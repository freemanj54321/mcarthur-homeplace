import { HomeHero } from '@/components/home/HomeHero'
import { MissionSection } from '@/components/home/MissionSection'
import { ProjectsTeaser } from '@/components/home/ProjectsTeaser'
import { StoriesTeaser } from '@/components/home/StoriesTeaser'
import { VisitInvite } from '@/components/home/VisitInvite'
import { HomeDonateStrip } from '@/components/home/HomeDonateStrip'

export default function HomePage() {
  return (
    <main className="page fade-in">
      <HomeHero />
      <MissionSection />
      <ProjectsTeaser />
      <HomeDonateStrip />
      <StoriesTeaser />
      <VisitInvite />
    </main>
  )
}
