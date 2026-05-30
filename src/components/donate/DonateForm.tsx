'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { TartanRule } from '@/components/ui/TartanRule'
import { SectionHead } from '@/components/ui/SectionHead'

// ── Types ──────────────────────────────────────────────────────────────────
type Frequency   = 'once' | 'monthly'
type Designation = string
export type DonateProjectOption = { slug: string; title: string }

interface DonorInfo { name: string; email: string; anonymous: boolean; dedicate: string }

// ── Stepper ────────────────────────────────────────────────────────────────
const STEPS = ['Amount', 'Designation', 'Your details', 'Review', 'Done']

function Stepper({ step }: { step: number }) {
  return (
    <>
      <div
        aria-live="polite"
        aria-atomic="true"
        style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0,0,0,0)', whiteSpace: 'nowrap' }}
      >
        Step {step + 1} of {STEPS.length}: {STEPS[step]}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: `repeat(${STEPS.length}, 1fr)`, gap: 4 }}>
        {STEPS.map((s, i) => (
          <div key={s} style={{ paddingTop: 12, borderTop: `2px solid ${i <= step ? 'var(--c-accent)' : 'var(--c-line)'}` }}>
            <div className="dateline" style={{ color: i <= step ? 'var(--c-text)' : 'var(--c-text-muted)' }}>0{i + 1}</div>
            <div style={{ fontSize: 14, fontWeight: i === step ? 600 : 400, marginTop: 4 }}>{s}</div>
          </div>
        ))}
      </div>
    </>
  )
}

// ── Step 1: Amount ─────────────────────────────────────────────────────────
const PRESETS = [50, 100, 250, 500, 1000, 5000]

function StepAmount({ amount, setAmount, custom, setCustom, frequency, setFrequency, onNext }: {
  amount: number; setAmount: (v: number) => void
  custom: string; setCustom: (v: string) => void
  frequency: Frequency; setFrequency: (v: Frequency) => void
  onNext: () => void
}) {
  return (
    <div>
      <h2 className="h-card" style={{ fontSize: 26 }}>Choose an amount</h2>
      <div style={{ display: 'flex', gap: 4, marginTop: 24, background: 'var(--c-bg-alt)', padding: 4, width: 'fit-content' }}>
        {(['once', 'monthly'] as Frequency[]).map((f) => (
          <button key={f} onClick={() => setFrequency(f)} style={{ padding: '10px 20px', background: frequency === f ? 'var(--c-surface)' : 'transparent', border: 'none', color: 'var(--c-text)', fontFamily: 'var(--f-body)', fontWeight: frequency === f ? 600 : 400, fontSize: 14 }}>
            {f === 'once' ? 'One-time' : 'Monthly'}
          </button>
        ))}
      </div>
      <div style={{ marginTop: 28, display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
        {PRESETS.map((p) => (
          <button key={p} onClick={() => { setAmount(p); setCustom('') }} style={{ padding: '20px 12px', fontFamily: 'var(--f-display)', fontSize: 24, fontVariantNumeric: 'tabular-nums', background: amount === p && !custom ? 'var(--c-primary)' : 'transparent', color: amount === p && !custom ? 'var(--c-primary-ink)' : 'var(--c-text)', border: `1px solid ${amount === p && !custom ? 'var(--c-primary)' : 'var(--c-line)'}`, transition: 'all 0.15s' }}>
            ${p.toLocaleString()}
          </button>
        ))}
      </div>
      <div style={{ marginTop: 18 }}>
        <label className="dateline" style={{ display: 'block', marginBottom: 10 }}>Or enter your own</label>
        <div style={{ display: 'flex', alignItems: 'center', borderBottom: '1.5px solid var(--c-text)', paddingBottom: 8 }}>
          <span style={{ fontSize: 28, fontFamily: 'var(--f-display)' }}>$</span>
          <input type="number" value={custom} onChange={(e) => setCustom(e.target.value)} placeholder="0" style={{ flex: 1, border: 'none', background: 'transparent', fontSize: 28, fontFamily: 'var(--f-display)', fontVariantNumeric: 'tabular-nums', padding: '4px 8px', color: 'var(--c-text)' }} />
        </div>
      </div>
      {(() => {
        const canContinue = (custom ? parseFloat(custom) || 0 : amount) > 0
        return (
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 32 }}>
            <button onClick={onNext} disabled={!canContinue} className="btn btn-primary btn-lg" style={{ opacity: canContinue ? 1 : 0.4, cursor: canContinue ? 'pointer' : 'not-allowed' }}>
              Continue <span className="arrow">→</span>
            </button>
          </div>
        )
      })()}
    </div>
  )
}

