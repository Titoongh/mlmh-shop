import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3'
import { Upload } from '@aws-sdk/lib-storage'
import { Readable } from 'stream'

// Scaleway configuration
const scalewayConfig = {
    region: process.env.SCW_REGION || 'fr-par', // Default to Paris region
    endpoint: process.env.SCW_BUCKET_ENDPOINT || 'https://s3.fr-par.scw.cloud',
    credentials: {
        accessKeyId: process.env.SCALEWAY_ACCESS_KEY || '',
        secretAccessKey: process.env.SCALEWAY_SECRET_KEY || '',
    },
}

// Initialize S3 client
const s3Client = new S3Client(scalewayConfig)

// Bucket name
const BUCKET_NAME = process.env.SCALEWAY_BUCKET_NAME || 'mlmh-shop'

// Upload file to Scaleway
export async function uploadFile(
    fileBuffer: Buffer,
    fileName: string,
    contentType: string,
): Promise<string> {
    try {
        const upload = new Upload({
            client: s3Client,
            params: {
                Bucket: BUCKET_NAME,
                Key: fileName,
                Body: fileBuffer,
                ContentType: contentType,
                ACL: 'public-read', // Make the file publicly accessible
            },
        })

        await upload.done()

        // Return the public URL of the uploaded file
        return `https://${BUCKET_NAME}.s3.${
            process.env.SCALEWAY_REGION || 'fr-par'
        }.scw.cloud/${fileName}`
    } catch (error) {
        console.error('Error uploading file to Scaleway:', error)
        throw error
    }
}

// Get file from Scaleway
export async function getFile(fileName: string): Promise<Buffer> {
    try {
        const response = await s3Client.send(
            new GetObjectCommand({
                Bucket: BUCKET_NAME,
                Key: fileName,
            }),
        )

        // Convert the readable stream to a buffer
        const chunks: Buffer[] = []
        for await (const chunk of response.Body as Readable) {
            chunks.push(Buffer.from(chunk))
        }

        return Buffer.concat(chunks)
    } catch (error) {
        console.error('Error getting file from Scaleway:', error)
        throw error
    }
}

// Delete file from Scaleway
export async function deleteFile(fileName: string): Promise<void> {
    try {
        const { DeleteObjectCommand } = require('@aws-sdk/client-s3')

        await s3Client.send(
            new DeleteObjectCommand({
                Bucket: BUCKET_NAME,
                Key: fileName,
            }),
        )
    } catch (error) {
        console.error('Error deleting file from Scaleway:', error)
        throw error
    }
}
