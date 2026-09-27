import { notFound } from 'next/navigation'
import { DonateForm } from '@/components/donate/DonateForm'
import { donationsEnabled } from '@/lib/features'
import { projectsStore } from '@/lib/cms/projects'

export const metadata = { title: 'Make a Gift — W.T. McArthur Historic Homeplace Foundation' }
export const revalidate = 60

// MCA-71: the form is a prototype (no payments; Stripe is CMS Phase 6), so
// /donate is a 404 wherever the flag is off (prod, legacy).
export default async function DonatePage() {
  if (!donationsEnabled()) notFound()
  const published = await projectsStore.listPublished()
  const projects = published.map((p) => ({ slug: p.slug, title: p.title }))
  return <DonateForm projects={projects} />
}
