import { describe, it, expect } from 'vitest'
import {
  CONTENT_COLLECTIONS,
  buildDownloadUrl,
  collectObjects,
  findSourceBucketMentions,
  importedPhotoDoc,
  importedPhotoId,
  migrateContent,
  parseDownloadUrl,
  planPhotoImport,
  reconcile,
  rewriteDoc,
  type BucketObject,
  type ContentCollection,
  type MigrationPorts,
  type SourceDoc,
} from './contentMigration'

const SRC = 'mcarthur-tour.firebasestorage.app'
const DST = 'mcarthur-web-dev.firebasestorage.app'
const srcUrl = (path: string, token = 'old-token') => buildDownloadUrl(SRC, path, token)
const dstUrl = (path: string, token: string) => buildDownloadUrl(DST, path, token)

/** Stand-in for a Firestore DocumentReference / Timestamp: non-plain objects. */
class FakeRef {
  constructor(readonly path: string) {}
}
class FakeTimestamp {
  constructor(readonly millis: number) {}
}
const hooks = { isReference: (v: unknown) => v instanceof FakeRef }
const rewriteHooks = { ...hooks, convertReference: (v: unknown) => ({ rehomed: (v as FakeRef).path }) }

describe('download URLs', () => {
  it('builds the URL getDownloadURL produces, with the path encoded', () => {
    expect(buildDownloadUrl(SRC, 'pages/p1/a b.jpg', 't1')).toBe(
      `https://firebasestorage.googleapis.com/v0/b/${SRC}/o/pages%2Fp1%2Fa%20b.jpg?alt=media&token=t1`,
    )
  })

  it('round-trips through parseDownloadUrl', () => {
    expect(parseDownloadUrl(srcUrl('photos/x/1.jpg'))).toEqual({ bucket: SRC, path: 'photos/x/1.jpg' })
  })

  it.each(['/images/local.jpg', 'https://example.com/a.jpg', 'not a url', `${srcUrl('a.jpg')} trailing`])(
    'rejects %s',
    (value) => {
      expect(parseDownloadUrl(value)).toBeNull()
    },
  )

  it('rejects a malformed percent-encoding', () => {
    expect(parseDownloadUrl(`https://firebasestorage.googleapis.com/v0/b/${SRC}/o/bad%E0%A4%A`)).toBeNull()
  })
})

describe('collectObjects', () => {
  it('finds image records at any depth, including inside publishedSnapshot', () => {
    const data = {
      storagePath: 'photos/root.jpg',
      downloadUrl: srcUrl('photos/root.jpg'),
      cardImage: { storagePath: 'projects/card.jpg', downloadUrl: srcUrl('projects/card.jpg'), alt: '' },
      heroImages: [{ storagePath: 'projects/hero.jpg', downloadUrl: srcUrl('projects/hero.jpg'), alt: '' }],
      publishedSnapshot: {
        sections: [{ type: 'image', storagePath: 'pages/old.jpg', downloadUrl: srcUrl('pages/old.jpg'), alt: '' }],
      },
    }
    expect(collectObjects(data, SRC, hooks).objects.sort()).toEqual(
      ['pages/old.jpg', 'photos/root.jpg', 'projects/card.jpg', 'projects/hero.jpg'].sort(),
    )
  })

  it('finds source-bucket URLs embedded in rich text, including &amp;-escaped ones', () => {
    const html = `<p><img src="${srcUrl('pages/p/inline.jpg').replace('&', '&amp;')}"></p>`
    expect(collectObjects({ sections: [{ html }] }, SRC, hooks).objects).toEqual(['pages/p/inline.jpg'])
  })

  it('skips same-origin images and empty storage paths', () => {
    const data = {
      a: { storagePath: 'x.jpg', downloadUrl: '/images/x.jpg', alt: '' },
      b: { storagePath: '', downloadUrl: srcUrl('y.jpg'), alt: '' },
    }
    // b's URL still names a source object, so it's collected from the string.
    expect(collectObjects(data, SRC, hooks).objects).toEqual(['y.jpg'])
  })

  it('reports donate links, references, and URLs into other buckets', () => {
    const data = {
      html: '<a href="/donate">Give</a>',
      href: '/donate?fund=match',
      other: '/donations',
      owner: new FakeRef('editors/u1'),
      foreign: buildDownloadUrl('some-other.appspot.com', 'z.jpg', 't'),
    }
    const kinds = collectObjects(data, SRC, hooks).findings.map((f) => `${f.kind}@${f.field}`)
    expect(kinds.sort()).toEqual(
      ['donate-link@html', 'donate-link@href', 'reference@owner', 'foreign-bucket-url@foreign'].sort(),
    )
  })
})

