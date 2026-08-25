---
name: upload-method
description: Upload a guitar method (lessons + PDF/mp3/mp4 files + purchase offers) to the MLMH shop from a local folder. Scans the folder, maps files to lessons, writes an English description, shows an editable recap, then pushes everything through the admin API via the method-uploader CLI. Use when the user wants to publish/upload a guitar method (méthode).
---

# Upload a guitar method to the MLMH shop

You turn a local method folder (booklet cover + per-piece PDFs + mp3/mp4 lessons) into a
published multi-offer product, keeping the user in control via an editable recap before
anything is written.

**Working dir:** all commands run from `mlmh-shop-app/`.
**The CLI does all the writing** — never write to the DB or Scaleway directly. Orchestrate,
analyze, and build the manifest; the CLI (`scripts/method-uploader.ts`) performs every upload
and creation through `/api/admin/*`.

## Domain model (read once)

A `Method` = one volume. The **sellable unit is `MethodOffer`**, never the method:
- `FULL` = every file (default "Complete package", historical price 24.95 €)
- `DOCUMENTS` = only `role=DOCUMENT` files, i.e. cover + lesson PDFs ("PDF booklet", 17 €)
- `LESSON` = one lesson's own files, cover NOT included ("Lesson: <title>", 6 €)

Delivery is derived from `MethodFile.role` + `lessonId` (`lib/methods/delivery.ts`) — you
never enumerate files per offer. File roles derive from extension (mp3 → AUDIO, mp4 → VIDEO,
else DOCUMENT). Methods are sold to signed-in users only. Reference product:
`/product/methods/the-guitar-of-merle-travis-volume-2`.

## 0. Schema drift check — ALWAYS RUN THIS FIRST

Re-read `mlmh-shop-app/prisma/schema.prisma` and verify this tool still covers every field
the shop expects when creating a Method / MethodLesson / MethodFile / MethodOffer / Content.

Baseline handled today:
- **Method:** title, description, hidden, publicationDate, musicalGenres, artists (optional),
  contents, lessons, files, offers. Auto: id, slug (server-generated, stable), timestamps.
- **MethodLesson:** title, rank (= manifest order).
- **MethodFile:** filename, scalewayKey, fileSize, mimeType, role, lessonId (via `lessonRef`).
- **MethodOffer:** kind, title, price, hidden(false), lessonId (via `lessonRef`).
- **Content:** type, url, rank.

If a new creatable field appears: STOP, tell the user, propose updating (in order) the admin
endpoints under `app/api/admin/methods*` + `lib/admin/{methods,validation}.ts` → the CLI +
`scripts/method-manifest.example.json` → this baseline. Continue only once back in sync.

## 0bis. Prerequisites (check once, fail early)

- `scripts/.tab-uploader.config.json` must exist (config **shared** with tab-uploader:
  `targets.<name>.{baseUrl,adminApiKey}`). Never read or print `.env*`.
- For `local`: the dev server must be running (`npm run dev`).
- Duplicate check: `GET /api/admin/methods` via the CLI target (or ask) — if a method with
  the same title/volume already exists, STOP and ask (update vs skip). Never create twice.

## 1. Gather inputs

Ask for the method folder (convention: `methodes/<Method Title>/` at the repo root — e.g.
`methodes/The Guitar Of Merle Travis - Volume 2/`). Optionally: pasted email/notes with
YouTube links or a cover image for bonus contents, and price overrides.

## 2. Choose the target — ASK before doing anything

Ask: **"On travaille sur `prod` ou `local`/dev ?"** Use `<target>` for BOTH context and
apply. This is the required confirmation before any write.

## 3. Read existing site data

Run: `npx tsx scripts/method-uploader.ts context --target <target>`
→ `{ artists: [{id,name,hidden}], genres: [{id,name}] }`. Reuse genre names verbatim;
match artists case-insensitively.

## 4. Analyze the folder → structure

List every pdf/txt/jpg/jpeg/mp3/mp4 (ignore `.DS_Store`). Then decide:

- **Method-level files:** anything that belongs to the whole booklet, typically the file
  with "cover" in its name. Goes to `methodFiles`.
- **Lessons:** one lesson per taught piece. Extract piece titles from the PDF filenames,
  then match audio/video files to their lesson by fuzzy title (filenames are messy:
  extra spaces, "Vol.2", "taught by M.Lelong", etc.). Every file MUST land somewhere;
  if one matches nothing, ask.
