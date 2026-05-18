import Link from 'next/link'
import { requireEditor } from '@/lib/auth/server'
import { listPages } from '@/lib/cms/pages'

export const dynamic = 'force-dynamic'

function fmtDate(ms: number): string {
  if (!ms) return '—'
  return new Date(ms).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })
}

export default async function PagesList() {
  await requireEditor()
  const pages = await listPages()
  return (
    <div>
      <div className="admin-row" style={{ justifyContent: 'space-between', marginBottom: 24 }}>
        <h1 className="admin-h1">Pages</h1>
        <Link href="/admin/pages/new" className="admin-btn admin-btn--primary">+ New page</Link>
      </div>
      {pages.length === 0 ? (
        <div className="admin-empty">
          No pages yet. <Link href="/admin/pages/new">Create the first one.</Link>
        </div>
      ) : (
        <div>
          {pages.map((p) => (
            <Link
              key={p.id}
              href={`/admin/pages/${p.id}`}
              className="admin-card"
              style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', textDecoration: 'none', color: 'inherit' }}
            >
              <div>
                <div style={{ fontWeight: 600, fontSize: 18 }}>{p.title || <em style={{ color: '#888' }}>Untitled</em>}</div>
                <div style={{ color: '#666', fontSize: 13, marginTop: 4 }}>
                  /{p.slug} · updated {fmtDate(p.updatedAt)}
                </div>
              </div>
              <span className={`admin-pill admin-pill--${p.status}`}>{p.status}</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
