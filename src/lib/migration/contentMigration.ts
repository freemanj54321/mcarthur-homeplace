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
//
// Unreferenced images (MCA-90): legacy's bucket holds ~230 photos that no doc
// points at (raw uploads; legacy never had a `photos` collection). Copying only
// referenced objects would strand them in mcarthur-tour, so by default a run
// also imports every such image into the photo library, minus exact duplicates.

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

// ── Unreferenced photo import (MCA-90) ──────────────────────────────────────

/** A source-bucket object as listed by the CLI port. `md5Hash` is '' when Storage has none (composite objects). */
export type BucketObject = { path: string; md5Hash: string; size: number }

export type PhotoImportPlan = {
  /** Images to copy and register, in library order. */
  imports: { path: string; docId: string }[]
  /** Byte-identical copies left behind, with the copy that represents them. */
  duplicates: { path: string; keptPath: string }[]
  skipped: { path: string; reason: 'folder' | 'empty' | 'not-a-web-image' }[]
}

// Formats browsers render. Anything else (HEIC, RAW, PDFs…) is reported, not imported.
const WEB_IMAGE_RE = /\.(jpe?g|png|gif|webp|avif)$/i
// "IMG_1 (1).jpg": the suffix a re-upload or OS copy adds.
const COPY_SUFFIX_RE = / \(\d+\)(?=\.[^./]+$)/

// Imported docs are written by this script, not an editor; the UIDs fields say so.
const IMPORTED_BY = 'migrate-content'

/**
 * Deterministic `photos` doc id for an imported object, so re-runs update the
 * same doc instead of adding another. Readable slug + FNV-1a hash of the full
 * path (slugs alone collide: "a b.jpg" vs "a-b.jpg").
 */
export function importedPhotoId(path: string): string {
  let hash = 0x811c9dc5
  for (let i = 0; i < path.length; i++) {
    hash ^= path.charCodeAt(i)
    hash = Math.imul(hash, 0x01000193) >>> 0
  }
  const slug = path.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 80)
  return `legacy-${slug}-${hash.toString(16).padStart(8, '0')}`
}

/** Which image of a byte-identical group to keep: the referenced one, else no " (n)" suffix, else shortest, else first by name. */
function keeperRank(a: string, b: string, referenced: ReadonlySet<string>): number {
  const byRef = Number(referenced.has(b)) - Number(referenced.has(a))
  if (byRef !== 0) return byRef
  const bySuffix = Number(COPY_SUFFIX_RE.test(a)) - Number(COPY_SUFFIX_RE.test(b))
  if (bySuffix !== 0) return bySuffix
  return a.length - b.length || a.localeCompare(b)
}

/**
 * Plan the import of source images no content doc references. Duplicates are
 * decided by content (MD5), never by name alone: "x (1).jpg" with different
 * bytes from "x.jpg" is a different photo and is kept.
 */
export function planPhotoImport(objects: readonly BucketObject[], referenced: ReadonlySet<string>): PhotoImportPlan {
  const plan: PhotoImportPlan = { imports: [], duplicates: [], skipped: [] }
  const groups = new Map<string, string[]>()
  for (const o of objects) {
    if (o.path.endsWith('/')) plan.skipped.push({ path: o.path, reason: 'folder' })
    else if (o.size === 0) plan.skipped.push({ path: o.path, reason: 'empty' })
    else if (!WEB_IMAGE_RE.test(o.path)) plan.skipped.push({ path: o.path, reason: 'not-a-web-image' })
    else {
      const key = o.md5Hash ? `md5:${o.md5Hash}` : `path:${o.path}`
      groups.set(key, [...(groups.get(key) ?? []), o.path])
    }
  }

  const kept: string[] = []
  for (const paths of groups.values()) {
    const [keeper, ...rest] = [...paths].sort((a, b) => keeperRank(a, b, referenced))
    for (const path of rest) if (!referenced.has(path)) plan.duplicates.push({ path, keptPath: keeper })
    // A referenced keeper is already copied with its content doc.
    if (!referenced.has(keeper)) kept.push(keeper)
  }

  const natural = (a: string, b: string) => a.localeCompare(b, 'en', { numeric: true })
  plan.imports = kept.sort(natural).map((path) => ({ path, docId: importedPhotoId(path) }))
  plan.duplicates.sort((a, b) => natural(a.path, b.path))
  plan.skipped.sort((a, b) => natural(a.path, b.path))
  return plan
}

/**
 * The `photos` doc for an imported image: unassigned (`project: null`) and not
 * featured, so it shows in /admin/photos but on no public page until an editor
 * gives it a project. `category` must be one of the schema's values; `archival`
 * is the placeholder editors are expected to change.
 */
export function importedPhotoDoc(path: string, downloadUrl: string, order: number, importedAt: unknown): PlainObject {
  return {
    filename: path,
    storagePath: path,
    downloadUrl,
    caption: '',
    altText: '',
    project: null,
    category: 'archival',
    featured: false,
    order,
    dateTaken: null,
    uploadedAt: importedAt,
    updatedAt: importedAt,
    createdBy: IMPORTED_BY,
    updatedBy: IMPORTED_BY,
  }
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
  /** Every object in the source bucket. Only called when importing unreferenced photos. */
  listSourceObjects: () => Promise<BucketObject[]>
}

