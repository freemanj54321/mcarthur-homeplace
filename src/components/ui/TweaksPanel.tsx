'use client'

import { useState, useEffect, useRef, useCallback, ReactNode } from 'react'
import { useTweaks, HeroVariant, ColorMode, CardLayout, TypePair, TartanLevel, DonateStyle } from '@/context/TweaksContext'

const STYLE = `
.twk-panel{position:fixed;right:16px;bottom:16px;z-index:2147483646;width:280px;
  max-height:calc(100vh - 32px);display:flex;flex-direction:column;
  background:rgba(250,249,247,.88);color:#29261b;
  -webkit-backdrop-filter:blur(24px) saturate(160%);backdrop-filter:blur(24px) saturate(160%);
  border:.5px solid rgba(255,255,255,.6);border-radius:14px;
  box-shadow:0 1px 0 rgba(255,255,255,.5) inset,0 12px 40px rgba(0,0,0,.18);
  font:11.5px/1.4 ui-sans-serif,system-ui,-apple-system,sans-serif;overflow:hidden}
.twk-hd{display:flex;align-items:center;justify-content:space-between;
  padding:10px 8px 10px 14px;cursor:move;user-select:none;border-bottom:.5px solid rgba(0,0,0,.08)}
.twk-hd b{font-size:12px;font-weight:600}
.twk-x{appearance:none;border:0;background:transparent;color:rgba(41,38,27,.55);
  width:22px;height:22px;border-radius:6px;cursor:pointer;font-size:13px;line-height:1}
.twk-x:hover{background:rgba(0,0,0,.06);color:#29261b}
.twk-body{padding:8px 14px 14px;display:flex;flex-direction:column;gap:10px;
  overflow-y:auto;overflow-x:hidden;min-height:0}
.twk-sect{font-size:10px;font-weight:600;letter-spacing:.06em;text-transform:uppercase;
  color:rgba(41,38,27,.45);padding:8px 0 0}
.twk-row{display:flex;flex-direction:column;gap:5px}
.twk-lbl{font-size:11px;font-weight:500;color:rgba(41,38,27,.7)}
.twk-seg{position:relative;display:flex;padding:2px;border-radius:8px;
  background:rgba(0,0,0,.06);user-select:none}
.twk-seg-thumb{position:absolute;top:2px;bottom:2px;border-radius:6px;
  background:rgba(255,255,255,.9);box-shadow:0 1px 2px rgba(0,0,0,.12);
  transition:left .15s cubic-bezier(.3,.7,.4,1),width .15s}
.twk-seg button{position:relative;z-index:1;flex:1;border:0;background:transparent;
  color:inherit;font:inherit;font-weight:500;min-height:22px;border-radius:6px;
  cursor:pointer;padding:4px 6px;line-height:1.2}
.twk-field{appearance:none;width:100%;height:26px;padding:0 8px;
  border:.5px solid rgba(0,0,0,.1);border-radius:7px;
  background:rgba(255,255,255,.6);color:inherit;font:inherit;outline:none}
select.twk-field{padding-right:22px;background-image:url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='10' height='6' viewBox='0 0 10 6'><path fill='rgba(0,0,0,.5)' d='M0 0h10L5 6z'/></svg>");background-repeat:no-repeat;background-position:right 8px center}
`

interface Opt { value: string; label: string }

function Seg({ value, onChange, options }: { value: string; onChange: (v: string) => void; options: Opt[] }) {
  const n = options.length
  const idx = Math.max(0, options.findIndex((o) => o.value === value))
  return (
    <div className="twk-seg">
      <div className="twk-seg-thumb" style={{ left: `calc(2px + ${idx} * (100% - 4px) / ${n})`, width: `calc((100% - 4px) / ${n})` }} />
      {options.map((o) => (
        <button key={o.value} type="button" onClick={() => onChange(o.value)} aria-pressed={o.value === value}>
          {o.label}
        </button>
      ))}
    </div>
  )
}

