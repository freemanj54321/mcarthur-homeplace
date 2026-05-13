import Link from 'next/link'
import { TartanRule } from '@/components/ui/TartanRule'
import { HeroFacts } from './HeroFacts'

export function HeroTypographic() {
  return (
    <section style={{ position: 'relative', overflow: 'hidden' }}>
      <div className="container-wide" style={{ paddingTop: 80, paddingBottom: 80 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', borderBottom: '1px solid var(--c-line)', paddingBottom: 16 }}>
          <div className="dateline">Vol. III · The Spring Letter · 2026</div>
          <div className="dateline">N°&nbsp;03</div>
        </div>
        <h1 style={{ fontFamily: 'var(--f-display)', fontSize: 'clamp(64px, 13vw, 220px)', lineHeight: 0.92, margin: '64px 0 0', letterSpacing: '-0.04em', fontWeight: 400 }}>
          The
          <span style={{ fontStyle: 'italic', color: 'var(--c-primary)', fontWeight: 300 }}> Homeplace </span>
          remembers.
        </h1>
        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 64, marginTop: 80, alignItems: 'start' }}>
          <p className="lead dropcap" style={{ fontSize: 22 }}>
            We are descendants and neighbors of the W.T. McArthur farm — patented in 1893,
            built up across three generations, and quiet for the last thirty-five years.
            We are bringing it back, plank by plank, name by name. Every dollar through December
            is matched by the State Historical Commission.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <Link href="/projects" className="btn btn-primary btn-lg" style={{ justifyContent: 'space-between' }}>
              <span>The four projects</span> <span className="arrow">→</span>
            </Link>
            <Link href="/about" className="btn btn-outline btn-lg" style={{ justifyContent: 'space-between' }}>
              <span>The full history</span> <span className="arrow">→</span>
            </Link>
            <Link href="/donate" className="btn btn-ghost" style={{ justifyContent: 'space-between' }}>
              <span>Donate to the match</span> <span className="arrow">→</span>
            </Link>
          </div>
        </div>
        <TartanRule style={{ marginTop: 80 }} />
        <HeroFacts />
      </div>
    </section>
  )
}
