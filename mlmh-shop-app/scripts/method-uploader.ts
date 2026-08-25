/**
 * method-uploader — local CLI used by the `/upload-method` Claude Code skill to
 * push a guitar method (lessons + files + offers) to the MLMH shop through the
 * admin HTTP API.
 *
 * Same philosophy and config as tab-uploader: authenticates with
 * `x-admin-api-key`, NEVER touches the DB or Scaleway directly — every write
 * goes through /api/admin/* so server-side logic (key generation, lessonRef
 * resolution, revalidation) stays the single source of truth.
 *
 * Usage:
 *   npx tsx scripts/method-uploader.ts context --target <local|prod>
 *   npx tsx scripts/method-uploader.ts apply   --target <local|prod> --manifest <path.json>
 *
 * Config (shared with tab-uploader, gitignored): scripts/.tab-uploader.config.json
 * Manifest shape: see scripts/method-manifest.example.json
 *
 * Paid files are uploaded ONE PER REQUEST: mp3 lessons reach ~35 MB and the
 * request body transits the Next proxy buffer (see next.config.js
 * `experimental.proxyClientMaxBodySize`, raised to 64mb). One file per request
 * keeps each body small-ish and makes retries cheap.
 */

import { readFileSync } from 'node:fs'
import { basename, extname, resolve } from 'node:path'

// ---------- types ----------

interface TargetConfig {
    baseUrl: string
    adminApiKey: string
}

interface Manifest {
    method: {
        title: string
        description?: string | null
        hidden?: boolean
        publicationDate?: string | null // AAAA-MM-JJ
        genres?: string[] // genre names, created if missing
        artistExistingIds?: string[] // optional: methods may have no artist
        contents?: Array<{
            type: 'AUDIO' | 'VIDEO' | 'IMAGE'
            url?: string // external URL (e.g. youtube)
            localFile?: string // local path, uploaded to the bonus bucket
        }>
    }
    // Method-level paid files (e.g. the booklet cover) — delivered with FULL
    // and DOCUMENTS offers, not with single-lesson offers.
    methodFiles?: string[]
    lessons: Array<{
        title: string
        files: string[] // local paths; role derived from extension
    }>
    offers: {
        fullPrice?: number | null // absent/null = no FULL offer
        fullTitle?: string // default "Complete package"
        documentsPrice?: number | null
        documentsTitle?: string // default "PDF booklet"
        lessonPrice?: number | null // creates one LESSON offer per lesson
    }
}

// ---------- small utils ----------

const log = (...a: unknown[]) => console.error('[method-uploader]', ...a)
const die = (msg: string): never => {
    console.error('[method-uploader] ERROR:', msg)
    process.exit(1)
}

function parseArgs(argv: string[]): {
    cmd: string
    opts: Record<string, string>
} {
    const [cmd, ...rest] = argv
    const opts: Record<string, string> = {}
    for (let i = 0; i < rest.length; i++) {
        const a = rest[i]
        if (a.startsWith('--')) {
            const key = a.slice(2)
            opts[key] = rest[i + 1]
            i++
        }
    }
    return { cmd, opts }
}

function loadTarget(name: string): TargetConfig {
    if (!name) die('Missing --target (local|prod)')
    const cfgPath = resolve(__dirname, '.tab-uploader.config.json')
    let raw: string
    try {
        raw = readFileSync(cfgPath, 'utf8')
    } catch {
        return die(
            `Config not found at ${cfgPath}. Copy scripts/.tab-uploader.config.example.json and fill in the keys.`,
        )
    }
    const cfg = JSON.parse(raw)
    const target = cfg?.targets?.[name]
    if (!target?.baseUrl || !target?.adminApiKey) {
        return die(`Target "${name}" missing baseUrl/adminApiKey in ${cfgPath}`)
    }
    return target
}

async function apiGet(t: TargetConfig, path: string): Promise<any> {
    const res = await fetch(`${t.baseUrl}${path}`, {
        headers: { 'x-admin-api-key': t.adminApiKey },
    })
    if (!res.ok)
        throw new Error(`GET ${path} -> ${res.status} ${await res.text()}`)
    return res.json()
}

async function apiPostJson(
    t: TargetConfig,
    path: string,
    body: unknown,
): Promise<any> {
    const res = await fetch(`${t.baseUrl}${path}`, {
        method: 'POST',
        headers: {
            'content-type': 'application/json',
            'x-admin-api-key': t.adminApiKey,
        },
        body: JSON.stringify(body),
    })
    if (!res.ok)
        throw new Error(`POST ${path} -> ${res.status} ${await res.text()}`)
    return res.json()
}

