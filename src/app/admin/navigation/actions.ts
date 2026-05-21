'use server'

import { revalidatePath } from 'next/cache'
import { requireEditor } from '@/lib/auth/server'
import {
  FooterNavInput,
  PrimaryNavInput,
  saveFooterNav,
  savePrimaryNav,
} from '@/lib/cms/navigation'
import { fmtError } from '@/lib/cms/action-error'

type Result = { ok: true } | { ok: false; error: string }

export async function savePrimaryNavAction(input: unknown): Promise<Result> {
  const editor = await requireEditor()
  const parsed = PrimaryNavInput.safeParse(input)
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ') }
  }
  try {
    await savePrimaryNav(parsed.data, editor.uid)
    revalidatePath('/', 'layout')
    return { ok: true }
  } catch (e) {
    return { ok: false, error: fmtError(e) }
  }
}

export async function saveFooterNavAction(input: unknown): Promise<Result> {
  const editor = await requireEditor()
  const parsed = FooterNavInput.safeParse(input)
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ') }
  }
  try {
    await saveFooterNav(parsed.data, editor.uid)
    revalidatePath('/', 'layout')
    return { ok: true }
  } catch (e) {
    return { ok: false, error: fmtError(e) }
  }
}
