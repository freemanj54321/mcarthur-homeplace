import { requireEditor } from '@/lib/auth/server'
import { listPhotos } from '@/lib/cms/photosAdmin'
import { PhotoList } from './PhotoList'

export const dynamic = 'force-dynamic'

export default async function PhotoLibraryPage() {
  await requireEditor()
  const photos = await listPhotos()
  return <PhotoList initialPhotos={photos} />
}