async function apiPostForm(
    t: TargetConfig,
    path: string,
    form: FormData,
): Promise<any> {
    const res = await fetch(`${t.baseUrl}${path}`, {
        method: 'POST',
        headers: { 'x-admin-api-key': t.adminApiKey },
        body: form,
    })
    if (!res.ok)
        throw new Error(`POST ${path} -> ${res.status} ${await res.text()}`)
    return res.json()
}

function guessMime(filename: string): string {
    const ext = extname(filename).toLowerCase()
    const map: Record<string, string> = {
        '.pdf': 'application/pdf',
        '.txt': 'text/plain',
        '.png': 'image/png',
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.webp': 'image/webp',
        '.mp3': 'audio/mpeg',
        '.mp4': 'video/mp4',
    }
    return map[ext] || 'application/octet-stream'
}

type FileRole = 'DOCUMENT' | 'AUDIO' | 'VIDEO'

function roleFor(filename: string): FileRole {
    const ext = extname(filename).toLowerCase()
    if (ext === '.mp3') return 'AUDIO'
    if (ext === '.mp4') return 'VIDEO'
    return 'DOCUMENT'
}

function blobFromLocal(path: string): { blob: Blob; filename: string } {
    const buf = readFileSync(resolve(path))
    const filename = basename(path)
    return { blob: new Blob([buf], { type: guessMime(filename) }), filename }
}

/** Upload an arbitrary file to the general/bonus bucket via /api/admin/upload. */
async function uploadGeneric(
    t: TargetConfig,
    blob: Blob,
    filename: string,
): Promise<string> {
    const form = new FormData()
    form.append('file', blob, filename)
    const res = await apiPostForm(t, '/api/admin/upload', form)
    if (!res?.url)
        throw new Error(`upload returned no url: ${JSON.stringify(res)}`)
    return res.url as string
}

/** Upload ONE paid method file, returns its stored metadata. */
async function uploadMethodFile(
    t: TargetConfig,
    title: string,
    localPath: string,
): Promise<{
    filename: string
    scalewayKey: string
    fileSize: number
    mimeType: string
}> {
    const { blob, filename } = blobFromLocal(localPath)
    const form = new FormData()
    form.append('title', title)
    form.append('files', blob, filename)
    const res = await apiPostForm(t, '/api/admin/upload/method', form)
    if (!res?.success || !res.files?.[0]) {
        throw new Error(`method upload failed: ${JSON.stringify(res)}`)
    }
    return res.files[0]
}

// ---------- commands ----------

async function cmdContext(t: TargetConfig) {
    const [artists, genres] = await Promise.all([
        apiGet(t, '/api/artists/names'),
        apiGet(t, '/api/musical-genres'),
    ])
    process.stdout.write(
        JSON.stringify(
            {
                artists: (artists || []).map((a: any) => ({
                    id: a.id,
                    name: a.name,
                    hidden: a.hidden,
                })),
                genres: (genres || []).map((g: any) => ({
                    id: g.id,
                    name: g.name,
                })),
            },
            null,
            2,
        ) + '\n',
    )
}

