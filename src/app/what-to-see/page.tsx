import { projectsStore } from '@/lib/cms/projects'
import { ProjectsList } from '@/components/projects/ProjectsList'

export const metadata = { title: 'What to See — W.T. McArthur Historic Homeplace Foundation' }
export const revalidate = 60

export default async function ProjectsPage() {
  const projects = await projectsStore.listPublished()
  return <ProjectsList projects={projects} />
}
