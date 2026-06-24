import Link from 'next/link'
import { EventItem } from '@/lib/content-schema'

export function VisitInvite({ events }: { events: EventItem[] }) {
  const items = events.slice(0, 3)
  return (
    <section className="section" style={{ background: 'var(--c-primary)', color: 'var(--tartan-cream)' }}>
      <div className="container">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.4fr', gap: 64 }}>
          <div>
            <div className="eyebrow" style={{ color: 'var(--tartan-gold)' }}>Come see for yourself</div>
            <h2 className="h-section" style={{ color: 'var(--tartan-cream)', marginTop: 18 }}>
              The porch is <em style={{ color: 'var(--tartan-gold)' }}>open.</em>
            </h2>
            <p style={{ color: 'rgba(251,247,238,0.75)', marginTop: 24, fontSize: 17, maxWidth: '40ch' }}>
              We host three or four open days each season. Bring a picnic, a question, or a memory.
              No tickets, no pressure — just the porch and whoever happens to be on it.
            </p>
            <Link href="/visit" className="btn btn-lg" style={{ background: 'var(--tartan-gold)', color: 'var(--tartan-ink)', borderColor: 'var(--tartan-gold)', marginTop: 24, display: 'inline-flex' }}>
              Plan a visit <span className="arrow">→</span>
            </Link>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', borderTop: '1px solid rgba(251,247,238,0.15)' }}>
            {items.map((e) => (
              <div key={e.id} style={{ display: 'grid', gridTemplateColumns: '110px 1fr auto', alignItems: 'center', gap: 24, padding: '24px 0', borderBottom: '1px solid rgba(251,247,238,0.15)' }}>
                <div>
                  <div className="display" style={{ fontSize: 36, lineHeight: 1, fontWeight: 400, color: 'var(--tartan-gold)' }}>{new Date(e.date).getUTCDate()}</div>
                  <div style={{ fontSize: 11, letterSpacing: '0.16em', textTransform: 'uppercase', marginTop: 6, color: 'rgba(251,247,238,0.65)' }}>
                    {new Date(e.date).toLocaleDateString('en-US', { month: 'short', year: 'numeric', timeZone: 'UTC' })}
                  </div>
                </div>
                <div>
                  <div className="display" style={{ fontSize: 20, lineHeight: 1.2, color: 'var(--tartan-cream)' }}>{e.title}</div>
                  <div style={{ fontSize: 13, color: 'rgba(251,247,238,0.65)', marginTop: 6 }}>{e.location} · {e.time}</div>
                </div>
                <div style={{ fontSize: 18, color: 'var(--tartan-gold)' }}>→</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
