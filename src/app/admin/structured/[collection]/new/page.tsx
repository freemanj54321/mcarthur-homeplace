import { notFound } from 'next/navigation'
import { requireEditor } from '@/lib/auth/server'
import { COLLECTIONS } from '@/lib/content-schema'
import { StructuredForm } from '@/components/cms/StructuredForm'

export const dynamic = 'force-dynamic'

type Props = { params: Promise<{ collection: string }> }

export default async function NewStructuredItem({ params }: Props) {
  await requireEditor()
  const { collection } = await params
  const meta = COLLECTIONS[collection]
  if (!meta) notFound()
  return <StructuredForm collection={collection} meta={meta} initial={null} />
}
