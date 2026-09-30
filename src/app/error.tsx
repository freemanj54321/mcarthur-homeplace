'use client' // Error boundaries must be Client Components

import Link from 'next/link'

// MCA-130: branded error page for failures inside the site shell. Next.js
// already logs the server-side error; `digest` lets us find it in Cloud Logging.
export default function Error({
  error,
  retry,
}: {
  error: Error & { digest?: string }
  retry: () => void
}) {
  return (
    <main className="page" style={{ padding: '120px 0' }}>
      <div className="container" style={{ textAlign: 'center' }}>
        <div className="eyebrow" style={{ justifyContent: 'center' }}>Something went wrong</div>
        <h1 className="h-display" style={{ marginTop: 18, marginInline: 'auto', maxWidth: '16ch' }}>
          We couldn&apos;t load <em>this page.</em>
        </h1>
        <p className="lead" style={{ marginTop: 24, marginInline: 'auto', maxWidth: '46ch' }}>
          Please try again in a moment.
          {error.digest && <> If it keeps happening, mention reference <code>{error.digest}</code>.</>}
        </p>
        <div style={{ marginTop: 40, display: 'flex', justifyContent: 'center', gap: 12, flexWrap: 'wrap' }}>
          <button type="button" className="btn btn-primary" onClick={() => retry()}>Try again</button>
          <Link href="/" className="btn btn-outline">Back to home</Link>
        </div>
      </div>
    </main>
  )
}