// ── Step 2: Designation ────────────────────────────────────────────────────
function StepDesignation({ designation, setDesignation, projects, onBack, onNext }: {
  designation: Designation; setDesignation: (v: Designation) => void
  projects: DonateProjectOption[]
  onBack: () => void; onNext: () => void
}) {
  const opts = [
    { id: 'match',       name: 'The 2026 Match Campaign',   desc: 'General fund — directed where most needed (recommended).' },
    ...projects.map((p) => ({ id: p.slug, name: p.title,   desc: 'Restricted to this restoration project.' })),
    { id: 'maintenance', name: 'Long-Term Care Endowment',  desc: 'Preserves the buildings after restoration is complete.' },
  ]
  return (
    <div>
      <h2 className="h-card" style={{ fontSize: 26 }}>Where should it go?</h2>
      <p className="muted" style={{ marginTop: 8, fontSize: 14 }}>You can split a gift later by giving multiple times.</p>
      <div style={{ marginTop: 24, display: 'flex', flexDirection: 'column', gap: 10 }}>
        {opts.map((o) => (
          <label key={o.id} style={{ display: 'grid', gridTemplateColumns: '24px 1fr', gap: 14, padding: '18px 20px', border: `1px solid ${designation === o.id ? 'var(--c-primary)' : 'var(--c-line)'}`, background: designation === o.id ? 'var(--c-line-soft)' : 'transparent', cursor: 'pointer', alignItems: 'baseline' }}>
            <input type="radio" name="dst" value={o.id} checked={designation === o.id} onChange={() => setDesignation(o.id)} style={{ accentColor: 'var(--c-primary)' }} />
            <div>
              <div style={{ fontFamily: 'var(--f-display)', fontSize: 18, fontWeight: 500 }}>{o.name}</div>
              <div className="muted" style={{ fontSize: 13, marginTop: 4 }}>{o.desc}</div>
            </div>
          </label>
        ))}
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 32 }}>
        <button onClick={onBack} className="btn btn-ghost">← Back</button>
        <button onClick={onNext} className="btn btn-primary btn-lg">Continue <span className="arrow">→</span></button>
      </div>
    </div>
  )
}

// ── Step 3: Info ───────────────────────────────────────────────────────────
function Field({ label, type = 'text', value, onChange, placeholder }: { label: string; type?: string; value: string; onChange: (v: string) => void; placeholder: string }) {
  return (
    <label style={{ display: 'block' }}>
      <span className="dateline" style={{ display: 'block', marginBottom: 8 }}>{label}</span>
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} style={{ width: '100%', padding: '12px 0', border: 'none', borderBottom: '1.5px solid var(--c-line)', background: 'transparent', fontFamily: 'var(--f-body)', fontSize: 16, color: 'var(--c-text)' }} />
    </label>
  )
}

function StepInfo({ info, setInfo, onBack, onNext }: { info: DonorInfo; setInfo: (v: DonorInfo) => void; onBack: () => void; onNext: () => void }) {
  const valid = info.name.length > 1 && /\S+@\S+\.\S+/.test(info.email)
  return (
    <div>
      <h2 className="h-card" style={{ fontSize: 26 }}>Your details</h2>
      <div style={{ marginTop: 32, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
        <Field label="Full name"  value={info.name}  onChange={(v) => setInfo({ ...info, name: v })}  placeholder="Jane McArthur Hill" />
        <Field label="Email" type="email" value={info.email} onChange={(v) => setInfo({ ...info, email: v })} placeholder="jane@example.com" />
      </div>
      <div style={{ marginTop: 24 }}>
        <Field label="In honor or memory of (optional)" value={info.dedicate} onChange={(v) => setInfo({ ...info, dedicate: v })} placeholder="In memory of Ruby M. Pearce" />
      </div>
      <label style={{ display: 'flex', gap: 10, marginTop: 28, alignItems: 'center', fontSize: 14 }}>
        <input type="checkbox" checked={info.anonymous} onChange={(e) => setInfo({ ...info, anonymous: e.target.checked })} style={{ accentColor: 'var(--c-primary)' }} />
        Make this gift anonymous on the donor list.
      </label>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 32 }}>
        <button onClick={onBack} className="btn btn-ghost">← Back</button>
        <button onClick={onNext} disabled={!valid} className="btn btn-primary btn-lg" style={{ opacity: valid ? 1 : 0.4, cursor: valid ? 'pointer' : 'not-allowed' }}>
          Review gift <span className="arrow">→</span>
        </button>
      </div>
    </div>
  )
}

