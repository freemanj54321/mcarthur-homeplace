'use client'

import { useRouter } from 'next/navigation'
import { signOut } from '@/lib/auth/client'
import { useAuth } from '@/components/auth/AuthProvider'

export function AdminSignOutButton() {
  const { user, loading } = useAuth()
  const router = useRouter()
  if (loading) return null
  if (!user) return null
  return (
    <button
      type="button"
      className="admin-btn admin-btn--ghost"
      onClick={async () => {
        await signOut()
        router.push('/admin/login')
        router.refresh()
      }}
    >
      Sign out · {user.email}
    </button>
  )
}
