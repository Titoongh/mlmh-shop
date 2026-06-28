/**
 * tab-uploader — local CLI used by the `/upload-tab` Claude Code skill to push a
 * tablature (and, if needed, its artist) to the MLMH shop through the existing
 * admin HTTP API.
 *
 * It authenticates with the `x-admin-api-key` header (see proxy.ts) instead of a
 * Clerk session, so it can run fully locally. It NEVER touches the DB or Scaleway
 * directly — every write goes through /api/admin/* so the server-side logic
 * (key generation, content/file creation, revalidation) stays the single source
 * of truth.
 *
 * Usage:
 *   npx tsx scripts/tab-uploader.ts context --target <local|prod>
 *   npx tsx scripts/tab-uploader.ts apply   --target <local|prod> --manifest <path.json>
 *
 * Config (gitignored): scripts/.tab-uploader.config.json
 *   { "targets": { "local": { "baseUrl": "...", "adminApiKey": "..." }, ... } }
 *
 * Manifest shape: see scripts/tab-manifest.example.json
 */

import { readFileSync } from 'node:fs'
import { basename, extname, resolve } from 'node:path'

// ---------- types ----------

interface TargetConfig {
    baseUrl: string
    adminApiKey: string
}

interface Manifest {
    artist: {
        existingId?: string | null
        name: string
        description?: string | null
        photoUrl?: string | null // remote URL, downloaded then uploaded
        genres?: string[] // genre names, created if missing
        hidden?: boolean
    }
    tablature: {
        title: string
        price?: number // default 3.5
        hidden?: boolean
        description?: string | null
        genres?: string[] // genre names, created if missing
        files: string[] // local paths to tab files (pdf/gp*/midi)
        contents?: Array<{
            type: 'AUDIO' | 'VIDEO' | 'IMAGE'
            url?: string // external URL (e.g. youtube)
            localFile?: string // local path, uploaded to the bonus bucket
        }>
    }
}

// ---------- small utils ----------

const log = (...a: unknown[]) => console.error('[tab-uploader]', ...a)
const die = (msg: string): never => {
    console.error('[tab-uploader] ERROR:', msg)
    process.exit(1)
}

function parseArgs(argv: string[]): { cmd: string; opts: Record<string, string> } {
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
    if (!res.ok) throw new Error(`GET ${path} -> ${res.status} ${await res.text()}`)
    return res.json()
}

async function apiPostJson(t: TargetConfig, path: string, body: unknown): Promise<any> {
    const res = await fetch(`${t.baseUrl}${path}`, {
        method: 'POST',
        headers: {
            'content-type': 'application/json',
            'x-admin-api-key': t.adminApiKey,
        },
        body: JSON.stringify(body),
    })
    if (!res.ok) throw new Error(`POST ${path} -> ${res.status} ${await res.text()}`)
    return res.json()
}

async function apiPostForm(t: TargetConfig, path: string, form: FormData): Promise<any> {
    const res = await fetch(`${t.baseUrl}${path}`, {
        method: 'POST',
        headers: { 'x-admin-api-key': t.adminApiKey },
        body: form,
    })
    if (!res.ok) throw new Error(`POST ${path} -> ${res.status} ${await res.text()}`)
    return res.json()
}

function guessMime(filename: string): string {
    const ext = extname(filename).toLowerCase()
    const map: Record<string, string> = {
        '.pdf': 'application/pdf',
        '.png': 'image/png',
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.webp': 'image/webp',
        '.gif': 'image/gif',
        '.mp3': 'audio/mpeg',
        '.wav': 'audio/wav',
        '.m4a': 'audio/mp4',
        '.mid': 'audio/midi',
        '.midi': 'audio/midi',
    }
    return map[ext] || 'application/octet-stream'
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
    if (!res?.url) throw new Error(`upload returned no url: ${JSON.stringify(res)}`)
    return res.url as string // e.g. /public/storage/<key>
}

async function downloadPhoto(url: string): Promise<{ blob: Blob; filename: string }> {
    const res = await fetch(url)
    if (!res.ok) throw new Error(`download photo ${url} -> ${res.status}`)
    const contentType = res.headers.get('content-type') || 'image/jpeg'
    const buf = Buffer.from(await res.arrayBuffer())
    // derive a sane filename + extension from the content type
    const extFromType =
        contentType.includes('png')
            ? '.png'
            : contentType.includes('webp')
              ? '.webp'
              : '.jpg'
    let filename = basename(new URL(url).pathname) || 'photo'
    if (!extname(filename)) filename += extFromType
    return { blob: new Blob([buf], { type: contentType }), filename }
}

// ---------- commands ----------

