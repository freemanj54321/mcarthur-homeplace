import { projects } from '@/data/content'
import { ProjectsList } from '@/components/projects/ProjectsList'

export const metadata = { title: 'What to See — W.T. McArthur Historic Homeplace Foundation' }

export default function ProjectsPage() {
  return <ProjectsList projects={projects} />
}
