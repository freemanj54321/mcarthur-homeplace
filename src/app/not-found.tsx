import Link from 'next/link'

// MCA-130: branded 404 inside the site shell (header + footer), instead of the
// Next.js default. `metadata` exports are ignored in not-found.tsx (only
// global-not-found supports them), so the title is rendered with React 19's
// hoisted <title>.
export default function NotFound() {
  return (
    <main className="page" style={{ padding: '120px 0' }}>
      <title>Page not found — W.T. McArthur Historic Homeplace Foundation</title>
      <div className="container" style={{ textAlign: 'center' }}>
        <div className="eyebrow" style={{ justifyContent: 'center' }}>Page not found</div>
        <h1 className="h-display" style={{ marginTop: 18, marginInline: 'auto', maxWidth: '16ch' }}>
          This path <em>leads nowhere.</em>
        </h1>
        <p className="lead" style={{ marginTop: 24, marginInline: 'auto', maxWidth: '46ch' }}>
          The page you were looking for may have moved or no longer exists.
        </p>
        <div style={{ marginTop: 40, display: 'flex', justifyContent: 'center', gap: 12, flexWrap: 'wrap' }}>
          <Link href="/" className="btn btn-primary">Back to home</Link>
          <Link href="/what-to-see" className="btn btn-outline">What to see</Link>
        </div>
      </div>
    </main>
  )
}
