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

## Project docs

- [Stripe integration & conventions](docs/stripe.md) — payment flow, sync pattern, logged-in vs guest mode
- [Image optimization](../IMAGE_OPTIMIZATION.md)
- [Stripe v2 deployment guide](../STRIPE_V2_DEPLOYMENT_GUIDE.md)

## Usefull doc

- [File conventions](https://nextjs.org/docs/app/api-reference/file-conventions)
- [Generated types](https://www.prisma.io/docs/orm/prisma-client/type-safety#what-are-generated-types)
- [TS Satisfies operator](https://www.prisma.io/blog/satisfies-operator-ur8ys8ccq7zb)

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

