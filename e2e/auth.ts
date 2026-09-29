import { expect, type Page } from '@playwright/test'
import { SEED } from './fixtures'

/**
 * Sign in as the seeded editor through the real login UI: "Continue with
 * Google" opens the Auth emulator's account chooser (the seed links a Google
 * identity to the editor), picking the account completes signInWithPopup, and
 * the app then mints the `__session` cookie via POST /api/auth/session.
 *
 * Going through the UI rather than calling the session API directly matters:
 * it also signs in the client Firebase SDK, which browser uploads to Storage
 * rely on (storage.rules check request.auth).
 */
export async function signInAsEditor(page: Page, next = '/admin'): Promise<void> {
  await page.goto(`/admin/login?next=${encodeURIComponent(next)}`)
  const popupPromise = page.waitForEvent('popup')
  await page.getByRole('button', { name: 'Continue with Google' }).click()
  const popup = await popupPromise
  // The chooser ignores clicks until its own script has loaded.
  await popup.waitForLoadState('networkidle')
  await popup.getByText(SEED.editor.email).click()
  // Generous wait: under `next dev` the first visit to each admin route
  // compiles it, and several tests sign in at once.
  await expect(page).toHaveURL(new RegExp(`${next.replace(/\//g, '\\/')}$`), { timeout: 30_000 })
}
