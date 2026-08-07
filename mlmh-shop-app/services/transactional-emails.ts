import { prisma } from '@/app/prisma'

async function sendBrevoEmail(
    email: string,
    templateId: number,
    params: Record<string, string>,
) {
    try {
        const response = await fetch('https://api.brevo.com/v3/smtp/email', {
            method: 'POST',
            headers: {
                Accept: 'application/json',
                'Content-Type': 'application/json',
                'api-key': process.env.BREVO_API_KEY!,
            },
            body: JSON.stringify({
                to: [{ email }],
                templateId,
                params,
            }),
        })

        if (!response.ok) {
            const error = await response.json()
            throw new Error(`Brevo API error: ${JSON.stringify(error)}`)
        }
    } catch (error) {
        console.error('Error sending email:', error)
        throw error
    }
}

export async function sendDownloadEmail(email: string, downloadUrl: string) {
    return sendBrevoEmail(email, 1, { downloadLink: downloadUrl })
}

// Stripe does NOT notify the customer when a delayed payment (PayPal, Klarna…)
// ultimately fails — the fulfillment docs leave that to us.
export async function sendPaymentFailedEmail(email: string) {
    const templateId = Number(process.env.BREVO_PAYMENT_FAILED_TEMPLATE_ID || 2)
    return sendBrevoEmail(email, templateId, {
        retryUrl: `${process.env.NEXT_PUBLIC_BASE_URL}/checkout`,
    })
}

// Send the download email exactly once per paid session, no matter how many
// paths confirm the payment (webhook, webhook retries, success page). The
// emailSentAt column is claimed atomically: only the caller whose updateMany
// matches (status PAID, not yet sent) actually sends. On send failure the
// claim is released so a later confirmation can retry.
export async function sendDownloadEmailOnce(
    sessionId: string,
    email: string | null | undefined,
): Promise<boolean> {
    if (!email) return false

    const downloadUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/checkout/download?session_id=${sessionId}`

    // A session belongs to either a DownloadIntent (guest) or a Purchase
    // (logged-in) — try to claim whichever exists.
    const claimWhere = {
        stripeSessionId: sessionId,
        status: 'PAID',
        emailSentAt: null,
    } as const
    const claimData = { emailSentAt: new Date() }

    let claimedModel: 'downloadIntent' | 'purchase' | null = null
    const intentClaim = await prisma.downloadIntent.updateMany({
        where: claimWhere,
        data: claimData,
    })
    if (intentClaim.count === 1) {
        claimedModel = 'downloadIntent'
    } else {
        const purchaseClaim = await prisma.purchase.updateMany({
            where: claimWhere,
            data: claimData,
        })
        if (purchaseClaim.count === 1) claimedModel = 'purchase'
    }

    if (!claimedModel) return false // already sent, or session not PAID yet

    try {
        await sendDownloadEmail(email, downloadUrl)
        console.log(`Download email sent for session: ${sessionId}`)
        return true
    } catch (error) {
        console.error('Failed to send download email, releasing claim:', error)
        // Release so the next confirmation path retries.
        try {
            if (claimedModel === 'downloadIntent') {
                await prisma.downloadIntent.updateMany({
                    where: { stripeSessionId: sessionId },
                    data: { emailSentAt: null },
                })
            } else {
                await prisma.purchase.updateMany({
                    where: { stripeSessionId: sessionId },
                    data: { emailSentAt: null },
                })
            }
        } catch (releaseError) {
            console.error('Failed to release email claim:', releaseError)
        }
        return false
    }
}
