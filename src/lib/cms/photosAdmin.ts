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

// One-doc query rather than a full scan: the library holds hundreds of photos
// since the legacy import (MCA-90) and grows with bulk upload (MCA-106).
async function nextOrder(): Promise<number> {
  const snap = await col().orderBy('order', 'desc').limit(1).get()
  const top = snap.docs[0]?.data().order
  return typeof top === 'number' ? top + 1 : 0
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

/**
 * Delete a photo doc and return the Storage path it pointed at (null if the
 * doc didn't exist or had none). The caller deletes the object from that path:
 * it must come from the doc, never from the client, because the Admin SDK
 * bypasses Storage rules and could otherwise delete any object (MCA-113).
 */
export async function deletePhoto(id: string): Promise<string | null> {
  const ref = col().doc(id)
  const snap = await ref.get()
  if (!snap.exists) return null
  const storagePath = snap.data()?.storagePath
  await ref.delete()
  return typeof storagePath === 'string' && storagePath ? storagePath : null
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
