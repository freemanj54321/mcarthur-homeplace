import Link from 'next/link'

export const metadata = { title: 'Stories & News — W.T. McArthur Historic Homeplace Foundation' }

export default function StoriesPage() {
  return (
    <main className="page fade-in" style={{ padding: '120px 0' }}>
      <div className="container" style={{ textAlign: 'center' }}>
        <div className="eyebrow" style={{ justifyContent: 'center' }}>Coming soon</div>
        <h1 className="h-display" style={{ marginTop: 18, maxWidth: '14ch', marginInline: 'auto' }}>
          This page is <em>still in the workshop.</em>
        </h1>
        <p className="lead" style={{ marginTop: 24, marginInline: 'auto' }}>
          Stories, field notes, and oral history transcripts are on their way.
        </p>
        <div style={{ marginTop: 32, display: 'flex', justifyContent: 'center', gap: 12, flexWrap: 'wrap' }}>
          <Link href="/" className="btn btn-primary">Back home →</Link>
          <Link href="/projects" className="btn btn-outline">See the projects</Link>
        </div>
      </div>
    </main>
  )
}
