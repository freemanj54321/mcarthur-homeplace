import { notFound } from 'next/navigation'
import { projectsStore } from '@/lib/cms/projects'
import { listPhotosByProject } from '@/lib/cms/photosAdmin'
import { ProjectDetailPage } from '@/components/projects/ProjectDetailPage'

export const revalidate = 60
export const dynamicParams = true

export async function generateStaticParams() {
  const slugs = await projectsStore.listPublishedSlugs()
  return slugs.map((slug) => ({ slug }))
}

type Props = { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: Props) {
  const { slug } = await params
  const project = await projectsStore.getPublishedBySlug(slug)
  if (!project) return {}
  return { title: `${project.title} — W.T. McArthur Historic Homeplace Foundation` }
}

export default async function ProjectPage({ params }: Props) {
  const { slug } = await params
  const [project, allPublished, photos] = await Promise.all([
    projectsStore.getPublishedBySlug(slug),
    projectsStore.listPublished(),
    listPhotosByProject(slug),
  ])
  if (!project) notFound()
  const others = allPublished.filter((p) => p.slug !== slug).slice(0, 3)
  return <ProjectDetailPage project={project} others={others} photos={photos} />
}
