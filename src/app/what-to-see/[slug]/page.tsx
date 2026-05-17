import { notFound } from 'next/navigation'
import { projects } from '@/data/content'
import { ProjectDetailPage } from '@/components/projects/ProjectDetailPage'

export function generateStaticParams() {
  return projects.map((p) => ({ slug: p.slug }))
}

type Props = { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: Props) {
  const { slug } = await params
  const project = projects.find((p) => p.slug === slug)
  if (!project) return {}
  return { title: `${project.title} — W.T. McArthur Historic Homeplace Foundation` }
}

export default async function ProjectPage({ params }: Props) {
  const { slug } = await params
  const project = projects.find((p) => p.slug === slug)
  if (!project) notFound()
  const others = projects.filter((p) => p.slug !== slug).slice(0, 3)
  return <ProjectDetailPage project={project} others={others} />
}
