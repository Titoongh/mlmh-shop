import { Prisma, PrismaClient } from '@prisma/client'

const prisma = new PrismaClient({ log: ['query'] })

const main = async () => {
    await prisma.artist.deleteMany()
    await prisma.tablature.deleteMany()
    await prisma.musicalGenre.deleteMany()

    await prisma.artist.create({
        data: {
            name: 'Doc Watson',
            musicalGenres: {
                create: [
                    {
                        name: 'Bluegrass',
                    },
                ],
            },
            description: 'Doc Watson is really cool',
            picture:
                'https://upload.wikimedia.org/wikipedia/commons/thumb/b/ba/Doc_Watson_Sugar_Grove.jpg/440px-Doc_Watson_Sugar_Grove.jpg',
            tablatures: {
                create: [
                    {
                        title: 'Deep River Blues',
                        downloadLink:
                            'https://upload.wikimedia.org/wikipedia/commons/thumb/b/ba/Doc_Watson_Sugar_Grove.jpg/440px-Doc_Watson_Sugar_Grove.jpg',
                        description: 'Doc Watson playing Deep River Blues',
                        musicalGenres: {
                            create: [
                                {
                                    name: 'Blues',
                                },
                            ],
                        },
                        contents: {
                            create: [
                                {
                                    type: 'IMAGE',
                                    url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/ba/Doc_Watson_Sugar_Grove.jpg/440px-Doc_Watson_Sugar_Grove.jpg',
                                    rank: 1,
                                },
                            ],
                        },
                    },
                ],
            },
        },
    })
}

main()
    .then(() => {
        console.log('Database populated')
    })
    .catch(e => {
        console.error(e)
    })
