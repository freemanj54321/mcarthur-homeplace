import Link from 'next/link'
import { eventsStore } from '@/lib/cms/events'

export const metadata = { title: 'Plan a Visit — W.T. McArthur Historic Homeplace Foundation' }
export const revalidate = 60

export default async function VisitPage() {
  const events = await eventsStore.listPublished()
  return (
    <main className="page fade-in" style={{ padding: '120px 0' }}>
      <div className="container" style={{ textAlign: 'center' }}>
        <div className="eyebrow" style={{ justifyContent: 'center' }}>Come see for yourself</div>
        <h1 className="h-display" style={{ marginTop: 18, maxWidth: '14ch', marginInline: 'auto' }}>
          The porch is <em>open.</em>
        </h1>
        <p className="lead" style={{ marginTop: 24, marginInline: 'auto', maxWidth: '46ch' }}>
          We host open days throughout the season. No tickets, no pressure —
          just the porch and whoever happens to be on it.
        </p>
        <div style={{ marginTop: 56, display: 'flex', flexDirection: 'column', gap: 0, maxWidth: 640, marginInline: 'auto', borderTop: '1px solid var(--c-line)' }}>
          {events.map((e) => (
            <div key={e.id} style={{ display: 'grid', gridTemplateColumns: '80px 1fr', gap: 24, padding: '24px 0', borderBottom: '1px solid var(--c-line-soft)', textAlign: 'left' }}>
              <div>
                <div className="display" style={{ fontSize: 36, lineHeight: 1, fontStyle: 'italic', color: 'var(--c-primary)' }}>{new Date(e.date).getUTCDate()}</div>
                <div className="dateline" style={{ marginTop: 4 }}>{new Date(e.date).toLocaleDateString('en-US', { month: 'short', year: 'numeric', timeZone: 'UTC' })}</div>
              </div>
              <div>
                <h3 className="h-card" style={{ fontSize: 20 }}>{e.title}</h3>
                <div className="muted" style={{ fontSize: 13, marginTop: 4 }}>{e.location} · {e.time}</div>
                <p className="muted" style={{ fontSize: 14, marginTop: 8 }}>{e.excerpt}</p>
              </div>
            </div>
          ))}
        </div>
        <div style={{ marginTop: 48, display: 'flex', justifyContent: 'center', gap: 12 }}>
          <Link href="/donate" className="btn btn-primary">Support the work →</Link>
          <Link href="/" className="btn btn-outline">Back to home</Link>
        </div>
      </div>
    </main>
  )
}
