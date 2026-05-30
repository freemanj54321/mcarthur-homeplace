import { z } from 'zod'
import { createCollectionStore, type StoredDoc, type PublicDoc } from './collectionStore'

export const BoardMemberInput = z.object({
  name: z.string().min(1).max(200),
  role: z.string().max(200),
  note: z.string().max(600),
})
export type BoardMemberInput = z.infer<typeof BoardMemberInput>

export type BoardMemberDoc = StoredDoc<BoardMemberInput>
export type BoardMember = PublicDoc<BoardMemberInput>

export const boardStore = createCollectionStore<BoardMemberInput>({
  collection: 'boardMembers',
  schema: BoardMemberInput,
})
