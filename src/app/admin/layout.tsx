import Link from 'next/link'
import { AuthProvider } from '@/components/auth/AuthProvider'
import { getCurrentEditor } from '@/lib/auth/server'
import { AdminSignOutButton } from './AdminSignOutButton'
import './admin.css'

export const dynamic = 'force-dynamic'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const editor = await getCurrentEditor()
  return (
    <AuthProvider>
      {editor ? (
        <div className="admin-shell">
          <header className="admin-header">
            <Link href="/admin" className="admin-brand">McArthur Admin</Link>
            <nav className="admin-nav">
              <Link href="/admin">Dashboard</Link>
              <Link href="/admin/pages">Pages</Link>
              <Link href="/admin/structured">Content</Link>
              <Link href="/admin/navigation">Navigation</Link>
            </nav>
            <AdminSignOutButton />
          </header>
          <main className="admin-main">{children}</main>
        </div>
      ) : (
        children
      )}
    </AuthProvider>
  )
}
