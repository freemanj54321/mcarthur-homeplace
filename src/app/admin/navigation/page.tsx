import { requireEditor } from '@/lib/auth/server'
import { getFooterNav, getPrimaryNavRaw } from '@/lib/cms/navigation'
import { NavigationEditor } from './NavigationEditor'

export const dynamic = 'force-dynamic'

export default async function NavigationAdminPage() {
  await requireEditor()
  const [primary, footer] = await Promise.all([getPrimaryNavRaw(), getFooterNav()])
  return (
    <div>
      <h1 className="admin-h1">Navigation</h1>
      <p className="admin-hint" style={{ marginTop: -8, marginBottom: 24 }}>
        Edits go live across the site within ~60 seconds of saving.
      </p>
      <NavigationEditor primary={primary} footer={footer} />
    </div>
  )
}
