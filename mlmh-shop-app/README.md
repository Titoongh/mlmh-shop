# MLMH Shop Readme for developers

## Getting Started

Run the docker compose to start the database and the server:

```bash
docker compose up --build
```

## TODOs

- [x] Test all endpoints
- [x] Test prisma studio to see if my father could use it as it is otherwise create ugly forms to do it
- [x] fill database with 2 artists and 2 tabs per artist
- [x] Implement payment with stripe and/or paypal and test it
- [ ] continue with implementing frontend features especially the search, product page, and payment page
- [ ] Later: We will need to create custom links for downloading tabs: I think that I should create forms so that my dad can add its previous tabs and artists. When adding a dropbox link, my server should download the file directly and store it locally so that it can generate a one time download link.

# Usefull doc

- [File conventions](https://nextjs.org/docs/app/api-reference/file-conventions)
- [Generated types](https://www.prisma.io/docs/orm/prisma-client/type-safety#what-are-generated-types)
- [TS Satisfies operator](https://www.prisma.io/blog/satisfies-operator-ur8ys8ccq7zb)
