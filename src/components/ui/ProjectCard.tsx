'use client'

import Link from 'next/link'
import Image from 'next/image'
import { Project } from '@/data/content'
import { CardLayout } from '@/context/TweaksContext'
import { Placeholder } from './Placeholder'

function ProjectImage({ project: p, aspect = 'photo' }: { project: Project; aspect?: string }) {
  const ratio = aspect === 'portrait' ? '3 / 4' : aspect === 'square' ? '1 / 1' : aspect === 'wide' ? '16 / 9' : '4 / 3'
  if (p.slug === 'main-house') {
    return (
      <div style={{ position: 'relative', aspectRatio: ratio, overflow: 'hidden' }}>
        <Image src="/images/main-house.jpg" alt={p.title} fill style={{ objectFit: 'cover', objectPosition: 'center 45%' }} />
      </div>
    )
  }
  if (p.slug === 'cooper-conner-house') {
    return (
      <div style={{ position: 'relative', aspectRatio: ratio, overflow: 'hidden' }}>
        <Image src="/images/cooper-conner-day.jpg" alt={p.title} fill style={{ objectFit: 'cover', objectPosition: 'center 55%' }} />
      </div>
    )
  }
  return <Placeholder label={p.placeholder} aspect={aspect as 'photo' | 'portrait' | 'square' | 'wide'} />
}

interface ProjectCardProps {
  project: Project
  layout?: CardLayout
}

export function ProjectCard({ project: p, layout = 'classic' }: ProjectCardProps) {
  if (layout === 'overlay') {
    return (
      <Link href={`/projects/${p.slug}`} style={{ position: 'relative', display: 'block', overflow: 'hidden', minHeight: 460 }}>
        <ProjectImage project={p} aspect="portrait" />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(20,17,13,0.85) 0%, rgba(20,17,13,0.45) 50%, transparent 80%)' }} />
        <div style={{ position: 'absolute', top: 18, left: 18, background: 'var(--tartan-gold)', color: 'var(--tartan-ink)', padding: '4px 10px', fontSize: 10, letterSpacing: '0.18em', textTransform: 'uppercase', fontWeight: 700 }}>{p.kind}</div>
        <div style={{ position: 'absolute', bottom: 24, left: 24, right: 24, color: '#fff' }}>
          <div className="dateline" style={{ color: 'rgba(255,255,255,0.7)' }}>{p.built}</div>
          <h3 className="display" style={{ fontSize: 32, fontWeight: 400, color: '#fff', margin: '8px 0 12px', lineHeight: 1.1 }}>{p.title}</h3>
          <p style={{ color: 'rgba(255,255,255,0.85)', fontSize: 14, lineHeight: 1.55, margin: 0 }}>{p.excerpt}</p>
        </div>
      </Link>
    )
  }
  if (layout === 'split') {
    return (
      <Link href={`/projects/${p.slug}`} style={{ display: 'grid', gridTemplateColumns: '320px 1fr auto', gap: 28, padding: '28px 32px', background: 'var(--c-surface)', border: '1px solid var(--c-line-soft)', alignItems: 'center' }}>
        <ProjectImage project={p} aspect="photo" />
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 10 }}>
            <span className="dateline">{p.built}</span>
            <span style={{ width: 4, height: 4, background: 'var(--c-line)', borderRadius: '50%' }} />
            <span style={{ fontSize: 11, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--c-accent)', fontWeight: 700 }}>{p.kind}</span>
          </div>
          <h3 className="h-card" style={{ marginBottom: 8 }}>{p.title}</h3>
          <p className="muted" style={{ fontSize: 15, margin: 0, maxWidth: '52ch' }}>{p.excerpt}</p>
        </div>
        <div style={{ minWidth: 160, textAlign: 'right' }}>
          <div className="btn-ghost btn" style={{ padding: '6px 0', fontSize: 12 }}>Read more →</div>
        </div>
      </Link>
    )
  }
  // classic
  return (
    <Link href={`/projects/${p.slug}`} style={{ background: 'var(--c-surface)', border: '1px solid var(--c-line-soft)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <div style={{ position: 'relative' }}>
        <ProjectImage project={p} aspect="photo" />
        <div style={{ position: 'absolute', top: 14, left: 14, background: 'var(--c-surface)', color: 'var(--c-primary)', padding: '4px 10px', fontSize: 10, letterSpacing: '0.18em', textTransform: 'uppercase', fontWeight: 700 }}>{p.kind}</div>
      </div>
      <div style={{ padding: '24px 24px 28px', display: 'flex', flexDirection: 'column', flex: 1 }}>
        <div className="dateline" style={{ marginBottom: 8 }}>{p.built}</div>
        <h3 className="h-card" style={{ marginBottom: 8 }}>{p.title}</h3>
        <p className="muted" style={{ fontSize: 14, lineHeight: 1.55, flex: 1 }}>{p.excerpt}</p>
        <div className="btn-ghost btn" style={{ marginTop: 18, padding: '6px 0', fontSize: 12, textAlign: 'left' }}>Read more →</div>
      </div>
    </Link>
  )
}
