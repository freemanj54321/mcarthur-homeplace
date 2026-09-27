/**
 * Copy site content (Firestore + Storage images) between Firebase projects
 * (MCA-47). All logic lives in src/lib/migration/contentMigration.ts; this file
 * only wires up the two Firebase apps and the command line.
 *
 * Used for:
 *   - the rehearsal into dev/uat (MCA-48) and the initial prod copy (MCA-49),
 *     source = legacy (mcarthur-tour);
 *   - later refreshes prod → uat/dev (MCA-50).
 *
 * Usage (dry run by default: reads both sides, writes nothing):
 *   npm run migrate:content -- --from legacy --to dev
 *   npm run migrate:content -- --from legacy --to dev --apply --prune
 *   npm run migrate:content -- --from legacy --to prod --apply --prune --confirm-prod
 *
 * The npm script runs Node with one warning silenced: Node loads the .ts module
 * below via type stripping and notes that package.json has no "type" field.
 * Adding "type": "module" would change how Next and the config files load.
 *
 * Options:
 *   --from <alias>            Source alias from .firebaserc (legacy, dev, uat, prod).
 *   --to <alias>              Destination alias: dev, uat, or prod (never legacy).
 *   --apply                   Actually write. Without it, nothing is written.
 *   --prune                   Delete destination docs that aren't in the source, so counts reconcile.
 *   --confirm-prod            Required with --apply when the destination is prod.
 *   --collections a,b         Limit to these content collections (default: all nine).
 *   --source-bucket <name>    Override the source bucket (default <project-id>.firebasestorage.app).
 *   --dest-bucket <name>      Override the destination bucket (same default).
 *   --report <file>           Also write the full report as JSON.
 *
 * Credentials:
 *   Destination: Application Default Credentials only. The foundation org blocks
 *     service-account keys (MCA-67), so run `gcloud auth application-default
 *     login` as the foundation account first.
 *   Source: SOURCE_SA_PATH (key file) or SOURCE_SERVICE_ACCOUNT_JSON (JSON
 *     string) when set; otherwise ADC. mcarthur-tour lives in a personal account
 *     the foundation login can't see, so the legacy source needs its key.
 *
 * Images are copied through this machine (download, then upload with a fresh
 * download token) rather than bucket-to-bucket: the foundation org's domain
 * restricted sharing won't let the old project's identities into the new
 * buckets. An identical object already in the destination is reused, so
 * re-runs and the final delta sync only move what changed.
 */

import { randomUUID } from 'node:crypto'
import { readFileSync, writeFileSync } from 'node:fs'
import { parseArgs } from 'node:util'
import { applicationDefault, cert, initializeApp } from 'firebase-admin/app'
import { DocumentReference, getFirestore } from 'firebase-admin/firestore'
import { getStorage } from 'firebase-admin/storage'
import {
  CONTENT_COLLECTIONS,
  migrateContent,
  reconcile,
} from '../src/lib/migration/contentMigration.ts'

const DEST_ALIASES = ['dev', 'uat', 'prod']

function fail(message) {
  console.error(`migrate-content: ${message}`)
  process.exit(1)
}

// ── Arguments ───────────────────────────────────────────────────────────────

const { values: args } = parseArgs({
  options: {
    from: { type: 'string' },
    to: { type: 'string' },
    apply: { type: 'boolean', default: false },
    prune: { type: 'boolean', default: false },
    'confirm-prod': { type: 'boolean', default: false },
    collections: { type: 'string' },
    'source-bucket': { type: 'string' },
    'dest-bucket': { type: 'string' },
    report: { type: 'string' },
  },
})

// Seed/E2E variables would silently redirect the Admin SDK to a local emulator.
for (const name of ['FIRESTORE_EMULATOR_HOST', 'FIREBASE_STORAGE_EMULATOR_HOST', 'FIREBASE_AUTH_EMULATOR_HOST']) {
  if (process.env[name]) fail(`${name} is set; unset it. This script only talks to real projects.`)
}

const { projects: aliases } = JSON.parse(readFileSync(new URL('../.firebaserc', import.meta.url), 'utf8'))
if (!args.from || !aliases[args.from]) fail(`--from must be one of: ${Object.keys(aliases).join(', ')}`)
if (!args.to || !DEST_ALIASES.includes(args.to)) fail(`--to must be one of: ${DEST_ALIASES.join(', ')}`)
if (args.from === args.to) fail('--from and --to must differ')
if (args.apply && args.to === 'prod' && !args['confirm-prod']) {
  fail('writing to prod needs --confirm-prod as well as --apply')
}

const collections = args.collections ? args.collections.split(',').map((c) => c.trim()) : [...CONTENT_COLLECTIONS]
const unknown = collections.filter((c) => !CONTENT_COLLECTIONS.includes(c))
if (unknown.length > 0) fail(`unknown collection(s): ${unknown.join(', ')}`)

