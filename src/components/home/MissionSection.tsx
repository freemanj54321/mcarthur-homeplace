import Link from 'next/link'
import { Placeholder } from '@/components/ui/Placeholder'

export function MissionSection() {
  return (
    <section className="section">
      <div className="container">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: 80, alignItems: 'center' }}>
          <div>
            <div className="eyebrow">Our work</div>
            <h2 className="h-section" style={{ marginTop: 18 }}>
              More than old buildings — <em>a place to come home to.</em>
            </h2>
            <p style={{ marginTop: 24, fontSize: 17, color: 'var(--c-text-muted)', lineHeight: 1.7, maxWidth: '46ch' }}>
              The McArthur Homeplace is a tangible link to the agricultural history of our region.
              For over a century, these grounds witnessed the changing seasons, the evolution of farming
              practices, and the enduring strength of family ties.
            </p>
            <p style={{ fontSize: 17, color: 'var(--c-text-muted)', lineHeight: 1.7, maxWidth: '46ch' }}>
              The foundation was formed to ensure this history is not lost to time. Through careful
              restoration, educational programming, and community engagement, we are turning the
              homeplace into a living museum and archival center.
            </p>
            <Link href="/about" className="btn-ghost btn" style={{ marginTop: 16 }}>
              Read the full history <span className="arrow">→</span>
            </Link>
          </div>
          <div style={{ position: 'relative' }}>
            <div style={{ position: 'absolute', inset: '-24px -24px 24px 24px', background: 'var(--c-bg-alt)', zIndex: 0 }} />
            <div style={{ position: 'relative', zIndex: 1 }}>
              <Placeholder label="Family on the porch — circa 1924, sepia archive" aspect="photo" />
            </div>
            <div className="script" style={{ position: 'absolute', top: -20, right: -8, background: 'var(--c-surface)', padding: '8px 14px', boxShadow: '0 4px 12px var(--c-shadow)', transform: 'rotate(2deg)', fontSize: 22, color: 'var(--c-emphasis)', zIndex: 2 }}>
              the porch, <span style={{ color: 'var(--c-accent)' }}>1924</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
