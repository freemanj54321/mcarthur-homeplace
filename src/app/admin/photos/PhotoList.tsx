'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { PHOTO_CATEGORIES, type PhotoRecord } from '@/lib/photos'
import { deletePhotoAction, reorderPhotoAction } from './actions'

export function PhotoList({ initialPhotos }: { initialPhotos: PhotoRecord[] }) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [projectFilter, setProjectFilter] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')

  const allProjects = Array.from(
    new Set(initialPhotos.map((p) => p.project).filter((s): s is string => s !== null)),
  ).sort()

  const filtered = initialPhotos.filter((p) => {
    if (projectFilter && p.project !== projectFilter) return false
    if (categoryFilter && p.category !== categoryFilter) return false
    return true
  })

  function run(fn: () => Promise<{ ok: boolean; error?: string }>) {
    setError(null)
    startTransition(async () => {
      const res = await fn()
      if (!res.ok) setError((res as { ok: false; error: string }).error ?? 'Action failed')
      else router.refresh()
    })
  }

  return (
    <div>
      <div className="admin-row" style={{ justifyContent: 'space-between', marginBottom: 24 }}>
        <h1 className="admin-h1">Photo Library</h1>
        <Link href="/admin/photos/new" className="admin-btn admin-btn--primary">
          + Upload photo
        </Link>
      </div>

      <div className="admin-row" style={{ marginBottom: 24, gap: 12 }}>
        <select
          className="admin-input"
          style={{ width: 'auto' }}
          value={projectFilter}
          onChange={(e) => setProjectFilter(e.target.value)}
        >
          <option value="">All properties</option>
          {allProjects.map((slug) => (
            <option key={slug} value={slug}>{slug}</option>
          ))}
        </select>
        <select
          className="admin-input"
          style={{ width: 'auto' }}
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
        >
          <option value="">All categories</option>
          {PHOTO_CATEGORIES.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
        {(projectFilter || categoryFilter) && (
          <button
            type="button"
            className="admin-btn admin-btn--ghost"
            style={{ color: '#1a1a1a', borderColor: 'rgba(0,0,0,0.15)' }}
            onClick={() => { setProjectFilter(''); setCategoryFilter('') }}
          >
            Clear
          </button>
        )}
      </div>

      {error && (
        <div className="admin-card" style={{ borderColor: '#8b1a1a', color: '#8b1a1a', marginBottom: 16 }}>
          {error}
        </div>
      )}

      {filtered.length === 0 ? (
        <div className="admin-empty">
          {initialPhotos.length === 0
            ? <>No photos yet. <Link href="/admin/photos/new">Upload the first one.</Link></>
            : 'No photos match the current filters.'}
        </div>
      ) : (
        <>
          <p className="admin-hint" style={{ marginTop: 0, marginBottom: 16 }}>
            {filtered.length} photo{filtered.length !== 1 ? 's' : ''}
            {(projectFilter || categoryFilter) ? ' (filtered)' : ''}
            . ↑/↓ reorders within the current filtered view.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
            {filtered.map((photo, i) => {
              const prev = filtered[i - 1]
              const next = filtered[i + 1]
              return (
                <div key={photo.id} className="admin-card" style={{ padding: 0, overflow: 'hidden' }}>
                  <div style={{ position: 'relative', aspectRatio: '4/3', background: '#eee' }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={photo.downloadUrl}
                      alt={photo.altText || photo.caption}
                      style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                    />
                    {photo.featured && (
                      <span style={{
                        position: 'absolute', top: 8, right: 8,
                        background: 'var(--tartan-gold)', color: '#000',
                        fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 2,
                      }}>
                        Featured
                      </span>
                    )}
                  </div>
                  <div style={{ padding: 12 }}>
                    <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 4 }}>
                      {photo.caption || photo.filename || 'Untitled'}
                    </div>
                    <div style={{ fontSize: 12, color: '#666', marginBottom: 10 }}>
                      {[photo.project, photo.category].filter(Boolean).join(' · ')}
                    </div>
                    <div className="admin-row" style={{ gap: 6, flexWrap: 'wrap' }}>
                      <button
                        type="button"
                        className="admin-btn admin-btn--ghost"
                        style={{ color: '#1a1a1a', borderColor: 'rgba(0,0,0,0.15)', padding: '4px 8px', fontSize: 13 }}
                        disabled={pending || !prev}
                        onClick={() => prev && run(() => reorderPhotoAction(photo.id, prev.id))}
                      >↑</button>
                      <button
                        type="button"
                        className="admin-btn admin-btn--ghost"
                        style={{ color: '#1a1a1a', borderColor: 'rgba(0,0,0,0.15)', padding: '4px 8px', fontSize: 13 }}
                        disabled={pending || !next}
                        onClick={() => next && run(() => reorderPhotoAction(photo.id, next.id))}
                      >↓</button>
                      <Link
                        href={`/admin/photos/${photo.id}`}
                        className="admin-btn admin-btn--ghost"
                        style={{ color: '#1a1a1a', borderColor: 'rgba(0,0,0,0.15)', padding: '4px 8px', fontSize: 13 }}
                      >
                        Edit
                      </Link>
                      <button
                        type="button"
                        className="admin-btn admin-btn--danger"
                        style={{ padding: '4px 8px', fontSize: 13 }}
                        disabled={pending}
                        onClick={() => {
                          const label = photo.caption || photo.filename || 'this photo'
                          if (confirm(`Delete "${label}"? The image file will also be permanently deleted.`)) {
                            run(() => deletePhotoAction(photo.id, photo.storagePath))
                          }
                        }}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}
