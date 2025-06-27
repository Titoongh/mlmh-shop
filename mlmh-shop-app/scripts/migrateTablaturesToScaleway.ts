#!/usr/bin/env node

import { PrismaClient } from '@prisma/client'
import ScalewayService from '../services/scalewayv2.js'
import fs from 'fs'
import path from 'path'

const prisma = new PrismaClient()

// Configuration
const SCALEWAY_TABLATURES_BUCKET = 'tablatures'
const LOCAL_DOWNLOAD_DIR = './temp_tablatures'
const BACKUP_FILE = 'dropbox_links_backup_prd.csv'

interface TablatureData {
    id: string
    title: string
    downloadLink: string | null
}

class TablatureMigrator {
    private scalewayService: ScalewayService
    private localDir: string

    constructor() {
        this.scalewayService = new ScalewayService(
            undefined,
            SCALEWAY_TABLATURES_BUCKET,
        )
        this.localDir = path.resolve(LOCAL_DOWNLOAD_DIR)
    }

    async init() {
        // Create local directory if it doesn't exist
        if (!fs.existsSync(this.localDir)) {
            fs.mkdirSync(this.localDir, { recursive: true })
            console.log(`Created local directory: ${this.localDir}`)
        }
    }

    /**
     * Get filename and extension from Dropbox URL
     */
    private getFilenameFromDropboxUrl(url: string): {
        filename: string
        extension: string
    } {
        try {
            const cleanUrl = decodeURIComponent(url.split('?')[0])
            const fullFilename = cleanUrl.split('/').pop() || ''

            const lastDotIndex = fullFilename.lastIndexOf('.')
            if (lastDotIndex === -1) {
                return {
                    filename: fullFilename || 'unknown',
                    extension: '.pdf', // Default to PDF for tablatures
                }
            }

            return {
                filename: fullFilename.substring(0, lastDotIndex),
                extension: fullFilename.substring(lastDotIndex),
            }
        } catch (error) {
            console.error('Error parsing Dropbox URL:', error)
            return {
                filename: 'unknown',
                extension: '.pdf',
            }
        }
    }

    /**
     * Convert Dropbox sharing URL to direct download URL
     */
    private convertToDirectDownloadUrl(dropboxUrl: string): string {
        return dropboxUrl.replace('?dl=0', '?dl=1')
    }

