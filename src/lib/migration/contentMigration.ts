// Content copy between Firebase projects (MCA-47).
//
// Used for the initial migration mcarthur-tour → foundation envs (MCA-48
// rehearsal, MCA-49 prod) and for later prod → uat/dev refreshes (MCA-50). The
// CLI wrapper is scripts/migrate-content.mjs; it supplies the Firebase-bound
// ports, and everything here is pure so it can be unit-tested.
//
// WHY no imports: the CLI runs this file directly under Node's TypeScript type
// stripping, which needs explicit `.ts` import paths that `tsc` rejects in this
// repo. Keeping the module self-contained avoids both problems. For the same
// reason it uses only erasable TypeScript (no enums, no parameter properties).
//
// What a copy does, per document:
//   1. Collect every Storage object the doc points at: image records
//      (`{ storagePath, downloadUrl }`, including inside `publishedSnapshot`)
//      and source-bucket download URLs embedded in any string (rich-text HTML).
//   2. Copy those objects into the destination bucket (the CLI's port reuses an
//      identical object already there, so re-runs and delta syncs are cheap).
//   3. Rewrite the doc so every such URL points at the destination bucket with
//      the destination object's download token, then write it.
// Stored download URLs are absolute and bucket-bound, so skipping step 3 would
// leave every image loading from the old project (see ONBOARDING, migration note).

/** Collections that hold site content. `editors` (the Auth allowlist) is rebuilt per env instead (MCA-51). */
export const CONTENT_COLLECTIONS = [
  'navigation',
  'pages',
  'photos',
  'projects',
  'news',
  'events',
  'milestones',
  'boardMembers',
  'partners',
] as const
export type ContentCollection = (typeof CONTENT_COLLECTIONS)[number]

const STORAGE_HOST = 'https://firebasestorage.googleapis.com'

/** The URL Firebase's `getDownloadURL` produces for an object. */
export function buildDownloadUrl(bucket: string, path: string, token: string): string {
  return `${STORAGE_HOST}/v0/b/${bucket}/o/${encodeURIComponent(path)}?alt=media&token=${token}`
}

// Matches a Firebase Storage download URL inside arbitrary text (including HTML
// attributes, where `&` may be written `&amp;`). Groups: bucket, encoded path.
const DOWNLOAD_URL_RE = /https:\/\/firebasestorage\.googleapis\.com\/v0\/b\/([^/\s"'<>]+)\/o\/([^?\s"'<>]+)(?:\?[^\s"'<>]*)?/g

/** Bucket and object path of a Firebase Storage download URL, or null for anything else. */
export function parseDownloadUrl(url: string): { bucket: string; path: string } | null {
  const match = new RegExp(`^${DOWNLOAD_URL_RE.source}$`).exec(url)
  if (!match) return null
  try {
    return { bucket: match[1], path: decodeURIComponent(match[2]) }
  } catch {
    return null
  }
}

