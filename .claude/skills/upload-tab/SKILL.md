---
name: upload-tab
description: Upload a guitar tablature (and its artist if new) to the MLMH shop from local files + a pasted email. Extracts artist/title, researches a new artist (photo, description, genre), parses bonus content (YouTube/mp3), shows an editable recap, then pushes everything through the admin API via the tab-uploader CLI. Use when the user wants to publish/upload a tablature.
---

# Upload a tablature to the MLMH shop

You turn a pile of files + a forwarded email into a published product on the MLMH shop,
keeping the user in control via an editable recap before anything is written.

**Working dir:** all commands run from `mlmh-shop-app/`.
**The CLI does all the writing** — never write to the DB or Scaleway directly. Orchestrate,
research, and build the manifest; the CLI (`scripts/tab-uploader.ts`) performs every upload
and creation through `/api/admin/*`.

## 0. Schema drift check — ALWAYS RUN THIS FIRST

Before anything else, re-read `mlmh-shop-app/prisma/schema.prisma` and verify this tool still
covers every field the shop expects when creating an Artist / Tablature / Content /
TablatureFile. The DB is developer-owned and columns get added over time — the tool must never
silently skip a newly added one.

Compare the schema against the **fields this tool currently handles** (baseline):
- **Artist:** name, description, hidden, musicalGenres (relation), contents (relation; the photo
  is a Content of type IMAGE). Auto/ignored: id, createdAt, updatedAt; `tablatures` is linked
  from the tablature side.
- **Tablature:** title, price, hidden, description, musicalGenres, artists, contents, files.
  NOT set by the tool: `publicationDate` (optional). Auto/ignored: id, timestamps;
  `Download`/`PurchaseItem` are runtime.
- **Content:** type, url, rank. (`blob` unused — we always use `url`.)
- **TablatureFile:** filename, scalewayKey, fileSize, mimeType.

If you find a **new or changed creatable field** relevant to publishing a tablature that is NOT
in the baseline above:
1. STOP and tell the user exactly what changed.
2. Propose updating, in order: the admin endpoint(s) under `app/api/admin/*` that create the
   record → the CLI (`scripts/tab-uploader.ts`) + `scripts/tab-manifest.example.json` → this
   baseline list.
3. Only continue once the tool is back in sync (or the user explicitly says to skip the field).

Purely internal/auto fields (ids, timestamps, runtime relations like purchases/downloads) do
NOT count as drift.

## 0bis. Prerequisites (check once, fail early)

- `scripts/.tab-uploader.config.json` must exist. If not, tell the user to copy
  `scripts/.tab-uploader.config.example.json` to it and fill in `baseUrl` + `adminApiKey`
  for each target. The `adminApiKey` must equal the `ADMIN_API_KEY` env var on that
  deployment (and the local app must be running for the `local` target).
- Do not read or print the user's `.env`. If a key is missing, ask the user to set it.

## 1. Gather inputs

- **Files:** ask where the downloaded files are (default `mlmh-shop-app/tab-inbox/`). They are
  tablatures (`.pdf/.png/.jpg/.gp3/.gp4/.gp5/.gpx/.mid/.midi`) and optional bonus files (`.mp3`, …).
- **Email text:** ask the user to paste the email(s) content (YouTube links, notes, etc.).

## 2. Choose the target — ASK before doing anything

Ask: **"On travaille sur `prod` ou `local`/dev ?"** Use the chosen `<target>` for BOTH the
context read and the final apply. This is the required confirmation before any write.

## 3. Read existing site data (to stay within existing conventions)

Run: `npx tsx scripts/tab-uploader.ts context --target <target>`
→ returns `{ artists: [{id,name,hidden}], genres: [{id,name}] }`.
Use this to (a) match the artist and (b) reuse existing genre names exactly.

## 4. Extract artist + title

Read the tablature file(s) (PDF/PNG/JPEG are readable directly). Extract the **song title** and
**artist name**, cross-checking the filename. If ambiguous, ask.

- **One song, several files** (e.g. guitar + bass, or pdf + Guitar Pro) → ONE product with
  multiple `files`.
