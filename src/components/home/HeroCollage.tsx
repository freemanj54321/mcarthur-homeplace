import Image from 'next/image'
import Link from 'next/link'
import { Polaroid } from '@/components/ui/Polaroid'
import { HeroFacts } from './HeroFacts'

export function HeroCollage() {
  return (
    <section className="section">
      <div className="container-wide">
        <div style={{ display: 'grid', gridTemplateColumns: '1.05fr 1fr', gap: 56, alignItems: 'center' }}>
          <div>
            <div className="eyebrow">A foundation, est. 1893</div>
            <h1 className="h-display" style={{ marginTop: 22, maxWidth: '12ch' }}>
              The houses<br /><em>are still standing.</em>
            </h1>
            <p className="lead" style={{ marginTop: 28, maxWidth: '46ch' }}>
              For three generations the McArthur Homeplace was a working farm. For thirty-five years
              after that, it was a quiet field. We are reopening it — building by building, story by story.
            </p>
            <div style={{ display: 'flex', gap: 12, marginTop: 32, flexWrap: 'wrap' }}>
              <Link href="/about" className="btn btn-primary btn-lg">Read our story <span className="arrow">→</span></Link>
              <Link href="/what-to-see" className="btn btn-ghost">What to See</Link>
            </div>
          </div>
          <div style={{ position: 'relative', minHeight: 520 }}>
            <div style={{ position: 'absolute', top: 0, left: '8%', width: '52%', zIndex: 3 }}>
              <div className="polaroid" data-caption="The Main House" style={{ transform: 'rotate(-3deg)' }}>
                <span className="tape" />
                <div style={{ aspectRatio: '3 / 4', overflow: 'hidden', position: 'relative' }}>
                  <Image src="/images/main-house.jpg" alt="Main house" fill style={{ objectFit: 'cover', objectPosition: 'center 50%' }} />
                </div>
              </div>
            </div>
            <div style={{ position: 'absolute', top: '38%', right: 0, width: '50%', zIndex: 2 }}>
              <Polaroid label="Smokehouse — log siding" caption="Smokehouse, mended" aspect="photo" rotate={4} />
            </div>
            <div style={{ position: 'absolute', bottom: 0, left: 0, width: '46%', zIndex: 1 }}>
              <Polaroid label="Cemetery iron gate detail" caption="Iron gate, 1897" aspect="square" rotate={-2} />
            </div>
          </div>
        </div>
        <HeroFacts />
      </div>
    </section>
  )
}
