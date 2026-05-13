'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { BrandMark } from './BrandMark'

const NAV_LINKS = [
  { name: 'About',    href: '/about' },
  { name: 'Projects', href: '/projects' },
  { name: 'Stories',  href: '/stories' },
  { name: 'Visit',    href: '/visit' },
]

export function Header() {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()

  return (
    <header className="header">
      <div className="header-inner">
        <Link href="/" className="brand" aria-label="W.T. McArthur Homeplace — Home" onClick={() => setOpen(false)}>
          <BrandMark size={62} />
        </Link>
        <nav className={`nav${open ? ' open' : ''}`} aria-label="Primary">
          {NAV_LINKS.map((l) => (
            <Link
              key={l.name}
              href={l.href}
              className={`nav-link${pathname.startsWith(l.href) ? ' active' : ''}`}
              onClick={() => setOpen(false)}
            >
              {l.name}
            </Link>
          ))}
          <Link
            href="/donate"
            className={`nav-cta${pathname === '/donate' ? ' active' : ''}`}
            onClick={() => setOpen(false)}
          >
            Donate
          </Link>
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
    </header>
  )
}