// Mirrors isDonateHref in src/lib/features.ts (not imported: see header).
const DONATE_LINK_RE = /(?:^|href=["'])\/donate(?=$|[/?#"'])/

type PlainObject = Record<string, unknown>

function isPlainObject(value: unknown): value is PlainObject {
  if (value === null || typeof value !== 'object') return false
  const proto = Object.getPrototypeOf(value)
  return proto === Object.prototype || proto === null
}

/** An image record: a non-empty `storagePath` next to a `downloadUrl`. Same-origin paths ("/images/x.jpg") aren't Storage objects. */
function isStorageImage(value: PlainObject): value is PlainObject & { storagePath: string; downloadUrl: string } {
  return (
    typeof value.storagePath === 'string' &&
    value.storagePath.length > 0 &&
    typeof value.downloadUrl === 'string' &&
    !value.downloadUrl.startsWith('/')
  )
}

/** A value the walk leaves alone except for references (Timestamps, GeoPoints, Bytes, …). */
export type ValueHooks = {
  /** True for a Firestore DocumentReference, which is bound to the source database. */
  isReference: (value: unknown) => boolean
}

export type DocFinding = {
  /** Dotted field path inside the doc, e.g. `sections.2.html`. */
  field: string
  kind: 'donate-link' | 'source-bucket-mention' | 'reference' | 'foreign-bucket-url'
  detail: string
}

/**
 * Storage objects a doc needs in the destination bucket, plus findings to
 * report. Objects are named by their path in the SOURCE bucket.
 */
export function collectObjects(
  data: PlainObject,
  sourceBucket: string,
  hooks: ValueHooks,
): { objects: string[]; findings: DocFinding[] } {
  const objects = new Set<string>()
  const findings: DocFinding[] = []

  const visitString = (value: string, field: string) => {
    for (const match of value.matchAll(DOWNLOAD_URL_RE)) {
      const parsed = parseDownloadUrl(match[0].replace(/&amp;/g, '&'))
      if (!parsed) continue
      if (parsed.bucket === sourceBucket) objects.add(parsed.path)
      else findings.push({ field, kind: 'foreign-bucket-url', detail: match[0] })
    }
    if (DONATE_LINK_RE.test(value)) findings.push({ field, kind: 'donate-link', detail: truncate(value) })
  }

  const visit = (value: unknown, field: string) => {
    if (typeof value === 'string') return visitString(value, field)
    if (hooks.isReference(value)) {
      findings.push({ field, kind: 'reference', detail: String((value as { path?: unknown }).path ?? '') })
      return
    }
    if (Array.isArray(value)) return value.forEach((item, i) => visit(item, join(field, i)))
    if (!isPlainObject(value)) return
    if (isStorageImage(value)) {
      objects.add(value.storagePath)
      // Its downloadUrl is replaced wholesale on rewrite; don't double-count it.
      for (const [key, child] of Object.entries(value)) {
        if (key !== 'downloadUrl') visit(child, join(field, key))
      }
      return
    }
    for (const [key, child] of Object.entries(value)) visit(child, join(field, key))
  }

  visit(data, '')
  return { objects: [...objects], findings }
}

export type RewriteContext = {
  sourceBucket: string
  destBucket: string
  /** Destination download token per SOURCE object path. Paths without one (e.g. missing in the source) keep their URL. */
  tokens: ReadonlyMap<string, string>
  hooks: ValueHooks & {
    /** Re-home a source DocumentReference in the destination database. */
    convertReference: (value: unknown) => unknown
  }
}

/** The doc with every source-bucket URL pointing at the destination bucket. Doesn't mutate its input. */
export function rewriteDoc(data: PlainObject, ctx: RewriteContext): PlainObject {
  const rewriteUrl = (path: string, fallback: string) => {
    const token = ctx.tokens.get(path)
    return token ? buildDownloadUrl(ctx.destBucket, path, token) : fallback
  }

  const rewriteString = (value: string) =>
    value.replace(DOWNLOAD_URL_RE, (match: string) => {
      const htmlEscaped = match.includes('&amp;')
      const parsed = parseDownloadUrl(htmlEscaped ? match.replace(/&amp;/g, '&') : match)
      if (!parsed || parsed.bucket !== ctx.sourceBucket) return match
      const url = rewriteUrl(parsed.path, match)
      return htmlEscaped && url !== match ? url.replace(/&/g, '&amp;') : url
    })

  const walk = (value: unknown): unknown => {
    if (typeof value === 'string') return rewriteString(value)
    if (ctx.hooks.isReference(value)) return ctx.hooks.convertReference(value)
    if (Array.isArray(value)) return value.map(walk)
    if (!isPlainObject(value)) return value
    const out: PlainObject = {}
    for (const [key, child] of Object.entries(value)) out[key] = walk(child)
    if (isStorageImage(value)) out.downloadUrl = rewriteUrl(value.storagePath, value.downloadUrl)
    return out
  }

  return walk(data) as PlainObject
}

/** Occurrences of the source bucket's name left in a rewritten doc (gs:// paths, other URL forms). */
export function findSourceBucketMentions(data: PlainObject, sourceBucket: string): DocFinding[] {
  const findings: DocFinding[] = []
  const visit = (value: unknown, field: string) => {
    if (typeof value === 'string') {
      if (value.includes(sourceBucket)) findings.push({ field, kind: 'source-bucket-mention', detail: truncate(value) })
    } else if (Array.isArray(value)) {
      value.forEach((item, i) => visit(item, join(field, i)))
    } else if (isPlainObject(value)) {
      for (const [key, child] of Object.entries(value)) visit(child, join(field, key))
    }
  }
  visit(data, '')
  return findings
}

function join(parent: string, key: string | number): string {
  return parent ? `${parent}.${key}` : String(key)
}

function truncate(value: string, max = 120): string {
  return value.length > max ? `${value.slice(0, max)}…` : value
}

// ── Orchestration ───────────────────────────────────────────────────────────

export type SourceDoc = { id: string; data: PlainObject }

/** Firebase-bound operations the CLI supplies. */
export type MigrationPorts = ValueHooks & {
  convertReference: (value: unknown) => unknown
  listSourceDocs: (collection: ContentCollection) => Promise<SourceDoc[]>
  listDestIds: (collection: ContentCollection) => Promise<string[]>
  writeDestDoc: (collection: ContentCollection, id: string, data: PlainObject) => Promise<void>
  deleteDestDoc: (collection: ContentCollection, id: string) => Promise<void>
  /** Whether the object exists in the source bucket (dry runs). */
  sourceObjectExists: (path: string) => Promise<boolean>
  /**
   * Ensure the object exists in the destination bucket and return its download
   * token, or null when it's missing from the source. Reuses an identical
   * object already in the destination (re-runs, delta syncs).
   */
  copyObject: (path: string) => Promise<{ token: string; reused: boolean } | null>
}

export type MigrationOptions = {
  sourceBucket: string
  destBucket: string
  collections?: readonly ContentCollection[]
  /** Write to the destination. Off = dry run: read-only, reports what would happen. */
  apply: boolean
  /** Delete destination docs that don't exist in the source, so counts reconcile. */
  prune: boolean
  log?: (line: string) => void
}

export type CollectionReport = {
  collection: ContentCollection
  sourceDocs: number
  written: number
  /** Destination docs absent from the source (deleted when `prune`). */
  extraInDest: string[]
  pruned: number
  /** Destination doc count after the run (before, on a dry run). */
  destDocs: number
}

export type MigrationReport = {
  apply: boolean
  collections: CollectionReport[]
  objects: { total: number; copied: number; reused: number; missing: string[] }
  findings: (DocFinding & { collection: ContentCollection; id: string })[]
}

/** Copy content collections and their Storage objects from the source to the destination project. */
export async function migrateContent(ports: MigrationPorts, options: MigrationOptions): Promise<MigrationReport> {
  const log = options.log ?? (() => {})
  const collections = options.collections ?? CONTENT_COLLECTIONS
  const tokens = new Map<string, string>()
  const seenObjects = new Set<string>()
  const report: MigrationReport = {
    apply: options.apply,
    collections: [],
    objects: { total: 0, copied: 0, reused: 0, missing: [] },
    findings: [],
  }

  // Each object is resolved once, however many docs point at it.
  const resolveObject = async (path: string) => {
    if (seenObjects.has(path)) return
    seenObjects.add(path)
    report.objects.total++
    if (!options.apply) {
      if (!(await ports.sourceObjectExists(path))) report.objects.missing.push(path)
      return
    }
    const copied = await ports.copyObject(path)
    if (!copied) {
      report.objects.missing.push(path)
      return
    }
    tokens.set(path, copied.token)
    if (copied.reused) report.objects.reused++
    else report.objects.copied++
  }

  for (const collection of collections) {
    const docs = await ports.listSourceDocs(collection)
    const destIdsBefore = await ports.listDestIds(collection)
    const sourceIds = new Set(docs.map((d) => d.id))
    const extraInDest = destIdsBefore.filter((id) => !sourceIds.has(id))
    const entry: CollectionReport = {
      collection,
      sourceDocs: docs.length,
      written: 0,
      extraInDest,
      pruned: 0,
      destDocs: destIdsBefore.length,
    }

    for (const doc of docs) {
      const { objects, findings } = collectObjects(doc.data, options.sourceBucket, ports)
      for (const f of findings) report.findings.push({ ...f, collection, id: doc.id })
      for (const path of objects) await resolveObject(path)
      if (!options.apply) continue

      const rewritten = rewriteDoc(doc.data, {
        sourceBucket: options.sourceBucket,
        destBucket: options.destBucket,
        tokens,
        hooks: ports,
      })
      for (const f of findSourceBucketMentions(rewritten, options.sourceBucket)) {
        report.findings.push({ ...f, collection, id: doc.id })
      }
      await ports.writeDestDoc(collection, doc.id, rewritten)
      entry.written++
    }

    if (options.apply && options.prune) {
      for (const id of extraInDest) {
        await ports.deleteDestDoc(collection, id)
        entry.pruned++
      }
    }
    if (options.apply) entry.destDocs = (await ports.listDestIds(collection)).length

    report.collections.push(entry)
    log(
      `${collection}: ${entry.sourceDocs} source, ${entry.written} written, ` +
        `${entry.extraInDest.length} extra in dest${options.prune ? ` (${entry.pruned} pruned)` : ''}, ${entry.destDocs} in dest`,
    )
  }

  return report
}

/**
 * Reconciliation (MCA-49): each collection's destination count matches the
 * source, and no image was missing. Returns the problems; empty means clean.
 */
export function reconcile(report: MigrationReport): string[] {
  const problems: string[] = []
  for (const c of report.collections) {
    if (c.destDocs !== c.sourceDocs) {
      problems.push(`${c.collection}: ${c.sourceDocs} in source but ${c.destDocs} in destination`)
    }
  }
  if (report.objects.missing.length > 0) {
    problems.push(`${report.objects.missing.length} Storage object(s) missing from the source bucket`)
  }
  const leftovers = report.findings.filter((f) => f.kind === 'source-bucket-mention')
  if (leftovers.length > 0) problems.push(`${leftovers.length} field(s) still mention the source bucket`)
  return problems
}
