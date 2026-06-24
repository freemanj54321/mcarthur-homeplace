import { z } from 'zod'
import type { StoredDoc, PublicDoc } from '../doc'

export const BoardMemberInput = z.object({
  name: z.string().min(1).max(200),
  role: z.string().max(200),
  note: z.string().max(600),
})
export type BoardMemberInput = z.infer<typeof BoardMemberInput>

export type BoardMemberDoc = StoredDoc<BoardMemberInput>
export type BoardMember = PublicDoc<BoardMemberInput>
