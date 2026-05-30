'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { ImageUploader } from '@/components/cms/ImageUploader'
import {
  emptyValues,
  type CollectionMeta,
  type FieldSpec,
} from '@/lib/cms/structuredFields'
import { saveStructuredAction } from '@/app/admin/structured/actions'

type ContentImage = { storagePath: string; downloadUrl: string; alt: string; caption?: string }
type Feature = { label: string; body: string }
type Values = Record<string, unknown>

function move<T>(arr: T[], from: number, to: number): T[] {
  if (to < 0 || to >= arr.length) return arr
  const next = [...arr]
  const [item] = next.splice(from, 1)
  next.splice(to, 0, item)
  return next
}

// ── Sub-editors ──────────────────────────────────────────────────────────────

function ImageListEditor({
  images,
  pathPrefix,
  onChange,
}: {
  images: ContentImage[]
  pathPrefix: string
  onChange: (next: ContentImage[]) => void
}) {
  return (
    <div>
      {images.map((im, i) => (
        <div key={i} className="admin-card" style={{ padding: 12 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={im.downloadUrl} alt={im.alt} style={{ maxWidth: '100%', maxHeight: 180, display: 'block', marginBottom: 8 }} />
          <input
            className="admin-input"
            placeholder="Alt text"
            value={im.alt}
            onChange={(e) => onChange(images.map((x, j) => (j === i ? { ...x, alt: e.target.value } : x)))}
          />
          <input
            className="admin-input"
            style={{ marginTop: 6 }}
            placeholder="Caption (optional)"
            value={im.caption ?? ''}
            onChange={(e) => onChange(images.map((x, j) => (j === i ? { ...x, caption: e.target.value } : x)))}
          />
          <div className="admin-row" style={{ marginTop: 8 }}>
            <button type="button" className="admin-btn admin-btn--ghost" style={{ color: '#1a1a1a', borderColor: 'rgba(0,0,0,0.15)', padding: '6px 10px' }} onClick={() => onChange(move(images, i, i - 1))} disabled={i === 0}>↑</button>
            <button type="button" className="admin-btn admin-btn--ghost" style={{ color: '#1a1a1a', borderColor: 'rgba(0,0,0,0.15)', padding: '6px 10px' }} onClick={() => onChange(move(images, i, i + 1))} disabled={i === images.length - 1}>↓</button>
            <button type="button" className="admin-btn admin-btn--danger" style={{ padding: '6px 10px' }} onClick={() => onChange(images.filter((_, j) => j !== i))}>Remove</button>
          </div>
        </div>
      ))}
      <ImageUploader
        pathPrefix={pathPrefix}
        value={null}
        label="Add image"
        onChange={(img) => {
          if (img) onChange([...images, { storagePath: img.storagePath, downloadUrl: img.downloadUrl, alt: '' }])
        }}
      />
    </div>
  )
}

function FeatureListEditor({
  features,
  onChange,
}: {
  features: Feature[]
  onChange: (next: Feature[]) => void
}) {
  return (
    <div>
      {features.map((f, i) => (
        <div key={i} className="admin-card" style={{ padding: 12 }}>
          <input
            className="admin-input"
            placeholder="Feature label"
            value={f.label}
            onChange={(e) => onChange(features.map((x, j) => (j === i ? { ...x, label: e.target.value } : x)))}
          />
          <textarea
            className="admin-textarea"
            style={{ marginTop: 6 }}
            placeholder="Feature body"
            value={f.body}
            onChange={(e) => onChange(features.map((x, j) => (j === i ? { ...x, body: e.target.value } : x)))}
          />
          <div className="admin-row" style={{ marginTop: 8 }}>
            <button type="button" className="admin-btn admin-btn--ghost" style={{ color: '#1a1a1a', borderColor: 'rgba(0,0,0,0.15)', padding: '6px 10px' }} onClick={() => onChange(move(features, i, i - 1))} disabled={i === 0}>↑</button>
            <button type="button" className="admin-btn admin-btn--ghost" style={{ color: '#1a1a1a', borderColor: 'rgba(0,0,0,0.15)', padding: '6px 10px' }} onClick={() => onChange(move(features, i, i + 1))} disabled={i === features.length - 1}>↓</button>
            <button type="button" className="admin-btn admin-btn--danger" style={{ padding: '6px 10px' }} onClick={() => onChange(features.filter((_, j) => j !== i))}>Remove</button>
          </div>
        </div>
      ))}
      <button
        type="button"
        className="admin-btn admin-btn--ghost"
        style={{ color: '#1a1a1a', borderColor: 'rgba(0,0,0,0.15)' }}
        onClick={() => onChange([...features, { label: '', body: '' }])}
      >+ Add feature</button>
    </div>
  )
}

// ── Field renderer ─────────────────────────────────────────────────────────

function Field({
  spec,
  value,
  pathPrefix,
  onChange,
}: {
  spec: FieldSpec
  value: unknown
  pathPrefix: string
  onChange: (v: unknown) => void
}) {
  if (spec.kind === 'image') {
    const img = value as ContentImage | null
    return (
      <ImageUploader
        pathPrefix={pathPrefix}
        label={spec.label}
        value={img}
        altValue={img?.alt ?? ''}
        onAltChange={(alt) => onChange(img ? { ...img, alt } : img)}
        onChange={(next) => onChange(next ? { storagePath: next.storagePath, downloadUrl: next.downloadUrl, alt: img?.alt ?? '' } : null)}
      />
    )
  }
  if (spec.kind === 'imageList') {
    return (
      <div>
        <div className="admin-label">{spec.label}</div>
        <ImageListEditor images={(value as ContentImage[]) ?? []} pathPrefix={pathPrefix} onChange={onChange} />
      </div>
    )
  }
  if (spec.kind === 'featureList') {
    return (
      <div>
        <div className="admin-label">{spec.label}</div>
        <FeatureListEditor features={(value as Feature[]) ?? []} onChange={onChange} />
      </div>
    )
  }
  const str = (value as string) ?? ''
  return (
    <div>
      <label className="admin-label">{spec.label}</label>
      {spec.kind === 'textarea' ? (
        <textarea className="admin-textarea" value={str} placeholder={spec.placeholder} onChange={(e) => onChange(e.target.value)} />
      ) : (
        <input
          className="admin-input"
          type={spec.kind === 'date' ? 'date' : 'text'}
          value={str}
          placeholder={spec.placeholder}
          onChange={(e) => onChange(e.target.value)}
        />
      )}
    </div>
  )
}

// ── Form ─────────────────────────────────────────────────────────────────────

export function StructuredForm({
  collection,
  meta,
  initial,
}: {
  collection: string
  meta: CollectionMeta
  initial: (Record<string, unknown> & { id: string }) | null
}) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [draftId] = useState(() => crypto.randomUUID())

  const [values, setValues] = useState<Values>(() => {
    const base = emptyValues(meta)
    if (initial) {
      for (const f of meta.fields) {
        if (initial[f.name] !== undefined) base[f.name] = initial[f.name]
      }
    }
    return base
  })

  const docId = initial?.id ?? null
  const pathPrefix = `content/${collection}/${docId ?? `draft-${draftId}`}`

  function setField(name: string, v: unknown) {
    setValues((prev) => ({ ...prev, [name]: v }))
  }

  function onSave() {
    setError(null)
    startTransition(async () => {
      const result = await saveStructuredAction(collection, docId, values)
      if (!result.ok) {
        setError(result.error)
        return
      }
      if (docId) {
        router.refresh()
      } else {
        router.push(`/admin/structured/${collection}/${result.id}`)
      }
    })
  }

  return (
    <div>
      <div className="admin-row" style={{ justifyContent: 'space-between', marginBottom: 16 }}>
        <h1 className="admin-h1">{docId ? `Edit ${meta.singular.toLowerCase()}` : `New ${meta.singular.toLowerCase()}`}</h1>
        <button type="button" className="admin-btn admin-btn--ghost" style={{ color: '#1a1a1a', borderColor: 'rgba(0,0,0,0.15)' }} onClick={() => router.push(`/admin/structured/${collection}`)}>← Back</button>
      </div>

      {error && <div className="admin-card" style={{ borderColor: '#8b1a1a', color: '#8b1a1a' }}>{error}</div>}

      <div className="admin-card">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {meta.fields.map((f) => (
            <Field
              key={f.name}
              spec={f}
              value={values[f.name]}
              pathPrefix={pathPrefix}
              onChange={(v) => setField(f.name, v)}
            />
          ))}
        </div>
      </div>

      <div className="admin-row" style={{ marginTop: 16 }}>
        <button type="button" className="admin-btn admin-btn--primary" onClick={onSave} disabled={pending}>
          {pending ? 'Saving…' : docId ? 'Save' : 'Create draft'}
        </button>
      </div>
      {!docId && <p className="admin-hint">New records are saved as drafts. Publish from the list once you&apos;re happy with it.</p>}
    </div>
  )
}
