import Link from 'next/link'

export function MissionSection() {
  return (
    <section className="section">
      <div className="container">
        {/* MCA-91: the stand-in "Family on the porch — circa 1924" image and its
            "the porch, 1924" note were removed; there is no such photo. */}
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
      </div>
    </section>
  )
}
