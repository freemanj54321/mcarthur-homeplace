'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { signInWithGoogle } from '@/lib/auth/client'

export function LoginForm({ next }: { next: string }) {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#f7f5ef',
        padding: 24,
      }}
    >
      <div className="admin-card" style={{ maxWidth: 400, width: '100%', textAlign: 'center' }}>
        <h1 className="admin-h1" style={{ fontSize: 24 }}>Editor sign-in</h1>
        <p style={{ color: '#666', fontSize: 14, marginBottom: 24 }}>
          Sign in with the Google account on the editor allowlist.
        </p>
        <button
          type="button"
          className="admin-btn admin-btn--primary"
          disabled={busy}
          onClick={async () => {
            setBusy(true)
            setError(null)
            try {
              await signInWithGoogle()
              router.push(next)
              router.refresh()
            } catch (e) {
              setError(e instanceof Error ? e.message : 'Sign-in failed')
            } finally {
              setBusy(false)
            }
          }}
        >
          {busy ? 'Signing in…' : 'Continue with Google'}
        </button>
        {error && <div className="admin-error">{error}</div>}
      </div>
    </div>
  )
}
