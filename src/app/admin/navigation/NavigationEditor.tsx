'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import type {
  FooterColumn,
  FooterNavInput,
  NavItem,
  NavLink,
  PrimaryNavInput,
} from '@/lib/cms/navigation'
import { savePrimaryNavAction, saveFooterNavAction } from './actions'

function uid() {
  return crypto.randomUUID()
}

function move<T>(arr: T[], from: number, to: number): T[] {
  if (to < 0 || to >= arr.length) return arr
  const next = [...arr]
  const [item] = next.splice(from, 1)
  next.splice(to, 0, item)
  return next
}

function newLink(prefix: string): NavLink {
  return { id: `${prefix}-${uid()}`, label: 'New link', href: '/', kind: 'internal' }
}

function newItem(prefix: string): NavItem {
  return { ...newLink(prefix) }
}

type LinkRowProps = {
  link: NavLink
  index: number
  total: number
  onChange: (patch: Partial<NavLink>) => void
  onMove: (delta: -1 | 1) => void
  onRemove: () => void
}

function LinkRow({ link, index, total, onChange, onMove, onRemove }: LinkRowProps) {
  return (
    <div className="admin-row" style={{ alignItems: 'stretch', gap: 6, marginBottom: 6 }}>
      <input
        className="admin-input"
        style={{ flex: '1 1 200px' }}
        value={link.label}
        onChange={(e) => onChange({ label: e.target.value })}
        placeholder="Label"
      />
      <input
        className="admin-input"
        style={{ flex: '1 1 240px' }}
        value={link.href}
        onChange={(e) => onChange({ href: e.target.value })}
        placeholder="/path or https://…"
      />
      <select
        className="admin-input"
        style={{ flex: '0 0 120px' }}
        value={link.kind}
        onChange={(e) => onChange({ kind: e.target.value as 'internal' | 'external' })}
      >
        <option value="internal">Internal</option>
        <option value="external">External</option>
      </select>
      <button
        type="button"
        className="admin-btn admin-btn--ghost"
        style={{ color: '#1a1a1a', borderColor: 'rgba(0,0,0,0.15)', padding: '6px 10px' }}
        onClick={() => onMove(-1)}
        disabled={index === 0}
      >↑</button>
      <button
        type="button"
        className="admin-btn admin-btn--ghost"
        style={{ color: '#1a1a1a', borderColor: 'rgba(0,0,0,0.15)', padding: '6px 10px' }}
        onClick={() => onMove(1)}
        disabled={index === total - 1}
      >↓</button>
      <button
        type="button"
        className="admin-btn admin-btn--danger"
        style={{ padding: '6px 10px' }}
        onClick={onRemove}
      >✕</button>
    </div>
  )
}

function LinkList({
  links,
  prefix,
  onChange,
}: {
  links: NavLink[]
  prefix: string
  onChange: (next: NavLink[]) => void
}) {
  return (
    <div>
      {links.map((link, i) => (
        <LinkRow
          key={link.id}
          link={link}
          index={i}
          total={links.length}
          onChange={(patch) => onChange(links.map((l) => (l.id === link.id ? { ...l, ...patch } : l)))}
          onMove={(delta) => onChange(move(links, i, i + delta))}
          onRemove={() => onChange(links.filter((l) => l.id !== link.id))}
        />
      ))}
      <button
        type="button"
        className="admin-btn admin-btn--ghost"
        style={{ color: '#1a1a1a', borderColor: 'rgba(0,0,0,0.15)' }}
        onClick={() => onChange([...links, newLink(prefix)])}
      >+ Add link</button>
    </div>
  )
}

