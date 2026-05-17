'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { BrandMark } from './BrandMark'
import { projects } from '@/data/content'

type NavChild = { name: string; href: string }
type NavItem  = { name: string; href: string; children?: NavChild[] }

const whatToSeeChildren: NavChild[] = projects.map((p) => ({
  name: p.title,
  href: `/what-to-see/${p.slug}`,
}))

const NAV_LEFT: NavItem[] = [
  { name: 'About',       href: '/about' },
  { name: 'What to See', href: '/what-to-see', children: whatToSeeChildren },
]
const NAV_RIGHT: NavItem[] = [
  { name: 'Stories', href: '/stories' },
  { name: 'Visit',   href: '/visit' },
]
const ALL_NAV = [...NAV_LEFT, ...NAV_RIGHT]

function DesktopNavItem({
  item,
  isActive,
  onClose,
}: {
  item: NavItem
  isActive: (href: string) => boolean
  onClose: () => void
}) {
  if (!item.children) {
    return (
      <Link
        href={item.href}
        className={`nav-link${isActive(item.href) ? ' active' : ''}`}
        onClick={onClose}
      >
        {item.name}
      </Link>
    )
  }
  return (
    <div className="nav-item-with-dropdown">
      <Link
        href={item.href}
        className={`nav-link${isActive(item.href) ? ' active' : ''}`}
        onClick={onClose}
        aria-haspopup="true"
      >
        {item.name}
        <span className="nav-caret" aria-hidden="true">▾</span>
      </Link>
      <div className="nav-dropdown" role="menu">
        {item.children.map((c) => (
          <Link
            key={c.href}
            href={c.href}
            className={`nav-dropdown-link${isActive(c.href) ? ' active' : ''}`}
            role="menuitem"
            onClick={onClose}
          >
            {c.name}
          </Link>
        ))}
      </div>
    </div>
  )
}

export function Header() {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()
  const isActive = (href: string) => pathname === href || pathname.startsWith(href + '/')
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
              <DesktopNavItem key={l.name} item={l} isActive={isActive} onClose={close} />
            ))}
          </nav>

          <Link href="/" className="brand" aria-label="W.T. McArthur Homeplace — Home" onClick={close}>
            <BrandMark size={104} />
          </Link>

          <nav className="nav nav-right" aria-label="Primary navigation, right">
            {NAV_RIGHT.map((l) => (
              <DesktopNavItem key={l.name} item={l} isActive={isActive} onClose={close} />
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

      {/* Mobile dropdown — submenu items stack inline under their parent */}
      <nav className={`mobile-nav${open ? ' open' : ''}`} aria-label="Primary navigation, mobile">
        {ALL_NAV.map((item) => (
          <div key={item.name} className="mobile-nav-group">
            <Link
              href={item.href}
              className={`nav-link${isActive(item.href) ? ' active' : ''}`}
              onClick={close}
            >
              {item.name}
            </Link>
            {item.children && (
              <div className="mobile-subnav">
                {item.children.map((c) => (
                  <Link
                    key={c.href}
                    href={c.href}
                    className={`mobile-subnav-link${isActive(c.href) ? ' active' : ''}`}
                    onClick={close}
                  >
                    {c.name}
                  </Link>
                ))}
              </div>
            )}
          </div>
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
