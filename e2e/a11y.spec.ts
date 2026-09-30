import { test, expect } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'
import { SEED } from './fixtures'

/**
 * Accessibility scans (MCA-150). axe-core checks each key page against
 * WCAG 2.1 A/AA rules; serious and critical violations fail the test, and
 * anything less is attached to the report for review.
 */

const PAGES = [
  '/',
  '/about',
  '/visit',
  '/what-to-see',
  `/what-to-see/${SEED.publishedProject.slug}`,
  `/${SEED.publishedPage.slug}`,
  '/donate',
  '/admin/login',
]

for (const path of PAGES) {
  test(`${path} has no serious or critical accessibility violations`, async ({ page }, testInfo) => {
    await page.goto(path)
    // Scan the app's document, not a dev-server interstitial: under parallel
    // load `next dev` may still be compiling the route when goto() returns.
    await expect(page.locator('html')).toHaveAttribute('lang', 'en')
    await page.waitForLoadState('networkidle')
    const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze()
    await testInfo.attach('axe-results', { body: JSON.stringify(results.violations, null, 2), contentType: 'application/json' })
    const blocking = results.violations
      .filter((v) => v.impact === 'serious' || v.impact === 'critical')
      .map((v) => `${v.impact} ${v.id}: ${v.help} (${v.nodes.length} × e.g. ${v.nodes[0]?.target.join(' ')})`)
    expect(blocking, blocking.join('\n')).toEqual([])
  })
}
