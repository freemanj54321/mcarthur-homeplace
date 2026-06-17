'use server'

import { revalidatePath } from 'next/cache'
import { requireEditor } from '@/lib/auth/server'
import { fmtError } from '@/lib/cms/action-error'
import { adminStorage } from '@/lib/firebase-admin'
import {
  PhotoAdminInput,
  createPhoto,
  updatePhoto,
  deletePhoto,
  swapPhotoOrder,
} from '@/lib/cms/photosAdmin'

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
  const parsed = PhotoAdminInput.safeParse(input)
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

export async function deletePhotoAction(
  id: string,
  storagePath: string,
): Promise<Result> {
  await requireEditor()
  try {
    await deletePhoto(id)
    try {
      await adminStorage().bucket().file(storagePath).delete()
    } catch {
      // Storage object may already be absent — don't fail the whole action
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
    revalidatePath('/admin/photos')
    return { ok: true }
  } catch (e) {
    return { ok: false, error: fmtError(e) }
  }
}
