import { HomeHero } from '@/components/home/HomeHero'
import { MissionSection } from '@/components/home/MissionSection'
import { ProjectsTeaser } from '@/components/home/ProjectsTeaser'
import { StoriesTeaser } from '@/components/home/StoriesTeaser'
import { VisitInvite } from '@/components/home/VisitInvite'
import { HomeDonateStrip } from '@/components/home/HomeDonateStrip'
import { projectsStore } from '@/lib/cms/projects'
import { newsStore } from '@/lib/cms/news'
import { eventsStore } from '@/lib/cms/events'

export const revalidate = 60

export default async function HomePage() {
  const [projects, news, events] = await Promise.all([
    projectsStore.listPublished(),
    newsStore.listPublished(),
    eventsStore.listPublished(),
  ])
  return (
    <main className="page fade-in">
      <HomeHero />
      <MissionSection />
      <ProjectsTeaser projects={projects} />
      <HomeDonateStrip />
      <StoriesTeaser news={news.slice(0, 3)} />
      <VisitInvite events={events} />
    </main>
  )
}
