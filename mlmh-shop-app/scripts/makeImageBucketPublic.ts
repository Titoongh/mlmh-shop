#!/usr/bin/env node
/**
 * Rend les IMAGES du bucket Scaleway accessibles publiquement (lecture).
 *
 * Passer un bucket en "public" ne change PAS l'ACL des objets déjà uploadés (en
 * privé) : il faut agir objet par objet, OU poser une bucket policy publique.
 *
 * Deux modes :
 *   (défaut) ACL par objet : met `public-read` sur chaque objet listé. Direct,
 *            mais ne couvre QUE les objets existants (les futurs uploads devront
 *            aussi être rendus publics — voir --policy ou l'endpoint d'upload).
 *   --policy : pose une bucket policy "GetObject public" → couvre TOUS les objets
 *            existants ET futurs, en un seul appel (recommandé).
 *
 * SÉCURITÉ : DRY-RUN par défaut. Rien n'est écrit tant que `--apply` n'est pas
 * passé. ⚠️ Ne lance ça QUE sur le bucket des IMAGES (pas celui des tablatures).
 *
 * Env requis : SCW_ACCESS_KEY, SCW_SECRET_KEY, SCW_BUCKET_NAME.
 * Optionnels : SCW_REGION (fr-par), SCW_ENDPOINT (https://s3.fr-par.scw.cloud).
 *
 * Usage :
 *   tsx scripts/makeImageBucketPublic.ts                 # dry-run, ACL par objet
 *   tsx scripts/makeImageBucketPublic.ts --apply         # ACL par objet (réel)
 *   tsx scripts/makeImageBucketPublic.ts --policy         # dry-run, bucket policy
 *   tsx scripts/makeImageBucketPublic.ts --policy --apply # bucket policy (réel)
 */

import {
    S3Client,
    ListObjectsV2Command,
    PutObjectAclCommand,
    PutBucketPolicyCommand,
} from '@aws-sdk/client-s3'

function assertEnv() {
    const required = ['SCW_ACCESS_KEY', 'SCW_SECRET_KEY', 'SCW_BUCKET_NAME']
    const missing = required.filter(n => !process.env[n])
    if (missing.length) {
        console.error(
            `\n❌ Missing required env var(s): ${missing.join(', ')}\n\n` +
                `Required: SCW_ACCESS_KEY, SCW_SECRET_KEY, SCW_BUCKET_NAME\n` +
                `Optional (defaults): SCW_REGION (fr-par), SCW_ENDPOINT (https://s3.fr-par.scw.cloud)\n`,
        )
        process.exit(1)
    }
}

const argv = process.argv.slice(2)
const APPLY = argv.includes('--apply')
const USE_POLICY = argv.includes('--policy')

const BUCKET = process.env.SCW_BUCKET_NAME as string

function makeClient(): S3Client {
    return new S3Client({
        region: process.env.SCW_REGION || 'fr-par',
        endpoint: process.env.SCW_ENDPOINT || 'https://s3.fr-par.scw.cloud',
        credentials: {
            accessKeyId: process.env.SCW_ACCESS_KEY as string,
            secretAccessKey: process.env.SCW_SECRET_KEY as string,
        },
        forcePathStyle: true,
    })
}

function publicReadPolicy(bucket: string): string {
    return JSON.stringify({
        Version: '2023-04-17',
        Statement: [
            {
                Sid: 'PublicReadGetObject',
                Effect: 'Allow',
                Principal: '*',
                Action: ['s3:GetObject'],
                Resource: [`${bucket}/*`],
            },
        ],
    })
}

async function applyPolicy(s3: S3Client) {
    const policy = publicReadPolicy(BUCKET)
    console.log(`\nBucket policy to apply on "${BUCKET}":\n${policy}\n`)
    if (!APPLY) {
        console.log('DRY-RUN: not applied. Re-run with --policy --apply.')
        return
    }
    await s3.send(new PutBucketPolicyCommand({ Bucket: BUCKET, Policy: policy }))
    console.log('✅ Bucket policy applied (existing + future objects are public).')
}

async function applyPerObjectAcl(s3: S3Client) {
    let token: string | undefined
    let total = 0
    let done = 0
    let failed = 0

    do {
        const res = await s3.send(
            new ListObjectsV2Command({
                Bucket: BUCKET,
                ContinuationToken: token,
            }),
        )
        const objects = res.Contents || []
        for (const obj of objects) {
            if (!obj.Key) continue
            total++
            if (!APPLY) {
                console.log(`would set public-read: ${obj.Key}`)
                continue
            }
            try {
                await s3.send(
                    new PutObjectAclCommand({
                        Bucket: BUCKET,
                        Key: obj.Key,
                        ACL: 'public-read',
                    }),
                )
                done++
                if (done % 50 === 0) console.log(`...${done} updated`)
            } catch (e) {
                failed++
                console.error(
                    `FAILED ${obj.Key}:`,
                    e instanceof Error ? e.message : e,
                )
            }
        }
        token = res.IsTruncated ? res.NextContinuationToken : undefined
    } while (token)

    console.log('\n=== Summary ===')
    console.log(`Objects listed : ${total}`)
    if (APPLY) {
        console.log(`Updated        : ${done}`)
        console.log(`Failed         : ${failed}`)
    } else {
        console.log('DRY-RUN: nothing changed. Re-run with --apply.')
    }
}

async function main() {
    assertEnv()
    console.log('=== makeImageBucketPublic ===')
    console.log(`Bucket : ${BUCKET}`)
    console.log(`Mode   : ${USE_POLICY ? 'bucket policy' : 'per-object ACL'}`)
    console.log(`Action : ${APPLY ? 'APPLY (writes)' : 'DRY-RUN'}`)

    const s3 = makeClient()
    if (USE_POLICY) {
        await applyPolicy(s3)
    } else {
        await applyPerObjectAcl(s3)
    }
}

main().catch(e => {
    console.error('Script failed:', e)
    process.exit(1)
})
