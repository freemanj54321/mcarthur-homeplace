import { z } from 'zod'
import { createCollectionStore, type StoredDoc, type PublicDoc } from './collectionStore'

export const MilestoneInput = z.object({
  year: z.string().max(20),
  title: z.string().min(1).max(200),
  body: z.string().max(2000),
})
export type MilestoneInput = z.infer<typeof MilestoneInput>

export type MilestoneDoc = StoredDoc<MilestoneInput>
export type Milestone = PublicDoc<MilestoneInput>

export const milestonesStore = createCollectionStore<MilestoneInput>({
  collection: 'milestones',
  schema: MilestoneInput,
})