describe('rewriteDoc', () => {
  const tokens = new Map([
    ['projects/card.jpg', 'new-card'],
    ['pages/p/inline.jpg', 'new-inline'],
  ])
  const ctx = { sourceBucket: SRC, destBucket: DST, tokens, hooks: rewriteHooks }

  it('points image records and embedded URLs at the destination bucket', () => {
    const escaped = srcUrl('pages/p/inline.jpg').replace('&', '&amp;')
    const data = {
      cardImage: { storagePath: 'projects/card.jpg', downloadUrl: srcUrl('projects/card.jpg'), alt: 'Card' },
      html: `<img src="${escaped}"> and ${srcUrl('pages/p/inline.jpg')}`,
    }
    const out = rewriteDoc(data, ctx)
    expect(out.cardImage).toEqual({ storagePath: 'projects/card.jpg', downloadUrl: dstUrl('projects/card.jpg', 'new-card'), alt: 'Card' })
    const newUrl = dstUrl('pages/p/inline.jpg', 'new-inline')
    // HTML-escaped input stays HTML-escaped; raw stays raw.
    expect(out.html).toBe(`<img src="${newUrl.replace('&', '&amp;')}"> and ${newUrl}`)
    expect(data.cardImage.downloadUrl).toBe(srcUrl('projects/card.jpg')) // input untouched
  })

  it('keeps URLs whose object has no token (missing in the source) and other buckets', () => {
    const foreign = buildDownloadUrl('other.appspot.com', 'projects/card.jpg', 't')
    const data = { a: { storagePath: 'gone.jpg', downloadUrl: srcUrl('gone.jpg') }, foreign }
    expect(rewriteDoc(data, ctx)).toEqual(data)
  })

  it('re-homes references and passes other non-plain values through', () => {
    const ts = new FakeTimestamp(1)
    const out = rewriteDoc({ owner: new FakeRef('editors/u1'), at: ts, n: 3, ok: true, none: null }, ctx)
    expect(out).toEqual({ owner: { rehomed: 'editors/u1' }, at: ts, n: 3, ok: true, none: null })
    expect(out.at).toBe(ts)
  })
})

describe('findSourceBucketMentions', () => {
  it('flags leftover mentions such as gs:// paths', () => {
    const findings = findSourceBucketMentions({ list: [{ note: `gs://${SRC}/raw.jpg` }], fine: 'ok' }, SRC)
    expect(findings).toEqual([{ field: 'list.0.note', kind: 'source-bucket-mention', detail: `gs://${SRC}/raw.jpg` }])
  })
})

// ── Orchestration against in-memory ports ──────────────────────────────────

function fakePorts(
  source: Partial<Record<ContentCollection, SourceDoc[]>>,
  opts: { dest?: Partial<Record<ContentCollection, string[]>>; sourceObjects?: string[]; destObjects?: string[]; bucket?: BucketObject[] } = {},
) {
  const dest = new Map<string, Map<string, Record<string, unknown>>>()
  for (const c of CONTENT_COLLECTIONS) {
    dest.set(c, new Map((opts.dest?.[c] ?? []).map((id) => [id, { stale: true }])))
  }
  const sourceObjects = new Set([...(opts.sourceObjects ?? []), ...(opts.bucket ?? []).map((o) => o.path)])
  const destObjects = new Set(opts.destObjects ?? [])
  const copies: string[] = []
  const ports: MigrationPorts = {
    ...rewriteHooks,
    listSourceDocs: async (c) => source[c] ?? [],
    listDestIds: async (c) => [...dest.get(c)!.keys()],
    writeDestDoc: async (c, id, data) => void dest.get(c)!.set(id, data),
    deleteDestDoc: async (c, id) => void dest.get(c)!.delete(id),
    sourceObjectExists: async (p) => sourceObjects.has(p),
    copyObject: async (p) => {
      if (!sourceObjects.has(p)) return null
      copies.push(p)
      const reused = destObjects.has(p)
      destObjects.add(p)
      return { token: `tok-${p}`, reused }
    },
    listSourceObjects: async () => opts.bucket ?? [],
  }
  return { ports, dest, copies }
}

const project = (id: string, image: string): SourceDoc => ({
  id,
  data: { slug: id, cardImage: { storagePath: image, downloadUrl: srcUrl(image), alt: '' } },
})

