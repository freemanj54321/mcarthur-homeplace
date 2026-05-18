import { notFound } from 'next/navigation'
import { requireEditor } from '@/lib/auth/server'
import { getPageById } from '@/lib/cms/pages'
import { SectionEditor } from '@/components/cms/SectionEditor'

export const dynamic = 'force-dynamic'

type Props = { params: Promise<{ id: string }> }

export default async function EditPage({ params }: Props) {
  await requireEditor()
  const { id } = await params
  const page = await getPageById(id)
  if (!page) notFound()
  return (
    <div>
      <h1 className="admin-h1">{page.title || 'Untitled page'}</h1>
      <SectionEditor page={page} />
    </div>
  )
}
