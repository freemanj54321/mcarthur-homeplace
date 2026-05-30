import { z } from 'zod'
import { createCollectionStore, type StoredDoc, type PublicDoc } from './collectionStore'

export const PartnerInput = z.object({
  name: z.string().min(1).max(200),
  url: z.string().url().max(500).optional().or(z.literal('')),
})
export type PartnerInput = z.infer<typeof PartnerInput>

export type PartnerDoc = StoredDoc<PartnerInput>
export type Partner = PublicDoc<PartnerInput>

export const partnersStore = createCollectionStore<PartnerInput>({
  collection: 'partners',
  schema: PartnerInput,
})
