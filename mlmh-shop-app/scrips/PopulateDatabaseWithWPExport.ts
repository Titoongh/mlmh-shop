import { Prisma, PrismaClient } from '@prisma/client'
import fs from 'fs'
import path from 'path'
import { parse } from 'csv-parse/sync'

const prisma = new PrismaClient({ log: ['query'] })

// Function to extract YouTube URLs from text
const extractYoutubeUrls = (text: string): string[] => {
    if (!text) return []
    const youtubeRegex =
        /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:[^\/\n\s]+\/\S+\/|(?:v|e(?:mbed)?)\/|\S*?[?&]v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})/g
    const matches = text.match(youtubeRegex) || []
    return Array.from(new Set(matches))
}

// Function to extract title from name
const extractTitle = (name: string): string => {
    const parts = name.split('-')
    return parts[0].trim()
}

// Function to find artist in categories based on database artists
const findArtistInCategories = (
    categories: string,
    dbArtists: { id: string; name: string }[],
): { id: string; name: string } | null => {
    if (!categories) return null

    for (const artist of dbArtists) {
        // Create a case-insensitive regex pattern for each artist
        const pattern = new RegExp(artist.name, 'i')
        if (pattern.test(categories)) {
            return artist
        }
    }
    return null
}

const main = async () => {
    // Get all artists from database
    const dbArtists = await prisma.artist.findMany({
        select: {
            id: true,
            name: true,
        },
    })

    if (dbArtists.length === 0) {
        console.error(
            'No artists found in database. Please populate artists first.',
        )
        process.exit(1)
    }

    // Read and parse CSV file
    const csvContent = fs.readFileSync(
        path.join(process.cwd(), 'scrips/sitepapaexport.csv'),
        'utf-8',
    )
    const records = parse(csvContent, {
        delimiter: ';',
        columns: true,
        // skip_empty_lines: true,
        // relaxQuotes: true,
        // relaxColumnCount: true,
        // from: 2, // Skip the first line which contains the export info
    })

    console.log(`Processing ${records.length} tablatures...`)
    const unprocessedTablatures: any[] = []

    console.log('db artist', dbArtists)
    // Process each record
    for (const record of records) {
        try {
            // console.log(
            //     '\n\n==============Processing tablature:=============\n\n',
            //     record,
            // )
            // console.log('record name', record.Name)
            console.log('categories', record.Categories)
            const artist = findArtistInCategories(record.Categories, dbArtists)
            console.log('artist', artist)
            console.log(
                'Processing category:',
                record.Categories,
                'found artist:',
                artist,
            )
            const downloadUrl: string = record['Download 1 URL']
            console.log('downloadUrl', downloadUrl)

            if (!artist || !downloadUrl) {
                console.log('Skipping record:', record.Name)
                unprocessedTablatures.push({
                    name: record.Name,
                    reason: !artist
                        ? 'No matching artist found'
                        : 'No download URL',
                    categories: record.Categories,
                })
                continue
            }

            const youtubeUrls = extractYoutubeUrls(record.Description)
            console.log(
                'description',
                record.Description,
                'youtubeUrls',
                youtubeUrls,
            )
            const youtubeUrls2 = extractYoutubeUrls(record.shortDescription)
            console.log(
                'shortdescription',
                record.Shortdescription,
                'youtubeUrls',
                youtubeUrls,
            )
            const uniqueYoutubeUrls = Array.from(
                new Set([...youtubeUrls, ...youtubeUrls2]),
            )

            // const data = {
            //     title: extractTitle(record.Name),
            //     downloadLink: downloadUrl,
            //     price: 9.9,
            //     artists: {
            //         connect: { id: artist.id },
            //     },
            //     contents:
            //         uniqueYoutubeUrls.length > 0
            //             ? {
            //                   createMany: {
            //                       data: uniqueYoutubeUrls.map((url, index) => ({
            //                           type: 'VIDEO',
            //                           url,
            //                           rank: index + 1,
            //                       })),
            //                   },
            //               }
            //             : {
            //                   create: [],
            //               },
            // }

            // console.log('data', data)

            await prisma.tablature.create({
                data: {
                    title: extractTitle(record.Name),
                    downloadLink: downloadUrl,
                    price: 9.9,
                    artists: {
                        connect: { id: artist.id },
                    },
                    contents:
                        uniqueYoutubeUrls.length > 0
                            ? {
                                  createMany: {
                                      data: uniqueYoutubeUrls.map(
                                          (url, index) => ({
                                              type: 'VIDEO',
                                              url,
                                              rank: index + 1,
                                          }),
                                      ),
                                  },
                              }
                            : {
                                  create: [],
                              },
                },
            })
        } catch (error) {
            console.error(`Error processing tablature ${record.Name}:`, error)
            unprocessedTablatures.push({
                name: record.Name,
                categories: record.Categories,
            })
        }
    }

    // Write unprocessed tablatures to CSV
    if (unprocessedTablatures.length > 0) {
        const unprocessedCsv = unprocessedTablatures
            .map(tab => `"${tab.name}","${tab.reason}","${tab.categories}"`)
            .join('\n')
        fs.writeFileSync(
            'unprocessed_tablatures.csv',
            'Name,Reason,Categories\n' + unprocessedCsv,
        )
        console.log(
            `${unprocessedTablatures.length} tablatures couldn't be processed. Check unprocessed_tablatures.csv`,
        )
    }
}

main()
    .catch(console.error)
    .finally(async () => {
        await prisma.$disconnect()
    })
