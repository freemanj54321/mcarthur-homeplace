'use client'

import { Project } from '@/data/content'
import { ProjectCard } from '@/components/ui/ProjectCard'
import { DonateStrip } from '@/components/ui/DonateStrip'
import { useTweaks } from '@/context/TweaksContext'

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ borderLeft: '1.5px solid var(--c-primary)', paddingLeft: 16 }}>
      <dd className="display" style={{ margin: 0, fontSize: 32, fontStyle: 'italic', fontWeight: 300, color: 'var(--c-primary)', lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>{value}</dd>
      <dt className="muted" style={{ fontSize: 12, letterSpacing: '0.08em', textTransform: 'uppercase', marginTop: 8 }}>{label}</dt>
    </div>
  )
}

export function ProjectsList({ projects }: { projects: Project[] }) {
  const { tweaks } = useTweaks()
  return (
    <main className="page fade-in">
      <section style={{ paddingTop: 80, paddingBottom: 56 }}>
        <div className="container">
          <div className="eyebrow">The Homeplace</div>
          <h1 className="h-display" style={{ marginTop: 22, maxWidth: '14ch' }}>
            Four buildings,<br /><em>one quiet hill.</em>
          </h1>
          <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 56, alignItems: 'end', marginTop: 40 }}>
            <p className="lead">
              The McArthur Homeplace is a 160-acre site at the south fork, with a Folk Victorian
              main house, a neighboring pyramidal-roof cottage, three log outbuildings, and a small
              family cemetery on the Pine Knoll. Each was built by hand, of materials drawn from
              the land it stands on.
            </p>
            <dl style={{ margin: 0, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <Fact label="Founded"     value="1893" />
              <Fact label="Acreage"     value="160" />
              <Fact label="Buildings"   value="Six" />
              <Fact label="Generations" value="Six" />
            </dl>
          </div>
        </div>
      </section>

      <section className="section" style={{ paddingTop: 24 }}>
        <div className="container">
          <div style={{
            display: 'grid',
            gridTemplateColumns: tweaks.cardLayout === 'split' ? '1fr' : tweaks.cardLayout === 'overlay' ? 'repeat(3, 1fr)' : 'repeat(2, 1fr)',
            gap: tweaks.cardLayout === 'split' ? 24 : 32,
          }}>
            {projects.map((p) => <ProjectCard key={p.id} project={p} layout={tweaks.cardLayout} />)}
          </div>
        </div>
      </section>

      <DonateStrip style={tweaks.donateStyle} />
    </main>
  )
}
