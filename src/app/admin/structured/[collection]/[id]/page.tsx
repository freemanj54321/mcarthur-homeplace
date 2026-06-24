import { notFound } from 'next/navigation'
import { requireEditor } from '@/lib/auth/server'
import { COLLECTIONS } from '@/lib/content-schema'
import { StructuredForm } from '@/components/cms/StructuredForm'
import { getEntry } from '../../registry'

export const dynamic = 'force-dynamic'

type Props = { params: Promise<{ collection: string; id: string }> }

export default async function EditStructuredItem({ params }: Props) {
  await requireEditor()
  const { collection, id } = await params
  const meta = COLLECTIONS[collection]
  const entry = getEntry(collection)
  if (!meta || !entry) notFound()
  const doc = await entry.store.getById(id)
  if (!doc) notFound()
  return <StructuredForm collection={collection} meta={meta} initial={doc as never} />
}
