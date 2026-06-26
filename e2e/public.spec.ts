import { test, expect } from '@playwright/test'
import { SEED } from './fixtures'

/**
 * WS2 (MCA-20) — public-facing flows.
 *
 * Tests marked `test.fixme` are scaffolded but not yet implemented: their
 * assertions depend on selectors/flows still to be finalised in the next pass.
 * The active tests are the smoke checks that prove the harness + emulator seed
 * are wired correctly end to end.
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

  // TODO(MCA-20): assert the "What to See" dropdown lists the seeded published
  // project (dynamicChildren: 'projects'). Needs the header dropdown selectors.
  test.fixme('What to See dropdown lists published projects', async ({ page }) => {
    await page.goto('/')
    const whatToSee = page.getByRole('link', { name: 'What to See' })
    await whatToSee.hover()
    await expect(page.getByRole('link', { name: SEED.publishedProject.title })).toBeVisible()
  })

  // TODO(MCA-20): assert a what-to-see/[slug] detail page renders.
  test.fixme('what-to-see detail page renders', async ({ page }) => {
    await page.goto(`/what-to-see/${SEED.publishedProject.slug}`)
    await expect(page.getByRole('heading', { name: SEED.publishedProject.title })).toBeVisible()
  })
})

test.describe('donate form', () => {
  // TODO(MCA-20): drive the multi-step DonateForm happy path (amount →
  // designation → details → review → confirm) and assert the thank-you step.
  // Step-machine/validation logic is also covered as a jsdom unit test in
  // src/components/donate/DonateForm.test.tsx.
  test.fixme('completes the donation happy path (no real payment)', async ({ page }) => {
    await page.goto('/donate')
  })

  // TODO(MCA-20): assert Continue is disabled until a valid amount/details are
  // entered (validation errors surface).
  test.fixme('blocks progress on invalid input', async ({ page }) => {
    await page.goto('/donate')
  })
})
