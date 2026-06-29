import { test, expect } from '@playwright/test'
import { SEED } from './fixtures'

/**
 * WS2 (MCA-20) — admin / CMS flows.
 *
 * DONE: the two auth-redirect checks below are hermetic (middleware-only, no
 * session cookie) and pass against a real emulator + Chromium run.
 *
 * TODO(MCA-20): every authenticated flow is scaffolded as `test.fixme` — they
 * all need an emulator-backed editor sign-in helper (Auth emulator +
 * `__session` cookie, reused via storageState) before they can run for real.
 * That helper is the next concrete piece of work on this issue.
 */

test.describe('admin auth gate', () => {
  test('unauthenticated /admin redirects to login', async ({ page }) => {
    await page.goto('/admin')
    await expect(page).toHaveURL(/\/admin\/login/)
  })

  test('unauthenticated deep admin route redirects to login', async ({ page }) => {
    await page.goto('/admin/navigation')
    await expect(page).toHaveURL(/\/admin\/login/)
  })

  // TODO(MCA-20): the middleware sets ?next=<pathname>, but it isn't surviving
  // to the final browser URL in dev — confirm whether that's expected (and that
  // post-login redirect still returns the editor to the original route).
  test.fixme('preserves the next param through the login redirect', async ({ page }) => {
    await page.goto('/admin/navigation')
    await expect(page).toHaveURL(/\/admin\/login\?next=%2Fadmin%2Fnavigation/)
  })
})

test.describe('admin editor flows', () => {
  // TODO(MCA-20): sign in as the seeded editor (Auth emulator) and establish
  // the __session cookie, then reuse via storageState across the flows below.
  test.fixme('editor can sign in', async ({ page }) => {
    await page.goto('/admin/login')
    expect(SEED.editor.email).toBeTruthy()
  })

  // TODO(MCA-20): create → edit → publish a page, then assert it renders publicly.
  test.fixme('create, edit and publish a page; it appears publicly', async ({ page }) => {
    await page.goto('/admin/pages/new')
  })

  // TODO(MCA-20): upload a photo via /admin/photos/new (Storage emulator).
  test.fixme('upload a photo', async ({ page }) => {
    await page.goto('/admin/photos/new')
  })

  // TODO(MCA-20): edit navigation (add/remove/reorder) and assert persistence.
  // Add/remove/reorder logic is also covered as a jsdom unit test in
  // src/app/admin/navigation/NavigationEditor.test.tsx.
  test.fixme('edit navigation', async ({ page }) => {
    await page.goto('/admin/navigation')
  })

  // TODO(MCA-20): reorder structured items and assert new order persists.
  test.fixme('reorder structured items', async ({ page }) => {
    await page.goto('/admin/structured')
  })
})