function Sel({ value, onChange, options }: { value: string; onChange: (v: string) => void; options: Opt[] }) {
  return (
    <select className="twk-field" value={value} onChange={(e) => onChange(e.target.value)}>
      {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  )
}

function Section({ label, children }: { label: string; children: ReactNode }) {
  return <><div className="twk-sect">{label}</div>{children}</>
}

function Row({ label, children }: { label: string; children: ReactNode }) {
  return <div className="twk-row"><div className="twk-lbl">{label}</div>{children}</div>
}

export function TweaksPanel() {
  const [open, setOpen] = useState(false)
  const { tweaks, setTweak } = useTweaks()
  const dragRef = useRef<HTMLDivElement>(null)
  const offsetRef = useRef({ x: 16, y: 16 })
  const PAD = 16

  useEffect(() => {
    const onMsg = (e: MessageEvent) => {
      const ty = (e?.data as { type?: string })?.type
      if (ty === '__activate_edit_mode') setOpen(true)
      else if (ty === '__deactivate_edit_mode') setOpen(false)
    }
    window.addEventListener('message', onMsg)
    return () => window.removeEventListener('message', onMsg)
  }, [])

  const clamp = useCallback(() => {
    const panel = dragRef.current
    if (!panel) return
    const w = panel.offsetWidth, h = panel.offsetHeight
    offsetRef.current = {
      x: Math.min(Math.max(PAD, window.innerWidth - w - PAD), Math.max(PAD, offsetRef.current.x)),
      y: Math.min(Math.max(PAD, window.innerHeight - h - PAD), Math.max(PAD, offsetRef.current.y)),
    }
    panel.style.right  = offsetRef.current.x + 'px'
    panel.style.bottom = offsetRef.current.y + 'px'
  }, [])

  useEffect(() => { if (open) { clamp(); window.addEventListener('resize', clamp); return () => window.removeEventListener('resize', clamp) } }, [open, clamp])

  const onDragStart = (e: React.MouseEvent) => {
    const panel = dragRef.current; if (!panel) return
    const r = panel.getBoundingClientRect()
    const sx = e.clientX, sy = e.clientY
    const startRight = window.innerWidth - r.right, startBottom = window.innerHeight - r.bottom
    const move = (ev: MouseEvent) => {
      offsetRef.current = { x: startRight - (ev.clientX - sx), y: startBottom - (ev.clientY - sy) }
      clamp()
    }
    const up = () => { window.removeEventListener('mousemove', move); window.removeEventListener('mouseup', up) }
    window.addEventListener('mousemove', move); window.addEventListener('mouseup', up)
  }

  const dismiss = () => {
    setOpen(false)
    window.postMessage({ type: '__edit_mode_dismissed' }, '*')
  }

  if (!open) return null

  return (
    <>
      <style>{STYLE}</style>
      <div ref={dragRef} className="twk-panel">
        <div className="twk-hd" onMouseDown={onDragStart}>
          <b>Design Options</b>
          <button className="twk-x" aria-label="Close" onMouseDown={(e) => e.stopPropagation()} onClick={dismiss}>✕</button>
        </div>
        <div className="twk-body">
          <Section label="Hero treatment">
            <Row label="Opening scene">
              <Seg value={tweaks.hero} onChange={(v) => setTweak('hero', v as HeroVariant)}
                options={[{ value: 'photo', label: 'Photo' }, { value: 'collage', label: 'Album' }, { value: 'typographic', label: 'Letter' }]} />
            </Row>
          </Section>
          <Section label="Color mode">
            <Row label="Theme">
              <Seg value={tweaks.mode} onChange={(v) => setTweak('mode', v as ColorMode)}
                options={[{ value: 'day', label: 'Parchment' }, { value: 'dark', label: 'Dark' }]} />
            </Row>
          </Section>
          <Section label="Type pairing">
            <Row label="Font pair">
              <Sel value={tweaks.typepair} onChange={(v) => setTweak('typepair', v as TypePair)}
                options={[
                  { value: 'A', label: 'Fraunces + Inter (editorial)' },
                  { value: 'B', label: 'Playfair + Work Sans (classical)' },
                  { value: 'C', label: 'Cormorant + Manrope (refined)' },
                ]} />
            </Row>
          </Section>
          <Section label="Tartan intensity">
            <Row label="Pattern">
              <Seg value={tweaks.tartan} onChange={(v) => setTweak('tartan', v as TartanLevel)}
                options={[{ value: 'subtle', label: 'Subtle' }, { value: 'medium', label: 'Medium' }, { value: 'bold', label: 'Bold' }]} />
            </Row>
          </Section>
          <Section label="Project card layout">
            <Row label="Style">
              <Sel value={tweaks.cardLayout} onChange={(v) => setTweak('cardLayout', v as CardLayout)}
                options={[
                  { value: 'classic', label: 'Classic — photo above' },
                  { value: 'split', label: 'Editorial split row' },
                  { value: 'overlay', label: 'Magazine overlay' },
                ]} />
            </Row>
          </Section>
          <Section label="Donate CTA">
            <Row label="Style">
              <Sel value={tweaks.donateStyle} onChange={(v) => setTweak('donateStyle', v as DonateStyle)}
                options={[
                  { value: 'quiet', label: 'Quiet — inline divider' },
                  { value: 'banner', label: 'Banner — navy strip' },
                  { value: 'sticker', label: 'Sticker — gold seal' },
                ]} />
            </Row>
          </Section>
        </div>
      </div>
    </>
  )
}
