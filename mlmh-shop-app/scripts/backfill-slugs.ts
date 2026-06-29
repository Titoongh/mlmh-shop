// Backfill slugs for existing Artist/Tablature rows that don't have one yet.
//
// Idempotent: only touches rows where slug IS NULL, and skips ones already set.
// Safe to re-run. Dry-run by default; pass --apply to write.
//
//   Dev:   set -a; . ./.env.development; set +a; npx tsx scripts/backfill-slugs.ts          (dry run)
//          set -a; . ./.env.development; set +a; npx tsx scripts/backfill-slugs.ts --apply   (write)
//   Prod:  run the same with the production env (done manually by the maintainer).
//
// Run this AFTER the slug column is deployed, BEFORE deploying the slug-based URLs.

import { PrismaClient } from '@prisma/client'
import { generateUniqueSlug } from '../lib/slug'

const prisma = new PrismaClient()
const APPLY = process.argv.includes('--apply')

async function backfillArtists() {
    const artists = await prisma.artist.findMany({
        where: { slug: null },
        select: { id: true, name: true },
    })
    console.log(`\nArtists without slug: ${artists.length}`)
    for (const a of artists) {
        const slug = await generateUniqueSlug(
            a.name,
            async s =>
                !!(await prisma.artist.findUnique({
                    where: { slug: s },
                    select: { id: true },
                })),
        )
        console.log(`  ${APPLY ? 'SET' : 'DRY'}  "${a.name}" -> ${slug}`)
        if (APPLY)
            await prisma.artist.update({
                where: { id: a.id },
                data: { slug },
            })
    }
}

async function backfillTablatures() {
    const tabs = await prisma.tablature.findMany({
        where: { slug: null },
        select: {
            id: true,
            title: true,
            artists: { select: { name: true }, take: 1 },
        },
    })
    console.log(`\nTablatures without slug: ${tabs.length}`)
    for (const t of tabs) {
        const base = `${t.title} ${t.artists[0]?.name ?? ''}`
        const slug = await generateUniqueSlug(
            base,
            async s =>
                !!(await prisma.tablature.findUnique({
                    where: { slug: s },
                    select: { id: true },
                })),
        )
        console.log(`  ${APPLY ? 'SET' : 'DRY'}  "${t.title}" -> ${slug}`)
        if (APPLY)
            await prisma.tablature.update({
                where: { id: t.id },
                data: { slug },
            })
    }
}

async function main() {
    console.log(
        APPLY
            ? '=== APPLYING slug backfill ==='
            : '=== DRY RUN (pass --apply to write) ===',
    )
    await backfillArtists()
    await backfillTablatures()
    console.log('\nDone.')
}

main()
    .then(() => prisma.$disconnect())
    .catch(async error => {
        console.error(error)
        await prisma.$disconnect()
        process.exit(1)
    })
