test
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


# Problems

- Il faut une base de dev qui fonctionne je crois et avec la db a jour avec prisma migrate sinon 
ca marche pas le deploy ! Mais ya surement moyen de trouver mieux comme methode dans la cicd