export type MigrationOptions = {
  sourceBucket: string
  destBucket: string
  collections?: readonly ContentCollection[]
  /** Write to the destination. Off = dry run: read-only, reports what would happen. */
  apply: boolean
  /** Delete destination docs that don't exist in the source, so counts reconcile. */
  prune: boolean
  /** Also import source images no doc references into `photos` (MCA-90). Needs `photos` among the collections. */
  importUnreferenced?: boolean
  /** Value stored as `uploadedAt`/`updatedAt` on imported photo docs (the CLI passes a Firestore Timestamp). */
  importedAt?: unknown
  log?: (line: string) => void
}

export type CollectionReport = {
  collection: ContentCollection
  sourceDocs: number
  /** Photo docs created from unreferenced images (`photos` only). Counted with `sourceDocs` when reconciling. */
  imported: number
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
  /** Null when the import was off or `photos` wasn't migrated. */
  photoImport: PhotoImportPlan | null
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
    photoImport: null,
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

  // Read every collection first: the photo import needs the full set of
  // referenced objects before `photos` (third in order) is processed. When
  // importing, that set comes from ALL content collections even if only some
  // are being migrated, or a project's card image would look unreferenced and
  // be imported again as a stray library photo.
  const importing = Boolean(options.importUnreferenced) && collections.includes('photos')
  const toRead = importing ? CONTENT_COLLECTIONS : collections
  const sources = new Map<ContentCollection, { doc: SourceDoc; objects: string[]; findings: DocFinding[] }[]>()
  const referenced = new Set<string>()
  for (const collection of toRead) {
    const docs = await ports.listSourceDocs(collection)
    sources.set(
      collection,
      docs.map((doc) => {
        const { objects, findings } = collectObjects(doc.data, options.sourceBucket, ports)
        for (const path of objects) referenced.add(path)
        return { doc, objects, findings }
      }),
    )
  }

  if (importing) report.photoImport = planPhotoImport(await ports.listSourceObjects(), referenced)

  for (const collection of collections) {
    const entries = sources.get(collection) ?? []
    const imports = collection === 'photos' ? (report.photoImport?.imports ?? []) : []
    const destIdsBefore = await ports.listDestIds(collection)
    // Imported docs count as source docs, so --prune keeps them on re-runs.
    const sourceIds = new Set([...entries.map((e) => e.doc.id), ...imports.map((i) => i.docId)])
    const extraInDest = destIdsBefore.filter((id) => !sourceIds.has(id))
    const entry: CollectionReport = {
      collection,
      sourceDocs: entries.length,
      imported: 0,
      written: 0,
      extraInDest,
      pruned: 0,
      destDocs: destIdsBefore.length,
    }

    for (const { doc, objects, findings } of entries) {
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

    // Imported photos go after any existing library order.
    let order = entries.reduce((max, e) => {
      const o = e.doc.data.order
      return typeof o === 'number' && o > max ? o : max
    }, -1)
    for (const { path, docId } of imports) {
      order++
      await resolveObject(path)
      if (!options.apply) continue
      const token = tokens.get(path)
      if (!token) continue // missing: already in report.objects.missing
      const url = buildDownloadUrl(options.destBucket, path, token)
      await ports.writeDestDoc(collection, docId, importedPhotoDoc(path, url, order, options.importedAt ?? null))
      entry.imported++
    }

    if (options.apply && options.prune) {
      for (const id of extraInDest) {
        await ports.deleteDestDoc(collection, id)
        entry.pruned++
      }
    }
    if (options.apply) entry.destDocs = (await ports.listDestIds(collection)).length

    report.collections.push(entry)
    const importNote = imports.length > 0 ? ` + ${options.apply ? entry.imported : imports.length} imported` : ''
    log(
      `${collection}: ${entry.sourceDocs} source${importNote}, ${entry.written} written, ` +
        `${entry.extraInDest.length} extra in dest${options.prune ? ` (${entry.pruned} pruned)` : ''}, ${entry.destDocs} in dest`,
    )
  }

  return report
}

/**
 * Reconciliation (MCA-49): each collection's destination count matches the
 * source (plus imported photos), and no image was missing. Returns the
 * problems; empty means clean.
 */
export function reconcile(report: MigrationReport): string[] {
  const problems: string[] = []
  for (const c of report.collections) {
    const expected = c.sourceDocs + c.imported
    if (c.destDocs !== expected) {
      const imported = c.imported > 0 ? ` (+${c.imported} imported)` : ''
      problems.push(`${c.collection}: ${c.sourceDocs} in source${imported} but ${c.destDocs} in destination`)
    }
  }
  if (report.objects.missing.length > 0) {
    problems.push(`${report.objects.missing.length} Storage object(s) missing from the source bucket`)
  }
  const leftovers = report.findings.filter((f) => f.kind === 'source-bucket-mention')
  if (leftovers.length > 0) problems.push(`${leftovers.length} field(s) still mention the source bucket`)
  return problems
}
