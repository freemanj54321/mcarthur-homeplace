'use client'

import Image from 'next/image'
import Link from 'next/link'
import { Project } from '@/data/content'
import { Placeholder } from '@/components/ui/Placeholder'
import { SectionHead } from '@/components/ui/SectionHead'
import { ProjectCard } from '@/components/ui/ProjectCard'
import { DonateStrip } from '@/components/ui/DonateStrip'
import { useTweaks } from '@/context/TweaksContext'

function DetailFact({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '110px 1fr', gap: 14, alignItems: 'baseline' }}>
      <dt className="dateline" style={{ margin: 0 }}>{label}</dt>
      <dd style={{ margin: 0, fontSize: 14, lineHeight: 1.55 }}>{value}</dd>
    </div>
  )
}

function DetailLine({ label, value }: { label: string; value: string }) {
  return (
    <li style={{ display: 'grid', gridTemplateColumns: '110px 1fr', alignItems: 'baseline', gap: 12, paddingBottom: 14, borderBottom: '1px solid var(--c-line-soft)' }}>
      <span className="dateline">{label}</span>
      <span style={{ fontSize: 15, lineHeight: 1.5 }}>{value}</span>
    </li>
  )
}

function ProjectHeroImage({ project: p }: { project: Project }) {
  if (p.slug === 'main-house') {
    return (
      <div style={{ position: 'relative', aspectRatio: '21 / 9', overflow: 'hidden', border: '1px solid var(--c-line)' }}>
        <Image src="/images/main-house.jpg" alt={p.title} fill style={{ objectFit: 'cover', objectPosition: 'center 45%' }} />
      </div>
    )
  }
  if (p.slug === 'cooper-conner-house') {
    return (
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, border: '1px solid var(--c-line)' }}>
        <figure style={{ margin: 0, position: 'relative', aspectRatio: '4 / 5', overflow: 'hidden' }}>
          <Image src="/images/cooper-conner-day.jpg" alt={`${p.title} — daylight`} fill style={{ objectFit: 'cover' }} />
          <figcaption className="dateline" style={{ position: 'absolute', left: 14, bottom: 14, padding: '6px 10px', background: 'var(--c-surface)', fontSize: 11 }}>By day</figcaption>
        </figure>
        <figure style={{ margin: 0, position: 'relative', aspectRatio: '4 / 5', overflow: 'hidden' }}>
          <Image src="/images/cooper-conner-night.jpg" alt={`${p.title} — at night`} fill style={{ objectFit: 'cover' }} />
          <figcaption className="dateline" style={{ position: 'absolute', left: 14, bottom: 14, padding: '6px 10px', background: 'var(--c-surface)', fontSize: 11 }}>By night</figcaption>
        </figure>
      </div>
    )
  }
  return <Placeholder label={p.placeholder} aspect="pano" />
}

export function ProjectDetailPage({ project: p, others }: { project: Project; others: Project[] }) {
  const { tweaks } = useTweaks()
  return (
    <main className="page fade-in">
      <section style={{ paddingTop: 56, paddingBottom: 32 }}>
        <div className="container">
          <Link href="/projects" className="muted" style={{ fontSize: 13, letterSpacing: '0.08em', textTransform: 'uppercase' }}>← The Homeplace</Link>
          <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 56, alignItems: 'end', marginTop: 32 }}>
            <div>
              <div className="dateline">{p.built} · {p.kind}</div>
              <h1 className="h-display" style={{ marginTop: 14, maxWidth: '14ch' }}>{p.title}</h1>
              <p className="lead" style={{ marginTop: 24, maxWidth: '46ch' }}>{p.subtitle}</p>
            </div>
            <dl style={{ margin: 0, background: 'var(--c-surface)', border: '1px solid var(--c-line)', padding: 28, display: 'grid', gridTemplateColumns: '1fr', gap: 18 }}>
              <DetailFact label="Built"     value={p.built} />
              <DetailFact label="Style"     value={p.style} />
              <DetailFact label="Materials" value={p.materials} />
              <DetailFact label="Footprint" value={p.footprint} />
            </dl>
          </div>
        </div>
      </section>

      <section style={{ paddingTop: 24, paddingBottom: 56 }}>
        <div className="container">
          <ProjectHeroImage project={p} />
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 80 }}>
            <div>
              <div className="eyebrow">About this building</div>
              <p style={{ marginTop: 24, fontSize: 19, lineHeight: 1.65 }} className="dropcap">{p.description}</p>
            </div>
            <div>
              <div className="eyebrow">At a glance</div>
              <ul style={{ listStyle: 'none', padding: 0, marginTop: 24, display: 'flex', flexDirection: 'column', gap: 14 }}>
                <DetailLine label="Kind"      value={p.kind} />
                <DetailLine label="Built"     value={p.built} />
                <DetailLine label="Builder"   value={p.architect} />
                <DetailLine label="Style"     value={p.style} />
                <DetailLine label="Footprint" value={p.footprint} />
              </ul>
            </div>
          </div>
        </div>
      </section>

      {p.features.length > 0 && (
        <section className="section" style={{ background: 'var(--c-bg-alt)' }}>
          <div className="container">
            <SectionHead eyebrow="Notable features" title="What to look for <em>on a visit.</em>" />
            <div style={{ marginTop: 56, display: 'grid', gridTemplateColumns: `repeat(${Math.min(p.features.length, 4)}, 1fr)`, gap: 24 }}>
              {p.features.map((f, i) => (
                <div key={f.label} style={{ background: 'var(--c-surface)', border: '1px solid var(--c-line-soft)', padding: '28px 24px', display: 'flex', flexDirection: 'column' }}>
                  <div className="dateline">No. {String(i + 1).padStart(2, '0')}</div>
                  <h3 className="display" style={{ fontSize: 22, fontWeight: 500, lineHeight: 1.2, marginTop: 10 }}>{f.label}</h3>
                  <p className="muted" style={{ fontSize: 14, marginTop: 14, flex: 1 }}>{f.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="section">
        <div className="container">
          <SectionHead eyebrow="Continue exploring" title="Elsewhere on <em>the homeplace.</em>" />
          <div style={{ marginTop: 56, display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 32 }}>
            {others.map((o) => <ProjectCard key={o.id} project={o} layout={tweaks.cardLayout === 'split' ? 'classic' : tweaks.cardLayout} />)}
          </div>
        </div>
      </section>

      <DonateStrip style={tweaks.donateStyle} />
    </main>
  )
}
