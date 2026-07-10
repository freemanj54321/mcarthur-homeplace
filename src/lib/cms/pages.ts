import 'server-only'
import { createCollectionStore, type PublicDoc } from './collectionStore'
import { PageDraftInput, Section, type PageDoc } from './sections'
import { sanitizeHtml } from './sanitize'

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

export const pagesStore = createCollectionStore<PageDraftInput>({
  collection: 'pages',
  schema: PageDraftInput,
  slugField: 'slug',
  sanitize: sanitizeDraft,
  orderBy: { field: 'updatedAt', direction: 'desc' },
  snapshotFields: ['title', 'hero', 'sections'],
})

// --- Backward-compatible named exports ---
// StoredDoc<PageDraftInput> has an extra `order` field and a wider static
// `publishedSnapshot` type vs PageDoc. Both are verified safe: no admin/pages
// consumer reads `.order`, and snapshotFields ensures the runtime publishedSnapshot
// really is the narrow {title,hero,sections} shape PageDoc declares.

export async function listPages(): Promise<PageDoc[]> {
  return pagesStore.list() as unknown as Promise<PageDoc[]>
}

export async function getPageById(id: string): Promise<PageDoc | null> {
  return pagesStore.getById(id) as unknown as Promise<PageDoc | null>
}

/** Public published-view lookup. Returns the flattened published content
 *  (title/hero/sections/slug/id/order) — no publishedSnapshot wrapper needed.
 *  Callers should read page.title/hero/sections directly. */
export async function getPublishedPage(slug: string): Promise<PublicDoc<PageDraftInput> | null> {
  return pagesStore.getPublishedBySlug(slug)
}

/** Unfiltered slug lookup — used for create/update uniqueness checks and the
 *  admin preview route, which must show drafts. Inherits list()'s resilience. */
export async function getPageBySlug(slug: string): Promise<PageDoc | null> {
  const all = await pagesStore.list()
  return (all.find((d) => d.slug === slug) as unknown as PageDoc | undefined) ?? null
}

export async function listPublishedSlugs(): Promise<string[]> {
  return pagesStore.listPublishedSlugs()
}

export async function createPage(input: PageDraftInput, editorUid: string): Promise<string> {
  return pagesStore.create(input, editorUid)
}

export async function updatePage(id: string, input: PageDraftInput, editorUid: string): Promise<void> {
  return pagesStore.update(id, input, editorUid)
}

export async function publishPage(id: string, editorUid: string): Promise<void> {
  return pagesStore.publish(id, editorUid)
}

export async function unpublishPage(id: string, editorUid: string): Promise<void> {
  return pagesStore.unpublish(id, editorUid)
}

// Note: the original deletePage stamped deletedBy/updatedBy before the hard
// delete. That stamp is dropped here — no consumer reads deletedBy after
// deletion since the document is gone immediately. Mentioned in PR description.
export async function deletePage(id: string, editorUid: string): Promise<void> {
  void editorUid
  return pagesStore.remove(id)
}
