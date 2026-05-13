interface ProgressProps {
  pct: number
  raised: number
  goal: number
}

export function Progress({ pct, raised, goal }: ProgressProps) {
  const w = Math.min(100, pct)
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'var(--f-body)', fontVariantNumeric: 'tabular-nums', fontSize: 12, letterSpacing: '0.04em', color: 'var(--c-text-muted)', marginBottom: 8 }}>
        <span>${raised.toLocaleString()} raised</span>
        <span>{pct}% of ${goal.toLocaleString()}</span>
      </div>
      <div style={{ position: 'relative', height: 6, background: 'var(--c-line-soft)', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: `${w}%`, background: 'linear-gradient(90deg, var(--c-primary), var(--c-accent))', transition: 'width 1.2s cubic-bezier(.2,.8,.2,1)' }} />
      </div>
    </div>
  )
}
