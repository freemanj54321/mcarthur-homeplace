import { collection, query, where, orderBy, getDocs, Timestamp } from 'firebase/firestore'
import { db } from './firebase'

export const PHOTO_CATEGORIES = ['exterior', 'interior', 'detail', 'landscape', 'archival'] as const
export type PhotoCategory = (typeof PHOTO_CATEGORIES)[number]

/** Serializable photo shape safe to pass as props to client components. */
export type PhotoRecord = {
  id: string
  filename: string
  storagePath: string
  downloadUrl: string
  caption: string
  altText: string
  project: string | null
  category: PhotoCategory
  featured: boolean
  order: number
  dateTaken: string
  updatedAt: number
  uploadedAt: number
}

/** Legacy client-SDK type (still used for client-side queries). */
export interface PhotoDoc {
  id: string
  filename: string
  storagePath: string
  downloadUrl: string
  caption: string
  altText: string
  project: string | null
  category: PhotoCategory
  featured: boolean
  order: number
  dateTaken: Timestamp | null
  uploadedAt: Timestamp
}

export async function getProjectPhotos(slug: string): Promise<PhotoDoc[]> {
  try {
    const q = query(
      collection(db, 'photos'),
      where('project', '==', slug),
      orderBy('order', 'asc'),
    )
    const snap = await getDocs(q)
    return snap.docs.map((doc) => ({ id: doc.id, ...doc.data() } as PhotoDoc))
  } catch {
    return []
  }
}

export async function getFeaturedPhotos(): Promise<PhotoDoc[]> {
  try {
    const q = query(
      collection(db, 'photos'),
      where('featured', '==', true),
      orderBy('order', 'asc'),
    )
    const snap = await getDocs(q)
    return snap.docs.map((doc) => ({ id: doc.id, ...doc.data() } as PhotoDoc))
  } catch {
    return []
  }
}