async function cmdContext(t: TargetConfig) {
    const [artists, genres] = await Promise.all([
        apiGet(t, '/api/artists/names'),
        apiGet(t, '/api/musical-genres'),
    ])
    // keep output compact and stable for the skill to consume
    process.stdout.write(
        JSON.stringify(
            {
                artists: (artists || []).map((a: any) => ({
                    id: a.id,
                    name: a.name,
                    hidden: a.hidden,
                })),
                genres: (genres || []).map((g: any) => ({ id: g.id, name: g.name })),
            },
            null,
            2,
        ) + '\n',
    )
}

async function cmdApply(t: TargetConfig, manifestPath: string) {
    if (!manifestPath) die('Missing --manifest <path>')
    const manifest: Manifest = JSON.parse(readFileSync(resolve(manifestPath), 'utf8'))

    if (!manifest.tablature?.title) die('manifest.tablature.title is required')
    if (!manifest.tablature?.files?.length) die('manifest.tablature.files is required')

    // 1) Resolve genres (artist + tablature), creating any that are missing.
    const neededGenres = [
        ...(manifest.artist.genres || []),
        ...(manifest.tablature.genres || []),
    ]
    const genreNameToId = new Map<string, string>()
    if (neededGenres.length) {
        const existing = await apiGet(t, '/api/musical-genres')
        for (const g of existing || []) {
            genreNameToId.set(String(g.name).trim().toLowerCase(), g.id)
        }
        for (const name of neededGenres) {
            const key = name.trim().toLowerCase()
            if (genreNameToId.has(key)) continue
            log(`Creating genre "${name}"`)
            const created = await apiPostJson(t, '/api/admin/musical-genres', { name })
            genreNameToId.set(key, created.id)
        }
    }
    const genreIds = (names: string[] = []) =>
        names.map((n) => genreNameToId.get(n.trim().toLowerCase())!).filter(Boolean)

    // 2) Resolve artist (use existing, or create with photo + genres).
    let artistId = manifest.artist.existingId || ''
    let artistCreated = false
    if (!artistId) {
        const contents: Array<{ type: string; url: string; rank: number }> = []
        if (manifest.artist.photoUrl) {
            log(`Downloading + uploading artist photo`)
            const { blob, filename } = await downloadPhoto(manifest.artist.photoUrl)
            const url = await uploadGeneric(t, blob, filename)
            contents.push({ type: 'IMAGE', url, rank: 0 })
        }
        log(`Creating artist "${manifest.artist.name}"`)
        const artist = await apiPostJson(t, '/api/admin/artists', {
            name: manifest.artist.name,
            description: manifest.artist.description ?? null,
            hidden: manifest.artist.hidden ?? false,
            musicalGenres: genreIds(manifest.artist.genres),
            contents,
        })
        artistId = artist.id
        artistCreated = true
    } else {
        log(`Using existing artist ${artistId}`)
    }

    // 3) Upload tablature files.
    log(`Uploading ${manifest.tablature.files.length} tablature file(s)`)
    const filesForm = new FormData()
    filesForm.append('title', manifest.tablature.title)
    for (const f of manifest.tablature.files) {
        const { blob, filename } = blobFromLocal(f)
        filesForm.append('files', blob, filename)
    }
    const upRes = await apiPostForm(t, '/api/admin/upload/tablature', filesForm)
    if (!upRes?.success) throw new Error(`tab upload failed: ${JSON.stringify(upRes)}`)
    const files = upRes.files

    // 4) Build bonus contents (youtube urls as-is, local files uploaded).
    const contents: Array<{ type: string; url: string; rank: number }> = []
    const rawContents = manifest.tablature.contents || []
    for (let i = 0; i < rawContents.length; i++) {
        const c = rawContents[i]
        let url = c.url || ''
        if (c.localFile) {
            log(`Uploading bonus ${c.type} file: ${c.localFile}`)
            const { blob, filename } = blobFromLocal(c.localFile)
            url = await uploadGeneric(t, blob, filename)
        }
        if (!url) {
            die(`content #${i} has neither url nor localFile`)
        }
        contents.push({ type: c.type, url, rank: i })
    }

    // 5) Create the tablature.
    log(`Creating tablature "${manifest.tablature.title}"`)
    const tablature = await apiPostJson(t, '/api/admin/tablatures', {
        title: manifest.tablature.title,
        price: manifest.tablature.price ?? 3.5,
        hidden: manifest.tablature.hidden ?? false,
        description: manifest.tablature.description ?? null,
        artists: [artistId],
        musicalGenres: genreIds(manifest.tablature.genres),
        contents,
        files: files.map((f: any) => ({
            filename: f.filename,
            scalewayKey: f.scalewayKey,
            fileSize: f.fileSize,
            mimeType: f.mimeType,
        })),
    })

    process.stdout.write(
        JSON.stringify(
            {
                ok: true,
                artistId,
                artistCreated,
                tablatureId: tablature.id,
                title: tablature.title,
                price: tablature.price,
                fileCount: files.length,
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

main().catch((e) => die(e instanceof Error ? e.message : String(e)))
