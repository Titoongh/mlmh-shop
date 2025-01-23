import { Prisma, PrismaClient } from '@prisma/client'
import fs from 'fs'
import path from 'path'

const realArtists = [
    'Brownie Mc Ghee',
    'Big Bill Bronzy',
    'Johnny Shines',
    'Jerry Ricks',
    'Fred McDowell',
    'Jorma Kaukonen',
    'John Jackson',
    'Memphis Minnie',
    'Robert Johnson',
    'Gary Davis',
    'Muddy Waters',
    'Chet Atkins',
    'Larry Campbell',
    'Mississippi John Hurt',
    'Ray Charles',
    'Bob Dylan',
    'Doc Watson',
    'Mance Lipscomb',
    'Tommy Johnson',
    'Lightnin Hopkins',
    'Etta Baker',
]

const prisma = new PrismaClient({ log: ['query'] })

// Helper function to get image files from uploads folder
const getImageFiles = () => {
    const uploadsPath = path.join(process.cwd(), 'public/uploads')
    try {
        return fs.readdirSync(uploadsPath)
    } catch (error) {
        console.error('Error reading uploads directory:', error)
        return []
    }
}

// Available genres for random selection
const availableGenres = [
    'Blues',
    'Folk',
    'Bluegrass',
    'Country',
    'Jazz',
    'Celtic',
]

// Updated generator function to use real artist names
const generateArtistData = (artistName: string) => {
    const artistGenres = availableGenres
        .sort(() => Math.random() - 0.5)
        .slice(0, 2 + Math.floor(Math.random() * 2))

    return {
        name: artistName,
        genres: artistGenres,
        description: `${artistName} is a legendary musician known for their contributions to American roots music.`,
        tablatures: [
            {
                title: `Classic Song 1 by ${artistName}`,
                downloadLink:
                    'https://www.dropbox.com/s/gytv20rl4zrylzy/Take%20me%20home%20arrgt%20instru%20picking%20Lelong.pdf?dl=0',
                description: `A timeless piece by ${artistName}`,
                genres: artistGenres.slice(0, 2),
            },
            {
                title: `Classic Song 2 by ${artistName}`,
                downloadLink:
                    'https://www.dropbox.com/s/gytv20rl4zrylzy/Take%20me%20home%20arrgt%20instru%20picking%20Lelong.pdf?dl=0',
                description: `Another masterpiece by ${artistName}`,
                genres: artistGenres.slice(-2),
            },
        ],
    }
}

// Generate 5 artists with 2 tablatures each
const artistsData = realArtists.map(artistName =>
    generateArtistData(artistName),
)

const main = async () => {
    // Clear existing data
    await prisma.artist.deleteMany()
    await prisma.download.deleteMany()
    await prisma.tablature.deleteMany()
    await prisma.musicalGenre.deleteMany()
    await prisma.content.deleteMany()

    let imageFiles = getImageFiles()
    imageFiles = imageFiles.filter(
        file =>
            file.endsWith('.jpg') ||
            file.endsWith('.png') ||
            file.endsWith('.jpeg'),
    )
    let imageIndex = 0

    await prisma.musicalGenre.createMany({
        data: availableGenres.map(name => ({ name })),
    })

    // Create artists with their tablatures
    for (const artistData of artistsData) {
        await prisma.artist.create({
            data: {
                name: artistData.name,
                description: artistData.description,
                musicalGenres: {
                    connect: artistData.genres.map(name => ({ name })),
                },
                contents: {
                    create: [
                        {
                            type: 'IMAGE',
                            url:
                                '/public/uploads/' +
                                    imageFiles[
                                        imageIndex % imageFiles.length
                                    ] || '',
                            rank: 1,
                        },
                    ],
                },
                tablatures: {
                    create: artistData.tablatures.map(tab => ({
                        title: tab.title,
                        downloadLink: tab.downloadLink,
                        description: tab.description,
                        musicalGenres: {
                            connect: tab.genres.map(genre => ({ name: genre })),
                        },
                        contents: {
                            create: [
                                {
                                    type: 'IMAGE',
                                    url:
                                        '/public/uploads/' +
                                            imageFiles[
                                                (imageIndex + 1) %
                                                    imageFiles.length
                                            ] || '',
                                    rank: 1,
                                },
                            ],
                        },
                    })),
                },
            },
        })
        imageIndex += 2
    }
}

main()
    .then(() => {
        console.log('Database populated')
    })
    .catch(e => {
        console.error(e)
        process.exit(1)
    })
