# MLMH Shop Readme for developers

## Getting Started

Fill the local database with fake data:

```bash
npx tsx scrips/PopulateDatabase.ts
```

Start the local stripe webhook handler:

```bash
stripe listen --forward-to localhost:3000/api/webhook/stripe
```

Run the docker compose to start the database and the server:

```bash
docker compose up --build
```

## Usefull doc

- [File conventions](https://nextjs.org/docs/app/api-reference/file-conventions)
- [Generated types](https://www.prisma.io/docs/orm/prisma-client/type-safety#what-are-generated-types)
- [TS Satisfies operator](https://www.prisma.io/blog/satisfies-operator-ur8ys8ccq7zb)

## Course Feature Overview

The platform now supports full Courses in addition to standalone tablatures.

### Data Model (summary)
| Entity | Purpose |
|--------|---------|
| Course | Wraps structured learning content (lessons) & forum, linked to an optional Tablature. |
| CourseLesson | Ordered unit inside a course. |
| CourseLessonAsset | Video, audio, PDF, image, etc. stored in S3/Scaleway (referenced by URL/key). |
| User | Local mirror of Clerk user (created lazily via ensureLocalUser). |
| CourseEnrollment | Grants a user access to course content. Created on successful payment. |
| CourseComment | Forum message for a course (isAdmin flag for staff / instructors). |
| CoursePurchaseIntent | Stripe checkout intent for courses (auth-only). |

### Purchase Flows
1. Tablature (legacy): Anonymous checkout allowed. Creates DownloadIntent → Stripe session. Webhook marks success and sends email with download link.
2. Course: Requires authenticated Clerk user. Creates CoursePurchaseIntent and Stripe session with metadata.type="course". Webhook confirms payment → upsert CourseEnrollment. Content & comments gated behind enrollment.

### API Routes Added
| Route | Method | Description | Auth |
|-------|--------|-------------|------|
| /api/course/[id] | GET | Public course metadata + enrollment flag (if logged in) | Optional |
| /api/course/checkout | POST | Start authenticated course checkout | Required |
| /api/course/[id]/content | GET | Full lessons + assets (enrolled only) | Required + enrollment |
| /api/course/[id]/comments | GET | List forum comments | Public (course must be published) |
| /api/course/[id]/comments | POST | Create comment (must be enrolled) | Required + enrollment |
| /api/course/asset?assetId= | GET | (Alt) Signed URL for a lesson asset by query | Required + enrollment |
| /api/course/asset/[id]/signed-url | GET | Signed URL for a lesson asset by path | Required + enrollment |
| /api/tablature/[id]/access | POST | Claim access (after anonymous purchase) | Required (links purchase to user) |
| /api/tablature/[id]/comments | GET | List tablature forum comments | Public |
| /api/tablature/[id]/comments | POST | Create tablature comment (after access claimed) | Required + access |
| /api/tablature/[id]/files | GET | List files for purchased tablature (metadata only) | Required + access |
| /api/tablature/file/[fileId]/signed-url | GET | Signed URL for a tablature file | Required + access |

### Auth Mapping
We use Clerk for auth; a local `User` row is created/ensured on first course-related action. Helper: `ensureLocalUser(clerkUserId)`.

### Stripe Metadata
We tag sessions with `metadata.type` = `course` or `tablature` to branch logic in the webhook.

### Extensibility Notes
Future additions (progress tracking, quizzes, certificates) can hang off Course / Lesson ids without breaking purchases. Use separate tables referencing `courseId` / `lessonId` to avoid denormalizing.

### Local Testing Checklist
1. Run migrations (schema includes new course models).
2. Create a test course + lessons + assets via Prisma Studio or seed script.
3. Start Stripe listener.
4. Auth with Clerk test user; POST to /api/course/checkout.
5. After payment session completes (simulate in Stripe), verify CourseEnrollment created.
6. Access /api/course/[id]/content returns lessons.

### Minimal Seeding Snippet (pseudo)
```ts
await prisma.course.create({
	data: {
		title: 'Blues Foundations',
		description: 'Essential riffs and rhythm patterns',
		price: 49,
		published: true,
		lessons: {
			create: [
				{
					title: 'Intro Shuffle', order: 1,
					assets: { create: [{ type: 'VIDEO', url: 's3://bucket/course/intro.mp4', title: 'Video' }] },
				},
			],
		},
	},
})
```

### Forum Moderation Hook Idea
Add a server-only cron or queue worker to scan `CourseComment` for flagged words and mark for review. Not implemented yet; table structure supports adding a `status` enum later.

### Security Considerations
- Do NOT expose raw S3 keys: use signed URLs for private videos if required. Current model stores URL/key; access layer should generate signed URL on demand (future improvement).
- Enforce enrollment before serving any asset links (currently coarse-grained at course content endpoint—per-asset signed URL generation recommended next step).
 - Implemented: per-asset signed URLs for course lesson assets and tablature files (10 min TTL). Client should re-request when expired.
 - Consider caching signed URL responses in-memory (server) keyed by (userId, assetId) with short TTL to reduce presigner load.

### Next Suggested Enhancements
- Asset signed URL proxy endpoint.
- Course listing / search endpoint.
- Admin UI to reorder lessons (drag & drop) and add assets.
- Rate limiting on comment POST.
- Webhook idempotency guard (Stripe idempotent already; optional local log table if needed).
 - Bulk download ZIP builder for tablature files (on-demand with streaming + caching).
 - Soft delete / edit history for comments (add status or revision table).
 - Progress tracking per lesson (CourseProgress table with completedAt).


# Problems

- Il faut une base de dev qui fonctionne je crois et avec la db a jour avec prisma migrate sinon ca marche pas le deploy ! Mais ya surement moyen de trouver mieux comme methode dans la cicd


# Prisma stuffs

## Schema modifications:

Run:
```
npx prisma generate
```

This command will generate the Prisma Client based on the schema defined in `prisma/schema.prisma`. It will also update the types in `@prisma/client` package.

## migration

Write your changes, then run:

### In dev ONLY
```bash
npx prisma migrate dev --name "add-tablature-files-model" # it will run prisma generate too !
```

This create a migration file and applies it to the database in developement.

### In prod ONLY
```bash
npx prisma generate --accelerate
npx prisma migrate deploy
```

## DB Backup

Create a dump that will remove all existing tables if they exists when restoring.
```bash
# Remove existing
pg_dump --clean --if-exists "postgres://user:pwd@db:port/?sslmode=require" > prod_dump_clean_if_exists.sql
# Keep existing
pg_dump "postgres://user:pwd@db:port/?sslmode=require" > prod_dump.sql
```

Restore db:
```bash
psql "db_direct_url" < dump.sql
```

## Prisma rollback

We have to manually generate down revision:
https://www.prisma.io/docs/orm/prisma-migrate/workflows/generating-down-migrations

bump

