# SEO — Manual steps (owner: Martin)

> Companion to the technical SEO work done in code. This file lists **only the actions
> Claude cannot do for you** — schema migrations, Google/infra setup, design assets and
> decisions. Each item says *why* it matters and *when* to do it.
>
> Domain in use: `https://michel-lelong-guitar-tab-workshop.com` · Target market: **English only**
>
> Legend: 🔴 blocking (a code phase depends on it) · 🟡 do after deploy · 🟢 nice-to-have

---

## 1. Environment variable — site URL  🔴 (Phase 0)

- [ ] Add `NEXT_PUBLIC_SITE_URL=https://michel-lelong-guitar-tab-workshop.com` to every
  ```
  environment (local `.env`, `.env.deploy`, Docker secrets / Swarm config).
  ```
  - **Why:** drives `metadataBase`, canonical URLs, sitemap and Open Graph absolute URLs.
  Without it everything falls back to the hardcoded prod domain (works in prod, wrong in preview).
  - Claude will read it via `process.env`; **Claude will not create/edit your** `.env`* **files** (project rule).

---



## 2. Default Open Graph image  🟢 (done — auto-generated)

- [x] **No action required.** The site-wide default share image is now generated
  ```
  dynamically at `app/opengraph-image.tsx` (Next.js `next/og`, 1200×630, branded
  purple). Every page without its own image (home, search…) gets it automatically;
  tablature/artist pages still use their own preview when available.
  ```
  - 🟢 Optional: if you'd rather use a hand-designed image, drop a 1200×630 PNG and tell
  me — I'll swap the dynamic generator for the static asset. Otherwise nothing to do.

---



## 3. Prisma slugs — schema + migration  🔴 (Phase 3)

Claude will prepare the schema change, the slug-generation/backfill script and the route +
301-redirect code. **You** run the DB parts (project rule: dev owns schema & migrations):

- [x] Review the proposed `slug` field on `Tablature` and `Artist` (unique, indexed).
- [x] Apply the migration (`prisma migrate dev` locally, then CI/CD `migrate deploy` in prod).
- [x] Run the one-off **backfill script** to populate slugs for existing rows.
- [x] Run `prisma generate` (you always do this yourself).
- [x] Confirm old UUID URLs still resolve via 301 redirects **before** announcing — so no
  ```
  existing/indexed link breaks.
  ```
  - **Why:** readable URLs (`/tablatures/sweet-home-alabama-lynyrd-skynyrd`) are a strong
  ranking + click-through signal vs opaque UUIDs.

---



## 4. Canonical domain & HTTPS (infra / Caddy)  🟡

- [ ] Decide and enforce ONE canonical host: **apex** (`michel-lelong-...com`) vs **www**.
  ```
  Redirect the other with a 301 at the proxy/Caddy level.
  ```
- [ ] Ensure `http://` 301-redirects to `https://` (likely already true — verify).
  - **Why:** Google treats `www`, non-`www`, http and https as different URLs. Splitting
  them dilutes ranking. Pick one; the sitemap/canonical must match it exactly.

---



## 5. Google Search Console  🟡 (Phase 6 — Claude guides you live)

Do this **after** Phases 0–2 are deployed (sitemap + robots live). Claude walks you through
each click; these are the actions only you can perform:

