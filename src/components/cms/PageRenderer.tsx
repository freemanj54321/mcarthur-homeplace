import Image from 'next/image'
import { sanitizeHtml, type Section } from '@/lib/content-schema'
import './page-renderer.css'

type PageRendererProps = {
  title: string
  hero: { storagePath: string; downloadUrl: string; alt: string } | null
  sections: Section[]
}

function Html({ html, className }: { html: string; className?: string }) {
  return <div className={className} dangerouslySetInnerHTML={{ __html: sanitizeHtml(html) }} />
}

function RenderSection({ section }: { section: Section }) {
  switch (section.type) {
    case 'richText':
      return (
        <div className="cms-section cms-richtext">
          <Html html={section.html} />
        </div>
      )
    case 'image':
      if (!section.downloadUrl) return null
      return (
        <figure className="cms-section cms-image">
          <Image
            src={section.downloadUrl}
            alt={section.alt}
            width={1600}
            height={900}
            sizes="(min-width: 900px) 800px, 100vw"
            style={{ width: '100%', height: 'auto' }}
          />
          {section.caption && <figcaption>{section.caption}</figcaption>}
        </figure>
      )
    case 'twoColumn':
      return (
        <div className="cms-section cms-twocol">
          <Html html={section.leftHtml} className="cms-twocol-col" />
          <Html html={section.rightHtml} className="cms-twocol-col" />
        </div>
      )
    case 'quote':
      return (
        <blockquote className="cms-section cms-quote">
          <Html html={section.html} />
          {section.attribution && <cite>— {section.attribution}</cite>}
        </blockquote>
      )
    case 'callout':
      return (
        <aside className={`cms-section cms-callout cms-callout--${section.tone}`}>
          <Html html={section.html} />
        </aside>
      )
    case 'gallery':
      if (section.photoIds.length === 0) return null
      return (
        <div className="cms-section cms-gallery">
          {section.photoIds.map((id) => (
            <div key={id} className="cms-gallery-placeholder">Photo {id}</div>
          ))}
        </div>
      )
  }
}

export function PageRenderer({ title, hero, sections }: PageRendererProps) {
  return (
    <article className="cms-page">
      {hero && (
        <div className="cms-hero">
          <Image
            src={hero.downloadUrl}
            alt={hero.alt}
            width={2400}
            height={1200}
            priority
            sizes="100vw"
            style={{ width: '100%', height: 'auto' }}
          />
        </div>
      )}
      <header className="cms-page-header">
        <h1>{title}</h1>
      </header>
      <SectionsRenderer sections={sections} />
    </article>
  )
}

/** Renders only the section list — no page wrapper, title, or hero.
 *  Used by hybrid pages that keep a custom layout but pull body copy from the CMS. */
export function SectionsRenderer({ sections }: { sections: Section[] }) {
  return (
    <div className="cms-sections">
      {sections.map((s) => (
        <RenderSection key={s.id} section={s} />
      ))}
    </div>
  )
}