// ── Step 4: Review ─────────────────────────────────────────────────────────
function Row({ k, v }: { k: string; v: string }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '160px 1fr', gap: 16, padding: '14px 0', borderBottom: '1px solid var(--c-line-soft)' }}>
      <span className="dateline">{k}</span>
      <span style={{ fontSize: 16 }}>{v}</span>
    </div>
  )
}

function StepReview({ amount, matched, frequency, designation, info, onBack, onConfirm }: { amount: number; matched: number; frequency: Frequency; designation: string; info: DonorInfo; onBack: () => void; onConfirm: () => void }) {
  return (
    <div>
      <h2 className="h-card" style={{ fontSize: 26 }}>Review your gift</h2>
      <div style={{ marginTop: 24 }}>
        <Row k="Amount"      v={`$${amount.toLocaleString()}${frequency === 'monthly' ? ' /month' : ''}`} />
        <Row k="Match impact" v={`Doubled to $${matched.toLocaleString()} via the State Historical Commission match.`} />
        <Row k="Direction"   v={designation} />
        <Row k="Donor"       v={info.anonymous ? 'Anonymous (not listed publicly)' : info.name} />
        <Row k="Email"       v={info.email} />
        {info.dedicate && <Row k="Dedication" v={info.dedicate} />}
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 32 }}>
        <button onClick={onBack} className="btn btn-ghost">← Edit</button>
        <button onClick={onConfirm} className="btn btn-primary btn-lg">Confirm gift <span className="arrow">→</span></button>
      </div>
      <p className="muted" style={{ marginTop: 24, fontSize: 12 }}>This is a prototype — no payment will be processed.</p>
    </div>
  )
}

// ── Step 5: Thanks ─────────────────────────────────────────────────────────
function StepThanks({ amount, matched, info }: { amount: number; matched: number; info: DonorInfo }) {
  return (
    <div style={{ textAlign: 'center', padding: '24px 0' }}>
      <div className="script" style={{ fontSize: 38, color: 'var(--c-primary)' }}>thank you,</div>
      <h2 className="display" style={{ fontSize: 48, fontWeight: 400, marginTop: 6, lineHeight: 1.1 }}>
        {info.name.split(' ')[0] || 'friend'}.
      </h2>
      <p className="lead" style={{ margin: '24px auto 0', maxWidth: '38ch' }}>
        Your gift of <strong>${amount.toLocaleString()}</strong> will be matched to <strong>${matched.toLocaleString()}</strong> by year end. A receipt is on its way to your inbox.
      </p>
      <div style={{ marginTop: 40, display: 'flex', justifyContent: 'center', gap: 12, flexWrap: 'wrap' }}>
        <Link href="/what-to-see" className="btn btn-primary">See the work →</Link>
        <Link href="/" className="btn btn-outline">Back to home</Link>
      </div>
    </div>
  )
}

// ── Sidebar ────────────────────────────────────────────────────────────────
function Sidebar({ amount, matched, designation, frequency }: { amount: number; matched: number; designation: string; frequency: Frequency }) {
  return (
    <aside style={{ position: 'sticky', top: 100, background: 'var(--c-bg-alt)', padding: 32, border: '1px solid var(--c-line-soft)' }}>
      <div className="eyebrow">Your gift</div>
      <div className="display" style={{ fontSize: 56, fontStyle: 'italic', fontWeight: 300, color: 'var(--c-primary)', lineHeight: 1, marginTop: 14, fontVariantNumeric: 'tabular-nums' }}>
        ${amount.toLocaleString()}
      </div>
      <div className="muted" style={{ fontSize: 13, marginTop: 6 }}>
        {frequency === 'monthly' ? 'monthly' : 'one-time'} · matched to <strong style={{ color: 'var(--c-text)' }}>${matched.toLocaleString()}</strong>
      </div>
      <div style={{ marginTop: 24, paddingTop: 24, borderTop: '1px solid var(--c-line-soft)' }}>
        <div className="dateline">Direction</div>
        <p style={{ fontFamily: 'var(--f-display)', fontStyle: 'italic', fontSize: 18, marginTop: 8, lineHeight: 1.35 }}>{designation}</p>
      </div>
      <div style={{ marginTop: 24, paddingTop: 24, borderTop: '1px solid var(--c-line-soft)', fontSize: 13, color: 'var(--c-text-muted)' }}>
        <p style={{ margin: 0 }}>The W.T. McArthur Historic Homeplace Foundation is a 501(c)(3) nonprofit. Your gift is tax-deductible to the extent allowed by law.</p>
      </div>
    </aside>
  )
}

