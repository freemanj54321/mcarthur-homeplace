const FACTS = [
  { kpi: '4',    label: 'active restoration projects' },
  { kpi: '17',   label: 'oral histories recorded' },
  { kpi: '$50K', label: 'state matching grant pledged' },
  { kpi: '1893', label: 'year the land was patented' },
]

export function HeroFacts() {
  return (
    <div style={{ marginTop: 56, display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', borderTop: '1px solid var(--c-line)', borderBottom: '1px solid var(--c-line)' }}>
      {FACTS.map((it, i) => (
        <div key={i} style={{ padding: '28px 24px', borderRight: i < FACTS.length - 1 ? '1px solid var(--c-line-soft)' : 'none' }}>
          <div className="display" style={{ fontSize: 'clamp(36px, 4vw, 56px)', lineHeight: 1, fontStyle: 'italic', fontWeight: 300, color: 'var(--c-primary)' }}>{it.kpi}</div>
          <div className="muted" style={{ fontSize: 12, letterSpacing: '0.08em', textTransform: 'uppercase', marginTop: 10 }}>{it.label}</div>
        </div>
      ))}
    </div>
  )
}
