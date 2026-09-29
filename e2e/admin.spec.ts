import { join } from 'node:path'
import { test, expect } from '@playwright/test'
import { SEED } from './fixtures'
import { signInAsEditor } from './auth'

/**
 * Admin / CMS flows (MCA-20, finished in MCA-148).
 *
 * Editors sign in through the real "Continue with Google" button against the
 * Auth emulator (see ./auth.ts). Each test uses its own browser context, so it
 * signs in afresh; the flows below also leave unique data behind (timestamped
 * slugs, captions) so they can run in parallel without clashing.
 */

// A real JPEG from the repo (~2 MB, under the 10 MB Storage rule limit).
const PHOTO = join(__dirname, '..', 'public', 'images', 'cooper-conner-day.jpg')

test.describe('admin auth gate', () => {
  test('unauthenticated /admin redirects to login', async ({ page }) => {
    await page.goto('/admin')
    await expect(page).toHaveURL(/\/admin\/login/)
  })

  test('unauthenticated deep admin route redirects to login', async ({ page }) => {
    await page.goto('/admin/navigation')
    await expect(page).toHaveURL(/\/admin\/login/)
  })

  test('preserves the next param through the login redirect', async ({ page }) => {
    await page.goto('/admin/navigation')
    await expect(page).toHaveURL(/\/admin\/login\?next=%2Fadmin%2Fnavigation/)
  })
})

test.describe('admin editor flows', () => {
  // Sign-in plus several first-compile admin routes under `next dev`.
  test.describe.configure({ timeout: 60_000 })

  test('editor can sign in and lands where they were headed', async ({ page }) => {
    await signInAsEditor(page, '/admin/navigation')
    await expect(page.getByRole('heading', { name: /Header — utility row/ })).toBeVisible()
    await page.goto('/admin')
    await expect(page.getByRole('heading', { name: `Welcome, ${SEED.editor.displayName}` })).toBeVisible()
  })

  test('create, edit and publish a page; it appears publicly', async ({ page }) => {
    const slug = `e2e-new-${Date.now()}`
    await signInAsEditor(page, '/admin/pages/new')

    await page.getByPlaceholder('Page title').fill('E2E Draft Title')
    await page.getByPlaceholder('e.g. heritage-day-2026').fill(slug)
    await page.getByRole('button', { name: '+ Rich text' }).click()
    await page.locator('.ProseMirror').click()
    await page.keyboard.type('Written by the E2E suite.')
    await page.getByRole('button', { name: 'Save draft' }).click()
    // Wait for the redirect from /admin/pages/new to the saved page's id.
    await expect(page).toHaveURL(/\/admin\/pages\/(?!new$)[^/]+$/)

    // Reload: proves the draft persisted, and makes sure we edit the editor
    // mounted for /admin/pages/<id>. (The first save swaps routes with
    // router.replace, which remounts the editor from stored data, so typing
    // before that lands would be lost.)
    await page.reload()
    await expect(page.getByPlaceholder('Page title')).toHaveValue('E2E Draft Title')

    // Drafts are not public.
    expect((await page.request.get(`/${slug}`)).status()).toBe(404)

    // Edit, then publish (Publish saves first).
    await page.getByPlaceholder('Page title').fill('E2E Published Title')
    await page.getByRole('button', { name: 'Save draft' }).click()
    await expect(page.getByText('Saved.')).toBeVisible()
    await page.getByRole('button', { name: 'Publish' }).click()
    await expect(page.getByText('Published.')).toBeVisible()

    await page.goto(`/${slug}`)
    await expect(page.getByRole('heading', { name: 'E2E Published Title' })).toBeVisible()
    await expect(page.getByText('Written by the E2E suite.')).toBeVisible()
  })

  test('upload a photo; it shows in the library and on its place page', async ({ page }) => {
    const caption = `E2E photo ${Date.now()}`
    await signInAsEditor(page, '/admin/photos/new')

    // The uploader's file input is hidden behind "Choose image".
    await page.locator('input[type="file"]').setInputFiles(PHOTO)
    await expect(page.getByRole('button', { name: 'Replace' })).toBeVisible()
    await page.getByPlaceholder('Alt text (describe the image)').fill('The Cooper Conner House by day')
    await page.getByPlaceholder('Short descriptive caption').fill(caption)
    await page.locator('select').first().selectOption(SEED.publishedProject.slug)
    await page.getByRole('button', { name: 'Upload' }).click()
    await expect(page).toHaveURL(/\/admin\/photos\/(?!new$)[^/]+$/)

    await page.goto('/admin/photos')
    await expect(page.getByText(caption)).toBeVisible()

    // The public place page renders the image from Storage (the check MCA-58
    // deferred): a real <img> whose src is a Storage download URL.
    await page.goto(`/what-to-see/${SEED.publishedProject.slug}`)
    const img = page.getByRole('img', { name: 'The Cooper Conner House by day' })
    await expect(img).toBeVisible()
    await expect(img).toHaveAttribute('src', /\/v0\/b\/.+\/o\/photos%2F/)
    expect(await img.evaluate((el: HTMLImageElement) => el.naturalWidth)).toBeGreaterThan(0)
    await expect(page.getByText(caption)).toBeVisible()
  })

  test('edit navigation; the new link appears on the public site', async ({ page }) => {
    const label = `E2E Link ${Date.now()}`
    await signInAsEditor(page, '/admin/navigation')

    // The first card with "+ Add link" is the header utility row.
    const utility = () =>
      page.locator('.admin-card').filter({ has: page.getByRole('button', { name: '+ Add link' }) }).first()
    await utility().getByRole('button', { name: '+ Add link' }).click()
    await utility().getByPlaceholder('Label').last().fill(label)
    await utility().getByPlaceholder('/path or https://…').last().fill('/about')
    await page.getByRole('button', { name: 'Save header' }).click()
    await expect(page.getByText('Primary nav saved.')).toBeVisible()

    await page.reload()
    await expect(utility().getByPlaceholder('Label').last()).toHaveValue(label)
    await page.goto('/')
    await expect(page.getByRole('banner').getByRole('link', { name: label })).toBeVisible()
  })

  test('reorder structured items; the new order persists', async ({ page }) => {
    const [first, second] = SEED.milestones
    await signInAsEditor(page, '/admin/structured/milestones')

    // Assert order by where each title appears in the list's text.
    const list = page.getByRole('main')
    await expect(list).toHaveText(new RegExp(`${first}[\\s\\S]*${second}`))
    await page.getByRole('button', { name: '↓' }).first().click()
    await expect(list).toHaveText(new RegExp(`${second}[\\s\\S]*${first}`))

    await page.reload()
    await expect(list).toHaveText(new RegExp(`${second}[\\s\\S]*${first}`))
    // The public timeline follows the new order.
    await page.goto('/about')
    const publicTitles = page.getByRole('heading', { level: 3 }).filter({ hasText: 'E2E Milestone' })
    await expect(publicTitles).toHaveText([second, first])
  })
})