const sourceProject = aliases[args.from]
const destProject = aliases[args.to]
const sourceBucketName = args['source-bucket'] ?? `${sourceProject}.firebasestorage.app`
const destBucketName = args['dest-bucket'] ?? `${destProject}.firebasestorage.app`

// ── Firebase apps ───────────────────────────────────────────────────────────

function sourceCredential() {
  if (process.env.SOURCE_SERVICE_ACCOUNT_JSON) return cert(JSON.parse(process.env.SOURCE_SERVICE_ACCOUNT_JSON))
  if (process.env.SOURCE_SA_PATH) return cert(JSON.parse(readFileSync(process.env.SOURCE_SA_PATH, 'utf8')))
  return applicationDefault()
}

const sourceApp = initializeApp({ credential: sourceCredential(), projectId: sourceProject }, 'source')
const destApp = initializeApp({ credential: applicationDefault(), projectId: destProject }, 'dest')
const sourceDb = getFirestore(sourceApp)
const destDb = getFirestore(destApp)
const sourceBucket = getStorage(sourceApp).bucket(sourceBucketName)
const destBucket = getStorage(destApp).bucket(destBucketName)

// TODO(MCA-48): these ports haven't touched real Firebase yet. The logic they
// feed is unit-tested (contentMigration.test.ts); the first read-only dry run
// against legacy → dev is the check for the ports themselves.
/** @type {import('../src/lib/migration/contentMigration.ts').MigrationPorts} */
const ports = {
  isReference: (value) => value instanceof DocumentReference,
  convertReference: (value) => destDb.doc(value.path),

  async listSourceDocs(collection) {
    const snap = await sourceDb.collection(collection).get()
    return snap.docs.map((d) => ({ id: d.id, data: d.data() }))
  },
  async listDestIds(collection) {
    const snap = await destDb.collection(collection).select().get()
    return snap.docs.map((d) => d.id)
  },
  async writeDestDoc(collection, id, data) {
    await destDb.collection(collection).doc(id).set(data)
  },
  async deleteDestDoc(collection, id) {
    await destDb.collection(collection).doc(id).delete()
  },

  async sourceObjectExists(path) {
    const [exists] = await sourceBucket.file(path).exists()
    return exists
  },
  async copyObject(path) {
    const src = sourceBucket.file(path)
    const [exists] = await src.exists()
    if (!exists) return null
    const [srcMeta] = await src.getMetadata()

    const dst = destBucket.file(path)
    const [dstExists] = await dst.exists()
    if (dstExists) {
      const [dstMeta] = await dst.getMetadata()
      const existingToken = dstMeta.metadata?.firebaseStorageDownloadTokens
      if (dstMeta.md5Hash === srcMeta.md5Hash && existingToken) {
        return { token: String(existingToken).split(',')[0], reused: true }
      }
    }

    const [contents] = await src.download()
    const token = randomUUID()
    await dst.save(contents, {
      resumable: false,
      metadata: {
        contentType: srcMeta.contentType,
        cacheControl: srcMeta.cacheControl,
        metadata: { firebaseStorageDownloadTokens: token },
      },
    })
    return { token, reused: false }
  },
}

// ── Run ─────────────────────────────────────────────────────────────────────

console.log(
  `${args.apply ? 'APPLY' : 'DRY RUN (nothing is written; add --apply)'}: ` +
    `${args.from} (${sourceProject}, ${sourceBucketName}) → ${args.to} (${destProject}, ${destBucketName})` +
    `${args.prune ? ', pruning extras' : ''}`,
)

const report = await migrateContent(ports, {
  sourceBucket: sourceBucketName,
  destBucket: destBucketName,
  collections,
  apply: args.apply,
  prune: args.prune,
  log: (line) => console.log(`  ${line}`),
})

const { objects } = report
console.log(
  `Images: ${objects.total} referenced` +
    (args.apply ? `, ${objects.copied} copied, ${objects.reused} already there` : '') +
    `, ${objects.missing.length} missing from the source`,
)
for (const path of objects.missing) console.log(`  missing: ${path}`)

if (report.findings.length > 0) {
  console.log(`Findings (${report.findings.length}):`)
  for (const f of report.findings) console.log(`  [${f.kind}] ${f.collection}/${f.id} ${f.field}: ${f.detail}`)
}

if (args.report) {
  writeFileSync(args.report, `${JSON.stringify(report, null, 2)}\n`)
  console.log(`Report written to ${args.report}`)
}

if (args.apply) {
  const problems = reconcile(report)
  if (problems.length > 0) {
    console.error('Reconciliation FAILED:')
    for (const p of problems) console.error(`  ${p}`)
    process.exit(1)
  }
  console.log('Reconciliation clean: every collection matches the source and every image resolved.')
}
