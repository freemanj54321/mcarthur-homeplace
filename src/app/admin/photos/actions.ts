'use server'

import { revalidatePath } from 'next/cache'
import { requireEditor } from '@/lib/auth/server'
import { fmtError } from '@/lib/cms/action-error'
import { adminStorage } from '@/lib/firebase-admin'
import { logFallback } from '@/lib/log'
import { PhotoInput } from '@/lib/content-schema'
import { createPhoto, updatePhoto, deletePhoto, swapPhotoOrder } from '@/lib/cms/photosAdmin'

type Result = { ok: true } | { ok: false; error: string }
type CreateResult = { ok: true; id: string } | { ok: false; error: string }

function revalidateAll() {
  revalidatePath('/admin/photos')
  revalidatePath('/what-to-see', 'layout')
  revalidatePath('/')
}

export async function savePhotoAction(
  id: string | null,
  input: unknown,
): Promise<CreateResult> {
  const editor = await requireEditor()
  const parsed = PhotoInput.safeParse(input)
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; '),
    }
  }
  try {
    if (id) {
      await updatePhoto(id, parsed.data, editor.uid)
      revalidateAll()
      return { ok: true, id }
    }
    const newId = await createPhoto(parsed.data, editor.uid)
    revalidateAll()
    return { ok: true, id: newId }
  } catch (e) {
    return { ok: false, error: fmtError(e) }
  }
}

export async function deletePhotoAction(id: string): Promise<Result> {
  await requireEditor()
  try {
    // The path comes from the doc, not the caller (MCA-113).
    const storagePath = await deletePhoto(id)
    if (storagePath) {
      try {
        await adminStorage().bucket().file(storagePath).delete()
      } catch (err) {
        // The object may already be gone; the photo doc is deleted either way.
        logFallback('photos.deleteStorageObject', err, { id, storagePath })
      }
    }
    revalidateAll()
    return { ok: true }
  } catch (e) {
    return { ok: false, error: fmtError(e) }
  }
}

export async function reorderPhotoAction(idA: string, idB: string): Promise<Result> {
  const editor = await requireEditor()
  try {
    await swapPhotoOrder(idA, idB, editor.uid)
    // Public galleries show this order too, not just the admin list.
    revalidateAll()
    return { ok: true }
  } catch (e) {
    return { ok: false, error: fmtError(e) }
  }
}