// ── Other ways ─────────────────────────────────────────────────────────────
function OtherWaysToGive() {
  const ways = [
    { t: 'By mail',  d: 'Make checks payable to "W.T. McArthur Foundation," PO Box 1893.' },
    { t: 'By stock', d: 'Gifts of appreciated securities. Contact the treasurer for transfer details.' },
    { t: 'In your will', d: 'Bequests of any size help us steward the homeplace for the next century.' },
    { t: 'In kind',  d: 'Tools, lumber, professional services. We always need a roofer who is also a friend.' },
  ]
  return (
    <section className="section" style={{ background: 'var(--c-bg-alt)' }}>
      <div className="container">
        <SectionHead eyebrow="Other ways to give" title="Not every gift <em>looks like a gift.</em>" />
        <div style={{ marginTop: 48, display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 24 }}>
          {ways.map((w, i) => (
            <div key={w.t} style={{ background: 'var(--c-surface)', padding: 28, border: '1px solid var(--c-line-soft)' }}>
              <div className="display" style={{ fontSize: 22, fontStyle: 'italic', color: 'var(--c-primary)', fontWeight: 400 }}>0{i + 1}</div>
              <h3 className="h-card" style={{ fontSize: 20, marginTop: 12 }}>{w.t}</h3>
              <p className="muted" style={{ fontSize: 14, marginTop: 10 }}>{w.d}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ── Main component ─────────────────────────────────────────────────────────
export function DonateForm({ projects }: { projects: DonateProjectOption[] }) {
  const [step, setStep] = useState(0)
  const [amount, setAmount] = useState(100)
  const [custom, setCustom] = useState('')
  const [frequency, setFrequency] = useState<Frequency>('once')
  const [designation, setDesignation] = useState<Designation>('match')
  const [info, setInfo] = useState<DonorInfo>({ name: '', email: '', anonymous: false, dedicate: '' })

  const finalAmount = useMemo(() => {
    const v = custom ? parseFloat(custom) : amount
    return isNaN(v) ? 0 : Math.max(0, v)
  }, [amount, custom])
  const matched = finalAmount * 2

  const designationLabel =
    designation === 'match'       ? 'The 2026 Match Campaign (general)' :
    designation === 'maintenance' ? 'The Endowment for Long-Term Care'  :
    (projects.find((p) => p.slug === designation)?.title ?? 'General')

  return (
    <main className="page fade-in">
      <section style={{ paddingTop: 64, paddingBottom: 24 }}>
        <div className="container">
          <div className="eyebrow">Support the work</div>
          <h1 className="h-display" style={{ marginTop: 18, maxWidth: '14ch' }}>
            Make a gift. <em>Until December, it doubles.</em>
          </h1>
          <p className="lead" style={{ marginTop: 24, maxWidth: '52ch' }}>
            Every dollar contributed before year-end is matched by the State Historical Commission.
            Choose where it goes — or trust the board to direct it where it&apos;s most needed.
          </p>
        </div>
      </section>

      <TartanRule thin />

      <section style={{ padding: '40px 0 24px' }}>
        <div className="container"><Stepper step={step} /></div>
      </section>

      <section style={{ paddingBottom: 96 }}>
        <div className="container">
          <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 48, alignItems: 'start' }}>
            <div style={{ background: 'var(--c-surface)', border: '1px solid var(--c-line)', padding: '40px' }}>
              {step === 0 && <StepAmount amount={amount} setAmount={setAmount} custom={custom} setCustom={setCustom} frequency={frequency} setFrequency={setFrequency} onNext={() => finalAmount > 0 && setStep(1)} />}
              {step === 1 && <StepDesignation designation={designation} setDesignation={setDesignation} projects={projects} onBack={() => setStep(0)} onNext={() => setStep(2)} />}
              {step === 2 && <StepInfo info={info} setInfo={setInfo} onBack={() => setStep(1)} onNext={() => setStep(3)} />}
              {step === 3 && <StepReview amount={finalAmount} matched={matched} frequency={frequency} designation={designationLabel} info={info} onBack={() => setStep(2)} onConfirm={() => setStep(4)} />}
              {step === 4 && <StepThanks amount={finalAmount} matched={matched} info={info} />}
            </div>
            <Sidebar amount={finalAmount} matched={matched} designation={designationLabel} frequency={frequency} />
          </div>
        </div>
      </section>

      <OtherWaysToGive />
    </main>
  )
}