- **Several distinct songs** → ask whether to make one product per song (usually yes). Run the
  flow once per product.

## 5. Resolve the artist

Match the extracted name against `context.artists` (case-insensitive, tolerant of accents/typos).
- **Found** → set `artist.existingId` to its id; skip research.
- **Not found** → create it. Research with WebSearch/WebFetch:
  - **description:** a short **English** bio (2–4 sentences), factual, no marketing fluff. The
    site's artist descriptions are in English (e.g. Bob Dylan) — always write EN, even for
    French artists. Match the tone of an existing description if you fetch one for reference.
  - **photoUrl:** a direct image URL (ends in .jpg/.png/.webp or serves an image content-type).
    Prefer Wikimedia/Wikipedia for licensing. Reasonably high-res (the site serves responsive
    webp up to ~1080px wide). Put it in `artist.photoUrl` — the CLI downloads + uploads it.
  - **genre:** pick ONE genre. Reuse an existing genre name from `context.genres` verbatim when
    it fits; only introduce a new name when none fits (the CLI will create it).

## 6. Parse bonus content from the email

- **YouTube / external video URLs** → `{ "type": "VIDEO", "url": "<url>" }`
  - **Clean them up:** the email often has the same link **duplicated** (sometimes 2+ times)
    and **malformed** (trailing punctuation/text, `m.youtube`, `youtu.be` short form, extra
    query params, missing scheme, line breaks splitting the URL). Deduplicate, fix the format,
    and normalize to a canonical `https://www.youtube.com/watch?v=<id>` (or keep `youtu.be` if
    that's what's intended). When unsure whether two links are the same video, compare the
    video id. Keep only the distinct, valid ones.
- **Bonus audio files** in the inbox (mp3, …) → `{ "type": "AUDIO", "localFile": "<abs path>" }`
- Order matters: it becomes the carousel order (`rank` is assigned by array position).

## 7. Build the manifest

Write a manifest JSON to the scratchpad (see `scripts/tab-manifest.example.json` for the shape).
Rules:
- `tablature.price`: **3.5** (per product, always, even with several files).
- `tablature.hidden`: **false** (visible to everyone by default).
- `files`: absolute paths to the tab files only (not bonus audio).
- Genre names go in `artist.genres` and/or `tablature.genres`; the CLI maps them to ids.

## 8. Show an editable recap — wait for confirmation

Present a clear recap (this is the "nice interface"):

```
Artiste : <name>  [EXISTANT id=… | NOUVEAU]
  Genre : <genre>
  Desc  : <short desc>           (nouveau seulement)
  Photo : <photoUrl>             (nouveau seulement)
Produit : <title>
  Prix  : 3.50 €   Visible : oui
  Fichiers tab : <list>
  Bonus : <VIDEO url… / AUDIO file…>
Cible  : <target>
```

Let the user edit any field (re-write the manifest on change). Only proceed on explicit "go".

## 9. Apply

Run: `npx tsx scripts/tab-uploader.ts apply --target <target> --manifest <path>`
It outputs JSON `{ ok, artistId, artistCreated, tablatureId, title, fileCount, baseUrl }`.

Report the result. If it fails **after** the artist was created (`artistCreated` was reached),
re-run with `artist.existingId` set to the new artist id to avoid a duplicate artist.

## 10. Archive the processed inbox files

Only **after a successful apply**, move every file that was consumed for this product (the tab
files + any bonus audio) out of the inbox into `tab-inbox/archive/<tab_name>/`, where
`<tab_name>` is a filesystem-safe slug of the product title (lowercase, spaces→`-`, strip odd
chars). Create the folder if needed. This keeps the inbox clean and shows what's already done.
Do NOT archive on failure. (The whole `tab-inbox/` is gitignored, archive included.)

## Notes / gotchas

- The admin API requires the `x-admin-api-key` header — the CLI handles it; the app's
  `proxy.ts` accepts it for `/api/admin/*` only.
- Always send genres/contents as arrays (the CLI does); never omit them.
- If `local` target fails to connect, the dev server probably isn't running (`npm run dev`).
