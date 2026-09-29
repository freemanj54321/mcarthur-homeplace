'use server'

import { revalidatePath } from 'next/cache'
import { requireEditor } from '@/lib/auth/server'
import { fmtError } from '@/lib/cms/action-error'
import { getEntry, type SaveResult } from './registry'

type Result = { ok: true } | { ok: false; error: string }

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
): Promise<SaveResult> {
  const editor = await requireEditor()
  const entry = getEntry(collection)
  if (!entry) return { ok: false, error: `Unknown collection "${collection}"` }
  try {
    const result = await entry.save(id, input, editor.uid)
    if (result.ok) revalidateEntry(collection)
    return result
  } catch (e) {
    return { ok: false, error: fmtError(e) }
  }
}

export async function publishStructuredAction(collection: string, id: string): Promise<Result> {
  const editor = await requireEditor()
  const entry = getEntry(collection)
  if (!entry) return { ok: false, error: `Unknown collection "${collection}"` }
  try {
    await entry.publish(id, editor.uid)
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
    await entry.unpublish(id, editor.uid)
    revalidateEntry(collection)
    return { ok: true }
  } catch (e) {
    return { ok: false, error: fmtError(e) }
  }
}

export async function deleteStructuredAction(collection: string, id: string): Promise<Result> {
  const editor = await requireEditor()
  const entry = getEntry(collection)
  if (!entry) return { ok: false, error: `Unknown collection "${collection}"` }
  try {
    await entry.remove(id, editor.uid)
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
    await entry.reorder(id, direction, editor.uid)
    revalidateEntry(collection)
    return { ok: true }
  } catch (e) {
    return { ok: false, error: fmtError(e) }
  }
}
