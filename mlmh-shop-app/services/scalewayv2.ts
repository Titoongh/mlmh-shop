import {
    S3Client,
    ListBucketsCommand,
    PutObjectCommand,
    GetObjectCommand,
    DeleteObjectCommand,
    ListObjectsV2Command,
    HeadObjectCommand,
    type S3ClientConfig,
} from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'

export class ScalewayService {
    private s3Client: S3Client
    private defaultBucket: string

    constructor(config?: S3ClientConfig, defaultBucket?: string) {
        // Default configuration
        const credentials: S3ClientConfig = config || {
            region: process.env.SCW_REGION || 'fr-par',
            endpoint: process.env.SCW_ENDPOINT || 'https://s3.fr-par.scw.cloud',
            credentials: {
                accessKeyId: process.env.SCW_ACCESS_KEY || '',
                secretAccessKey: process.env.SCW_SECRET_KEY || '',
            },
            forcePathStyle: true,
        }

        this.s3Client = new S3Client(credentials)
        this.defaultBucket = defaultBucket || process.env.SCW_BUCKET_NAME || ''
    }

    /**
     * List all buckets in the account
     */
    async listBuckets() {
        try {
            const command = new ListBucketsCommand({})
            const response = await this.s3Client.send(command)

            if (!response.Buckets || response.Buckets.length === 0) {
                console.log('No buckets found or Buckets property is undefined')
            }

            return response.Buckets || []
        } catch (error) {
            console.error('Error listing buckets:', error)
            throw error
        }
    }

    /**
     * List all objects in a bucket
     */
    async listObjects(bucket = this.defaultBucket, prefix = '') {
        try {
            const command = new ListObjectsV2Command({
                Bucket: bucket,
                Prefix: prefix,
            })

            const response = await this.s3Client.send(command)
            return response.Contents || []
        } catch (error) {
            console.error(`Error listing objects in bucket ${bucket}:`, error)
            throw error
        }
    }

    /**
     * Upload file to bucket
     */
    async uploadFile(
        fileContent: Buffer | string | Uint8Array | ReadableStream,
        key: string,
        bucket = this.defaultBucket,
        contentType = 'application/octet-stream',
    ) {
        try {
            const command = new PutObjectCommand({
                Bucket: bucket,
                Key: key,
                Body: fileContent,
                ContentType: contentType,
            })

            const response = await this.s3Client.send(command)
            return response
        } catch (error) {
            console.error(`Error uploading file to ${bucket}/${key}:`, error)
            throw error
        }
    }

    /**
     * Download file from bucket
     */
    async downloadFile(key: string, bucket = this.defaultBucket) {
        try {
            const command = new GetObjectCommand({
                Bucket: bucket,
                Key: key,
            })

            const response = await this.s3Client.send(command)

            // Convert stream to buffer if needed
            if (response.Body) {
                const streamToString = async (stream: any): Promise<string> => {
                    const chunks: any[] = []
                    return new Promise((resolve, reject) => {
                        stream.on('data', (chunk: any) => chunks.push(chunk))
                        stream.on('error', reject)
                        stream.on('end', () =>
                            resolve(Buffer.concat(chunks).toString('utf8')),
                        )
                    })
                }

                const bodyContents = await streamToString(response.Body)
                return {
                    content: bodyContents,
                    contentType: response.ContentType,
                    lastModified: response.LastModified,
                }
            }

            throw new Error('No body returned from S3')
        } catch (error) {
            console.error(
                `Error downloading file from ${bucket}/${key}:`,
                error,
            )
            throw error
        }
    }

    async signedUrl(
        key: string,
        bucket = this.defaultBucket,
        expiresIn: number = 3600,
    ) {
        try {
            const command = new GetObjectCommand({
                Bucket: bucket,
                Key: key,
            })
            const url = await getSignedUrl(this.s3Client, command, {
                expiresIn,
            })
            return url
        } catch (error) {
            console.error(
                `Error generating signed URL for ${bucket}/${key}:`,
                error,
            )
            throw error
        }
    }

    /**
     * Delete file from bucket
     */
    async deleteFile(key: string, bucket = this.defaultBucket) {
        try {
            const command = new DeleteObjectCommand({
                Bucket: bucket,
                Key: key,
            })

            const response = await this.s3Client.send(command)
            return response
        } catch (error) {
            console.error(`Error deleting file ${bucket}/${key}:`, error)
            throw error
        }
    }

    /**
     * Check if file exists
     */
    async fileExists(key: string, bucket = this.defaultBucket) {
        try {
            const command = new HeadObjectCommand({
                Bucket: bucket,
                Key: key,
            })

            await this.s3Client.send(command)
            return true
        } catch (error) {
            if ((error as any).name === 'NotFound') {
                return false
            }
            console.error(
                `Error checking if file exists ${bucket}/${key}:`,
                error,
            )
            throw error
        }
    }
}

// Test function to demonstrate usage
async function testScalewayService() {
    try {
        console.log('Starting Scaleway Service test...')
        const service = new ScalewayService()

        // Test 1: List buckets
        console.log('Test 1: Listing buckets')
        const buckets = await service.listBuckets()
        console.log('Buckets:', buckets)

        if (buckets.length === 0) {
            console.warn(
                'No buckets found. Please create a bucket before continuing with the tests.',
            )
            return
        }

        const testBucket = buckets[0].Name
        console.log(`Using bucket: ${testBucket}`)

        // Test 2: Upload a test file
        console.log('Test 2: Uploading test file')
        const testContent = 'This is a test file from Scaleway Service'
        const testKey = `test-${Date.now()}.txt`

        await service.uploadFile(testContent, testKey, testBucket, 'text/plain')
        console.log(`File uploaded to ${testBucket}/${testKey}`)

        // Test 3: List objects
        console.log('Test 3: Listing objects')
        const objects = await service.listObjects(testBucket)
        console.log('Objects:', objects)

        // Test 4: Check if file exists
        console.log('Test 4: Checking if file exists')
        const exists = await service.fileExists(testKey, testBucket)
        console.log(`File exists: ${exists}`)

        // Test 5: Download the file
        console.log('Test 5: Downloading file')
        const downloadedFile = await service.downloadFile(testKey, testBucket)
        console.log('Downloaded content:', downloadedFile.content)
        console.log('Content type:', downloadedFile.contentType)

        // Test 6: Delete the file
        console.log('Test 6: Deleting file')
        // await service.deleteFile(testKey, testBucket)
        console.log(`File ${testKey} deleted`)

        // Test 7: Verify deletion
        console.log('Test 7: Verifying deletion')
        const stillExists = await service.fileExists(testKey, testBucket)
        console.log(`File still exists: ${stillExists}`)

        console.log('All tests completed successfully!')
    } catch (err) {
        console.error('Test failed:', err)
    }
}

// Uncomment to run the test
// testScalewayService()

// Export the service for use in other files
export default ScalewayService
