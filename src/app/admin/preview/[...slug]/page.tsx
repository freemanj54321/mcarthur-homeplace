import { notFound } from 'next/navigation'
import { requireEditor } from '@/lib/auth/server'
import { getPageBySlug } from '@/lib/cms/pages'
import { PageRenderer } from '@/components/cms/PageRenderer'

export const dynamic = 'force-dynamic'

type Props = { params: Promise<{ slug: string[] }> }

export default async function PreviewPage({ params }: Props) {
  await requireEditor()
  const { slug } = await params
  const joined = slug.join('/')
  const page = await getPageBySlug(joined)
  if (!page) notFound()
  return (
    <div style={{ background: '#fff', minHeight: '100vh' }}>
      <div style={{ background: '#7a1f1f', color: '#fbf7ee', padding: '8px 24px', fontSize: 14 }}>
        Preview — {page.status === 'draft' ? 'this page is not published' : 'showing current draft, may differ from public version'}
      </div>
      <PageRenderer title={page.title} hero={page.hero} sections={page.sections} />
    </div>
  )
}
