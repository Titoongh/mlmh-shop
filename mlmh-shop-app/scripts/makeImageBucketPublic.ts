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
 * Env requis : SCW_ACCESS_KEY, SCW_SECRET_KEY, SCW_BUCKET_NAME (les variantes
 *   MLMH_-préfixées de .env.deploy sont aussi acceptées et prioritaires — pour
 *   cibler la prod : `tsx --env-file=.env.deploy ... --policy --apply`, bucket=mlmh).
 * Pour --policy : le principal propriétaire est auto-résolu depuis la clé API (IAM).
 *   Override possible via SCW_POLICY_PRINCIPALS (ex. "application_id:<APP_ID>").
 *   Sans ce grant, la policy verrouille l'écriture (AccessDenied sur les uploads).
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

// The deploy source of truth (.env.deploy) prefixes Scaleway vars with MLMH_
// (e.g. MLMH_SCW_BUCKET_NAME=mlmh) — the MLMH_ → unprefixed mapping only happens
// in docker-entrypoint.sh on the server. So when run with --env-file=.env.deploy,
// prefer the MLMH_-prefixed value (else a stray unprefixed shell var like
// SCW_BUCKET_NAME=mlmh-dev would silently win and target the wrong bucket).
for (const name of [
    'SCW_ACCESS_KEY',
    'SCW_SECRET_KEY',
    'SCW_BUCKET_NAME',
    'SCW_REGION',
]) {
    const prefixed = process.env['MLMH_' + name]
    if (prefixed) process.env[name] = prefixed
}

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

// SCW principals that must KEEP full access to the bucket once a policy exists.
// Comma-separated, e.g. "application_id:<APP_ID>" or "user_id:<USER_ID>".
// Scaleway bucket policies (version 2023-04-17) are allow-only and authoritative:
// without an explicit owner grant, the API key LOSES write access and uploads
// start failing with AccessDenied. The `SCW` field accepts only `user_id:` /
// `application_id:` (NOT project_id).
// https://www.scaleway.com/en/docs/object-storage/troubleshooting/lost-bucket-access-bucket-policy/
function envPrincipals(): string[] {
    return (process.env.SCW_POLICY_PRINCIPALS || '')
        .split(',')
        .map(s => s.trim())
        .filter(Boolean)
}

// Resolve the SCW principal(s) that must keep full access. Prefer an explicit
// SCW_POLICY_PRINCIPALS; otherwise auto-discover the bearer of the current API
// key via the Scaleway IAM API (the secret key doubles as the X-Auth-Token).
async function resolvePrincipals(): Promise<string[]> {
    const explicit = envPrincipals()
    if (explicit.length) return explicit

    const accessKey = process.env.SCW_ACCESS_KEY as string
    const secretKey = process.env.SCW_SECRET_KEY as string
    try {
        const res = await fetch(
            `https://api.scaleway.com/iam/v1alpha1/api-keys/${accessKey}`,
            { headers: { 'X-Auth-Token': secretKey } },
        )
        if (!res.ok) throw new Error(`IAM API ${res.status}: ${await res.text()}`)
        const data: any = await res.json()
        if (data.application_id)
            return [`application_id:${data.application_id}`]
        if (data.user_id) return [`user_id:${data.user_id}`]
        throw new Error('API key has neither application_id nor user_id')
    } catch (e) {
        console.error(
            '\n❌ Could not auto-resolve the API key principal:\n  ' +
                (e instanceof Error ? e.message : String(e)) +
                '\n\nSet it manually instead, e.g.:\n' +
                '  SCW_POLICY_PRINCIPALS="application_id:<APP_ID>"   # or user_id:<USER_ID>\n' +
                '(Scaleway console → IAM → Applications/Users → copy the ID.)\n',
        )
        process.exit(1)
    }
}

function publicReadPolicy(bucket: string, principals: string[]): string {
    return JSON.stringify({
        Version: '2023-04-17',
        Id: 'MlmhImagesPolicy',
        Statement: [
            {
                // Keep the bucket owner/key writable — prevents the lockout.
                Sid: 'OwnerFullAccess',
                Effect: 'Allow',
                Principal: { SCW: principals },
                Action: '*',
                Resource: [bucket, `${bucket}/*`],
            },
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
    const principals = await resolvePrincipals()
    console.log(`Owner principal(s): ${principals.join(', ')}`)
    const policy = publicReadPolicy(BUCKET, principals)
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
