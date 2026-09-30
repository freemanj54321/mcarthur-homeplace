import { TartanRule } from '@/components/ui/TartanRule'
import { SectionHead } from '@/components/ui/SectionHead'
import { AboutDonateStrip } from '@/components/about/AboutDonateStrip'
import { getPublishedPage } from '@/lib/cms/pages'
import { SectionsRenderer } from '@/components/cms/PageRenderer'
import { milestonesStore } from '@/lib/cms/milestones'
import { boardStore } from '@/lib/cms/board'
import { partnersStore } from '@/lib/cms/partners'
import { logFallback } from '@/lib/log'

export const revalidate = 60

export const metadata = { title: 'Our Story — W.T. McArthur Historic Homeplace Foundation' }

export default async function AboutPage() {
  const [page, milestones, board, partners] = await Promise.all([
    getPublishedPage('about').catch((err) => {
      logFallback('pages.about', err)
      return null
    }),
    milestonesStore.listPublished(),
    boardStore.listPublished(),
    partnersStore.listPublished(),
  ])
  // getPublishedPage already resolves publishedSnapshot vs. live fields.
  const sections = page?.sections ?? []

  return (
    <main className="page fade-in">

      {/* ── Header + CMS narrative sections ──────────────────────────────── */}
      <section style={{ paddingTop: 80, paddingBottom: 64 }}>
        <div className="container">
          <div className="eyebrow">Our story</div>
          <h1 className="h-display" style={{ marginTop: 22, maxWidth: '14ch' }}>
            One hundred and thirty-three years <em>of porches.</em>
          </h1>
          {sections.length > 0 && (
            <div style={{ marginTop: 40 }}>
              <SectionsRenderer sections={sections} />
            </div>
          )}
        </div>
      </section>

      <TartanRule thin />

      {/* ── Timeline — structured data, migrates to Firestore in Phase 4 ── */}
      <section className="section">
        <div className="container">
          <SectionHead eyebrow="A timeline" title="Land, house, <em>quiet, return.</em>" />
          <div style={{ marginTop: 56, position: 'relative' }}>
            <div style={{ position: 'absolute', left: 90, top: 0, bottom: 0, width: 1, background: 'var(--c-line)' }} />
            {milestones.map((m, i) => (
              <div key={m.year} style={{ display: 'grid', gridTemplateColumns: '90px 28px 1fr', gap: 24, padding: '28px 0', borderBottom: i === milestones.length - 1 ? 'none' : '1px solid var(--c-line-soft)' }}>
                <div className="display" style={{ fontSize: 28, lineHeight: 1, fontStyle: 'italic', color: 'var(--c-primary)', fontVariantNumeric: 'tabular-nums' }}>{m.year}</div>
                <div style={{ position: 'relative' }}>
                  <span style={{ position: 'absolute', left: -3, top: 12, width: 13, height: 13, background: 'var(--c-accent)', border: '2px solid var(--c-bg)', borderRadius: '50%', boxSizing: 'border-box' }} />
                </div>
                <div>
                  <h3 className="h-card" style={{ fontSize: 20, marginBottom: 6 }}>{m.title}</h3>
                  <p className="muted" style={{ fontSize: 15, margin: 0, maxWidth: '60ch' }}>{m.body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Board (MCA-91) ────────────────────────────────────────────────────
          Rendered only when board members are published: the heading used to
          show over an empty list once the sample roster was unpublished. The
          old hardcoded "What still stands" cards were placeholder copy and
          were removed; buildings now live only in What to See (projects). */}
      {board.length > 0 && (
        <section className="section">
          <div className="container">
            <SectionHead eyebrow="The board" title="Board of <em>directors.</em>" />
            <div style={{ marginTop: 56, display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 32 }}>
              {board.map((b) => (
                <div key={b.name} style={{ borderTop: '1.5px solid var(--c-primary)', paddingTop: 18 }}>
                  <div className="dateline">{b.role}</div>
                  <h3 className="display" style={{ fontSize: 22, marginTop: 8, fontWeight: 500 }}>{b.name}</h3>
                  <p className="muted" style={{ fontSize: 14, marginTop: 6 }}>{b.note}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── Partners: rendered only when partners are published (MCA-91) ─── */}
      {partners.length > 0 && (
        <section style={{ borderTop: '1px solid var(--c-line)', borderBottom: '1px solid var(--c-line)', padding: '56px 0' }}>
          <div className="container">
            <div style={{ display: 'grid', gridTemplateColumns: '180px 1fr', gap: 32, alignItems: 'center' }}>
              <div className="eyebrow">In partnership with</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 32, fontFamily: 'var(--f-display)', fontStyle: 'italic', fontSize: 18, color: 'var(--c-text-muted)' }}>
                {partners.map((p, i) => <span key={p.id}>{p.name}{i < partners.length - 1 ? ' ·' : ''}</span>)}
              </div>
            </div>
          </div>
        </section>
      )}

      <AboutDonateStrip />
    </main>
  )
}
