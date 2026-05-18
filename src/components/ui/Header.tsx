'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { BrandMark } from './BrandMark'
import type { ResolvedPrimaryNav, ResolvedNavItem } from '@/lib/cms/navigation'

type NavChild = { id: string; label: string; href: string; kind: 'internal' | 'external' }

function externalProps(kind: 'internal' | 'external') {
  return kind === 'external' ? { target: '_blank', rel: 'noopener noreferrer' } : {}
}

function DesktopNavItem({
  item,
  isActive,
  onClose,
}: {
  item: ResolvedNavItem
  isActive: (href: string) => boolean
  onClose: () => void
}) {
  const ext = externalProps(item.kind)
  if (!item.children || item.children.length === 0) {
    return (
      <Link
        href={item.href}
        className={`nav-link${isActive(item.href) ? ' active' : ''}`}
        onClick={onClose}
        {...ext}
      >
        {item.label}
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
        {...ext}
      >
        {item.label}
        <span className="nav-caret" aria-hidden="true">▾</span>
      </Link>
      <div className="nav-dropdown" role="menu">
        {item.children.map((c) => (
          <Link
            key={c.id}
            href={c.href}
            className={`nav-dropdown-link${isActive(c.href) ? ' active' : ''}`}
            role="menuitem"
            onClick={onClose}
            {...externalProps(c.kind)}
          >
            {c.label}
          </Link>
        ))}
      </div>
    </div>
  )
}

export function Header({ data }: { data: ResolvedPrimaryNav }) {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()
  const isActive = (href: string) => pathname === href || pathname.startsWith(href + '/')
  const close = () => setOpen(false)

  const allMain: ResolvedNavItem[] = [...data.left, ...data.right]

  return (
    <header className="header">
      {/* Utility row */}
      <div className="header-utility">
        <div className="header-utility-inner">
          {data.utility.map((u, i) => {
            const isLast = i === data.utility.length - 1
            const className = isLast ? 'utility-cta' : 'utility-link'
            return (
              <Link key={u.id} href={u.href} className={className} {...externalProps(u.kind)}>
                {u.label}{isLast && <> <span aria-hidden="true">→</span></>}
              </Link>
            )
          })}
        </div>
      </div>

      {/* Main row */}
      <div className="header-main">
        <div className="header-main-inner">
          <nav className="nav nav-left" aria-label="Primary navigation, left">
            {data.left.map((l) => (
              <DesktopNavItem key={l.id} item={l} isActive={isActive} onClose={close} />
            ))}
          </nav>

          <Link href="/" className="brand" aria-label="W.T. McArthur Homeplace — Home" onClick={close}>
            <BrandMark size={104} />
          </Link>

          <nav className="nav nav-right" aria-label="Primary navigation, right">
            {data.right.map((l) => (
              <DesktopNavItem key={l.id} item={l} isActive={isActive} onClose={close} />
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
        {allMain.map((item) => (
          <div key={item.id} className="mobile-nav-group">
            <Link
              href={item.href}
              className={`nav-link${isActive(item.href) ? ' active' : ''}`}
              onClick={close}
              {...externalProps(item.kind)}
            >
              {item.label}
            </Link>
            {item.children && item.children.length > 0 && (
              <div className="mobile-subnav">
                {item.children.map((c: NavChild) => (
                  <Link
                    key={c.id}
                    href={c.href}
                    className={`mobile-subnav-link${isActive(c.href) ? ' active' : ''}`}
                    onClick={close}
                    {...externalProps(c.kind)}
                  >
                    {c.label}
                  </Link>
                ))}
              </div>
            )}
          </div>
        ))}
        {data.utility.map((u, i) => {
          const isLast = i === data.utility.length - 1
          return (
            <Link
              key={u.id}
              href={u.href}
              className={isLast ? `nav-cta${pathname === u.href ? ' active' : ''}` : `nav-link${isActive(u.href) ? ' active' : ''}`}
              onClick={close}
              {...externalProps(u.kind)}
            >
              {u.label}
            </Link>
          )
        })}
      </nav>
    </header>
  )
}
