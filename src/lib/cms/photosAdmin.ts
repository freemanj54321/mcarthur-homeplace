import 'server-only'
import { FieldValue, Timestamp } from 'firebase-admin/firestore'
import { z } from 'zod'
import { adminDb } from '@/lib/firebase-admin'
import type { PhotoCategory, PhotoRecord } from '@/lib/photos'

export const PhotoAdminInput = z.object({
  filename: z.string(),
  storagePath: z.string().min(1),
  downloadUrl: z.string().url(),
  caption: z.string().max(400),
  altText: z.string().max(400),
  project: z.string().nullable(),
  category: z.enum(['exterior', 'interior', 'detail', 'landscape', 'archival']),
  featured: z.boolean(),
  order: z.number().int(),
  dateTaken: z.string(),
})
export type PhotoAdminInput = z.infer<typeof PhotoAdminInput>

const col = () => adminDb().collection('photos')

function tsToMillis(value: unknown): number {
  if (value instanceof Timestamp) return value.toMillis()
  if (typeof value === 'number') return value
  return 0
}

function dateTakenStr(value: unknown): string {
  if (value instanceof Timestamp) return value.toDate().toISOString().slice(0, 10)
  if (typeof value === 'string') return value
  return ''
}

function toRecord(id: string, data: FirebaseFirestore.DocumentData): PhotoRecord {
  return {
    id,
    filename: data.filename ?? '',
    storagePath: data.storagePath ?? '',
    downloadUrl: data.downloadUrl ?? '',
    caption: data.caption ?? '',
    altText: data.altText ?? '',
    project: data.project ?? null,
    category: (data.category ?? 'exterior') as PhotoCategory,
    featured: data.featured ?? false,
    order: typeof data.order === 'number' ? data.order : 0,
    dateTaken: dateTakenStr(data.dateTaken),
    updatedAt: tsToMillis(data.updatedAt),
    uploadedAt: tsToMillis(data.uploadedAt),
  }
}

export async function listPhotos(): Promise<PhotoRecord[]> {
  try {
    const snap = await col().orderBy('order', 'asc').get()
    return snap.docs.map((d) => toRecord(d.id, d.data()))
  } catch {
    return []
  }
}

export async function getPhotoById(id: string): Promise<PhotoRecord | null> {
  try {
    const snap = await col().doc(id).get()
    if (!snap.exists) return null
    return toRecord(snap.id, snap.data() ?? {})
  } catch {
    return null
  }
}

export async function listPhotosByProject(slug: string): Promise<PhotoRecord[]> {
  try {
    const snap = await col().where('project', '==', slug).orderBy('order', 'asc').get()
    return snap.docs.map((d) => toRecord(d.id, d.data()))
  } catch {
    return []
  }
}

export async function listFeaturedPhotos(): Promise<PhotoRecord[]> {
  try {
    const snap = await col().where('featured', '==', true).orderBy('order', 'asc').get()
    return snap.docs.map((d) => toRecord(d.id, d.data()))
  } catch {
    return []
  }
}

async function nextOrder(): Promise<number> {
  const snap = await col().get()
  const max = snap.docs.reduce((m, d) => {
    const o = d.data().order
    return typeof o === 'number' && o > m ? o : m
  }, -1)
  return max + 1
}

export async function createPhoto(input: PhotoAdminInput, editorUid: string): Promise<string> {
  const order = input.order >= 0 ? input.order : await nextOrder()
  const ref = await col().add({
    ...input,
    order,
    dateTaken: input.dateTaken ? Timestamp.fromDate(new Date(input.dateTaken)) : null,
    uploadedAt: FieldValue.serverTimestamp(),
    createdBy: editorUid,
    updatedBy: editorUid,
    updatedAt: FieldValue.serverTimestamp(),
  })
  return ref.id
}

export async function updatePhoto(
  id: string,
  input: PhotoAdminInput,
  editorUid: string,
): Promise<void> {
  await col().doc(id).update({
    ...input,
    dateTaken: input.dateTaken ? Timestamp.fromDate(new Date(input.dateTaken)) : null,
    updatedBy: editorUid,
    updatedAt: FieldValue.serverTimestamp(),
  })
}

export async function deletePhoto(id: string): Promise<void> {
  await col().doc(id).delete()
}

/** Swap `order` values between two photos (used by reorder ↑/↓). */
export async function swapPhotoOrder(
  idA: string,
  idB: string,
  editorUid: string,
): Promise<void> {
  const [snapA, snapB] = await Promise.all([col().doc(idA).get(), col().doc(idB).get()])
  if (!snapA.exists || !snapB.exists) return
  const orderA = snapA.data()?.order ?? 0
  const orderB = snapB.data()?.order ?? 0
  const stamp = { updatedBy: editorUid, updatedAt: FieldValue.serverTimestamp() }
  const batch = adminDb().batch()
  batch.update(col().doc(idA), { order: orderB, ...stamp })
  batch.update(col().doc(idB), { order: orderA, ...stamp })
  await batch.commit()
}