describe('migrateContent', () => {
  const base = { sourceBucket: SRC, destBucket: DST }

  it('dry run: reads only, counts objects, reports missing ones', async () => {
    const { ports, dest, copies } = fakePorts(
      { projects: [project('a', 'p/a.jpg'), project('b', 'p/missing.jpg')] },
      { dest: { projects: ['old'] }, sourceObjects: ['p/a.jpg'] },
    )
    const lines: string[] = []
    const report = await migrateContent(ports, { ...base, apply: false, prune: true, collections: ['projects'], log: (l) => lines.push(l) })

    expect(copies).toEqual([])
    expect([...dest.get('projects')!.keys()]).toEqual(['old'])
    expect(report.collections[0]).toMatchObject({ sourceDocs: 2, imported: 0, written: 0, extraInDest: ['old'], pruned: 0, destDocs: 1 })
    expect(report.photoImport).toBeNull()
    expect(report.objects).toEqual({ total: 2, copied: 0, reused: 0, missing: ['p/missing.jpg'] })
    expect(lines[0]).toContain('projects: 2 source, 0 written, 1 extra in dest (0 pruned), 1 in dest')
  })

  it('apply: copies each object once, rewrites URLs, writes docs, prunes extras', async () => {
    const shared = 'p/shared.jpg'
    const { ports, dest, copies } = fakePorts(
      { projects: [project('a', shared), project('b', shared)], news: [] },
      { dest: { projects: ['old'] }, sourceObjects: [shared], destObjects: [] },
    )
    const report = await migrateContent(ports, { ...base, apply: true, prune: true, collections: ['projects', 'news'] })

    expect(copies).toEqual([shared])
    expect([...dest.get('projects')!.keys()].sort()).toEqual(['a', 'b'])
    expect((dest.get('projects')!.get('a')!.cardImage as { downloadUrl: string }).downloadUrl).toBe(dstUrl(shared, `tok-${shared}`))
    expect(report.collections[0]).toMatchObject({ sourceDocs: 2, written: 2, pruned: 1, destDocs: 2 })
    expect(report.objects).toMatchObject({ total: 1, copied: 1, reused: 0, missing: [] })
    expect(reconcile(report)).toEqual([])
  })

  it('apply without prune leaves extras, which reconciliation reports', async () => {
    const { ports } = fakePorts({ projects: [project('a', 'p/a.jpg')] }, { dest: { projects: ['old'] }, sourceObjects: ['p/a.jpg'], destObjects: ['p/a.jpg'] })
    const report = await migrateContent(ports, { ...base, apply: true, prune: false, collections: ['projects'] })
    expect(report.objects).toMatchObject({ copied: 0, reused: 1 })
    expect(reconcile(report)).toEqual(['projects: 1 in source but 2 in destination'])
  })

  it('keeps the old URL for an object missing from the source and flags it', async () => {
    const { ports, dest } = fakePorts({ projects: [project('a', 'p/gone.jpg')] })
    const report = await migrateContent(ports, { ...base, apply: true, prune: false, collections: ['projects'] })
    const written = dest.get('projects')!.get('a')!.cardImage as { downloadUrl: string }
    expect(written.downloadUrl).toBe(srcUrl('p/gone.jpg'))
    expect(report.objects.missing).toEqual(['p/gone.jpg'])
    expect(reconcile(report)).toEqual([
      '1 Storage object(s) missing from the source bucket',
      '1 field(s) still mention the source bucket',
    ])
  })

  it('records findings with their collection and doc id, and defaults to every content collection', async () => {
    const { ports } = fakePorts({ pages: [{ id: 'home', data: { html: '<a href="/donate">Give</a>' } }] })
    const report = await migrateContent(ports, { ...base, apply: false, prune: false })
    expect(report.collections.map((c) => c.collection)).toEqual([...CONTENT_COLLECTIONS])
    expect(report.findings).toEqual([expect.objectContaining({ collection: 'pages', id: 'home', kind: 'donate-link', field: 'html' })])
  })

  it('never includes the editors allowlist', () => {
    expect(CONTENT_COLLECTIONS).not.toContain('editors')
  })
})

// ── Unreferenced photo import (MCA-90) ─────────────────────────────────────

const obj = (path: string, md5 = `md5-${path}`, size = 100): BucketObject => ({ path, md5Hash: md5, size })

