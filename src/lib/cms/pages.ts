import 'server-only'
import { FieldValue, Timestamp } from 'firebase-admin/firestore'
import { adminDb } from '@/lib/firebase-admin'
import { PageDraftInput, Section, type PageDoc, type PageStatus } from './sections'
import { sanitizeHtml } from './sanitize'

const COL = 'pages'

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

function tsToMillis(value: unknown): number | null {
  if (value instanceof Timestamp) return value.toMillis()
  if (typeof value === 'number') return value
  return null
}

function toPageDoc(id: string, data: FirebaseFirestore.DocumentData): PageDoc {
  return {
    id,
    slug: data.slug,
    title: data.title,
    hero: data.hero ?? null,
    sections: (data.sections ?? []) as Section[],
    status: (data.status ?? 'draft') as PageStatus,
    publishedSnapshot: data.publishedSnapshot ?? null,
    publishedAt: tsToMillis(data.publishedAt),
    createdBy: data.createdBy ?? '',
    createdAt: tsToMillis(data.createdAt) ?? 0,
    updatedBy: data.updatedBy ?? '',
    updatedAt: tsToMillis(data.updatedAt) ?? 0,
  }
}

export async function listPages(): Promise<PageDoc[]> {
  const snap = await adminDb().collection(COL).orderBy('updatedAt', 'desc').get()
  return snap.docs.map((d) => toPageDoc(d.id, d.data()))
}

export async function getPageById(id: string): Promise<PageDoc | null> {
  const snap = await adminDb().collection(COL).doc(id).get()
  if (!snap.exists) return null
  return toPageDoc(snap.id, snap.data() ?? {})
}

export async function getPublishedPage(slug: string): Promise<PageDoc | null> {
  const snap = await adminDb()
    .collection(COL)
    .where('slug', '==', slug)
    .where('status', '==', 'published')
    .limit(1)
    .get()
  if (snap.empty) return null
  return toPageDoc(snap.docs[0].id, snap.docs[0].data())
}

export async function getPageBySlug(slug: string): Promise<PageDoc | null> {
  const snap = await adminDb().collection(COL).where('slug', '==', slug).limit(1).get()
  if (snap.empty) return null
  return toPageDoc(snap.docs[0].id, snap.docs[0].data())
}

export async function listPublishedSlugs(): Promise<string[]> {
  const snap = await adminDb().collection(COL).where('status', '==', 'published').get()
  return snap.docs.map((d) => d.data().slug as string)
}

export async function createPage(input: PageDraftInput, editorUid: string): Promise<string> {
  const existing = await getPageBySlug(input.slug)
  if (existing) throw new Error(`A page with slug "${input.slug}" already exists.`)
  const clean = sanitizeDraft(input)
  const ref = await adminDb().collection(COL).add({
    ...clean,
    status: 'draft' as PageStatus,
    publishedSnapshot: null,
    publishedAt: null,
    createdBy: editorUid,
    createdAt: FieldValue.serverTimestamp(),
    updatedBy: editorUid,
    updatedAt: FieldValue.serverTimestamp(),
  })
  return ref.id
}

export async function updatePage(id: string, input: PageDraftInput, editorUid: string): Promise<void> {
  const current = await getPageById(id)
  if (!current) throw new Error('Page not found')
  if (input.slug !== current.slug) {
    const conflict = await getPageBySlug(input.slug)
    if (conflict && conflict.id !== id) throw new Error(`A page with slug "${input.slug}" already exists.`)
  }
  const clean = sanitizeDraft(input)
  await adminDb().collection(COL).doc(id).update({
    ...clean,
    updatedBy: editorUid,
    updatedAt: FieldValue.serverTimestamp(),
  })
}

export async function publishPage(id: string, editorUid: string): Promise<void> {
  const current = await getPageById(id)
  if (!current) throw new Error('Page not found')
  await adminDb().collection(COL).doc(id).update({
    status: 'published' as PageStatus,
    publishedSnapshot: {
      title: current.title,
      hero: current.hero,
      sections: current.sections,
    },
    publishedAt: FieldValue.serverTimestamp(),
    updatedBy: editorUid,
    updatedAt: FieldValue.serverTimestamp(),
  })
}

export async function unpublishPage(id: string, editorUid: string): Promise<void> {
  await adminDb().collection(COL).doc(id).update({
    status: 'draft' as PageStatus,
    updatedBy: editorUid,
    updatedAt: FieldValue.serverTimestamp(),
  })
}

export async function deletePage(id: string, editorUid: string): Promise<void> {
  const ref = adminDb().collection(COL).doc(id)
  await ref.update({ deletedBy: editorUid, updatedBy: editorUid, updatedAt: FieldValue.serverTimestamp() })
  await ref.delete()
}
