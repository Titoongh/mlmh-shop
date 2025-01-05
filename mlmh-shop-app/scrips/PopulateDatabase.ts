import { Prisma, PrismaClient } from '@prisma/client'
import fs from 'fs'
import path from 'path'

const prisma = new PrismaClient({ log: ['query'] })

// Helper function to get image files from uploads folder
const getImageFiles = () => {
    const uploadsPath = path.join(process.cwd(), 'uploads')
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

// Generate random artist data
const generateArtistData = (index: number) => {
    // Randomly select 2-3 genres for the artist
    const artistGenres = availableGenres
        .sort(() => Math.random() - 0.5)
        .slice(0, 2 + Math.floor(Math.random() * 2))

    return {
        name: `Artist ${index + 1}`,
        genres: artistGenres,
        description: `Description for Artist ${index + 1}`,
        tablatures: [
            {
                title: `Song 1 by Artist ${index + 1}`,
                downloadLink:
                    'https://www.dropbox.com/s/gytv20rl4zrylzy/Take%20me%20home%20arrgt%20instru%20picking%20Lelong.pdf?dl=0',
                description: `First song by Artist ${index + 1}`,
                genres: artistGenres.slice(0, 2), // Use first two genres for first song
            },
            {
                title: `Song 2 by Artist ${index + 1}`,
                downloadLink:
                    'https://www.dropbox.com/s/gytv20rl4zrylzy/Take%20me%20home%20arrgt%20instru%20picking%20Lelong.pdf?dl=0',
                description: `Second song by Artist ${index + 1}`,
                genres: artistGenres.slice(-2), // Use last two genres for second song
            },
        ],
    }
}

// Generate 5 artists with 2 tablatures each
const artistsData = Array.from({ length: 5 }, (_, i) => generateArtistData(i))

const main = async () => {
    // Clear existing data
    await prisma.artist.deleteMany()
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
                                '/uploads/' +
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
                                        '/uploads/' +
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
