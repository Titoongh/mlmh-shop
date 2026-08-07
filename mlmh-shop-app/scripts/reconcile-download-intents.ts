// Reconcile DownloadIntent rows against the Stripe API.
//
// Answers "are our success:null intents real abandons, or lost payments?" by
// fetching each intent's checkout session from Stripe and classifying it:
//
//   PAID in Stripe but not in DB  → LOST PAYMENT  (fix: success=true, status=PAID)
//   expired, never paid           → abandoned cart (fix: status=CANCELLED)
//   still open (24h window)       → leave PENDING
//   complete but unpaid           → async payment pending/failed → listed for review
//
// Also backfills `status` from `success` for already-settled rows (no Stripe
// call needed). Never overwrites a status the webhook already set (≠ PENDING).
//
// Idempotent, dry-run by default; pass --apply to write.
//
//   Dev:   set -a; . ./.env.development; set +a; npx tsx scripts/reconcile-download-intents.ts
//          set -a; . ./.env.development; set +a; npx tsx scripts/reconcile-download-intents.ts --apply
//   Prod:  run the same with the production env (done manually by the maintainer).

import { PrismaClient } from '@prisma/client'
import Stripe from 'stripe'

const prisma = new PrismaClient()
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2024-09-30.acacia',
})

const APPLY = process.argv.includes('--apply')
const BATCH_SIZE = 10

type Classification =
    | 'LOST_PAYMENT'
    | 'ABANDONED'
    | 'STILL_OPEN'
    | 'ASYNC_UNSETTLED'
    | 'STRIPE_ERROR'

interface Result {
    classification: Classification
    intentId: string
    sessionId: string
    createdAt: Date
    email?: string | null
    amountTotal?: number | null
    detail?: string
}

async function backfillSettledRows() {
    // Rows whose outcome is already known from `success` — no Stripe call.
    const paid = await prisma.downloadIntent.count({
        where: { success: true, status: 'PENDING' },
    })
    const failed = await prisma.downloadIntent.count({
        where: { success: false, status: 'PENDING' },
    })
    console.log(`\nSettled rows to backfill: ${paid} PAID, ${failed} FAILED`)

    if (APPLY) {
        await prisma.downloadIntent.updateMany({
            where: { success: true, status: 'PENDING' },
            data: { status: 'PAID' },
        })
        await prisma.downloadIntent.updateMany({
            where: { success: false, status: 'PENDING' },
            data: { status: 'FAILED' },
        })
    }
}

async function classifyIntent(intent: {
    id: string
    stripeSessionId: string
    createdAt: Date
}): Promise<Result> {
    const base = {
        intentId: intent.id,
        sessionId: intent.stripeSessionId,
        createdAt: intent.createdAt,
    }

    let session: Stripe.Checkout.Session
    try {
        session = await stripe.checkout.sessions.retrieve(intent.stripeSessionId)
    } catch (error: any) {
        return {
            ...base,
            classification: 'STRIPE_ERROR',
            detail: error.message,
        }
    }

    const email = session.customer_details?.email
    const amountTotal = session.amount_total

    if (
        session.payment_status === 'paid' ||
        session.payment_status === 'no_payment_required'
    ) {
        return { ...base, classification: 'LOST_PAYMENT', email, amountTotal }
    }

    if (session.status === 'expired') {
        return { ...base, classification: 'ABANDONED', email, amountTotal }
    }

    if (session.status === 'open') {
        return { ...base, classification: 'STILL_OPEN', email, amountTotal }
    }

    // status === 'complete' but unpaid: async payment still settling, or failed
    // without the async_payment_failed event having been processed.
    return {
        ...base,
        classification: 'ASYNC_UNSETTLED',
        email,
        amountTotal,
        detail: `payment_status=${session.payment_status}`,
    }
}

async function applyFix(result: Result) {
    if (result.classification === 'LOST_PAYMENT') {
        await prisma.downloadIntent.update({
            where: { id: result.intentId },
            data: {
                success: true,
                status: 'PAID',
                email: result.email ?? undefined,
            },
        })
    } else if (result.classification === 'ABANDONED') {
        await prisma.downloadIntent.update({
            where: { id: result.intentId },
            data: { status: 'CANCELLED' },
        })
    }
    // STILL_OPEN / ASYNC_UNSETTLED / STRIPE_ERROR: left untouched on purpose.
}

async function main() {
    console.log(
        `Reconciling DownloadIntents against Stripe (${APPLY ? 'APPLY' : 'DRY RUN'})`,
    )

    await backfillSettledRows()

    const unknowns = await prisma.downloadIntent.findMany({
        where: { success: null, status: 'PENDING' },
        select: { id: true, stripeSessionId: true, createdAt: true },
        orderBy: { createdAt: 'asc' },
    })
    console.log(`\nUnknown-outcome intents to check against Stripe: ${unknowns.length}`)

    const results: Result[] = []
    for (let i = 0; i < unknowns.length; i += BATCH_SIZE) {
        const batch = unknowns.slice(i, i + BATCH_SIZE)
        results.push(...(await Promise.all(batch.map(classifyIntent))))
        process.stdout.write(
            `\r  checked ${Math.min(i + BATCH_SIZE, unknowns.length)}/${unknowns.length}`,
        )
    }
    console.log()

    const byClass = (c: Classification) =>
        results.filter(r => r.classification === c)

    for (const c of [
        'LOST_PAYMENT',
        'ASYNC_UNSETTLED',
        'STRIPE_ERROR',
        'STILL_OPEN',
        'ABANDONED',
    ] as const) {
        const rows = byClass(c)
        if (rows.length === 0) continue
        console.log(`\n${c}: ${rows.length}`)
        // Abandons are the (large) boring case — only summarized.
        if (c === 'ABANDONED') continue
        for (const r of rows) {
            const amount =
                r.amountTotal != null ? `${(r.amountTotal / 100).toFixed(2)}€` : '?€'
            console.log(
                `  ${r.createdAt.toISOString()}  ${amount}  ${r.email ?? 'no-email'}  ${r.sessionId}${r.detail ? `  (${r.detail})` : ''}`,
            )
            if (c === 'LOST_PAYMENT') {
                console.log(
                    `    → download link: ${process.env.NEXT_PUBLIC_BASE_URL ?? ''}/checkout/download?session_id=${r.sessionId}`,
                )
            }
        }
    }

    if (APPLY) {
        for (const r of results) await applyFix(r)
        console.log(
            `\nApplied: ${byClass('LOST_PAYMENT').length} marked PAID, ${byClass('ABANDONED').length} marked CANCELLED`,
        )
    } else {
        console.log(
            `\nDry run — nothing written. Re-run with --apply to fix ` +
                `${byClass('LOST_PAYMENT').length} lost payments and mark ` +
                `${byClass('ABANDONED').length} abandons as CANCELLED.`,
        )
    }
}

main()
    .catch(error => {
        console.error('Reconciliation failed:', error)
        process.exitCode = 1
    })
    .finally(() => prisma.$disconnect())
