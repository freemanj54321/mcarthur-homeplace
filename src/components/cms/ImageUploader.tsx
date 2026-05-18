'use client'

import { useRef, useState } from 'react'
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage'
import { storage } from '@/lib/firebase'

export type UploadedImage = {
  storagePath: string
  downloadUrl: string
}

type Props = {
  pageId: string
  value: { storagePath: string; downloadUrl: string; alt?: string } | null
  onChange: (image: UploadedImage | null) => void
  altValue?: string
  onAltChange?: (alt: string) => void
  label?: string
}

export function ImageUploader({ pageId, value, onChange, altValue, onAltChange, label = 'Image' }: Props) {
  const fileRef = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleFile(file: File) {
    setBusy(true)
    setError(null)
    try {
      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
      const storagePath = `pages/${pageId}/${crypto.randomUUID()}-${safeName}`
      const storageRef = ref(storage, storagePath)
      await uploadBytes(storageRef, file, { contentType: file.type })
      const downloadUrl = await getDownloadURL(storageRef)
      onChange({ storagePath, downloadUrl })
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Upload failed')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div>
      <div className="admin-label">{label}</div>
      {value?.downloadUrl ? (
        <div className="admin-card" style={{ padding: 12 }}>
          {/* preview uses plain img to avoid Next.js remote-pattern lookups during upload */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={value.downloadUrl}
            alt={altValue ?? ''}
            style={{ maxWidth: '100%', maxHeight: 240, display: 'block', marginBottom: 12 }}
          />
          {onAltChange && (
            <input
              className="admin-input"
              placeholder="Alt text (describe the image)"
              value={altValue ?? ''}
              onChange={(e) => onAltChange(e.target.value)}
            />
          )}
          <div className="admin-row" style={{ marginTop: 8 }}>
            <button
              type="button"
              className="admin-btn admin-btn--ghost"
              style={{ color: '#1a1a1a', borderColor: 'rgba(0,0,0,0.15)' }}
              onClick={() => fileRef.current?.click()}
              disabled={busy}
            >
              Replace
            </button>
            <button
              type="button"
              className="admin-btn admin-btn--danger"
              onClick={() => onChange(null)}
              disabled={busy}
            >
              Remove
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          className="admin-btn admin-btn--ghost"
          style={{ color: '#1a1a1a', borderColor: 'rgba(0,0,0,0.15)' }}
          onClick={() => fileRef.current?.click()}
          disabled={busy}
        >
          {busy ? 'Uploading…' : 'Choose image'}
        </button>
      )}
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        hidden
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) handleFile(file)
          e.target.value = ''
        }}
      />
      {error && <div className="admin-error">{error}</div>}
    </div>
  )
}
