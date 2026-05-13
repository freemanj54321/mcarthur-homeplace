'use client'

import { useState, useEffect } from 'react'

export function DesignOptionsButton() {
  const [panelOpen, setPanelOpen] = useState(false)

  useEffect(() => {
    const onMsg = (e: MessageEvent) => {
      const ty = (e?.data as { type?: string })?.type
      if (ty === '__activate_edit_mode') setPanelOpen(true)
      else if (ty === '__deactivate_edit_mode' || ty === '__edit_mode_dismissed') setPanelOpen(false)
    }
    window.addEventListener('message', onMsg)
    return () => window.removeEventListener('message', onMsg)
  }, [])

  if (panelOpen) return null

  return (
    <button
      onClick={() => window.postMessage({ type: '__activate_edit_mode' }, '*')}
      aria-label="Open design options"
      style={{
        position: 'fixed', right: 18, bottom: 18, zIndex: 2147483645,
        background: 'var(--tartan-gold)', color: 'var(--tartan-ink)',
        border: '1.5px solid var(--tartan-ink)',
        padding: '12px 18px',
        fontFamily: 'var(--f-body)', fontSize: 12,
        letterSpacing: '0.14em', textTransform: 'uppercase', fontWeight: 700,
        cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 10,
        boxShadow: '4px 4px 0 var(--tartan-green), 0 8px 24px rgba(0,0,0,0.18)',
        transition: 'transform 0.15s',
      }}
      onMouseEnter={(e) => { e.currentTarget.style.transform = 'translate(-1px, -1px)' }}
      onMouseLeave={(e) => { e.currentTarget.style.transform = 'translate(0, 0)' }}
    >
      <span style={{ width: 8, height: 8, background: 'var(--tartan-ink)', display: 'inline-block' }} />
      Design Options
    </button>
  )
}
