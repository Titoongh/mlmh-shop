# MLMH Shop Readme for developers

## Getting Started

Run the docker compose to start the database and the server:

```bash
stripe listen --forward-to localhost:3000/api/webhook/stripe
docker compose up --build
```

# Usefull doc

- [File conventions](https://nextjs.org/docs/app/api-reference/file-conventions)
- [Generated types](https://www.prisma.io/docs/orm/prisma-client/type-safety#what-are-generated-types)
- [TS Satisfies operator](https://www.prisma.io/blog/satisfies-operator-ur8ys8ccq7zb)
