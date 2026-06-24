import { createCollectionStore } from './collectionStore'
import { BoardMemberInput } from '@/lib/content-schema'

export const boardStore = createCollectionStore<BoardMemberInput>({
  collection: 'boardMembers',
  schema: BoardMemberInput,
})
