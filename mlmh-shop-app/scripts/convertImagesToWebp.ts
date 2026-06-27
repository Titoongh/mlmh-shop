#!/usr/bin/env node
/**
 * Convertit en WebP les images stockées sur Scaleway et référencées par
 * `Content.url` (type IMAGE).
 *
 * Stratégie ADDITIVE et NON destructive :
 *  - On télécharge l'original, on encode une variante .webp, on l'uploade sous une
 *    NOUVELLE clé (l'original n'est jamais supprimé ni écrasé).
 *  - On met à jour `Content.url` vers la nouvelle clé .webp.
 *
 * SÉCURITÉ : le mode DRY-RUN est le DÉFAUT. Rien n'est écrit (ni S3, ni DB) tant
 * que `--apply` n'est pas passé explicitement. Lance d'abord SANS `--apply`,
 * vérifie le rapport, puis relance avec `--apply`.
 *
 * Pré-requis env (vérifiés au démarrage, échec explicite si manquant) :
 *   - DATABASE_URL    : connexion Prisma
 *   - SCW_ACCESS_KEY  : clé d'accès Scaleway
 *   - SCW_SECRET_KEY  : clé secrète Scaleway
 *   - SCW_BUCKET_NAME : bucket par défaut (où sont les images)
 *   Optionnels (ont un défaut) : SCW_REGION (fr-par), SCW_ENDPOINT
 *   (https://s3.fr-par.scw.cloud).
 *
 * Usage :
 *   tsx scripts/convertImagesToWebp.ts            # dry-run (défaut)
 *   tsx scripts/convertImagesToWebp.ts --apply    # exécution réelle
 *   tsx scripts/convertImagesToWebp.ts --quality 82 --limit 50
 */

import { PrismaClient } from '@prisma/client'
import ScalewayService from '../services/scalewayv2.js'
import sharp from 'sharp'

const prisma = new PrismaClient()

// Préfixes d'URL qui pointent vers le bucket Scaleway par défaut (voir les
// rewrites de next.config.js + app/api/storage/[...path]).
const STORAGE_PREFIXES = ['/public/storage/', '/public/uploads/', '/api/static/']

interface Args {
    apply: boolean
    quality: number
    limit: number | null
}

function parseArgs(): Args {
    const argv = process.argv.slice(2)
    const get = (flag: string): string | undefined => {
        const i = argv.indexOf(flag)
        return i !== -1 ? argv[i + 1] : undefined
    }
    return {
        apply: argv.includes('--apply'),
        quality: Number(get('--quality') ?? 80),
        limit: get('--limit') ? Number(get('--limit')) : null,
    }
}

