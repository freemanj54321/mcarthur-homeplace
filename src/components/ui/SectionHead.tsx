import { sanitizeHtml } from '@/lib/cms/sanitize'

interface SectionHeadProps {
  eyebrow?: string
  title: string
  lede?: string
  align?: 'left' | 'center'
}

export function SectionHead({ eyebrow, title, lede, align = 'left' }: SectionHeadProps) {
  const isCenter = align === 'center'
  return (
    <div style={{ textAlign: align, maxWidth: isCenter ? '60ch' : 'none', margin: isCenter ? '0 auto' : 0 }}>
      {eyebrow && <div className="eyebrow">{eyebrow}</div>}
      <h2
        className="h-section"
        style={{ marginTop: 18, maxWidth: '20ch', marginLeft: isCenter ? 'auto' : 0, marginRight: isCenter ? 'auto' : 0 }}
        dangerouslySetInnerHTML={{ __html: sanitizeHtml(title) }}
      />
      {lede && (
        <p className="lead" style={{ marginTop: 18, marginLeft: isCenter ? 'auto' : 0, marginRight: isCenter ? 'auto' : 0 }}>
          {lede}
        </p>
      )}
    </div>
  )
}
