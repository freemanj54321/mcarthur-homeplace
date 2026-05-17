'use client'

import Link from 'next/link'
import { projects } from '@/data/content'
import { ProjectCard } from '@/components/ui/ProjectCard'
import { SectionHead } from '@/components/ui/SectionHead'
import { useTweaks } from '@/context/TweaksContext'

export function ProjectsTeaser() {
  const { tweaks } = useTweaks()
  const items = projects.slice(0, 3)
  return (
    <section style={{ background: 'var(--c-bg-alt)', borderTop: '1px solid var(--c-line-soft)', borderBottom: '1px solid var(--c-line-soft)' }} className="section">
      <div className="container">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 24, marginBottom: 56 }}>
          <SectionHead eyebrow="Current restoration" title="Four buildings, <em>one slow act of repair.</em>" />
          <Link href="/what-to-see" className="btn-ghost btn">What to See <span className="arrow">→</span></Link>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: tweaks.cardLayout === 'split' ? '1fr' : 'repeat(3, 1fr)', gap: tweaks.cardLayout === 'split' ? 24 : 32 }}>
          {items.map((p) => <ProjectCard key={p.id} project={p} layout={tweaks.cardLayout} />)}
        </div>
      </div>
    </section>
  )
}
