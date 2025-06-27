#!/usr/bin/env node

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function migrateDownloadLinksToFiles() {
    try {
        // Find all tablatures with downloadLink but no files
        const tablatures = await prisma.tablature.findMany({
            where: {
                downloadLink: {
                    not: null,
                },
                files: {
                    none: {},
                },
            },
            select: {
                id: true,
                title: true,
                downloadLink: true,
            },
        })

        let migrated = 0
        let failed = 0

        for (const tablature of tablatures) {
            try {
                if (!tablature.downloadLink) continue

                // Extract filename from Scaleway key
                const scalewayKey = tablature.downloadLink
                let filename = scalewayKey

                // Try to extract a better filename
                // if (scalewayKey.includes('/')) {
                //     filename = scalewayKey.split('/').pop() || scalewayKey
                // }

                // Get file extension
                const extension = filename.includes('.')
                    ? filename.split('.').pop()?.toLowerCase()
                    : 'pdf'

                // Generate a readable filename if needed
                // if (!filename.includes('.')) {
                //     filename = `${tablature.title
                //         .replace(/[^a-zA-Z0-9\s-]/g, '')
                //         .replace(/\s+/g, '-')
                //         .toLowerCase()}.${extension}`
                // }

                // Create the file record
                await prisma.tablatureFile.create({
                    data: {
                        filename: filename,
                        scalewayKey: scalewayKey,
                        mimeType: getMimeType(extension || 'pdf'),
                        tablatureId: tablature.id,
                    },
                })

                migrated++
            } catch (error) {
                failed++
            }
        }

        if (migrated > 0) {
            console.log('Migration completed successfully!')
        }
    } catch (error) {
        process.exit(1)
    } finally {
        await prisma.$disconnect()
    }
}

function getMimeType(extension: string): string {
    const mimeTypes: { [key: string]: string } = {
        pdf: 'application/pdf',
        gp5: 'application/octet-stream',
        gpx: 'application/octet-stream',
        gp4: 'application/octet-stream',
        gp3: 'application/octet-stream',
        mid: 'audio/midi',
        midi: 'audio/midi',
        zip: 'application/zip',
    }
    return mimeTypes[extension.toLowerCase()] || 'application/octet-stream'
}

// Run the migration
migrateDownloadLinksToFiles().catch(() => process.exit(1))
