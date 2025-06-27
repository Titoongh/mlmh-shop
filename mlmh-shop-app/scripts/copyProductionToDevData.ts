#!/usr/bin/env node

import { PrismaClient } from '@prisma/client'

// Create two Prisma clients - one for each environment
const prodPrisma = new PrismaClient({
    datasources: {
        db: {
            url: 'prisma+postgres://accelerate.prisma-data.net/?api_key=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhcGlfa2V5IjoiNDg1YTg3MmYtOTFiYi00M2MzLThjNDQtMDY2YzE1Y2E0ZTE1IiwidGVuYW50X2lkIjoiNzM0ZDA4NzZjNmI3ZTk5YjUwMTliM2Q5ODQwNWI4ODA4Y2U3OTExOWNiZWEwZDk5OTllNzVkNTYyYTAyNzIyNCIsImludGVybmFsX3NlY3JldCI6ImU1YWIxNzIxLTRiNWEtNGExNy1iNGQwLTRmYWM4MjQ0OTNjNyJ9.kUpkQ4Y_qcaa8ZJaASlqF4c-Tlqd-hjWKYNlcHcY9ro',
        },
    },
})

const devPrisma = new PrismaClient({
    datasources: {
        db: {
            url: 'prisma+postgres://accelerate.prisma-data.net/?api_key=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhcGlfa2V5IjoiMDA1YWI5ODgtNjIwMC00ODc4LWIzMWMtZjNhMjM2NGFkYzdiIiwidGVuYW50X2lkIjoiYThhMTUzMTZkNGYwMDhlYTUwNzQ2ZTcwMzUwY2VmODc3ZWM1NDllNmUzZGU4NWZjODI5ZmNjYThkMWU2ODE5MiIsImludGVybmFsX3NlY3JldCI6Ijk0MTFiZjk1LTU1MTctNDkzOS04YmE0LTIwYjc2MzRiZGEwNCJ9.Xv1_pgStcCjLmtOi-u2qZnr8tIfxpMDkR3cwgsCM9fU',
        },
    },
})