async function cmdApply(t: TargetConfig, manifestPath: string) {
    if (!manifestPath) die('Missing --manifest <path>')
    const manifest: Manifest = JSON.parse(
        readFileSync(resolve(manifestPath), 'utf8'),
    )

    if (!manifest.method?.title) die('manifest.method.title is required')
    if (!manifest.lessons?.length) die('manifest.lessons is required')
    for (const [i, lesson] of manifest.lessons.entries()) {
        if (!lesson.title) die(`lesson #${i} is missing a title`)
        if (!lesson.files?.length) die(`lesson "${lesson.title}" has no files`)
    }
    const o = manifest.offers || {}
    if (o.fullPrice == null && o.documentsPrice == null && o.lessonPrice == null) {
        die('manifest.offers must set at least one of fullPrice/documentsPrice/lessonPrice')
    }

    // 1) Resolve genres, creating any that are missing.
    const genreNameToId = new Map<string, string>()
    const neededGenres = manifest.method.genres || []
    if (neededGenres.length) {
        const existing = await apiGet(t, '/api/musical-genres')
        for (const g of existing || []) {
            genreNameToId.set(String(g.name).trim().toLowerCase(), g.id)
        }
        for (const name of neededGenres) {
            const key = name.trim().toLowerCase()
            if (genreNameToId.has(key)) continue
            log(`Creating genre "${name}"`)
            const created = await apiPostJson(t, '/api/admin/musical-genres', {
                name,
            })
            genreNameToId.set(key, created.id)
        }
    }
    const genreIds = neededGenres
        .map(n => genreNameToId.get(n.trim().toLowerCase())!)
        .filter(Boolean)

    // 2) Upload paid files, one request per file (big mp3s + retries).
    const title = manifest.method.title
    const lessonRefs = manifest.lessons.map((_, i) => `l${i + 1}`)
    const files: Array<{
        filename: string
        scalewayKey: string
        fileSize: number
        mimeType: string
        role: FileRole
        lessonRef: string | null
    }> = []

    for (const path of manifest.methodFiles || []) {
        log(`Uploading method-level file: ${basename(path)}`)
        const up = await uploadMethodFile(t, title, path)
        files.push({ ...up, role: roleFor(up.filename), lessonRef: null })
    }
    for (const [i, lesson] of manifest.lessons.entries()) {
        for (const path of lesson.files) {
            log(`Uploading [${lesson.title}] ${basename(path)}`)
            const up = await uploadMethodFile(t, title, path)
            files.push({
                ...up,
                role: roleFor(up.filename),
                lessonRef: lessonRefs[i],
            })
        }
    }

    // 3) Bonus contents (youtube urls as-is, local files to the bonus bucket).
    const contents: Array<{ type: string; url: string; rank: number }> = []
    const rawContents = manifest.method.contents || []
    for (let i = 0; i < rawContents.length; i++) {
        const c = rawContents[i]
        let url = c.url || ''
        if (c.localFile) {
            log(`Uploading bonus ${c.type} file: ${c.localFile}`)
            const { blob, filename } = blobFromLocal(c.localFile)
            url = await uploadGeneric(t, blob, filename)
        }
        if (!url) die(`content #${i} has neither url nor localFile`)
        contents.push({ type: c.type, url, rank: i })
    }

    // 4) Build offers.
    const offers: Array<{
        kind: 'FULL' | 'DOCUMENTS' | 'LESSON'
        lessonRef?: string
        title: string
        price: number
    }> = []
    if (o.fullPrice != null) {
        offers.push({
            kind: 'FULL',
            title: o.fullTitle ?? 'Complete package',
            price: o.fullPrice,
        })
    }
    if (o.documentsPrice != null) {
        offers.push({
            kind: 'DOCUMENTS',
            title: o.documentsTitle ?? 'PDF booklet',
            price: o.documentsPrice,
        })
    }
    if (o.lessonPrice != null) {
        manifest.lessons.forEach((lesson, i) => {
            offers.push({
                kind: 'LESSON',
                lessonRef: lessonRefs[i],
                title: `Lesson: ${lesson.title}`,
                price: o.lessonPrice!,
            })
        })
    }

    // 5) Create the method (lessons + files + offers wired via lessonRef).
    log(`Creating method "${title}"`)
    const method = await apiPostJson(t, '/api/admin/methods', {
        title,
        description: manifest.method.description ?? null,
        hidden: manifest.method.hidden ?? false,
        publicationDate: manifest.method.publicationDate ?? null,
        artists: manifest.method.artistExistingIds ?? [],
        musicalGenres: genreIds,
        contents,
        lessons: manifest.lessons.map((lesson, i) => ({
            ref: lessonRefs[i],
            title: lesson.title,
            rank: i + 1,
        })),
        files,
        offers,
    })

    process.stdout.write(
        JSON.stringify(
            {
                ok: true,
                methodId: method.id,
                slug: method.slug,
                title: method.title,
                lessonCount: method.lessons?.length ?? 0,
                fileCount: method.files?.length ?? 0,
                offerCount: method.offers?.length ?? 0,
                baseUrl: t.baseUrl,
            },
            null,
            2,
        ) + '\n',
    )
}

// ---------- main ----------

async function main() {
    const { cmd, opts } = parseArgs(process.argv.slice(2))
    if (cmd === 'context') {
        await cmdContext(loadTarget(opts.target))
    } else if (cmd === 'apply') {
        await cmdApply(loadTarget(opts.target), opts.manifest)
    } else {
        die(`Unknown command "${cmd}". Use "context" or "apply".`)
    }
}

main().catch(e => die(e instanceof Error ? e.message : String(e)))
