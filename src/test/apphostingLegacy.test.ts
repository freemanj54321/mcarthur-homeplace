import { describe, it, expect } from 'vitest'
import { readApphostingFile, readEnv, type EnvEntry } from './apphostingEnv'

// MCA-44 — DONE. Guards for `apphosting.yaml` (shared) and
// `apphosting.legacy.yaml` (live mcarthur-tour backend, Environment = `legacy`).
//
// WHY: the live site now reads its project values and Secret Manager references
// from the legacy file only. If an entry is dropped there, the live site builds
// with missing config. If anything creeps back into the shared base file, every
// foundation backend fails to build (a missing secret) or silently runs against
// mcarthur-tour.

// The mcarthur-tour config as it stood before the move. Pinned here so the live
// site stays protected now that the base file no longer carries it.
const LEGACY_CONFIG: EnvEntry[] = [
  { variable: 'NEXT_PUBLIC_FIREBASE_PROJECT_ID', value: 'mcarthur-tour', availability: '[BUILD, RUNTIME]' },
  {
    variable: 'NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET',
    value: 'mcarthur-tour.firebasestorage.app',
    availability: '[BUILD, RUNTIME]',
  },
  { variable: 'NEXT_PUBLIC_FIREBASE_API_KEY', secret: 'NEXT_PUBLIC_FIREBASE_API_KEY', availability: '[BUILD, RUNTIME]' },
  { variable: 'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN', secret: 'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN', availability: '[BUILD, RUNTIME]' },
  {
    variable: 'NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID',
    secret: 'NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID',
    availability: '[BUILD, RUNTIME]',
  },
  { variable: 'NEXT_PUBLIC_FIREBASE_APP_ID', secret: 'NEXT_PUBLIC_FIREBASE_APP_ID', availability: '[BUILD, RUNTIME]' },
  { variable: 'NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID', secret: 'NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID', availability: '[BUILD, RUNTIME]' },
  { variable: 'FIREBASE_SERVICE_ACCOUNT_JSON', secret: 'FIREBASE_SERVICE_ACCOUNT_JSON', availability: '[RUNTIME]' },
]

describe('apphosting.legacy.yaml', () => {
  it('carries exactly the live mcarthur-tour config', () => {
    expect(readEnv('apphosting.legacy.yaml')).toEqual(LEGACY_CONFIG)
  })
})

describe('apphosting.yaml (shared base)', () => {
  it('declares no env vars, so nothing environment-specific leaks into every backend', () => {
    expect(readEnv('apphosting.yaml')).toEqual([])
  })

  it('never mentions the legacy or emulator project ids', () => {
    const withoutComments = readApphostingFile('apphosting.yaml').replace(/#.*$/gm, '')
    expect(withoutComments).not.toMatch(/mcarthur-tour|demo-mcarthur/)
  })

  it('keeps the shared runtime limits', () => {
    const text = readApphostingFile('apphosting.yaml')
    expect(text).toMatch(/^runConfig:/m)
    expect(text).toMatch(/maxInstances:\s*2/)
  })
})
