'use server'

import { revalidatePath } from 'next/cache'
import { requireEditor } from '@/lib/auth/server'
import { fmtError } from '@/lib/cms/action-error'
import { getEntry } from './registry'

type Result = { ok: true } | { ok: false; error: string }
type CreateResult = { ok: true; id: string } | { ok: false; error: string }

function revalidateEntry(collection: string): void {
  const entry = getEntry(collection)
  if (!entry) return
  revalidatePath(`/admin/structured/${collection}`)
  for (const p of entry.paths) revalidatePath(p)
  if (entry.layout) revalidatePath('/', 'layout')
}

export async function saveStructuredAction(
  collection: string,
  id: string | null,
  input: unknown,
): Promise<CreateResult> {
  const editor = await requireEditor()
  const entry = getEntry(collection)
  if (!entry) return { ok: false, error: `Unknown collection "${collection}"` }
  const parsed = entry.schema.safeParse(input)
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ') }
  }
  try {
    if (id) {
      await entry.store.update(id, parsed.data, editor.uid)
      revalidateEntry(collection)
      return { ok: true, id }
    }
    const newId = await entry.store.create(parsed.data, editor.uid)
    revalidateEntry(collection)
    return { ok: true, id: newId }
  } catch (e) {
    return { ok: false, error: fmtError(e) }
  }
}

export async function publishStructuredAction(collection: string, id: string): Promise<Result> {
  const editor = await requireEditor()
  const entry = getEntry(collection)
  if (!entry) return { ok: false, error: `Unknown collection "${collection}"` }
  try {
    await entry.store.publish(id, editor.uid)
    revalidateEntry(collection)
    return { ok: true }
  } catch (e) {
    return { ok: false, error: fmtError(e) }
  }
}

export async function unpublishStructuredAction(collection: string, id: string): Promise<Result> {
  const editor = await requireEditor()
  const entry = getEntry(collection)
  if (!entry) return { ok: false, error: `Unknown collection "${collection}"` }
  try {
    await entry.store.unpublish(id, editor.uid)
    revalidateEntry(collection)
    return { ok: true }
  } catch (e) {
    return { ok: false, error: fmtError(e) }
  }
}

export async function deleteStructuredAction(collection: string, id: string): Promise<Result> {
  const editor = await requireEditor()
  void editor
  const entry = getEntry(collection)
  if (!entry) return { ok: false, error: `Unknown collection "${collection}"` }
  try {
    await entry.store.remove(id)
    revalidateEntry(collection)
    return { ok: true }
  } catch (e) {
    return { ok: false, error: fmtError(e) }
  }
}

export async function reorderStructuredAction(
  collection: string,
  id: string,
  direction: 'up' | 'down',
): Promise<Result> {
  const editor = await requireEditor()
  const entry = getEntry(collection)
  if (!entry) return { ok: false, error: `Unknown collection "${collection}"` }
  try {
    await entry.store.reorder(id, direction, editor.uid)
    revalidateEntry(collection)
    return { ok: true }
  } catch (e) {
    return { ok: false, error: fmtError(e) }
  }
}
