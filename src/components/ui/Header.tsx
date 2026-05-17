'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { BrandMark } from './BrandMark'

const NAV_LEFT = [
  { name: 'About',       href: '/about' },
  { name: 'What to See', href: '/what-to-see' },
]
const NAV_RIGHT = [
  { name: 'Stories', href: '/stories' },
  { name: 'Visit',   href: '/visit' },
]
const ALL_NAV = [...NAV_LEFT, ...NAV_RIGHT]

export function Header() {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()
  const isActive = (href: string) => pathname.startsWith(href)
  const close = () => setOpen(false)

  return (
    <header className="header">
      {/* Utility row */}
      <div className="header-utility">
        <div className="header-utility-inner">
          <Link href="/visit" className="utility-link">Plan a Visit</Link>
          <Link href="/donate" className="utility-cta">Donate <span aria-hidden="true">→</span></Link>
        </div>
      </div>

      {/* Main row */}
      <div className="header-main">
        <div className="header-main-inner">
          <nav className="nav nav-left" aria-label="Primary navigation, left">
            {NAV_LEFT.map((l) => (
              <Link
                key={l.name}
                href={l.href}
                className={`nav-link${isActive(l.href) ? ' active' : ''}`}
                onClick={close}
              >
                {l.name}
              </Link>
            ))}
          </nav>

          <Link href="/" className="brand" aria-label="W.T. McArthur Homeplace — Home" onClick={close}>
            <BrandMark size={104} />
          </Link>

          <nav className="nav nav-right" aria-label="Primary navigation, right">
            {NAV_RIGHT.map((l) => (
              <Link
                key={l.name}
                href={l.href}
                className={`nav-link${isActive(l.href) ? ' active' : ''}`}
                onClick={close}
              >
                {l.name}
              </Link>
            ))}
          </nav>

          <button
            className="mobile-toggle"
            aria-expanded={open}
            aria-label="Toggle menu"
            onClick={() => setOpen(!open)}
          >
            {open ? '✕' : '☰'}
          </button>
        </div>
      </div>

      {/* Mobile dropdown */}
      <nav className={`mobile-nav${open ? ' open' : ''}`} aria-label="Primary navigation, mobile">
        {ALL_NAV.map((l) => (
          <Link
            key={l.name}
            href={l.href}
            className={`nav-link${isActive(l.href) ? ' active' : ''}`}
            onClick={close}
          >
            {l.name}
          </Link>
        ))}
        <Link
          href="/donate"
          className={`nav-cta${pathname === '/donate' ? ' active' : ''}`}
          onClick={close}
        >
          Donate
        </Link>
      </nav>
    </header>
  )
}
