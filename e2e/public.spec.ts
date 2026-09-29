import { test, expect } from '@playwright/test'
import { SEED } from './fixtures'

/**
 * Public-facing flows (MCA-20, finished in MCA-148). The E2E web server runs
 * with donations on (playwright.config.ts), matching dev/uat.
 */

test.describe('public site', () => {
  test('home page renders with primary navigation', async ({ page }) => {
    const response = await page.goto('/')
    expect(response?.ok()).toBeTruthy()
    // Default nav (navigation.ts) always provides these top-level links.
    await expect(page.getByRole('link', { name: 'Donate' }).first()).toBeVisible()
  })

  test('published custom page renders', async ({ page }) => {
    await page.goto(`/${SEED.publishedPage.slug}`)
    await expect(
      page.getByText('This page is published and should render publicly.'),
    ).toBeVisible()
  })

  test('draft page 404s for anonymous visitors', async ({ page }) => {
    const response = await page.goto(`/${SEED.draftPage.slug}`)
    expect(response?.status()).toBe(404)
  })

  test('What to See dropdown lists published projects', async ({ page }) => {
    await page.goto('/')
    // Desktop header: the dropdown opens on hover (CSS :hover).
    await page.getByRole('navigation', { name: 'Primary navigation, left' })
      .getByRole('link', { name: /What to See/ }).hover()
    const item = page.getByRole('menuitem', { name: SEED.publishedProject.title })
    await expect(item).toBeVisible()
    await item.click()
    await expect(page).toHaveURL(new RegExp(`/what-to-see/${SEED.publishedProject.slug}$`))
  })

  test('what-to-see detail page renders', async ({ page }) => {
    const response = await page.goto(`/what-to-see/${SEED.publishedProject.slug}`)
    expect(response?.ok()).toBeTruthy()
    await expect(page.getByRole('heading', { level: 1, name: SEED.publishedProject.title })).toBeVisible()
  })

  test('unknown place 404s', async ({ page }) => {
    const response = await page.goto('/what-to-see/no-such-place')
    expect(response?.status()).toBe(404)
  })
})

test.describe('donate form (prototype, no real payment)', () => {
  test('completes the donation happy path', async ({ page }) => {
    await page.goto('/donate')
    await expect(page.getByRole('heading', { name: /choose an amount/i })).toBeVisible()
    await page.getByRole('button', { name: /continue/i }).click()

    await expect(page.getByRole('heading', { name: /where should it go/i })).toBeVisible()
    // Published projects are offered as designations; pick one.
    await page.getByRole('radio', { name: new RegExp(SEED.publishedProject.title) }).check()
    await page.getByRole('button', { name: /continue/i }).click()

    await page.getByPlaceholder('Jane McArthur Hill').fill('Jane Donor')
    await page.getByPlaceholder('jane@example.com').fill('jane@example.com')
    await page.getByRole('button', { name: /review gift/i }).click()

    await expect(page.getByRole('heading', { name: /review your gift/i })).toBeVisible()
    await expect(page.getByRole('main').getByText(SEED.publishedProject.title).first()).toBeVisible()
    await page.getByRole('button', { name: /confirm gift/i }).click()
    await expect(page.getByText(/thank you/i).first()).toBeVisible()
  })

  test('blocks progress on invalid input', async ({ page }) => {
    await page.goto('/donate')
    // A zero custom amount disables Continue.
    await page.getByPlaceholder('0').fill('0')
    await expect(page.getByRole('button', { name: /continue/i })).toBeDisabled()

    await page.getByPlaceholder('0').fill('50')
    await page.getByRole('button', { name: /continue/i }).click()
    await page.getByRole('button', { name: /continue/i }).click()

    // Review stays disabled until a name and a valid email are entered.
    const review = page.getByRole('button', { name: /review gift/i })
    await expect(review).toBeDisabled()
    await page.getByPlaceholder('Jane McArthur Hill').fill('Jane')
    await page.getByPlaceholder('jane@example.com').fill('not-an-email')
    await expect(review).toBeDisabled()
    await page.getByPlaceholder('jane@example.com').fill('jane@example.com')
    await expect(review).toBeEnabled()
  })
})
