import { requireEditor } from '@/lib/auth/server'
import { projectsStore } from '@/lib/cms/projects'
import { PhotoForm } from '@/components/cms/PhotoForm'

export const dynamic = 'force-dynamic'

export default async function NewPhotoPage() {
  await requireEditor()
  const slugs = await projectsStore.listPublishedSlugs()
  return <PhotoForm initial={null} projectSlugs={slugs} />
}
