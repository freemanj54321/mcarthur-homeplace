import { existsSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { defineConfig, devices } from '@playwright/test'

/**
 * Resolve a pre-installed Chromium when the environment ships one whose build
 * revision doesn't match this @playwright/test version (so Playwright would
 * otherwise refuse to launch and ask you to `playwright install`). Prefers an
 * explicit PLAYWRIGHT_CHROMIUM_PATH, else the newest `chromium-*` under
 * PLAYWRIGHT_BROWSERS_PATH. Returns undefined when none is found, letting
 * Playwright fall back to its own managed download.
 */
function resolveChromiumExecutable(): string | undefined {
  const override = process.env.PLAYWRIGHT_CHROMIUM_PATH
  if (override && existsSync(override)) return override

  const root = process.env.PLAYWRIGHT_BROWSERS_PATH
  if (!root || !existsSync(root)) return undefined

  const candidate = readdirSync(root)
    .filter((d) => /^chromium-\d+$/.test(d))
    .sort()
    .reverse()
    .map((d) => join(root, d, 'chrome-linux', 'chrome'))
    .find((p) => existsSync(p))

  return candidate
}

const chromiumExecutable = resolveChromiumExecutable()

/**
 * Playwright config for WS2 (MCA-20) — hermetic E2E against the Firebase
 * Emulator Suite.
 *
 * The emulators are started by the `test:e2e` wrapper:
 *   firebase emulators:exec --only auth,firestore,storage 'playwright test'
 * which sets FIRESTORE_EMULATOR_HOST / FIREBASE_AUTH_EMULATOR_HOST /
 * FIREBASE_STORAGE_EMULATOR_HOST for the admin SDK. The `webServer` below boots
 * `next dev` with the matching public env so the client SDK connects to the
 * same emulators (see src/lib/firebase.ts).
 */

const PORT = Number(process.env.E2E_PORT ?? 3100)
const BASE_URL = `http://127.0.0.1:${PORT}`
const PROJECT_ID = 'demo-mcarthur'

// Env shared by the Next dev server under test. Demo project id keeps the
// emulator fully offline; the api key is a placeholder the client SDK accepts.
const webServerEnv: Record<string, string> = {
  NEXT_PUBLIC_FIREBASE_USE_EMULATOR: 'true',
  NEXT_PUBLIC_FIREBASE_EMULATOR_HOST: '127.0.0.1',
  NEXT_PUBLIC_FIREBASE_PROJECT_ID: PROJECT_ID,
  NEXT_PUBLIC_FIREBASE_API_KEY: 'demo-api-key',
  NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: `${PROJECT_ID}.firebaseapp.com`,
  NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: `${PROJECT_ID}.appspot.com`,
  NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: '000000000000',
  NEXT_PUBLIC_FIREBASE_APP_ID: '1:000000000000:web:0000000000000000000000',
  GCLOUD_PROJECT: PROJECT_ID,
  // The admin SDK reads these from emulators:exec, but pass them through to the
  // dev server explicitly so server components/actions hit the emulator too.
  FIRESTORE_EMULATOR_HOST: '127.0.0.1:8080',
  FIREBASE_AUTH_EMULATOR_HOST: '127.0.0.1:9099',
  FIREBASE_STORAGE_EMULATOR_HOST: '127.0.0.1:9199',
}

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL: BASE_URL,
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        // Use the env-provided Chromium when present (see resolver above);
        // otherwise Playwright uses its managed browser.
        ...(chromiumExecutable ? { launchOptions: { executablePath: chromiumExecutable } } : {}),
      },
    },
  ],
  webServer: {
    command: `next dev --port ${PORT}`,
    url: BASE_URL,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    env: webServerEnv,
  },
})
