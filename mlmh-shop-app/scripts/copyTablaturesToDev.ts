import { ScalewayService } from '../services/scalewayv2'

async function copyTablaturesToDev() {
    console.log(
        'Starting tablatures copy from "tablatures" to "tablatures-dev"...',
    )

    try {
        const scalewayService = new ScalewayService()

        const sourceBucket = 'tablatures'
        const destinationBucket = 'tablatures-dev'

        // List all objects in the source bucket
        console.log(`Listing objects in source bucket: ${sourceBucket}`)
        const sourceObjects = await scalewayService.listObjects(sourceBucket)

        if (sourceObjects.length === 0) {
            console.log('No objects found in source bucket')
            return
        }

        console.log(`Found ${sourceObjects.length} objects in source bucket`)

        // List all objects in the destination bucket to check what already exists
        console.log(
            `Listing objects in destination bucket: ${destinationBucket}`,
        )
        const destinationObjects = await scalewayService.listObjects(
            destinationBucket,
        )
        const existingKeys = new Set(
            destinationObjects.map(obj => obj.Key).filter(Boolean),
        )

        console.log(
            `Found ${destinationObjects.length} existing objects in destination bucket`,
        )

        let copiedCount = 0
        let skippedCount = 0

        // Process each object in the source bucket
        for (const sourceObject of sourceObjects) {
            if (!sourceObject.Key) {
                console.log('Skipping object without key')
                continue
            }

            const key = sourceObject.Key

            // Check if file already exists in destination
            if (existingKeys.has(key)) {
                console.log(`Skipping ${key} - already exists in destination`)
                skippedCount++
                continue
            }

            try {
                console.log(`Copying ${key}...`)

                // Download from source bucket
                const fileData = await scalewayService.downloadFile(
                    key,
                    sourceBucket,
                )

                // Upload to destination bucket
                await scalewayService.uploadFile(
                    fileData.content,
                    key,
                    destinationBucket,
                    fileData.contentType || 'application/octet-stream',
                )

                console.log(`✓ Successfully copied ${key}`)
                copiedCount++
            } catch (error) {
                console.error(`✗ Failed to copy ${key}:`, error)
            }
        }

        console.log('\n=== Copy Summary ===')
        console.log(`Total objects in source: ${sourceObjects.length}`)
        console.log(`Successfully copied: ${copiedCount}`)
        console.log(`Skipped (already exist): ${skippedCount}`)
        console.log(
            `Failed: ${sourceObjects.length - copiedCount - skippedCount}`,
        )
        console.log('Copy operation completed!')
    } catch (error) {
        console.error('Copy operation failed:', error)
        throw error
    }
}

// Run the script if executed directly
if (require.main === module) {
    copyTablaturesToDev()
        .then(() => {
            console.log('Script completed successfully')
            process.exit(0)
        })
        .catch(error => {
            console.error('Script failed:', error)
            process.exit(1)
        })
}

export { copyTablaturesToDev }
