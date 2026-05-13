import { milestones, board, partners } from '@/data/content'
import { TartanRule } from '@/components/ui/TartanRule'
import { Polaroid } from '@/components/ui/Polaroid'
import { SectionHead } from '@/components/ui/SectionHead'
import { AboutDonateStrip } from '@/components/about/AboutDonateStrip'

export const metadata = { title: 'Our Story — W.T. McArthur Historic Homeplace Foundation' }

export default function AboutPage() {
  return (
    <main className="page fade-in">
      {/* Story header */}
      <section style={{ paddingTop: 80, paddingBottom: 64 }}>
        <div className="container">
          <div className="eyebrow">Our story</div>
          <h1 className="h-display" style={{ marginTop: 22, maxWidth: '14ch' }}>
            One hundred and thirty-three years <em>of porches.</em>
          </h1>
          <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 56, marginTop: 56, alignItems: 'start' }}>
            <p className="lead dropcap">
              William Thomas McArthur patented one hundred and sixty acres on the south fork in 1893
              and raised a house on it five years later. Long-leaf pine, cut on the property, hauled by
              mule, milled in town. Three generations of his family lived in that house. Two more were
              born nearby. The land grew tobacco, then cattle, then nothing — and the buildings began
              their long quiet. We are descendants and neighbors. We are bringing them back.
            </p>
            <div>
              <Polaroid label="W.T. McArthur on the porch, c. 1912" caption="W.T., c. 1912" aspect="portrait" rotate={-1} taped={false} />
            </div>
          </div>
        </div>
      </section>

      <TartanRule thin />

      {/* Timeline */}
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

      {/* Pull quote */}
      <section style={{ background: 'var(--c-bg-alt)', padding: '96px 0' }}>
        <div className="container-tight" style={{ textAlign: 'center' }}>
          <div className="eyebrow" style={{ justifyContent: 'center' }}>From the porch tapes, № 02</div>
          <blockquote style={{ fontFamily: 'var(--f-display)', fontSize: 'clamp(28px, 4vw, 44px)', lineHeight: 1.25, fontStyle: 'italic', fontWeight: 300, margin: '32px 0 24px', color: 'var(--c-text)' }}>
            &ldquo;The smell of the kitchen never left it. Forty years empty and you could still tell
            where my grandmother stood.&rdquo;
          </blockquote>
          <div className="script" style={{ fontSize: 26, color: 'var(--c-emphasis)' }}>— Ruby McArthur Pearce, 2025</div>
        </div>
      </section>

      {/* Board */}
      <section className="section">
        <div className="container">
          <SectionHead eyebrow="The board" title="Six neighbors and <em>a bookkeeper.</em>" />
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

      {/* Partners */}
      <section style={{ borderTop: '1px solid var(--c-line)', borderBottom: '1px solid var(--c-line)', padding: '56px 0' }}>
        <div className="container">
          <div style={{ display: 'grid', gridTemplateColumns: '180px 1fr', gap: 32, alignItems: 'center' }}>
            <div className="eyebrow">In partnership with</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 32, fontFamily: 'var(--f-display)', fontStyle: 'italic', fontSize: 18, color: 'var(--c-text-muted)' }}>
              {partners.map((p, i) => <span key={p}>{p}{i < partners.length - 1 ? ' ·' : ''}</span>)}
            </div>
          </div>
        </div>
      </section>

      <AboutDonateStrip />
    </main>
  )
}
