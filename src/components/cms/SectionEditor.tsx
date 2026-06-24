'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ImageUploader } from './ImageUploader'
import { RichTextField } from './RichTextField'
import {
  newSection,
  SECTION_LABELS,
  type Hero,
  type PageDoc,
  type PageDraftInput,
  type Section,
  type SectionType,
} from '@/lib/content-schema'
import {
  deletePageAction,
  publishPageAction,
  savePageAction,
  unpublishPageAction,
} from '@/app/admin/pages/actions'

type Props = {
  page: PageDoc | null  // null for "create new"
}

const SECTION_TYPES: SectionType[] = ['richText', 'image', 'twoColumn', 'quote', 'callout']

function move<T>(arr: T[], from: number, to: number): T[] {
  if (to < 0 || to >= arr.length) return arr
  const copy = [...arr]
  const [item] = copy.splice(from, 1)
  copy.splice(to, 0, item)
  return copy
}

export function SectionEditor({ page }: Props) {
  const router = useRouter()
  const isNew = page === null
  const [pageId, setPageId] = useState<string | null>(page?.id ?? null)
  const [slug, setSlug] = useState(page?.slug ?? '')
  const [title, setTitle] = useState(page?.title ?? '')
  const [hero, setHero] = useState<Hero>(page?.hero ?? null)
  const [heroAlt, setHeroAlt] = useState(page?.hero?.alt ?? '')
  const [sections, setSections] = useState<Section[]>(page?.sections ?? [])
  const [status, setStatus] = useState(page?.status ?? 'draft')
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  // For uploads we need an id. If creating, save once to mint an id before uploads.
  // Use a placeholder for unsaved pages so the upload path is stable per session.
  const uploadPageId = pageId ?? 'unsaved'

  function updateSection(id: string, patch: Partial<Section>) {
    setSections((prev) =>
      prev.map((s) => (s.id === id ? ({ ...s, ...patch } as Section) : s)),
    )
  }

  async function handleSave(): Promise<string | null> {
    setError(null)
    setMessage(null)
    const input: PageDraftInput = {
      slug: slug.trim(),
      title: title.trim(),
      hero: hero ? { ...hero, alt: heroAlt } : null,
      sections,
    }
    const result = await savePageAction(pageId, input)
    if (!result.ok) {
      setError(result.error)
      return null
    }
    setPageId(result.id)
    setMessage('Saved.')
    if (isNew) router.replace(`/admin/pages/${result.id}`)
    else router.refresh()
    return result.id
  }

  function onSaveClick() {
    startTransition(async () => {
      await handleSave()
    })
  }

  function onPublishClick() {
    startTransition(async () => {
      const id = await handleSave()
      if (!id) return
      const result = await publishPageAction(id)
      if (!result.ok) setError(result.error)
      else {
        setStatus('published')
        setMessage('Published.')
        router.refresh()
      }
    })
  }

  function onUnpublishClick() {
    if (!pageId) return
    startTransition(async () => {
      const result = await unpublishPageAction(pageId)
      if (!result.ok) setError(result.error)
      else {
        setStatus('draft')
        setMessage('Unpublished.')
        router.refresh()
      }
    })
  }

  function onDeleteClick() {
    if (!pageId) return
    if (!window.confirm('Delete this page? This cannot be undone.')) return
    startTransition(async () => {
      const result = await deletePageAction(pageId)
      if (result && !result.ok) setError(result.error)
    })
  }

  return (
    <div>
      <div className="admin-row" style={{ justifyContent: 'space-between', marginBottom: 24 }}>
        <div className="admin-row">
          <Link href="/admin/pages" className="admin-btn admin-btn--ghost" style={{ color: '#1a1a1a', borderColor: 'rgba(0,0,0,0.15)' }}>
            ← Pages
          </Link>
          <span className={`admin-pill admin-pill--${status}`}>{status}</span>
        </div>
        <div className="admin-row">
          {pageId && status === 'draft' && (
            <Link
              href={`/admin/preview/${slug}`}
              target="_blank"
              className="admin-btn admin-btn--ghost"
              style={{ color: '#1a1a1a', borderColor: 'rgba(0,0,0,0.15)' }}
            >
              Preview ↗
            </Link>
          )}
          <button type="button" className="admin-btn" onClick={onSaveClick} disabled={pending}>
            {pending ? 'Saving…' : 'Save draft'}
          </button>
          {status === 'draft' ? (
            <button type="button" className="admin-btn admin-btn--primary" onClick={onPublishClick} disabled={pending}>
              Publish
            </button>
          ) : (
            <button type="button" className="admin-btn admin-btn--ghost" style={{ color: '#1a1a1a', borderColor: 'rgba(0,0,0,0.15)' }} onClick={onUnpublishClick} disabled={pending}>
              Unpublish
            </button>
          )}
          {pageId && (
            <button type="button" className="admin-btn admin-btn--danger" onClick={onDeleteClick} disabled={pending}>
              Delete
            </button>
          )}
        </div>
      </div>

      {error && <div className="admin-card" style={{ borderColor: '#8b1a1a', color: '#8b1a1a' }}>{error}</div>}
      {message && !error && <div className="admin-hint">{message}</div>}

      <div className="admin-card">
        <label className="admin-label">Title</label>
        <input
          className="admin-input"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Page title"
        />

        <label className="admin-label" style={{ marginTop: 16 }}>Slug (URL path)</label>
        <input
          className="admin-input"
          value={slug}
          onChange={(e) => setSlug(e.target.value.toLowerCase())}
          placeholder="e.g. heritage-day-2026"
        />
        <div className="admin-hint">
          The public URL will be <code>/{slug || '…'}</code>. Use lowercase letters, numbers, and dashes. Cannot start with &quot;admin&quot;.
        </div>
      </div>

      <div className="admin-card">
        <ImageUploader
          label="Hero image (optional)"
          pageId={uploadPageId}
          value={hero}
          altValue={heroAlt}
          onAltChange={setHeroAlt}
          onChange={(img) => setHero(img ? { ...img, alt: heroAlt } : null)}
        />
      </div>

      <h2 className="admin-h2">Sections</h2>
      {sections.length === 0 && (
        <div className="admin-empty">No sections yet — add one below.</div>
      )}
      {sections.map((s, i) => (
        <div key={s.id} className="section-block">
          <div className="section-block-header">
            <span className="section-type-pill">{SECTION_LABELS[s.type]}</span>
            <div className="admin-row" style={{ gap: 6 }}>
              <button
                type="button"
                className="admin-btn admin-btn--ghost"
                style={{ color: '#1a1a1a', borderColor: 'rgba(0,0,0,0.15)', padding: '4px 10px' }}
                onClick={() => setSections((prev) => move(prev, i, i - 1))}
                disabled={i === 0}
              >↑</button>
              <button
                type="button"
                className="admin-btn admin-btn--ghost"
                style={{ color: '#1a1a1a', borderColor: 'rgba(0,0,0,0.15)', padding: '4px 10px' }}
                onClick={() => setSections((prev) => move(prev, i, i + 1))}
                disabled={i === sections.length - 1}
              >↓</button>
              <button
                type="button"
                className="admin-btn admin-btn--danger"
                style={{ padding: '4px 10px' }}
                onClick={() => setSections((prev) => prev.filter((x) => x.id !== s.id))}
              >Remove</button>
            </div>
          </div>
          <SectionFields
            section={s}
            uploadPageId={uploadPageId}
            onChange={(patch) => updateSection(s.id, patch)}
          />
        </div>
      ))}

      <div className="admin-card">
        <div className="admin-label">Add a section</div>
        <div className="admin-row">
          {SECTION_TYPES.map((t) => (
            <button
              key={t}
              type="button"
              className="admin-btn admin-btn--ghost"
              style={{ color: '#1a1a1a', borderColor: 'rgba(0,0,0,0.15)' }}
              onClick={() => setSections((prev) => [...prev, newSection(t)])}
            >
              + {SECTION_LABELS[t]}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

function SectionFields({
  section,
  uploadPageId,
  onChange,
}: {
  section: Section
  uploadPageId: string
  onChange: (patch: Partial<Section>) => void
}) {
  switch (section.type) {
    case 'richText':
      return <RichTextField value={section.html} onChange={(html) => onChange({ html } as Partial<Section>)} />
    case 'quote':
      return (
        <div>
          <RichTextField value={section.html} onChange={(html) => onChange({ html } as Partial<Section>)} />
          <label className="admin-label" style={{ marginTop: 12 }}>Attribution (optional)</label>
          <input
            className="admin-input"
            value={section.attribution ?? ''}
            onChange={(e) => onChange({ attribution: e.target.value } as Partial<Section>)}
          />
        </div>
      )
    case 'callout':
      return (
        <div>
          <label className="admin-label">Tone</label>
          <select
            className="admin-input"
            value={section.tone}
            onChange={(e) => onChange({ tone: e.target.value as 'info' | 'donate' } as Partial<Section>)}
          >
            <option value="info">Info</option>
            <option value="donate">Donate</option>
          </select>
          <div style={{ marginTop: 12 }}>
            <RichTextField value={section.html} onChange={(html) => onChange({ html } as Partial<Section>)} />
          </div>
        </div>
      )
    case 'twoColumn':
      return (
        <div className="cms-twocol">
          <div>
            <label className="admin-label">Left column</label>
            <RichTextField value={section.leftHtml} onChange={(html) => onChange({ leftHtml: html } as Partial<Section>)} />
          </div>
          <div>
            <label className="admin-label">Right column</label>
            <RichTextField value={section.rightHtml} onChange={(html) => onChange({ rightHtml: html } as Partial<Section>)} />
          </div>
        </div>
      )
    case 'image':
      return (
        <div>
          <ImageUploader
            pageId={uploadPageId}
            value={section.storagePath ? section : null}
            altValue={section.alt}
            onAltChange={(alt) => onChange({ alt } as Partial<Section>)}
            onChange={(img) => {
              if (!img) {
                onChange({ storagePath: '', downloadUrl: '' } as Partial<Section>)
              } else {
                onChange({ storagePath: img.storagePath, downloadUrl: img.downloadUrl } as Partial<Section>)
              }
            }}
          />
          <label className="admin-label" style={{ marginTop: 12 }}>Caption (optional)</label>
          <input
            className="admin-input"
            value={section.caption ?? ''}
            onChange={(e) => onChange({ caption: e.target.value } as Partial<Section>)}
          />
        </div>
      )
    case 'gallery':
      return (
        <div className="admin-hint">
          Gallery is not yet editable in v1 — coming with the photo management UI.
        </div>
      )
  }
}
