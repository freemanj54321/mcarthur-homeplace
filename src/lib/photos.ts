import { collection, query, where, orderBy, getDocs, Timestamp } from 'firebase/firestore'
import { db } from './firebase'

export interface PhotoDoc {
  id: string
  filename: string
  storagePath: string
  downloadUrl: string
  caption: string
  altText: string
  project: string | null
  category: 'exterior' | 'interior' | 'detail' | 'landscape' | 'archival'
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
