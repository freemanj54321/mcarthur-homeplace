'use client'

import { useState } from 'react'
import Link from 'next/link'
import { BrandMark } from './BrandMark'

export function Footer() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)

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
            <div className="footer-tagline">A century of weather,<br />a generation of care.</div>
          </div>
          <div>
            <h4>Explore</h4>
            <ul>
              <li><Link href="/about">Our Story</Link></li>
              <li><Link href="/what-to-see">What to See</Link></li>
              <li><Link href="/stories">Stories &amp; News</Link></li>
              <li><Link href="/visit">Plan a Visit</Link></li>
            </ul>
          </div>
          <div>
            <h4>Get Involved</h4>
            <ul>
              <li><Link href="/donate">Make a Donation</Link></li>
              <li><Link href="/">Volunteer</Link></li>
              <li><Link href="/">Share Your Story</Link></li>
              <li><Link href="/">Educational Resources</Link></li>
            </ul>
          </div>
          <div>
            <h4>Letters from the Porch</h4>
            <p style={{ fontSize: 14, color: 'rgba(251,247,238,0.78)', marginBottom: 4 }}>
              A quarterly note on what we&apos;ve patched, painted, and uncovered.
            </p>
            <form
              className="footer-newsletter"
              onSubmit={(e) => { e.preventDefault(); if (email) { setSent(true); setEmail('') } }}
            >
              <input
                type="email"
                placeholder="your@email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                aria-label="Email address"
              />
              <button type="submit">{sent ? 'Thanks ✓' : 'Subscribe →'}</button>
            </form>
          </div>
        </div>
        <div className="footer-bottom">
          <span>© {new Date().getFullYear()} W.T. McArthur Historic Homeplace Foundation. A 501(c)(3) nonprofit.</span>
          <div style={{ display: 'flex', gap: 24 }}>
            <Link href="/">Privacy</Link>
            <Link href="/">Accessibility</Link>
            <Link href="/contact">Contact</Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