- [x] Create the property at [https://search.google.com/search-console](https://search.google.com/search-console) (choose **Domain**
  ```
  property → requires a DNS TXT record; or **URL-prefix** → Claude adds a verification
  file/meta tag to the code).
  ```
- [x] Complete verification (add the DNS record at your registrar, or deploy the verify file).
- [x] Submit the sitemap: `https://michel-lelong-guitar-tab-workshop.com/sitemap.xml`.
- [x] Use **URL Inspection → Request indexing** on the home page + a few key tablatures to
  ```
  kick-start crawling.
  ```
- [ ] Come back after ~1–2 weeks to check **Pages (coverage)** and **Performance** (queries).
  - **Why:** this is how Google discovers/indexes the site and how you'll see which song
  searches bring people in.

---



## 6. Bing Webmaster Tools  🟢

- [x] Optional: register at [https://www.bing.com/webmasters](https://www.bing.com/webmasters) and submit the same sitemap.
  ```
  You can import directly from Google Search Console (1 click).
  ```
  - **Why:** small but free extra traffic (Bing + DuckDuckGo + ChatGPT search).

---



## 7. Content wording (your call, not code)  🟢

Claude handles the *technical* metadata structure. These need a human/marketing decision:

- [x] Sanity-check the **homepage title & meta description** wording (English, ~155 chars,
  ```
  includes "guitar tablatures" + key terms people search).
  ```
- [x] For top tablatures, make sure each has a real **description** in the DB (Claude uses it
  ```
  as the meta description / JSON-LD; empty → generic fallback, weaker SEO).
  ```
  - **Why:** the description is the snippet users see in Google results — it drives clicks.

---



## 8. Post-deploy verification checklist  🟡

Run these once the SEO phases are live (Claude can help interpret results):

- [x] `https://.../robots.txt` returns and references the sitemap.
- [x] `https://.../sitemap.xml` lists tablatures + artists (no `hidden` ones).
- [x] Test a tablature URL in the **Rich Results Test** ([https://search.google.com/test/rich-results](https://search.google.com/test/rich-results))
  ```
  → Product schema valid, price shown.
  ```
- [x] Paste a tablature URL in a WhatsApp/iMessage draft → correct title + image preview.
- [x] Run **Lighthouse** (Chrome DevTools, mobile) on home + a tablature page → note scores
  ```
  so Phase 5 improvements can be measured before/after.
  ```

---



## 9. How to test metadata, JSON-LD & social previews  🟡

Most of these need a **public URL** (deploy first, or expose localhost with a tunnel
like `ngrok http 3000`). Validators that accept pasted HTML/code work offline too.

**Structured data (JSON-LD):**

- [x] **Google Rich Results Test** — [https://search.google.com/test/rich-results](https://search.google.com/test/rich-results)
  ```
  Validates Product / BreadcrumbList / Person and shows rich-result eligibility.
  Accepts a URL *or* a code snippet. Check a tablature page (Product + price) and
  an artist page (MusicGroup).
  ```
- [x] **Schema.org validator** — [https://validator.schema.org/](https://validator.schema.org/) (validates every type).

**Metadata & social share previews (Open Graph / Twitter):**

- [x] **Facebook Sharing Debugger** — [https://developers.facebook.com/tools/debug/](https://developers.facebook.com/tools/debug/)
  ```
  This is also what **WhatsApp** uses. Use **"Scrape Again"** to bust the cache if
  a preview looks stale or the image is missing.
  ```
- [x] **LinkedIn Post Inspector** — [https://www.linkedin.com/post-inspector/](https://www.linkedin.com/post-inspector/)
- [x] **All-in-one preview** — [https://www.opengraph.xyz/](https://www.opengraph.xyz/) or [https://metatags.io/](https://metatags.io/)
- [x] Paste a tablature URL into a WhatsApp/iMessage draft → title + image preview.

**Quick local sanity checks (no deploy needed):**

- [x] `curl -s https://<host>/robots.txt` and `/sitemap.xml` return correctly.
- [x] View-source a tablature page → one `<title>`, a `<link rel="canonical">` with an
  ```
  absolute URL, `og:title/description/image/url`, and `application/ld+json` blocks.
  ```

> Note: WhatsApp/Facebook can't fetch the OG image from a non-public URL, so the
> "no image on WhatsApp" you saw locally is expected — it resolves once deployed.



## Out of scope (per your brief — not doing)

- ❌ Analytics / visitor tracking (you said you don't care for now).
- ❌ Bilingual FR/EN routing + hreflang (English-only chosen).
- ❌ Paid ads / Google Merchant feed.

