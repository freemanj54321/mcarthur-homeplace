'use client'

import Link from 'next/link'
import { BrandMark } from './BrandMark'
import type { ResolvedFooterNav } from '@/lib/cms/navigation'

function externalProps(kind: 'internal' | 'external') {
  return kind === 'external' ? { target: '_blank', rel: 'noopener noreferrer' } : {}
}

export function Footer({ data }: { data: ResolvedFooterNav }) {
  return (
    <footer className="footer">
      <div className="footer-inner">
        <div className="footer-grid">
          <div>
            <div className="footer-mark">
              <span style={{ display: 'inline-block', background: 'var(--tartan-parch)', padding: '20px 24px', boxShadow: '0 2px 12px rgba(0,0,0,0.18)' }}>
                <BrandMark size={120} />
              </span>
            </div>
            <div className="footer-tagline" style={{ whiteSpace: 'pre-line' }}>{data.tagline}</div>
          </div>
          {data.columns.map((col) => (
            <div key={col.id}>
              <h4>{col.heading}</h4>
              <ul>
                {col.links.map((l) => (
                  <li key={l.id}>
                    <Link href={l.href} {...externalProps(l.kind)}>{l.label}</Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
          {/* The "Letters from the Porch" newsletter form was removed (MCA-91):
              there is no newsletter, and the form sent nothing anywhere. */}
        </div>
        <div className="footer-bottom">
          <span>© {new Date().getFullYear()} W.T. McArthur Historic Homeplace Foundation. A 501(c)(3) nonprofit.</span>
          <div style={{ display: 'flex', gap: 24 }}>
            {data.bottomLinks.map((l) => (
              <Link key={l.id} href={l.href} {...externalProps(l.kind)}>{l.label}</Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  )
}
