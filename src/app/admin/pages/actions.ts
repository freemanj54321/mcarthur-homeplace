'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { requireEditor } from '@/lib/auth/server'
import { PageDraftInput } from '@/lib/cms/sections'
import {
  createPage,
  deletePage as deletePageDoc,
  getPageById,
  publishPage as publishPageDoc,
  unpublishPage as unpublishPageDoc,
  updatePage,
} from '@/lib/cms/pages'
import { fmtError } from '@/lib/cms/action-error'

type Result = { ok: true } | { ok: false; error: string }
type CreateResult = { ok: true; id: string } | { ok: false; error: string }

export async function savePageAction(
  id: string | null,
  input: unknown,
): Promise<CreateResult> {
  const editor = await requireEditor()
  const parsed = PageDraftInput.safeParse(input)
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues.map((i) => i.message).join('; ') }
  }
  try {
    if (id) {
      await updatePage(id, parsed.data, editor.uid)
      revalidatePath('/admin/pages')
      revalidatePath(`/admin/preview/${parsed.data.slug}`)
      return { ok: true, id }
    } else {
      const newId = await createPage(parsed.data, editor.uid)
      revalidatePath('/admin/pages')
      return { ok: true, id: newId }
    }
  } catch (e) {
    return { ok: false, error: fmtError(e) }
  }
}

export async function publishPageAction(id: string): Promise<Result> {
  const editor = await requireEditor()
  try {
    const page = await getPageById(id)
    if (!page) return { ok: false, error: 'Page not found' }
    await publishPageDoc(id, editor.uid)
    revalidatePath('/admin/pages')
    revalidatePath(`/${page.slug}`)
    return { ok: true }
  } catch (e) {
    return { ok: false, error: fmtError(e) }
  }
}

export async function unpublishPageAction(id: string): Promise<Result> {
  const editor = await requireEditor()
  try {
    const page = await getPageById(id)
    if (!page) return { ok: false, error: 'Page not found' }
    await unpublishPageDoc(id, editor.uid)
    revalidatePath('/admin/pages')
    revalidatePath(`/${page.slug}`)
    return { ok: true }
  } catch (e) {
    return { ok: false, error: fmtError(e) }
  }
}

export async function deletePageAction(id: string): Promise<Result> {
  const editor = await requireEditor()
  let slug: string | null = null
  try {
    const page = await getPageById(id)
    if (page) slug = page.slug
    await deletePageDoc(id, editor.uid)
  } catch (e) {
    return { ok: false, error: fmtError(e) }
  }
  revalidatePath('/admin/pages')
  if (slug) revalidatePath(`/${slug}`)
  redirect('/admin/pages')
}
