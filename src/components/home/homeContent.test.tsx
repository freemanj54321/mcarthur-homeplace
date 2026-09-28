import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import type { NewsItem, Project } from '@/lib/content-schema'
import { TweaksProvider } from '@/context/TweaksContext'
import { HeroPhoto } from './HeroPhoto'
import { HeroCollage } from './HeroCollage'
import { MissionSection } from './MissionSection'
import { ProjectsTeaser } from './ProjectsTeaser'
import { StoriesTeaser } from './StoriesTeaser'
import { VisitInvite } from './VisitInvite'

// MCA-91: the home page shows only real content. Placeholder copy is gone, and
// sections backed by CMS lists render nothing until something is published.

const text = (ui: React.ReactElement) => render(ui).container.textContent ?? ''

describe('home placeholder copy is gone', () => {
  it('heroes no longer claim "est. 1893"', () => {
    expect(text(<HeroPhoto />)).not.toContain('est. 1893')
    expect(text(<HeroCollage />)).not.toContain('est. 1893')
  })

  it('the mission section has no stand-in porch photo', () => {
    const t = text(<MissionSection />)
    expect(t).toContain('More than old buildings')
    expect(t).not.toMatch(/Family on the porch|the porch, 1924/)
  })

  it('the visit invite makes no open-days claim', () => {
    const t = text(<VisitInvite events={[]} />)
    expect(t).toContain('Plan a visit')
    expect(t).not.toMatch(/open days/i)
  })
})

describe('CMS-backed home sections', () => {
  it('StoriesTeaser renders nothing without news, and the news when there is some', () => {
    expect(render(<StoriesTeaser news={[]} />).container).toBeEmptyDOMElement()
    const item = { id: 'n1', title: 'A real update', excerpt: 'x', category: 'News', date: '2026-09-01', placeholder: '', image: null } as unknown as NewsItem
    render(<StoriesTeaser news={[item]} />)
    expect(screen.getByText('A real update')).toBeInTheDocument()
  })

  it('ProjectsTeaser renders nothing without projects, and a neutral heading otherwise', () => {
    const empty = render(<TweaksProvider><ProjectsTeaser projects={[]} /></TweaksProvider>)
    expect(empty.container).toBeEmptyDOMElement()
    empty.unmount()

    const project = { id: 'p1', slug: 'main-house', name: 'The Main House', category: 'Residence', subtitle: '', excerpt: '', cardImage: null } as unknown as Project
    const t = text(<TweaksProvider><ProjectsTeaser projects={[project]} /></TweaksProvider>)
    expect(t).toContain('The buildings')
    expect(t).not.toContain('Four buildings')
  })
})
