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
              William Thomas McArthur acquired one hundred and sixty acres on the south fork in 1893.
              A small four-square cottage stood on the land; he and his wife would build the
              central-hall house around it by 1900, leaving the original rooms as the kitchen, pantry,
              and dining room. Long-leaf pine, cut on the property, hauled by mule, milled in town.
              Three generations of his family lived in that house. Two more were born nearby. The land
              grew tobacco, then cattle, then nothing — and the buildings began their long quiet. We
              are descendants and neighbors. We are bringing them back.
            </p>
            <div>
              <Polaroid label="W.T. McArthur on the porch, c. 1912" caption="W.T., c. 1912" aspect="portrait" rotate={-1} taped={false} />
            </div>
          </div>
        </div>
      </section>

      {/* Why it matters */}
      <section style={{ paddingTop: 24, paddingBottom: 96 }}>
        <div className="container">
          <SectionHead eyebrow="Why it matters" title="A hundred and thirty-three years <em>in one family.</em>" />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 56, marginTop: 56, alignItems: 'start' }}>
            <p style={{ fontSize: 17, lineHeight: 1.75 }}>
              The Historic Homeplace is unusual not for any single building but for an absence of
              interruption. The McArthur family has owned the property since 1893. That continuity is
              the reason the home and outbuildings are still standing — and the reason the verbal and
              written history of the families who lived and worked here, McArthur and otherwise, has
              not been lost.
            </p>
            <p style={{ fontSize: 17, lineHeight: 1.75 }}>
              It is also the reason the old-growth long-leaf pines on the property — roughly twenty
              of them, adjacent to the home — are still standing. They are estimated to be among a
              very small number of survivors of the millions of acres of long-leaf forest that
              covered the South when Europeans first arrived.
            </p>
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

      {/* How the farm worked */}
      <section style={{ background: 'var(--c-bg-alt)', padding: '96px 0' }}>
        <div className="container">
          <SectionHead eyebrow="How the farm worked" title="Mules, syrup, <em>and a ledger.</em>" />
          <div style={{ marginTop: 56, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 56 }}>
            <div>
              <h3 className="h-card" style={{ marginBottom: 12 }}>The everyday</h3>
              <p style={{ fontSize: 16, lineHeight: 1.75, margin: 0 }}>
                Much of what was routine on a southern farm in the late nineteenth and early twentieth
                century is now beyond the imagination of most adults. Sugar cane was ground and its juice
                boiled down to syrup. Hogs and other livestock were butchered on the property. Mules —
                not tractors — pulled wagons and farm implements. Some mechanization had arrived by the
                early 1900s, but most field work was still done behind a mule.
              </p>
            </div>
            <div>
              <h3 className="h-card" style={{ marginBottom: 12 }}>The tenant system</h3>
              <p style={{ fontSize: 16, lineHeight: 1.75, margin: 0 }}>
                With mule-drawn implements, one person could only work between twenty and forty acres.
                Large farms relied on tenant families — one roughly built house per thirty to forty
                acres, each family tending its parcel, keeping a garden and a few animals for their
                own use. Once a year, after the harvest sold, the husband received a share of the
                profit.
              </p>
              <p style={{ fontSize: 16, lineHeight: 1.75, marginTop: 16, marginBottom: 0 }}>
                To bridge the months between, the farm operated a commissary — a store that sold
                essentials on credit. The balance was deducted from the year-end pay. In practice,
                the arrangement looked a great deal like indentured servitude. The W.T. McArthur
                commissary still stands, and multiple account books survive — every transaction
                recorded by name.
              </p>
            </div>
          </div>
          <div style={{ marginTop: 48, paddingTop: 32, borderTop: '1px solid var(--c-line-soft)' }}>
            <h3 className="h-card" style={{ marginBottom: 12 }}>The pine rosin and the lost still</h3>
            <p style={{ fontSize: 16, lineHeight: 1.75, maxWidth: '74ch', margin: 0 }}>
              Mules also worked the pine forests. Farm hands tapped the long-leaf pines for rosin,
              hauled it in mule-drawn wagons, and refined it in a still on the property — turpentine
              for trade, and pitch for the naval stores industry that once waterproofed wooden ships.
              Stills were dangerous; the heat came from wood fires and everything in reach was
              flammable. The McArthur still and its building burned to the ground. Nothing of either
              remains except the stories of the people who worked the pines.
            </p>
          </div>
        </div>
      </section>

      {/* What still stands */}
      <section className="section">
        <div className="container">
          <SectionHead eyebrow="What still stands" title="The proofs <em>of a working farm.</em>" />
          <div style={{ marginTop: 56, display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 32 }}>
            <div style={{ borderTop: '1.5px solid var(--c-primary)', paddingTop: 18 }}>
              <div className="dateline">Outbuilding</div>
              <h3 className="display" style={{ fontSize: 22, marginTop: 8, fontWeight: 500 }}>The mule barn</h3>
              <p className="muted" style={{ fontSize: 14, marginTop: 6 }}>Over a hundred years old. Housed the mules that pulled tenant farmers&apos; plows and hauled pine rosin from the forests.</p>
            </div>
            <div style={{ borderTop: '1.5px solid var(--c-primary)', paddingTop: 18 }}>
              <div className="dateline">Residence</div>
              <h3 className="display" style={{ fontSize: 22, marginTop: 8, fontWeight: 500 }}>A tenant house</h3>
              <p className="muted" style={{ fontSize: 14, marginTop: 6 }}>Standing in the condition the families would have known — a direct window into how forty acres was farmed.</p>
            </div>
            <div style={{ borderTop: '1.5px solid var(--c-primary)', paddingTop: 18 }}>
              <div className="dateline">Civic</div>
              <h3 className="display" style={{ fontSize: 22, marginTop: 8, fontWeight: 500 }}>The single-room school</h3>
              <p className="muted" style={{ fontSize: 14, marginTop: 6 }}>Where the children of the farm learned their letters.</p>
            </div>
            <div style={{ borderTop: '1.5px solid var(--c-primary)', paddingTop: 18 }}>
              <div className="dateline">Commerce</div>
              <h3 className="display" style={{ fontSize: 22, marginTop: 8, fontWeight: 500 }}>The commissary</h3>
              <p className="muted" style={{ fontSize: 14, marginTop: 6 }}>Still standing, in disrepair. Account books survive, with every credit transaction recorded by name.</p>
            </div>
            <div style={{ borderTop: '1.5px solid var(--c-primary)', paddingTop: 18 }}>
              <div className="dateline">Forest</div>
              <h3 className="display" style={{ fontSize: 22, marginTop: 8, fontWeight: 500 }}>The old-growth pines</h3>
              <p className="muted" style={{ fontSize: 14, marginTop: 6 }}>Roughly twenty long-leaf pines adjacent to the home — likely among the last survivors of the South&apos;s original long-leaf forest.</p>
            </div>
            <div style={{ borderTop: '1.5px solid var(--c-primary)', paddingTop: 18 }}>
              <div className="dateline">Built</div>
              <h3 className="display" style={{ fontSize: 22, marginTop: 8, fontWeight: 500 }}>The Main House</h3>
              <p className="muted" style={{ fontSize: 14, marginTop: 6 }}>Acquired in 1893 as a 350-square-foot cottage, expanded by 1900, preserved largely unchanged for seventy-five years.</p>
            </div>
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
