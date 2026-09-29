// MCA-44 — where each Firebase SDK gets its configuration.
//
// Deliberately SDK-free (no `firebase` / `firebase-admin` imports) so the
// decisions can be unit-tested, and so `next.config.ts` can import it at build
// time. `src/lib/firebase.ts` and `src/lib/firebase-admin.ts` stay thin and
// just act on what this module decides.
//
// WHY two sources: on Firebase App Hosting the platform injects the config
// (`FIREBASE_WEBAPP_CONFIG` for the JS SDK, `FIREBASE_CONFIG` for the Admin
// SDK), so the foundation environments need no config values or secrets.
// Everywhere else (local dev, E2E against the emulator, the CI build, and the
// legacy `mcarthur-tour` backend until cutover) explicit NEXT_PUBLIC_FIREBASE_*
// values are still provided, and those take precedence.
// Docs: https://firebase.google.com/docs/app-hosting/firebase-sdks

export type WebAppConfig = {
  apiKey?: string
  authDomain?: string
  projectId?: string
  storageBucket?: string
  messagingSenderId?: string
  appId?: string
  measurementId?: string
}

export type Env = Record<string, string | undefined>

/**
 * True when explicit NEXT_PUBLIC_FIREBASE_* config was provided. The API key is
 * the one field every explicit setup has and App Hosting-only setups don't.
 *
 * WHY the caller builds the object: Next.js only inlines `process.env.NEXT_PUBLIC_*`
 * into the browser bundle when each variable is referenced literally, so
 * `firebase.ts` must spell them out rather than pass `process.env` in here.
 */
export function hasExplicitWebConfig(config: WebAppConfig): boolean {
  return Boolean(config.apiKey)
}

/**
 * Parses a Firebase config env var (`FIREBASE_WEBAPP_CONFIG` / `FIREBASE_CONFIG`).
 * App Hosting provides these as inline JSON. Both SDKs also accept a file path,
 * but nothing here needs that form, so anything that isn't a JSON object yields
 * null rather than throwing during a build.
 */
export function parseFirebaseConfigEnv(raw: string | undefined): WebAppConfig | null {
  const trimmed = raw?.trim()
  if (!trimmed?.startsWith('{')) return null
  try {
    // Starts with `{`, so a successful parse is always a plain object.
    return JSON.parse(trimmed) as WebAppConfig
  } catch {
    return null
  }
}

/**
 * The Storage bucket for this environment. Explicit config wins (same
 * precedence as the SDK init), then the App Hosting-injected configs.
 */
export function resolveStorageBucket(env: Env): string | undefined {
  return (
    env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ||
    parseFirebaseConfigEnv(env.FIREBASE_WEBAPP_CONFIG)?.storageBucket ||
    parseFirebaseConfigEnv(env.FIREBASE_CONFIG)?.storageBucket ||
    undefined
  )
}

/**
 * True only for E2E builds wired to the Emulator Suite. There, Storage download
 * URLs are `http://127.0.0.1:9199/...`, which `next/image` refuses to optimize
 * (not in `remotePatterns`, and Next 16 blocks local IPs by default). Serving
 * images unoptimized in that mode avoids opening the optimizer to local IPs.
 * The flag is never set in a deployed environment (ONBOARDING, emulator-only
 * variables), and anything but exactly "true" is off, so deployed builds keep
 * full optimization.
 */
export function usesEmulatorImages(env: Env): boolean {
  return env.NEXT_PUBLIC_FIREBASE_USE_EMULATOR === 'true'
}

/** `next/image` remote pattern for this environment's Storage download URLs. */
export function storageRemotePatterns(bucket: string | undefined) {
  // No bucket means no Firebase config at build time at all. Allowing no remote
  // images is the safe failure: nothing else would work in that build either.
  if (!bucket) return []
  return [
    {
      protocol: 'https' as const,
      hostname: 'firebasestorage.googleapis.com',
      pathname: `/v0/b/${bucket}/**`,
    },
  ]
}

export type AdminInitMode = 'emulator' | 'serviceAccount' | 'appHosting' | 'applicationDefault'

/**
 * How `firebase-admin.ts` should initialize, in priority order:
 * - `emulator`: FIRESTORE_EMULATOR_HOST is set (E2E, seed scripts). Never in a
 *   deployed environment; see the ONBOARDING emulator-variable warning.
 * - `serviceAccount`: FIREBASE_SERVICE_ACCOUNT_JSON is set. Keeps the legacy
 *   `mcarthur-tour` backend and key-based local dev working unchanged.
 * - `appHosting`: FIREBASE_CONFIG is injected, so no-arg `initializeApp()` uses
 *   it plus the backend's own service account. Keyless (MCA-39).
 * - `applicationDefault`: nothing injected. Local dev using
 *   `gcloud auth application-default login` instead of a key file.
 */
export function adminInitMode(env: Env): AdminInitMode {
  if (env.FIRESTORE_EMULATOR_HOST) return 'emulator'
  if (env.FIREBASE_SERVICE_ACCOUNT_JSON) return 'serviceAccount'
  if (env.FIREBASE_CONFIG) return 'appHosting'
  return 'applicationDefault'
}
