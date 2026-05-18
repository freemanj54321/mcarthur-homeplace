import { requireEditor } from '@/lib/auth/server'
import { SectionEditor } from '@/components/cms/SectionEditor'

export const dynamic = 'force-dynamic'

export default async function NewPage() {
  await requireEditor()
  return (
    <div>
      <h1 className="admin-h1">New page</h1>
      <SectionEditor page={null} />
    </div>
  )
}
