import Link from 'next/link'
import { requireEditor } from '@/lib/auth/server'
import { COLLECTIONS } from '@/lib/content-schema'

export const dynamic = 'force-dynamic'

export default async function StructuredIndex() {
  await requireEditor()
  return (
    <div>
      <h1 className="admin-h1" style={{ marginBottom: 24 }}>Content</h1>
      <p className="admin-hint" style={{ marginTop: 0 }}>
        Structured collections — buildings, events, the timeline, the board, and partners.
      </p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 16, marginTop: 16 }}>
        {Object.values(COLLECTIONS).map((c) => (
          <Link key={c.key} href={`/admin/structured/${c.key}`} className="admin-card" style={{ textDecoration: 'none', color: 'inherit' }}>
            <div style={{ fontWeight: 600, fontSize: 18 }}>{c.label}</div>
            <div style={{ color: '#666', fontSize: 13, marginTop: 4 }}>Manage {c.label.toLowerCase()}</div>
          </Link>
        ))}
      </div>
    </div>
  )
}