    /**
     * Download file from Dropbox
     */
    private async downloadFromDropbox(
        url: string,
        localPath: string,
    ): Promise<boolean> {
        try {
            const directUrl = this.convertToDirectDownloadUrl(url)
            console.log(`Downloading from: ${directUrl}`)

            const response = await fetch(directUrl)
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`)
            }

            const arrayBuffer = await response.arrayBuffer()
            const buffer = Buffer.from(arrayBuffer)
            fs.writeFileSync(localPath, buffer)

            console.log(`Downloaded: ${localPath} (${buffer.length} bytes)`)
            return true
        } catch (error) {
            console.error(`Failed to download ${url}:`, error)
            return false
        }
    }

    /**
     * Upload file to Scaleway
     */
    private async uploadToScaleway(
        localPath: string,
        scalewayKey: string,
    ): Promise<string | null> {
        try {
            const fileBuffer = fs.readFileSync(localPath)
            const contentType = this.getContentType(path.extname(localPath))

            await this.scalewayService.uploadFile(
                fileBuffer,
                scalewayKey,
                SCALEWAY_TABLATURES_BUCKET,
                contentType,
            )

            // Generate the Scaleway URL
            const scalewayUrl = `${scalewayKey}`
            console.log(`Uploaded to Scaleway: ${scalewayUrl}`)
            return scalewayUrl
        } catch (error) {
            console.error(`Failed to upload ${localPath} to Scaleway:`, error)
            return null
        }
    }

    /**
     * Get content type based on file extension
     */
    private getContentType(extension: string): string {
        const contentTypes: { [key: string]: string } = {
            '.pdf': 'application/pdf',
            '.gp5': 'application/octet-stream',
            '.gpx': 'application/octet-stream',
            '.gp4': 'application/octet-stream',
            '.gp3': 'application/octet-stream',
            '.zip': 'application/zip',
            '.mid': 'audio/midi',
            '.midi': 'audio/midi',
        }
        return (
            contentTypes[extension.toLowerCase()] || 'application/octet-stream'
        )
    }

    /**
     * Generate unique Scaleway key for the file using tablature title
     */
    private generateScalewayKey(
        tablature: TablatureData,
        extension: string,
    ): string {
        // Create a safe filename from title
        const safeTitle = tablature.title
            .replace(/[^a-zA-Z0-9\s-]/g, '')
            .replace(/\s+/g, '-')
            .toLowerCase()

        // Use title as filename with ID to ensure uniqueness
        return `${safeTitle}-${tablature.id.slice(0, 8)}${extension}`
    }

    /**
     * Create CSV backup of original Dropbox links
     */
    private createDropboxBackup(tablatures: TablatureData[]): void {
        const header = 'ID,Title,Original_Dropbox_Link\n'
        const csvContent = tablatures
            .map(
                tab =>
                    `"${tab.id}","${tab.title.replace(/"/g, '""')}","${
                        tab.downloadLink
                    }"`,
            )
            .join('\n')

        fs.writeFileSync(BACKUP_FILE, header + csvContent)
        console.log(`✅ Created backup file: ${BACKUP_FILE}`)
    }

    /**
     * Process a single tablature
     */
    private async processTablature(
        tablature: TablatureData,
    ): Promise<{ success: boolean; newUrl?: string; error?: string }> {
        try {
            if (!tablature.downloadLink) {
                console.warn(
                    `Tablature ${tablature.title} has no download link, skipping.`,
                )
                return { success: true }
            }
            console.log(`\n--- Processing: ${tablature.title} ---`)
            console.log(`Original URL: ${tablature.downloadLink}`)

            // Get filename from Dropbox URL
            const { filename, extension } = this.getFilenameFromDropboxUrl(
                tablature.downloadLink,
            )
            console.log('filename', filename)

            // Create safe title for filename
            const safeTitle = tablature.title
                .replace(/[^a-zA-Z0-9\s-]/g, '')
                .replace(/\s+/g, '-')
                .toLowerCase()

            console.log('safeTitle:', safeTitle)

            // Generate local and Scaleway paths
            const localFilename = `${safeTitle}-${tablature.id.slice(
                0,
                8,
            )}${extension}`
            const localPath = path.join(this.localDir, localFilename)
            const scalewayKey = this.generateScalewayKey(tablature, extension)
            console.log('scalewayKey:', scalewayKey)

            // Check if file already exists in Scaleway
            const exists = await this.scalewayService.fileExists(
                scalewayKey,
                SCALEWAY_TABLATURES_BUCKET,
            )
            if (exists) {
                console.log(`File already exists in Scaleway: ${scalewayKey}`)
                const scalewayUrl = `${scalewayKey}`
                return { success: true, newUrl: scalewayUrl }
            }

            // Download from Dropbox
            const downloadSuccess = await this.downloadFromDropbox(
                tablature.downloadLink,
                localPath,
            )
            if (!downloadSuccess) {
                return {
                    success: false,
                    error: 'Failed to download from Dropbox',
                }
            }

            // Upload to Scaleway
            const scalewayUrl = await this.uploadToScaleway(
                localPath,
                scalewayKey,
            )
            if (!scalewayUrl) {
                return { success: false, error: 'Failed to upload to Scaleway' }
            }

            return { success: true, newUrl: scalewayUrl }
        } catch (error) {
            console.error(
                `Error processing tablature ${tablature.title}:`,
                error,
            )
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error',
            }
        }
    }

    /**
     * Update database with new Scaleway URL
     */
    private async updateTablatureUrl(
        tablatureId: string,
        newUrl: string,
    ): Promise<boolean> {
        try {
            await prisma.tablature.update({
                where: { id: tablatureId },
                data: { downloadLink: newUrl },
            })
            console.log(`Updated database for tablature ${tablatureId}`)
            return true
        } catch (error) {
            console.error(
                `Failed to update database for tablature ${tablatureId}:`,
                error,
            )
            return false
        }
    }

    /**
     * Main migration function
     */
    async migrate(dryRun: boolean = false): Promise<void> {
        try {
            console.log('=== Starting Tablature Migration to Scaleway ===')
            console.log(`Dry run mode: ${dryRun}`)
            console.log(`Target bucket: ${SCALEWAY_TABLATURES_BUCKET}`)

            await this.init()

            // Fetch all tablatures with Dropbox URLs
            const tablatures = await prisma.tablature.findMany({
                select: {
                    id: true,
                    title: true,
                    downloadLink: true,
                },
            })

            console.log(
                `Found ${tablatures.length} tablatures with Dropbox URLs`,
            )

            if (tablatures.length === 0) {
                console.log('No tablatures to migrate.')
                return
            }

            // Create backup of Dropbox links before migration
            console.log('Creating backup of original Dropbox links...')
            this.createDropboxBackup(tablatures)

            let successCount = 0
            let failureCount = 0
            const results: Array<{ tablature: TablatureData; result: any }> = []

            // Process each tablature
            for (let i = 0; i < tablatures.length; i++) {
                const tablature = tablatures[i]
                console.log(`\nProgress: ${i + 1}/${tablatures.length}`)

                const result = await this.processTablature(tablature)
                results.push({ tablature, result })

                if (result.success && result.newUrl) {
                    if (!dryRun) {
                        const updateSuccess = await this.updateTablatureUrl(
                            tablature.id,
                            result.newUrl,
                        )
                        if (updateSuccess) {
                            successCount++
                            console.log(
                                `✅ Successfully migrated: ${tablature.title}`,
                            )
                        } else {
                            failureCount++
                            console.log(
                                `❌ Failed to update database for: ${tablature.title}`,
                            )
                        }
                    } else {
                        successCount++
                        console.log(
                            `✅ Would migrate: ${tablature.title} -> ${result.newUrl}`,
                        )
                    }
                } else {
                    failureCount++
                    console.log(
                        `❌ Failed to migrate: ${tablature.title} - ${result.error}`,
                    )
                }

                // Add small delay to avoid overwhelming the services
                await new Promise(resolve => setTimeout(resolve, 1000))
            }

            // Summary
            console.log('\n=== Migration Summary ===')
            console.log(`Total tablatures: ${tablatures.length}`)
            console.log(`Successfully processed: ${successCount}`)
            console.log(`Failed: ${failureCount}`)

            if (dryRun) {
                console.log(
                    '\nThis was a dry run. No changes were made to the database.',
                )
                console.log(
                    'Run without --dry-run flag to perform actual migration.',
                )
            }
        } catch (error) {
            console.error('Migration failed:', error)
            throw error
        } finally {
            await prisma.$disconnect()
        }
    }
}

// CLI interface
async function main() {
    const args = process.argv.slice(2)
    const dryRun = args.includes('--dry-run')

    if (args.includes('--help') || args.includes('-h')) {
        console.log(`
Usage: npm run migrate-tablatures [options]

Options:
  --dry-run    Perform a dry run without making actual changes
  --help, -h   Show this help message

Examples:
  npm run migrate-tablatures --dry-run    # Test the migration
  npm run migrate-tablatures              # Perform actual migration
        `)
        return
    }

    try {
        const migrator = new TablatureMigrator()
        await migrator.migrate(dryRun)
    } catch (error) {
        console.error('Migration script failed:', error)
        process.exit(1)
    }
}

// Run if this file is executed directly
main().catch(console.error)
