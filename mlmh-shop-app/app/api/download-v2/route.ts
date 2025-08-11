import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import JSZip from 'jszip'
import ScalewayService from '../../../services/scalewayv2'
import { canDownloadSession, verifyUserPurchase } from '@/services/purchase-verification'
import { prisma } from '@/app/prisma'

const SCALEWAY_TABLATURES_BUCKET =
    process.env.SCALEWAY_TABLATURES_BUCKET || 'tablatures-dev'

/**
 * Robust download endpoint that supports both:
 * 1. Session-based downloads (legacy DownloadIntent system)
 * 2. User-based downloads (new authenticated user system)
 */
export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url)
    const sessionId = searchParams.get('session_id')
    const tablatureIds = searchParams.get('tablature_ids')?.split(',')

    try {
        let authorizedTablatureIds: string[] = []
        let downloadType: 'session' | 'user' = 'session'

        if (sessionId) {
            // Legacy session-based download
            console.log('Processing session-based download:', sessionId)
            
            const downloadPermission = await canDownloadSession(sessionId)
            if (!downloadPermission.canDownload) {
                return NextResponse.json(
                    { error: downloadPermission.reason || 'Download not authorized' },
                    { status: 403 }
                )
            }

            authorizedTablatureIds = downloadPermission.tablatureIds || []
        } else if (tablatureIds && tablatureIds.length > 0) {
            // New user-based download with authentication
            console.log('Processing user-based download for tablatures:', tablatureIds)
            downloadType = 'user'

            const { userId } = await auth()
            if (!userId) {
                return NextResponse.json(
                    { error: 'Authentication required for user downloads' },
                    { status: 401 }
                )
            }

            const verification = await verifyUserPurchase(tablatureIds)
            if (verification.status === 'ERROR') {
                return NextResponse.json(
                    { error: verification.error || 'Error verifying purchase' },
                    { status: 500 }
                )
            }

            if (!verification.hasPurchased) {
                return NextResponse.json(
                    { error: 'You have not purchased these tablatures' },
                    { status: 403 }
                )
            }

            authorizedTablatureIds = tablatureIds
        } else {
            return NextResponse.json(
                { error: 'Either session_id or tablature_ids parameter is required' },
                { status: 400 }
            )
        }

        if (authorizedTablatureIds.length === 0) {
            return NextResponse.json(
                { error: 'No tablatures found for download' },
                { status: 404 }
            )
        }

        // Get tablature data with files
        const tablatures = await prisma.tablature.findMany({
            where: {
                id: { in: authorizedTablatureIds },
            },
            include: {
                files: true,
                artists: true,
            },
        })

        if (tablatures.length === 0) {
            return NextResponse.json(
                { error: 'No tablatures found' },
                { status: 404 }
            )
        }

        console.log(`Preparing download for ${tablatures.length} tablatures (${downloadType} download)`)

        // Create ZIP file
        const zip = new JSZip()
        const scalewayService = new ScalewayService(
            undefined,
            SCALEWAY_TABLATURES_BUCKET,
        )

        let totalFilesAdded = 0

        for (const tablature of tablatures) {
            // Create a folder for each tablature in the zip
            const safeTablatureName = tablature.title
                .replace(/[^a-zA-Z0-9\s-]/g, '')
                .replace(/\s+/g, '-')
            const tablatureFolder = zip.folder(safeTablatureName)

            if (tablature.files && tablature.files.length > 0) {
                for (const file of tablature.files) {
                    try {
                        const scalewayKey = file.scalewayKey

                        // Check if file exists in Scaleway
                        const fileExists = await scalewayService.fileExists(
                            scalewayKey,
                            SCALEWAY_TABLATURES_BUCKET,
                        )
                        if (!fileExists) {
                            console.warn(`File not found in Scaleway: ${scalewayKey}`)
                            continue
                        }

                        // Get signed URL and download file
                        const signedUrl = await scalewayService.signedUrl(
                            scalewayKey,
                            SCALEWAY_TABLATURES_BUCKET,
                            3600, // 1 hour expiry
                        )
                        if (!signedUrl) {
                            console.warn(`Failed to generate signed URL for: ${scalewayKey}`)
                            continue
                        }

                        const response = await fetch(signedUrl)
                        if (!response.ok) {
                            console.warn(`Failed to download file: ${scalewayKey}, status: ${response.status}`)
                            continue
                        }
                        const fileBuffer = await response.arrayBuffer()

                        // Use original filename or generate safe name
                        const safeFilename = file.filename || `file-${file.id}`
                        tablatureFolder?.file(safeFilename, fileBuffer)
                        totalFilesAdded++
                        
                        console.log(`Added file to ZIP: ${safeFilename} from ${scalewayKey}`)
                    } catch (fileError) {
                        console.error(`Error processing file ${file.scalewayKey}:`, fileError)
                        // Continue with other files
                    }
                }
            }
        }

        if (totalFilesAdded === 0) {
            return NextResponse.json(
                { error: 'No files available for download' },
                { status: 404 }
            )
        }

        console.log(`Successfully added ${totalFilesAdded} files to ZIP`)

        // Generate the ZIP file
        const zipBuffer = await zip.generateAsync({ type: 'arraybuffer' })

        // Generate filename based on download type
        const zipFilename = downloadType === 'session' 
            ? 'tablatures.zip'
            : tablatures.length === 1 
                ? `${tablatures[0].title.replace(/[^a-zA-Z0-9\s-]/g, '').replace(/\s+/g, '-')}.zip`
                : `tablatures-${tablatures.length}-items.zip`

        // Return the ZIP file
        return new NextResponse(zipBuffer, {
            headers: {
                'Content-Disposition': `attachment; filename="${zipFilename}"`,
                'Content-Type': 'application/zip',
                'Content-Length': zipBuffer.byteLength.toString(),
            },
        })

    } catch (error: any) {
        console.error('Download error:', error)
        
        if (error.message?.includes('Authentication')) {
            return NextResponse.json(
                { error: 'Authentication required' },
                { status: 401 }
            )
        }

        return NextResponse.json(
            { 
                error: 'An error occurred while processing your download',
                details: process.env.NODE_ENV === 'development' ? error.message : undefined
            },
            { status: 500 }
        )
    }
}