import { describe, it, expect } from 'vitest'
import { readApphostingFile, readEnv } from './apphostingEnv'

// MCA-44 — DONE. Guards for the foundation backends' env files:
// apphosting.{dev,uat,prod}.yaml (mcarthur-web-<env>, Environment = <env>).
//
// WHY: each foundation env must take its Firebase config from App Hosting's
// injection and run keyless. A Firebase value would override the injected
// config, and a secret would fail the build (none exist in those projects; keys
// are blocked by org policy, MCA-67). The three files must also stay in step,
// so what passes in dev is what runs in uat and prod.

const ENVS = ['dev', 'uat', 'prod'] as const

describe.each(ENVS)('apphosting.%s.yaml', (env) => {
  const file = `apphosting.${env}.yaml`
  const entries = readEnv(file)
  const byName = new Map(entries.map((e) => [e.variable, e]))

  it('names its own project and Environment in the header', () => {
    const text = readApphostingFile(file)
    expect(text).toContain(`mcarthur-web-${env}`)
    expect(text).toContain(`is \`${env}\``)
  })

  it('sets no Firebase config or credentials (injected config + keyless)', () => {
    const firebaseVars = entries.filter(
      (e) => e.variable.startsWith('NEXT_PUBLIC_FIREBASE_') && e.variable !== 'NEXT_PUBLIC_FIREBASE_USE_EMULATOR',
    )
    expect(firebaseVars).toEqual([])
    expect(byName.has('FIREBASE_SERVICE_ACCOUNT_JSON')).toBe(false)
  })

  it('references no secrets', () => {
    expect(entries.filter((e) => e.secret !== undefined)).toEqual([])
  })

  it('never points the client SDK at an emulator', () => {
    expect(byName.get('NEXT_PUBLIC_FIREBASE_USE_EMULATOR')?.value).toBe('false')
    for (const name of ['FIRESTORE_EMULATOR_HOST', 'FIREBASE_AUTH_EMULATOR_HOST', 'FIREBASE_STORAGE_EMULATOR_HOST']) {
      expect(byName.has(name)).toBe(false)
    }
  })

  it('gives every entry a non-empty value (App Hosting rejects `value: ""`)', () => {
    for (const entry of entries) {
      expect(entry.value ?? entry.secret, entry.variable).toBeTruthy()
    }
  })

  it('never mentions the legacy or emulator project ids', () => {
    for (const entry of entries) {
      expect(entry.value ?? '').not.toMatch(/mcarthur-tour|demo-mcarthur/)
    }
  })
})

describe('foundation env files stay in step', () => {
  it('dev, uat, and prod declare identical env entries', () => {
    const [dev, ...others] = ENVS.map((env) => readEnv(`apphosting.${env}.yaml`))
    for (const entries of others) {
      expect(entries).toEqual(dev)
    }
  })
})