- **Lesson ORDER:** look for side/lesson markers in audio filenames (e.g.
  `"-A-lesson 1"`, `"-B-lesson 3"` → order A1..An then B1..Bn). Else use the old site's
  listing (michel-lelong-music-house.com/methodes/…) via WebFetch. Else ask.
- **Sanity check:** each lesson should usually have 1 DOCUMENT + ≥1 AUDIO/VIDEO. Flag
  asymmetries in the recap rather than silently accepting them.

## 5. Metadata

- **description:** short **English** product description (the whole site is EN): what the
  method teaches, the pieces list context, what the buyer gets (PDF tablatures + audio
  lessons, hours of audio if known), level. Source facts from the old site page for this
  method (WebFetch) when it exists.
- **genres:** pick from `context.genres` verbatim when one fits; new names are created by
  the CLI — introduce one only when nothing fits.
- **artists:** OPTIONAL. If the method is about a real artist (e.g. Merle Travis) who
  already exists on the shop, link via `artistExistingIds`. Do NOT create a new artist by
  default — if the user wants one, follow the `/upload-tab` artist-research procedure
  (EN bio, Wikimedia photo) and create it first through that flow.
- **prices:** defaults 24.95 (FULL) / 17 (DOCUMENTS) / 6 (per LESSON). Confirm in recap;
  the old site page for the method is the price reference when in doubt.
- **bonus contents:** YouTube demos → `{type:"VIDEO", url}` (dedupe/normalize like
  upload-tab); a cover image → `{type:"IMAGE", localFile}` (it becomes the product card
  and OG image; the paid cover PDF does NOT show on the page, so an IMAGE bonus is
  strongly recommended when available).

## 6. Build the manifest

Write the manifest JSON to the scratchpad (shape: `scripts/method-manifest.example.json`).
`lessons` array order = display order (rank is derived). File roles are derived from
extensions by the CLI — no need to specify them.

## 7. Show an editable recap — wait for confirmation

```
Méthode : <title>
  Desc   : <first line…>
  Genres : <names>   Artistes : <names or aucun>
  Fichiers méthode (couverture…) : <list>
  Leçons (<n>) :
    1. <title>   [PDF + mp3]
    2. …
  Offres : FULL <price> € | DOCUMENTS <price> € | LESSON <price> € x <n>
  Bonus  : <VIDEO/IMAGE…>
  Cible  : <target>
```

Let the user edit anything (rewrite the manifest on change). Only proceed on explicit "go".

## 8. Apply

Run: `npx tsx scripts/method-uploader.ts apply --target <target> --manifest <path>`
→ `{ ok, methodId, slug, title, lessonCount, fileCount, offerCount, baseUrl }`.

Uploads are **one HTTP request per file** and mp3 lessons weigh ~30 MB each: a full method
takes several minutes. That's normal — don't kill it, don't parallelize.

If apply fails midway, files already uploaded to the bucket are orphaned but harmless;
fix the cause and re-run (fresh keys are generated). Report leftover orphans to the user.

## 9. Verify

`curl -s <baseUrl>/product/methods/<slug>` and check the lessons list and every offer
with its price render. Spot-check the hub `<baseUrl>/methods` too. Report the public URL.

## Notes / gotchas

- **Body size limit:** requests through the middleware are buffered and capped by
  `experimental.proxyClientMaxBodySize` in `next.config.js` (raised to 64mb). A file
  bigger than that will fail with "Failed to parse body as FormData" — raise the limit
  first, never bypass the API.
- Offer invariants (server-enforced): max 1 FULL + 1 DOCUMENTS visible per method,
  1 LESSON offer per lesson; `lessonRef` required iff kind = LESSON.
- Updating later (admin UI or `PUT /api/admin/methods/{id}`): lessons/files/offers update
  as a trio; an offer removed from a payload is hidden server-side, never deleted
  (purchase history may reference it).
- `DELETE /api/admin/methods/{id}` cascades DB rows but does NOT clean the bucket, and
  fails (FK Restrict) once an offer has been sold — deletion is tooling-only.
- Docs: `docs/admin-api.md` (§ Méthodes) is the API contract reference.
