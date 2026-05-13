'use client'

import Link from 'next/link'
import { DonateStyle } from '@/context/TweaksContext'

export function DonateStrip({ style = 'quiet' }: { style?: DonateStyle }) {
  if (style === 'quiet') {
    return (
      <section style={{ borderTop: '1px solid var(--c-line)', borderBottom: '1px solid var(--c-line)', padding: '36px 0' }}>
        <div className="container" style={{ display: 'flex', alignItems: 'center', gap: 24, flexWrap: 'wrap', justifyContent: 'space-between' }}>
          <div style={{ maxWidth: '52ch' }}>
            <div className="eyebrow">The 2026 Match</div>
            <p style={{ margin: '10px 0 0', fontFamily: 'var(--f-display)', fontStyle: 'italic', fontSize: 22, lineHeight: 1.35, color: 'var(--c-text)' }}>
              Every gift is doubled by the State Historical Commission until December.
            </p>
          </div>
          <Link href="/donate" className="btn-ghost btn">
            Match a Gift <span className="arrow">→</span>
          </Link>
        </div>
      </section>
    )
  }
  if (style === 'banner') {
    return (
      <section style={{ background: 'var(--c-emphasis)', color: '#fff' }}>
        <div className="container" style={{ padding: '48px 32px', display: 'grid', gridTemplateColumns: '1.4fr auto', gap: 32, alignItems: 'center' }}>
          <div>
            <div className="eyebrow" style={{ color: 'var(--tartan-gold)' }}>The 2026 Match</div>
            <h3 className="h-section" style={{ color: '#fff', marginTop: 12, maxWidth: '24ch' }}>
              Every gift is doubled — <em style={{ color: 'var(--tartan-gold)' }}>through December</em>.
            </h3>
          </div>
          <Link href="/donate" className="btn btn-lg" style={{ background: 'var(--tartan-gold)', color: 'var(--tartan-ink)', borderColor: 'var(--tartan-gold)' }}>
            Match a Gift <span className="arrow">→</span>
          </Link>
        </div>
      </section>
    )
  }
  // sticker
  return (
    <section className="section">
      <div className="container" style={{ display: 'grid', placeItems: 'center' }}>
        <Link
          href="/donate"
          style={{
            position: 'relative',
            background: 'var(--tartan-gold)',
            color: 'var(--tartan-ink)',
            padding: '40px 56px',
            border: '2px solid var(--tartan-ink)',
            display: 'inline-flex', flexDirection: 'column', alignItems: 'center',
            transform: 'rotate(-2deg)',
            boxShadow: '6px 6px 0 var(--tartan-green)',
          }}
        >
          <div style={{ fontFamily: 'var(--f-script)', fontSize: 26, lineHeight: 1 }}>The 2026 Match</div>
          <div className="display" style={{ fontSize: 36, fontStyle: 'italic', margin: '6px 0 4px' }}>Doubled.</div>
          <div style={{ fontSize: 11, letterSpacing: '0.18em', textTransform: 'uppercase', fontWeight: 700 }}>Match a gift →</div>
        </Link>
      </div>
    </section>
  )
}
