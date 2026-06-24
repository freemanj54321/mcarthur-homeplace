import { createCollectionStore } from './collectionStore'
import { MilestoneInput } from '@/lib/content-schema'

export const milestonesStore = createCollectionStore<MilestoneInput>({
  collection: 'milestones',
  schema: MilestoneInput,
})
