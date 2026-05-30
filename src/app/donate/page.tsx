import { DonateForm } from '@/components/donate/DonateForm'
import { projectsStore } from '@/lib/cms/projects'

export const metadata = { title: 'Make a Gift — W.T. McArthur Historic Homeplace Foundation' }
export const revalidate = 60

export default async function DonatePage() {
  const published = await projectsStore.listPublished()
  const projects = published.map((p) => ({ slug: p.slug, title: p.title }))
  return <DonateForm projects={projects} />
}
