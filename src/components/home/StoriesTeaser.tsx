import Link from 'next/link'
import { NewsItem } from '@/lib/content-schema'
import { Placeholder } from '@/components/ui/Placeholder'
import { SectionHead } from '@/components/ui/SectionHead'

export function StoriesTeaser({ news }: { news: NewsItem[] }) {
  return (
    <section className="section">
      <div className="container">
        <SectionHead eyebrow="From the porch" title="Letters, field notes, <em>and the occasional confession.</em>" />
        <div style={{ marginTop: 56, display: 'grid', gridTemplateColumns: '1.4fr 1fr 1fr', gap: 32 }}>
          {news.map((n, i) => (
            <Link key={n.id} href="/stories" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {n.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={n.image.downloadUrl} alt={n.image.alt || n.title} style={{ width: '100%', aspectRatio: i === 0 ? '16 / 9' : '4 / 3', objectFit: 'cover' }} />
              ) : (
                <Placeholder label={n.placeholder} aspect={i === 0 ? 'wide' : 'photo'} />
              )}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                  <span style={{ fontSize: 11, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--c-accent)', fontWeight: 700 }}>{n.category}</span>
                  <span style={{ width: 3, height: 3, background: 'var(--c-line)', borderRadius: '50%' }} />
                  <span className="dateline">{new Date(n.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC' })}</span>
                </div>
                <h3 className="display" style={{ fontSize: i === 0 ? 28 : 22, lineHeight: 1.2, fontWeight: 500 }}>{n.title}</h3>
                <p className="muted" style={{ fontSize: 14, lineHeight: 1.55, marginTop: 10 }}>{n.excerpt}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
