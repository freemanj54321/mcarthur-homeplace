'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { ImageUploader } from '@/components/cms/ImageUploader'
import { PHOTO_CATEGORIES, type PhotoCategory, type PhotoRecord } from '@/lib/photos'
import { savePhotoAction } from '@/app/admin/photos/actions'

type ImageState = { storagePath: string; downloadUrl: string } | null

export function PhotoForm({
  initial,
  projectSlugs,
}: {
  initial: PhotoRecord | null
  projectSlugs: string[]
}) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const [image, setImage] = useState<ImageState>(
    initial ? { storagePath: initial.storagePath, downloadUrl: initial.downloadUrl } : null,
  )
  const [filename, setFilename] = useState(initial?.filename ?? '')
  const [caption, setCaption] = useState(initial?.caption ?? '')
  const [altText, setAltText] = useState(initial?.altText ?? '')
  const [project, setProject] = useState(initial?.project ?? '')
  const [category, setCategory] = useState<PhotoCategory>(initial?.category ?? 'exterior')
  const [featured, setFeatured] = useState(initial?.featured ?? false)
  const [order, setOrder] = useState(String(initial?.order ?? 0))
  const [dateTaken, setDateTaken] = useState(initial?.dateTaken ?? '')

  function onImageChange(img: (ImageState & { filename?: string }) | null) {
    setImage(img)
    if (img?.filename && !filename) setFilename(img.filename)
  }

  function onSave() {
    if (!image) {
      setError('Please upload an image first.')
      return
    }
    setError(null)
    startTransition(async () => {
      const result = await savePhotoAction(initial?.id ?? null, {
        filename,
        storagePath: image.storagePath,
        downloadUrl: image.downloadUrl,
        caption,
        altText,
        project: project || null,
        category,
        featured,
        order: parseInt(order, 10) || 0,
        dateTaken,
      })
      if (!result.ok) {
        setError(result.error)
        return
      }
      if (initial) {
        router.refresh()
      } else {
        router.push(`/admin/photos/${result.id}`)
      }
    })
  }

  return (
    <div>
      <div className="admin-row" style={{ justifyContent: 'space-between', marginBottom: 16 }}>
        <h1 className="admin-h1">{initial ? 'Edit photo' : 'Upload photo'}</h1>
        <button
          type="button"
          className="admin-btn admin-btn--ghost"
          style={{ color: '#1a1a1a', borderColor: 'rgba(0,0,0,0.15)' }}
          onClick={() => router.push('/admin/photos')}
        >
          ← Back
        </button>
      </div>

      {error && (
        <div className="admin-card" style={{ borderColor: '#8b1a1a', color: '#8b1a1a', marginBottom: 16 }}>
          {error}
        </div>
      )}

      <div className="admin-card">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <ImageUploader
            pathPrefix="photos"
            label="Photo"
            value={image ? { ...image, alt: altText } : null}
            altValue={altText}
            onAltChange={setAltText}
            onChange={onImageChange}
          />

          <div>
            <label className="admin-label">Caption</label>
            <input
              className="admin-input"
              value={caption}
              placeholder="Short descriptive caption"
              onChange={(e) => setCaption(e.target.value)}
            />
          </div>

          <div>
            <label className="admin-label">Property</label>
            <select
              className="admin-input"
              value={project}
              onChange={(e) => setProject(e.target.value)}
            >
              <option value="">— None —</option>
              {projectSlugs.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="admin-label">Category</label>
            <select
              className="admin-input"
              value={category}
              onChange={(e) => setCategory(e.target.value as PhotoCategory)}
            >
              {PHOTO_CATEGORIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="admin-label">Date taken</label>
            <input
              className="admin-input"
              type="date"
              value={dateTaken}
              onChange={(e) => setDateTaken(e.target.value)}
            />
          </div>

          <div>
            <label className="admin-label">Order</label>
            <input
              className="admin-input"
              type="number"
              value={order}
              style={{ width: 100 }}
              onChange={(e) => setOrder(e.target.value)}
            />
            <p className="admin-hint">Lower numbers appear first within a property gallery.</p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <input
              id="photo-featured"
              type="checkbox"
              checked={featured}
              onChange={(e) => setFeatured(e.target.checked)}
            />
            <label htmlFor="photo-featured" className="admin-label" style={{ margin: 0 }}>
              Featured (eligible for home page spotlight)
            </label>
          </div>
        </div>
      </div>

      <div className="admin-row" style={{ marginTop: 16 }}>
        <button
          type="button"
          className="admin-btn admin-btn--primary"
          onClick={onSave}
          disabled={pending}
        >
          {pending ? 'Saving…' : initial ? 'Save' : 'Upload'}
        </button>
      </div>
    </div>
  )
}
