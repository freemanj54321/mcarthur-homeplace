import { notFound } from 'next/navigation'
import { requireEditor } from '@/lib/auth/server'
import { getPhotoById } from '@/lib/cms/photosAdmin'
import { projectsStore } from '@/lib/cms/projects'
import { PhotoForm } from '@/components/cms/PhotoForm'

export const dynamic = 'force-dynamic'

type Props = { params: Promise<{ id: string }> }

export default async function EditPhotoPage({ params }: Props) {
  await requireEditor()
  const { id } = await params
  const [photo, slugs] = await Promise.all([
    getPhotoById(id),
    projectsStore.listPublishedSlugs(),
  ])
  if (!photo) notFound()
  return <PhotoForm initial={photo} projectSlugs={slugs} />
}
