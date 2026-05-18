import { notFound } from 'next/navigation'
import { getPublishedPage, listPublishedSlugs } from '@/lib/cms/pages'
import { PageRenderer } from '@/components/cms/PageRenderer'

export const revalidate = 60

type Props = { params: Promise<{ slug: string[] }> }

export async function generateStaticParams(): Promise<{ slug: string[] }[]> {
  try {
    const slugs = await listPublishedSlugs()
    return slugs.map((s) => ({ slug: s.split('/') }))
  } catch {
    return []
  }
}

export async function generateMetadata({ params }: Props) {
  const { slug } = await params
  const page = await getPublishedPage(slug.join('/'))
  if (!page) return {}
  return { title: `${page.title} — W.T. McArthur Historic Homeplace Foundation` }
}

export default async function DynamicPage({ params }: Props) {
  const { slug } = await params
  const page = await getPublishedPage(slug.join('/'))
  if (!page) notFound()
  const snap = page.publishedSnapshot ?? { title: page.title, hero: page.hero, sections: page.sections }
  return <PageRenderer title={snap.title} hero={snap.hero} sections={snap.sections} />
}
