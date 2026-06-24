'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import type { CollectionMeta } from '@/lib/content-schema'
import {
  deleteStructuredAction,
  publishStructuredAction,
  reorderStructuredAction,
  unpublishStructuredAction,
} from '../actions'

type Row = {
  id: string
  status: 'draft' | 'published'
  updatedAt: number
  [key: string]: unknown
}

function fmtDate(ms: number): string {
  if (!ms) return '—'
  return new Date(ms).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })
}

export function StructuredList({
  collection,
  meta,
  items,
}: {
  collection: string
  meta: CollectionMeta
  items: Row[]
}) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function run(fn: () => Promise<{ ok: boolean; error?: string }>) {
    setError(null)
    startTransition(async () => {
      const res = await fn()
      if (!res.ok) setError(res.error ?? 'Action failed')
      else router.refresh()
    })
  }

  return (
    <div>
      <div className="admin-row" style={{ justifyContent: 'space-between', marginBottom: 24 }}>
        <h1 className="admin-h1">{meta.label}</h1>
        <Link href={`/admin/structured/${collection}/new`} className="admin-btn admin-btn--primary">
          + New {meta.singular.toLowerCase()}
        </Link>
      </div>

      {error && <div className="admin-card" style={{ borderColor: '#8b1a1a', color: '#8b1a1a' }}>{error}</div>}

      {items.length === 0 ? (
        <div className="admin-empty">
          Nothing yet. <Link href={`/admin/structured/${collection}/new`}>Create the first one.</Link>
        </div>
      ) : (
        items.map((row, i) => {
          const title = (row[meta.titleField] as string) || 'Untitled'
          return (
            <div key={row.id} className="admin-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontWeight: 600, fontSize: 18 }}>{title}</div>
                <div style={{ color: '#666', fontSize: 13, marginTop: 4 }}>updated {fmtDate(row.updatedAt)}</div>
              </div>
              <div className="admin-row" style={{ gap: 6, alignItems: 'center' }}>
                <span className={`admin-pill admin-pill--${row.status}`}>{row.status}</span>
                <button type="button" className="admin-btn admin-btn--ghost" style={{ color: '#1a1a1a', borderColor: 'rgba(0,0,0,0.15)', padding: '6px 10px' }} disabled={pending || i === 0} onClick={() => run(() => reorderStructuredAction(collection, row.id, 'up'))}>↑</button>
                <button type="button" className="admin-btn admin-btn--ghost" style={{ color: '#1a1a1a', borderColor: 'rgba(0,0,0,0.15)', padding: '6px 10px' }} disabled={pending || i === items.length - 1} onClick={() => run(() => reorderStructuredAction(collection, row.id, 'down'))}>↓</button>
                <Link href={`/admin/structured/${collection}/${row.id}`} className="admin-btn admin-btn--ghost" style={{ color: '#1a1a1a', borderColor: 'rgba(0,0,0,0.15)' }}>Edit</Link>
                {row.status === 'published' ? (
                  <button type="button" className="admin-btn admin-btn--ghost" style={{ color: '#1a1a1a', borderColor: 'rgba(0,0,0,0.15)' }} disabled={pending} onClick={() => run(() => unpublishStructuredAction(collection, row.id))}>Unpublish</button>
                ) : (
                  <button type="button" className="admin-btn admin-btn--primary" disabled={pending} onClick={() => run(() => publishStructuredAction(collection, row.id))}>Publish</button>
                )}
                <button
                  type="button"
                  className="admin-btn admin-btn--danger"
                  disabled={pending}
                  onClick={() => {
                    if (confirm(`Delete "${title}"? This cannot be undone.`)) run(() => deleteStructuredAction(collection, row.id))
                  }}
                >Delete</button>
              </div>
            </div>
          )
        })
      )}
    </div>
  )
}
