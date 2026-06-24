import { createCollectionStore } from './collectionStore'
import { PartnerInput } from '@/lib/content-schema'

export const partnersStore = createCollectionStore<PartnerInput>({
  collection: 'partners',
  schema: PartnerInput,
})