// Extrait la clé S3 d'une `Content.url`. Retourne null si l'URL n'est pas une
// ressource du bucket par défaut (URL externe, format inconnu) → on saute.
function urlToKey(url: string): string | null {
    for (const prefix of STORAGE_PREFIXES) {
        if (url.startsWith(prefix)) return url.slice(prefix.length)
    }
    // URL absolue vers le bucket Scaleway (path-style ou vhost) : on extrait le path.
    try {
        const u = new URL(url)
        if (u.hostname.includes('scw.cloud')) {
            // path-style: /<bucket>/<key> ; vhost: /<key>
            const parts = u.pathname.replace(/^\//, '').split('/')
            if (parts.length > 1 && !u.hostname.startsWith(parts[0])) {
                return parts.slice(1).join('/') // drop bucket segment (path-style)
            }
            return parts.join('/')
        }
    } catch {
        // pas une URL absolue
    }
    return null
}

function keyToWebpKey(key: string): string {
    return key.replace(/\.[a-z0-9]+$/i, '') + '.webp'
}

// Reconstruit la nouvelle `Content.url` en conservant le même préfixe que l'original.
function urlToWebpUrl(url: string, newKey: string): string {
    for (const prefix of STORAGE_PREFIXES) {
        if (url.startsWith(prefix)) return prefix + newKey
    }
    return url.replace(/\.[a-z0-9]+$/i, '') + '.webp'
}

async function downloadBytes(scaleway: ScalewayService, key: string): Promise<Buffer> {
    const signed = await scaleway.signedUrl(key)
    const res = await fetch(signed)
    if (!res.ok) throw new Error(`download ${key}: HTTP ${res.status}`)
    return Buffer.from(await res.arrayBuffer())
}

// Échoue tôt avec un message clair si une variable d'env requise manque.
function assertEnv() {
    const required = [
        'DATABASE_URL',
        'SCW_ACCESS_KEY',
        'SCW_SECRET_KEY',
        'SCW_BUCKET_NAME',
    ]
    const missing = required.filter(name => !process.env[name])
    if (missing.length > 0) {
        console.error(
            `\n❌ Missing required env var(s): ${missing.join(', ')}\n\n` +
                `Required:\n` +
                `  DATABASE_URL     Prisma connection\n` +
                `  SCW_ACCESS_KEY   Scaleway access key\n` +
                `  SCW_SECRET_KEY   Scaleway secret key\n` +
                `  SCW_BUCKET_NAME  default bucket (where the images live)\n` +
                `Optional (defaults): SCW_REGION (fr-par), SCW_ENDPOINT (https://s3.fr-par.scw.cloud)\n\n` +
                `Example:\n` +
                `  DATABASE_URL=... SCW_ACCESS_KEY=... SCW_SECRET_KEY=... SCW_BUCKET_NAME=... \\\n` +
                `    npm run convert-webp            # dry-run\n`,
        )
        process.exit(1)
    }
}

async function main() {
    const args = parseArgs()
    assertEnv()
    const scaleway = new ScalewayService()

    console.log('=== convertImagesToWebp ===')
    console.log(`Mode      : ${args.apply ? 'APPLY (writes S3 + DB)' : 'DRY-RUN (no writes)'}`)
    console.log(`Quality   : ${args.quality}`)
    console.log(`Limit     : ${args.limit ?? 'none'}`)

    const images = await prisma.content.findMany({
        where: { type: 'IMAGE', url: { not: null } },
        select: { id: true, url: true },
        ...(args.limit ? { take: args.limit } : {}),
    })
    console.log(`Found ${images.length} IMAGE contents with a url\n`)

    let converted = 0
    let skippedWebp = 0
    let skippedExternal = 0
    let skippedExisting = 0
    let failed = 0
    let bytesBefore = 0
    let bytesAfter = 0

    for (const [i, content] of images.entries()) {
        const url = content.url as string
        const progress = `[${i + 1}/${images.length}]`

        if (/\.webp(\?|#|$)/i.test(url)) {
            skippedWebp++
            continue
        }

        const key = urlToKey(url)
        if (!key) {
            skippedExternal++
            console.warn(`${progress} skip (external/unknown url): ${url}`)
            continue
        }

        const newKey = keyToWebpKey(key)
        const newUrl = urlToWebpUrl(url, newKey)

        try {
            if (await scaleway.fileExists(newKey)) {
                // La variante webp existe déjà sur S3 : on (re)pointe juste la DB.
                skippedExisting++
                console.log(`${progress} exists on S3, ${args.apply ? 'updating' : 'would update'} DB → ${newUrl}`)
                if (args.apply) {
                    await prisma.content.update({
                        where: { id: content.id },
                        data: { url: newUrl },
                    })
                }
                continue
            }

            const original = await downloadBytes(scaleway, key)
            const webp = await sharp(original).webp({ quality: args.quality }).toBuffer()
            bytesBefore += original.length
            bytesAfter += webp.length

            const saved = (((original.length - webp.length) / original.length) * 100).toFixed(0)
            console.log(
                `${progress} ${key} (${(original.length / 1024).toFixed(0)}KB) → ${newKey} (${(webp.length / 1024).toFixed(0)}KB, -${saved}%)`,
            )

            if (args.apply) {
                await scaleway.uploadFile(webp, newKey, undefined, 'image/webp')
                await prisma.content.update({
                    where: { id: content.id },
                    data: { url: newUrl },
                })
            }
            converted++
        } catch (error) {
            failed++
            console.error(`${progress} FAILED ${key}:`, error instanceof Error ? error.message : error)
        }
    }

    console.log('\n=== Summary ===')
    console.log(`Converted        : ${converted}`)
    console.log(`Already webp      : ${skippedWebp}`)
    console.log(`Existing webp(S3) : ${skippedExisting}`)
    console.log(`External/unknown  : ${skippedExternal}`)
    console.log(`Failed            : ${failed}`)
    if (bytesBefore > 0) {
        console.log(
            `Size (converted)  : ${(bytesBefore / 1024 / 1024).toFixed(1)}MB → ${(bytesAfter / 1024 / 1024).toFixed(1)}MB`,
        )
    }
    if (!args.apply) {
        console.log('\nDRY-RUN: no changes were made. Re-run with --apply to execute.')
    }
}

main()
    .catch(error => {
        console.error('Script failed:', error)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
