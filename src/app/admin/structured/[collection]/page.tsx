import { notFound } from 'next/navigation'
import { requireEditor } from '@/lib/auth/server'
import { COLLECTIONS } from '@/lib/cms/structuredFields'
import { getEntry } from '../registry'
import { StructuredList } from './StructuredList'

export const dynamic = 'force-dynamic'

type Props = { params: Promise<{ collection: string }> }

export default async function StructuredListPage({ params }: Props) {
  await requireEditor()
  const { collection } = await params
  const meta = COLLECTIONS[collection]
  const entry = getEntry(collection)
  if (!meta || !entry) notFound()
  const items = await entry.store.list()
  return <StructuredList collection={collection} meta={meta} items={items as never} />
}