function NavItemEditor({
  item,
  index,
  total,
  onChange,
  onMove,
  onRemove,
}: {
  item: NavItem
  index: number
  total: number
  onChange: (patch: Partial<NavItem>) => void
  onMove: (delta: -1 | 1) => void
  onRemove: () => void
}) {
  return (
    <div className="admin-card" style={{ padding: 16 }}>
      <LinkRow
        link={item}
        index={index}
        total={total}
        onChange={onChange}
        onMove={onMove}
        onRemove={onRemove}
      />
      <div className="admin-row" style={{ gap: 16, marginTop: 8 }}>
        <label className="admin-row" style={{ gap: 6, fontSize: 14, cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={item.dynamicChildren === 'projects'}
            onChange={(e) => onChange({ dynamicChildren: e.target.checked ? 'projects' : undefined })}
          />
          Auto-list projects under this item
        </label>
      </div>
      <div className="admin-label" style={{ marginTop: 12 }}>Sub-links</div>
      <LinkList
        links={item.children ?? []}
        prefix={`child-${item.id}`}
        onChange={(next) => onChange({ children: next.length === 0 ? undefined : next })}
      />
    </div>
  )
}

function ItemList({
  items,
  prefix,
  onChange,
}: {
  items: NavItem[]
  prefix: string
  onChange: (next: NavItem[]) => void
}) {
  return (
    <div>
      {items.map((item, i) => (
        <NavItemEditor
          key={item.id}
          item={item}
          index={i}
          total={items.length}
          onChange={(patch) => onChange(items.map((it) => (it.id === item.id ? { ...it, ...patch } : it)))}
          onMove={(delta) => onChange(move(items, i, i + delta))}
          onRemove={() => onChange(items.filter((it) => it.id !== item.id))}
        />
      ))}
      <button
        type="button"
        className="admin-btn admin-btn--ghost"
        style={{ color: '#1a1a1a', borderColor: 'rgba(0,0,0,0.15)' }}
        onClick={() => onChange([...items, newItem(prefix)])}
      >+ Add item</button>
    </div>
  )
}

export function NavigationEditor({
  primary,
  footer,
}: {
  primary: PrimaryNavInput
  footer: FooterNavInput
}) {
  const router = useRouter()
  const [primaryNav, setPrimaryNav] = useState<PrimaryNavInput>(primary)
  const [footerNav, setFooterNav] = useState<FooterNavInput>(footer)
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  function onSavePrimary() {
    setError(null); setMessage(null)
    startTransition(async () => {
      const result = await savePrimaryNavAction(primaryNav)
      if (!result.ok) setError(result.error)
      else { setMessage('Primary nav saved.'); router.refresh() }
    })
  }

  function onSaveFooter() {
    setError(null); setMessage(null)
    startTransition(async () => {
      const result = await saveFooterNavAction(footerNav)
      if (!result.ok) setError(result.error)
      else { setMessage('Footer saved.'); router.refresh() }
    })
  }

  function updateColumn(id: string, patch: Partial<FooterColumn>) {
    setFooterNav({
      ...footerNav,
      columns: footerNav.columns.map((c) => (c.id === id ? { ...c, ...patch } : c)),
    })
  }

  return (
    <div>
      {error && <div className="admin-card" style={{ borderColor: '#8b1a1a', color: '#8b1a1a' }}>{error}</div>}
      {message && !error && <div className="admin-hint">{message}</div>}

      <h2 className="admin-h2">Header — utility row</h2>
      <div className="admin-card">
        <p className="admin-hint" style={{ marginTop: 0 }}>
          Small links above the logo. The last link is styled as the call-to-action.
        </p>
        <LinkList
          links={primaryNav.utility}
          prefix="util"
          onChange={(utility) => setPrimaryNav({ ...primaryNav, utility })}
        />
      </div>

      <h2 className="admin-h2">Header — left of logo</h2>
      <ItemList
        items={primaryNav.left}
        prefix="left"
        onChange={(left) => setPrimaryNav({ ...primaryNav, left })}
      />

      <h2 className="admin-h2" style={{ marginTop: 24 }}>Header — right of logo</h2>
      <ItemList
        items={primaryNav.right}
        prefix="right"
        onChange={(right) => setPrimaryNav({ ...primaryNav, right })}
      />

      <div className="admin-row" style={{ marginTop: 24 }}>
        <button
          type="button"
          className="admin-btn admin-btn--primary"
          onClick={onSavePrimary}
          disabled={pending}
        >
          {pending ? 'Saving…' : 'Save header'}
        </button>
      </div>

      <hr style={{ margin: '48px 0', border: 0, borderTop: '1px solid rgba(0,0,0,0.1)' }} />

      <h2 className="admin-h2">Footer — tagline</h2>
      <div className="admin-card">
        <textarea
          className="admin-textarea"
          value={footerNav.tagline}
          onChange={(e) => setFooterNav({ ...footerNav, tagline: e.target.value })}
          placeholder="Tagline (newlines render as line breaks)"
        />
      </div>

      <h2 className="admin-h2">Footer — link columns</h2>
      {footerNav.columns.map((col) => (
        <div key={col.id} className="admin-card">
          <label className="admin-label">Column heading</label>
          <input
            className="admin-input"
            value={col.heading}
            onChange={(e) => updateColumn(col.id, { heading: e.target.value })}
          />
          <div className="admin-label" style={{ marginTop: 12 }}>Links</div>
          <LinkList
            links={col.links}
            prefix={`col-${col.id}`}
            onChange={(links) => updateColumn(col.id, { links })}
          />
          <div className="admin-row" style={{ marginTop: 12 }}>
            <button
              type="button"
              className="admin-btn admin-btn--danger"
              onClick={() => setFooterNav({
                ...footerNav,
                columns: footerNav.columns.filter((c) => c.id !== col.id),
              })}
            >
              Remove column
            </button>
          </div>
        </div>
      ))}
      <button
        type="button"
        className="admin-btn admin-btn--ghost"
        style={{ color: '#1a1a1a', borderColor: 'rgba(0,0,0,0.15)' }}
        onClick={() => setFooterNav({
          ...footerNav,
          columns: [...footerNav.columns, { id: `col-${uid()}`, heading: 'New column', links: [] }],
        })}
      >+ Add column</button>

      <h2 className="admin-h2" style={{ marginTop: 24 }}>Footer — bottom links</h2>
      <div className="admin-card">
        <p className="admin-hint" style={{ marginTop: 0 }}>
          Small links next to the copyright line (Privacy, Accessibility, Contact).
        </p>
        <LinkList
          links={footerNav.bottomLinks}
          prefix="foot-bot"
          onChange={(bottomLinks) => setFooterNav({ ...footerNav, bottomLinks })}
        />
      </div>

      <div className="admin-row" style={{ marginTop: 24 }}>
        <button
          type="button"
          className="admin-btn admin-btn--primary"
          onClick={onSaveFooter}
          disabled={pending}
        >
          {pending ? 'Saving…' : 'Save footer'}
        </button>
      </div>
    </div>
  )
}
