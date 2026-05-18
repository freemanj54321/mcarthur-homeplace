import Link from 'next/link'
import { requireEditor } from '@/lib/auth/server'
import { listPages } from '@/lib/cms/pages'

export const dynamic = 'force-dynamic'

export default async function AdminDashboard() {
  const editor = await requireEditor()
  const pages = await listPages()
  const published = pages.filter((p) => p.status === 'published').length
  const drafts = pages.filter((p) => p.status === 'draft').length

  return (
    <div>
      <h1 className="admin-h1">Welcome, {editor.displayName ?? editor.email}</h1>
      <div className="admin-row" style={{ gap: 24, marginBottom: 32 }}>
        <div className="admin-card" style={{ flex: 1 }}>
          <div className="admin-label">Pages</div>
          <div style={{ fontSize: 32, fontWeight: 600 }}>{pages.length}</div>
        </div>
        <div className="admin-card" style={{ flex: 1 }}>
          <div className="admin-label">Published</div>
          <div style={{ fontSize: 32, fontWeight: 600 }}>{published}</div>
        </div>
        <div className="admin-card" style={{ flex: 1 }}>
          <div className="admin-label">Drafts</div>
          <div style={{ fontSize: 32, fontWeight: 600 }}>{drafts}</div>
        </div>
      </div>
      <div className="admin-row">
        <Link href="/admin/pages" className="admin-btn">All pages</Link>
        <Link href="/admin/pages/new" className="admin-btn admin-btn--primary">+ New page</Link>
      </div>
    </div>
  )
}
