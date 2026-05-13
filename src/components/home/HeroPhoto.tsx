import Image from 'next/image'
import Link from 'next/link'
import { HeroFacts } from './HeroFacts'

export function HeroPhoto() {
  return (
    <section style={{ position: 'relative' }}>
      <div style={{ position: 'relative', overflow: 'hidden' }}>
        <Image
          src="/images/main-house.jpg"
          alt="The McArthur Main House with its wraparound porch and white picket fence"
          fill
          priority
          style={{ objectFit: 'cover', objectPosition: 'center 45%' }}
        />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(20,17,13,0.55) 0%, rgba(20,17,13,0.40) 45%, rgba(20,17,13,0.78) 100%)' }} />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(90deg, rgba(20,17,13,0.55) 0%, rgba(20,17,13,0.10) 65%, transparent 100%)' }} />

        <div className="container-wide" style={{ position: 'relative', paddingTop: 96, paddingBottom: 96, minHeight: 'min(78vh, 760px)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: 48 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16, color: 'var(--tartan-cream)' }}>
            <div className="eyebrow" style={{ color: 'var(--tartan-gold)' }}>A foundation, est. 1893</div>
            <div className="dateline" style={{ color: 'rgba(251,247,238,0.75)' }}>No. 03 · Spring · 2026</div>
          </div>

          <div>
            <h1 className="h-display" style={{ maxWidth: '14ch', color: 'var(--tartan-cream)', textShadow: '0 2px 24px rgba(0,0,0,0.35)' }}>
              A century of weather,<br />
              <em style={{ color: 'var(--tartan-gold)' }}>a generation of care.</em>
            </h1>
            <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: 32, alignItems: 'end', marginTop: 40 }}>
              <p className="lead" style={{ maxWidth: '52ch', margin: 0, color: 'rgba(251,247,238,0.92)', fontWeight: 400, textShadow: '0 1px 12px rgba(0,0,0,0.45)' }}>
                We are restoring a 19th-century family farm — the houses, the outbuildings, the cemetery, and the
                stories that hold them together — and opening it, slowly, to the people it belonged to all along.
              </p>
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                <Link href="/projects" className="btn btn-lg" style={{ background: 'var(--tartan-gold)', color: 'var(--tartan-ink)', borderColor: 'var(--tartan-gold)' }}>
                  See the work <span className="arrow">→</span>
                </Link>
                <Link href="/about" className="btn btn-lg" style={{ background: 'rgba(251,247,238,0.10)', backdropFilter: 'blur(8px)', color: 'var(--tartan-cream)', borderColor: 'rgba(251,247,238,0.45)' }}>
                  Our story
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="container-wide">
        <HeroFacts />
      </div>
    </section>
  )
}