describe('planPhotoImport', () => {
  it('skips folder markers, empty objects and non-web images, and orders imports naturally', () => {
    const plan = planPhotoImport(
      [obj('Onion Barn/', '', 0), obj('Other/empty.jpg', 'e', 0), obj('Big House/scan.HEIC'), obj('Big House/IMG_10.jpg'), obj('Big House/IMG_9.JPG')],
      new Set(),
    )
    expect(plan.imports.map((i) => i.path)).toEqual(['Big House/IMG_9.JPG', 'Big House/IMG_10.jpg'])
    expect(plan.skipped).toEqual([
      { path: 'Big House/scan.HEIC', reason: 'not-a-web-image' },
      { path: 'Onion Barn/', reason: 'folder' },
      { path: 'Other/empty.jpg', reason: 'empty' },
    ])
    expect(plan.duplicates).toEqual([])
  })

  it('drops byte-identical copies, keeping the name without a " (n)" suffix', () => {
    const plan = planPhotoImport(
      [obj('C/IMG_1 (2).jpg', 'same'), obj('C/IMG_1.jpg', 'same'), obj('C/IMG_1 (1).jpg', 'same')],
      new Set(),
    )
    expect(plan.imports.map((i) => i.path)).toEqual(['C/IMG_1.jpg'])
    expect(plan.duplicates).toEqual([
      { path: 'C/IMG_1 (1).jpg', keptPath: 'C/IMG_1.jpg' },
      { path: 'C/IMG_1 (2).jpg', keptPath: 'C/IMG_1.jpg' },
    ])
  })

  it('keeps a " (n)" file whose bytes differ: same name is not a duplicate', () => {
    const plan = planPhotoImport([obj('C/IMG_1.jpg', 'a'), obj('C/IMG_1 (1).jpg', 'b')], new Set())
    expect(plan.imports.map((i) => i.path)).toEqual(['C/IMG_1 (1).jpg', 'C/IMG_1.jpg'])
    expect(plan.duplicates).toEqual([])
  })

  it('keeps the shortest path when no copy is suffixed, and never dedupes objects without an MD5', () => {
    const plan = planPhotoImport(
      [obj('Moving House/x.jpg', 'same'), obj('x.jpg', 'same'), obj('c1.jpg', ''), obj('c2.jpg', '')],
      new Set(),
    )
    expect(plan.imports.map((i) => i.path)).toEqual(['c1.jpg', 'c2.jpg', 'x.jpg'])
    expect(plan.duplicates).toEqual([{ path: 'Moving House/x.jpg', keptPath: 'x.jpg' }])
  })

  it('never imports referenced objects, and treats copies of one as duplicates', () => {
    const plan = planPhotoImport([obj('p/card.jpg', 'h'), obj('raw/card copy.jpg', 'h'), obj('raw/other.jpg')], new Set(['p/card.jpg']))
    expect(plan.imports.map((i) => i.path)).toEqual(['raw/other.jpg'])
    expect(plan.duplicates).toEqual([{ path: 'raw/card copy.jpg', keptPath: 'p/card.jpg' }])
  })
})

describe('importedPhotoId', () => {
  it('is stable, readable, and distinguishes paths that slug the same', () => {
    const id = importedPhotoId('Cooper Conner House/IMG_9261.jpg')
    expect(id).toBe(importedPhotoId('Cooper Conner House/IMG_9261.jpg'))
    expect(id).toMatch(/^legacy-cooper-conner-house-img-9261-jpg-[0-9a-f]{8}$/)
    expect(importedPhotoId('a b.jpg')).not.toBe(importedPhotoId('a-b.jpg'))
    expect(id).not.toContain('/')
  })
})

describe('importedPhotoDoc', () => {
  it('is unassigned, unfeatured and archival, with the original path as filename', () => {
    const at = new FakeTimestamp(1)
    expect(importedPhotoDoc('Big House/a.jpg', 'https://u', 7, at)).toEqual({
      filename: 'Big House/a.jpg',
      storagePath: 'Big House/a.jpg',
      downloadUrl: 'https://u',
      caption: '',
      altText: '',
      project: null,
      category: 'archival',
      featured: false,
      order: 7,
      dateTaken: null,
      uploadedAt: at,
      updatedAt: at,
      createdBy: 'migrate-content',
      updatedBy: 'migrate-content',
    })
  })
})

