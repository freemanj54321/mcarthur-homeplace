import { describe, it, expect } from 'vitest'
import { readEnv } from './apphostingEnv'

// MCA-44 — DONE. Guard for `apphosting.dev.yaml` (mcarthur-web-dev, Environment = `dev`).
//
// WHY: dev must take its Firebase config from App Hosting's injection and run
// keyless. Any Firebase value here would override the injected config, and any
// secret would fail the build, since none exist in the foundation projects.

const dev = readEnv('apphosting.dev.yaml')
const devByName = new Map(dev.map((e) => [e.variable, e]))

describe('apphosting.dev.yaml', () => {
  it('sets no Firebase config or credentials (injected config + keyless)', () => {
    const firebaseVars = dev.filter(
      (e) => e.variable.startsWith('NEXT_PUBLIC_FIREBASE_') && e.variable !== 'NEXT_PUBLIC_FIREBASE_USE_EMULATOR',
    )
    expect(firebaseVars).toEqual([])
    expect(devByName.has('FIREBASE_SERVICE_ACCOUNT_JSON')).toBe(false)
  })

  it('references no secrets', () => {
    expect(dev.filter((e) => e.secret !== undefined)).toEqual([])
  })

  it('never points the client SDK at an emulator', () => {
    expect(devByName.get('NEXT_PUBLIC_FIREBASE_USE_EMULATOR')?.value).toBe('false')
    for (const name of ['FIRESTORE_EMULATOR_HOST', 'FIREBASE_AUTH_EMULATOR_HOST', 'FIREBASE_STORAGE_EMULATOR_HOST']) {
      expect(devByName.has(name)).toBe(false)
    }
  })

  it('gives every entry a non-empty value (App Hosting rejects `value: ""`)', () => {
    for (const entry of dev) {
      expect(entry.value ?? entry.secret, entry.variable).toBeTruthy()
    }
  })

  it('never mentions the legacy or emulator project ids', () => {
    for (const entry of dev) {
      expect(entry.value ?? '').not.toMatch(/mcarthur-tour|demo-mcarthur/)
    }
  })
})
