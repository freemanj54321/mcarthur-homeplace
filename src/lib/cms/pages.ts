import 'server-only'
import {
  PageDraftInput,
  Section,
  sanitizeHtml,
  type PageDoc,
  type StoredDoc,
} from '@/lib/content-schema'
import { createCollectionStore } from './collectionStore'

function sanitizeSection(section: Section): Section {
  switch (section.type) {
    case 'richText':  return { ...section, html: sanitizeHtml(section.html) }
    case 'twoColumn': return { ...section, leftHtml: sanitizeHtml(section.leftHtml), rightHtml: sanitizeHtml(section.rightHtml) }
    case 'quote':     return { ...section, html: sanitizeHtml(section.html) }
    case 'callout':   return { ...section, html: sanitizeHtml(section.html) }
    case 'image':
    case 'gallery':   return section
  }
}

function sanitizeDraft(input: PageDraftInput): PageDraftInput {
  return { ...input, sections: input.sections.map(sanitizeSection) }
}

/**
 * `pages` now rides the same generic store as every structured collection
 * (MCA-26) — it used to be the one hand-rolled outlier. Reads go through the
 * transport-agnostic reader underneath, so the content API (MCA-53) can serve
 * pages without the Admin SDK.
 *
 * Admin listing is newest-edit-first rather than the default `order` ascending:
 * pages predate the `order` field and the admin UI has no reorder control.
 *
 * Back-compat: pages published before this change stored a NARROWER snapshot
 * (`title`/`hero`/`sections`, no `slug`) and no `order`. Both are tolerated on
 * read — `publicView` falls back to live fields and `toStored` defaults a
 * missing `order` to 0 — so existing documents keep rendering untouched and
 * simply pick up the wider shape the next time they are published. Normalizing
 * them is optional tidy-up, folded into the migration copy script (MCA-47)
 * rather than run as a separate backfill against live production.
 */
const store = createCollectionStore<PageDraftInput>({
  collection: 'pages',
  schema: PageDraftInput,
  slugField: 'slug',
  sanitize: sanitizeDraft,
  label: 'page',
  compare: (a, b) => b.updatedAt - a.updatedAt,
})

/**
 * `StoredDoc` carries the generic envelope; `PageDoc` is its pages-shaped view.
 * Built field-by-field rather than by spreading so the generic `order` field,
 * which the pages admin UI does not model, is dropped explicitly.
 */
function toPageDoc(doc: StoredDoc<PageDraftInput>): PageDoc {
  return {
    id: doc.id,
    slug: doc.slug,
    title: doc.title,
    hero: doc.hero,
    sections: doc.sections,
    status: doc.status,
    publishedSnapshot: doc.publishedSnapshot as PageDoc['publishedSnapshot'],
    publishedAt: doc.publishedAt,
    createdBy: doc.createdBy,
    createdAt: doc.createdAt,
    updatedBy: doc.updatedBy,
    updatedAt: doc.updatedAt,
  }
}

/** The renderable published page — snapshot already resolved for the caller. */
export type PublishedPage = Pick<PageDraftInput, 'title' | 'hero' | 'sections'> & { id: string }

export async function listPages(): Promise<PageDoc[]> {
  return (await store.list()).map(toPageDoc)
}

export async function getPageById(id: string): Promise<PageDoc | null> {
  const doc = await store.getById(id)
  return doc ? toPageDoc(doc) : null
}

/**
 * Published page for a public route, with `publishedSnapshot` already applied
 * (falling back to the live fields for pages published before snapshots were
 * stored). Callers render this directly — they must not re-implement the
 * fallback, which is how it used to drift between routes.
 */
export async function getPublishedPage(slug: string): Promise<PublishedPage | null> {
  const doc = await store.getPublishedBySlug(slug)
  if (!doc) return null
  return { id: doc.id, title: doc.title, hero: doc.hero, sections: doc.sections }
}

/** Draft-or-published lookup — backs the admin preview route. */
export async function getPageBySlug(slug: string): Promise<PageDoc | null> {
  const doc = await store.getBySlug(slug)
  return doc ? toPageDoc(doc) : null
}

export async function listPublishedSlugs(): Promise<string[]> {
  return store.listPublishedSlugs()
}

export async function createPage(input: PageDraftInput, editorUid: string): Promise<string> {
  return store.create(input, editorUid)
}

export async function updatePage(id: string, input: PageDraftInput, editorUid: string): Promise<void> {
  return store.update(id, input, editorUid)
}

export async function publishPage(id: string, editorUid: string): Promise<void> {
  return store.publish(id, editorUid)
}

export async function unpublishPage(id: string, editorUid: string): Promise<void> {
  return store.unpublish(id, editorUid)
}

export async function deletePage(id: string, editorUid: string): Promise<void> {
  return store.remove(id, editorUid)
}