describe('migrateContent with importUnreferenced', () => {
  const base = { sourceBucket: SRC, destBucket: DST }
  const bucket = [obj('p/card.jpg'), obj('Big House/a.jpg', 'h'), obj('Big House/a (1).jpg', 'h'), obj('Big House/b.jpg'), obj('Other/', '', 0)]
  const existingPhoto: SourceDoc = { id: 'ph1', data: { storagePath: 'p/card.jpg', downloadUrl: srcUrl('p/card.jpg'), order: 4 } }

  it('dry run: plans the import and reports it, writing nothing', async () => {
    const { ports, dest, copies } = fakePorts({ projects: [project('x', 'p/card.jpg')] }, { bucket })
    const lines: string[] = []
    const report = await migrateContent(ports, { ...base, apply: false, prune: true, importUnreferenced: true, log: (l) => lines.push(l) })

    expect(copies).toEqual([])
    expect(dest.get('photos')!.size).toBe(0)
    expect(report.photoImport!.imports.map((i) => i.path)).toEqual(['Big House/a.jpg', 'Big House/b.jpg'])
    expect(report.photoImport!.duplicates).toEqual([{ path: 'Big House/a (1).jpg', keptPath: 'Big House/a.jpg' }])
    expect(report.objects).toMatchObject({ total: 3, missing: [] })
    expect(lines.find((l) => l.startsWith('photos:'))).toContain('photos: 0 source + 2 imported, 0 written')
  })

  it('apply: copies and registers each kept image after existing photos, and reconciles', async () => {
    const at = new FakeTimestamp(1)
    const { ports, dest, copies } = fakePorts({ photos: [existingPhoto] }, { bucket, dest: { photos: ['stale'] } })
    const report = await migrateContent(ports, { ...base, apply: true, prune: true, importUnreferenced: true, importedAt: at })

    expect(copies.sort()).toEqual(['Big House/a.jpg', 'Big House/b.jpg', 'p/card.jpg'])
    const photos = dest.get('photos')!
    expect([...photos.keys()].sort()).toEqual(['ph1', importedPhotoId('Big House/a.jpg'), importedPhotoId('Big House/b.jpg')].sort())
    expect(photos.get(importedPhotoId('Big House/a.jpg'))).toMatchObject({
      order: 5,
      project: null,
      uploadedAt: at,
      downloadUrl: dstUrl('Big House/a.jpg', 'tok-Big House/a.jpg'),
    })
    expect(photos.get(importedPhotoId('Big House/b.jpg'))).toMatchObject({ order: 6 })
    expect(report.collections.find((c) => c.collection === 'photos')).toMatchObject({ sourceDocs: 1, imported: 2, written: 1, pruned: 1, destDocs: 3 })
    expect(reconcile(report)).toEqual([])
  })

  it('re-run: imported docs are updated in place and never pruned', async () => {
    const ids = ['Big House/a.jpg', 'Big House/b.jpg'].map(importedPhotoId)
    const { ports, dest } = fakePorts({ projects: [project('x', 'p/card.jpg')] }, { bucket, dest: { photos: ids } })
    const report = await migrateContent(ports, { ...base, apply: true, prune: true, importUnreferenced: true, collections: ['photos'] })
    expect([...dest.get('photos')!.keys()].sort()).toEqual([...ids].sort())
    expect(report.collections).toHaveLength(1)
    expect(report.collections[0]).toMatchObject({ extraInDest: [], pruned: 0, imported: 2, destDocs: 2 })
    expect(reconcile(report)).toEqual([])
  })

  it('with --collections photos, still treats images other collections use as referenced', async () => {
    const { ports } = fakePorts({ projects: [project('x', 'p/card.jpg')] }, { bucket })
    const report = await migrateContent(ports, { ...base, apply: false, prune: false, importUnreferenced: true, collections: ['photos'] })
    expect(report.photoImport!.imports.map((i) => i.path)).not.toContain('p/card.jpg')
    expect(report.collections.map((c) => c.collection)).toEqual(['photos'])
  })

  it('skips the import when photos is not among the collections', async () => {
    const { ports } = fakePorts({}, { bucket })
    const report = await migrateContent(ports, { ...base, apply: false, prune: false, importUnreferenced: true, collections: ['projects'] })
    expect(report.photoImport).toBeNull()
  })

  it('does not register an image that vanished before the copy, and reports it', async () => {
    const { ports, dest } = fakePorts({}, { bucket: [obj('Big House/a.jpg')] })
    ports.copyObject = async () => null
    const report = await migrateContent(ports, { ...base, apply: true, prune: false, importUnreferenced: true, collections: ['photos'] })
    expect(dest.get('photos')!.size).toBe(0)
    expect(report.objects.missing).toEqual(['Big House/a.jpg'])
    expect(reconcile(report)).toEqual(['1 Storage object(s) missing from the source bucket'])
  })

  it('names imported docs in a reconciliation mismatch', () => {
    const report = {
      apply: true,
      collections: [{ collection: 'photos' as const, sourceDocs: 1, imported: 2, written: 1, extraInDest: [], pruned: 0, destDocs: 2 }],
      objects: { total: 0, copied: 0, reused: 0, missing: [] },
      findings: [],
      photoImport: null,
    }
    expect(reconcile(report)).toEqual(['photos: 1 in source (+2 imported) but 2 in destination'])
  })
})