async function copyProductionDataToDevDatabase() {
    try {
        console.log('🚀 Starting production to dev data copy...')

        // Clear existing dev data first (in reverse dependency order)
        console.log('🧹 Clearing existing dev data...')
        await devPrisma.download.deleteMany()
        await devPrisma.downloadIntent.deleteMany()
        await devPrisma.content.deleteMany()
        await devPrisma.tablatureFile.deleteMany()
        await devPrisma.tablature.deleteMany()
        await devPrisma.artist.deleteMany()
        await devPrisma.musicalGenre.deleteMany()
        console.log('✅ Dev database cleared')

        // 1. Copy MusicalGenres (no dependencies)
        console.log('📊 Copying MusicalGenres...')
        const musicalGenres = await prodPrisma.musicalGenre.findMany()
        for (const genre of musicalGenres) {
            await devPrisma.musicalGenre.create({
                data: {
                    id: genre.id,
                    name: genre.name,
                },
            })
        }
        console.log(`✅ Copied ${musicalGenres.length} musical genres`)

        // 2. Copy Artists (with musical genres relationship)
        console.log('🎭 Copying Artists...')
        const artists = await prodPrisma.artist.findMany({
            include: {
                musicalGenres: true,
            },
        })
        for (const artist of artists) {
            await devPrisma.artist.create({
                data: {
                    id: artist.id,
                    createdAt: artist.createdAt,
                    updatedAt: artist.updatedAt,
                    name: artist.name,
                    description: artist.description,
                    hidden: artist.hidden,
                    musicalGenres: {
                        connect: artist.musicalGenres.map(genre => ({
                            id: genre.id,
                        })),
                    },
                },
            })
        }
        console.log(`✅ Copied ${artists.length} artists`)

        // 3. Copy Tablatures (with artists and musical genres relationships)
        console.log('🎼 Copying Tablatures...')
        const tablatures = await prodPrisma.tablature.findMany({
            include: {
                artists: true,
                musicalGenres: true,
            },
        })
        for (const tablature of tablatures) {
            await devPrisma.tablature.create({
                data: {
                    id: tablature.id,
                    createdAt: tablature.createdAt,
                    updatedAt: tablature.updatedAt,
                    downloadLink: tablature.downloadLink,
                    title: tablature.title,
                    price: tablature.price,
                    publicationDate: tablature.publicationDate,
                    description: tablature.description,
                    hidden: tablature.hidden,
                    artists: {
                        connect: tablature.artists.map(artist => ({
                            id: artist.id,
                        })),
                    },
                    musicalGenres: {
                        connect: tablature.musicalGenres.map(genre => ({
                            id: genre.id,
                        })),
                    },
                },
            })
        }
        console.log(`✅ Copied ${tablatures.length} tablatures`)

        // 4. Copy Contents (depends on tablatures and artists)
        console.log('📁 Copying Contents...')
        const contents = await prodPrisma.content.findMany()
        for (const content of contents) {
            await devPrisma.content.create({
                data: {
                    id: content.id,
                    createdAt: content.createdAt,
                    updatedAt: content.updatedAt,
                    type: content.type,
                    url: content.url,
                    blob: content.blob,
                    rank: content.rank,
                    tablatureId: content.tablatureId,
                    artistId: content.artistId,
                },
            })
        }
        console.log(`✅ Copied ${contents.length} contents`)

        // 5. Copy TablatureFiles (depends on tablatures) - Skip if they don't exist in prod
        console.log('📂 Copying TablatureFiles...')
        try {
            const tablatureFiles = await prodPrisma.tablatureFile.findMany()
            for (const file of tablatureFiles) {
                await devPrisma.tablatureFile.create({
                    data: {
                        id: file.id,
                        createdAt: file.createdAt,
                        updatedAt: file.updatedAt,
                        filename: file.filename,
                        scalewayKey: file.scalewayKey,
                        fileSize: file.fileSize,
                        mimeType: file.mimeType,
                        tablatureId: file.tablatureId,
                    },
                })
            }
            console.log(`✅ Copied ${tablatureFiles.length} tablature files`)
        } catch (error) {
            console.log(
                '⚠️  TablatureFile table does not exist in production, skipping...',
            )
        }

        // 6. Copy DownloadIntents (no dependencies)
        console.log('💳 Copying DownloadIntents...')
        const downloadIntents = await prodPrisma.downloadIntent.findMany()
        for (const intent of downloadIntents) {
            await devPrisma.downloadIntent.create({
                data: {
                    id: intent.id,
                    email: intent.email,
                    success: intent.success,
                    createdAt: intent.createdAt,
                    updatedAt: intent.updatedAt,
                    stripeSessionId: intent.stripeSessionId,
                },
            })
        }
        console.log(`✅ Copied ${downloadIntents.length} download intents`)

        // 7. Copy Downloads (depends on downloadIntents and tablatures)
        console.log('⬇️  Copying Downloads...')
        const downloads = await prodPrisma.download.findMany()
        for (const download of downloads) {
            await devPrisma.download.create({
                data: {
                    id: download.id,
                    downloadIntentId: download.downloadIntentId,
                    tablatureId: download.tablatureId,
                },
            })
        }
        console.log(`✅ Copied ${downloads.length} downloads`)

        console.log('\n🎉 Data copy completed successfully!')
        console.log('\n📊 Summary:')
        console.log(`- Musical Genres: ${musicalGenres.length}`)
        console.log(`- Artists: ${artists.length}`)
        console.log(`- Tablatures: ${tablatures.length}`)
        console.log(`- Contents: ${contents.length}`)
        console.log(`- Download Intents: ${downloadIntents.length}`)
        console.log(`- Downloads: ${downloads.length}`)
    } catch (error) {
        console.error('❌ Data copy failed:', error)
        process.exit(1)
    } finally {
        await prodPrisma.$disconnect()
        await devPrisma.$disconnect()
    }
}

// Run the data copy
copyProductionDataToDevDatabase().catch(console.error)
