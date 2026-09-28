import { describe, it, expect } from 'vitest'
import { readApphostingFile, readEnv } from './apphostingEnv'

// MCA-44 — DONE. Guards for the foundation backends' env files:
// apphosting.{dev,uat,prod}.yaml (mcarthur-web-<env>, Environment = <env>).
//
// WHY: each foundation env must take its Firebase config from App Hosting's
// injection and run keyless. A Firebase value would override the injected
// config, and a secret would fail the build (none exist in those projects; keys
// are blocked by org policy, MCA-67). The three files must also stay in step,
// so what passes in dev is what runs in uat and prod. The one sanctioned
// difference is the donations feature flag (MCA-71): on in dev/uat, off in prod.

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

// Variables allowed to differ between the three files, with each env's value.
const PER_ENV: Record<string, Record<(typeof ENVS)[number], string>> = {
  NEXT_PUBLIC_DONATIONS_ENABLED: { dev: 'true', uat: 'true', prod: 'false' },
  NEXT_PUBLIC_DESIGN_TOOLS_ENABLED: { dev: 'true', uat: 'true', prod: 'false' },
}

describe('foundation env files stay in step', () => {
  it('dev, uat, and prod declare identical env entries apart from per-env flags', () => {
    const shared = (env: string) => readEnv(`apphosting.${env}.yaml`).filter((e) => !(e.variable in PER_ENV))
    const [dev, ...others] = ENVS.map(shared)
    for (const entries of others) {
      expect(entries).toEqual(dev)
    }
  })

  it.each(ENVS)('%s sets each per-env flag to its expected value, at build and runtime', (env) => {
    const byName = new Map(readEnv(`apphosting.${env}.yaml`).map((e) => [e.variable, e]))
    for (const [variable, values] of Object.entries(PER_ENV)) {
      expect(byName.get(variable), `${env}: ${variable}`).toEqual({
        variable,
        value: values[env],
        availability: '[BUILD, RUNTIME]',
      })
    }
  })

  it('keeps donations off in prod (MCA-71: prototype, no payment backend)', () => {
    const prod = readEnv('apphosting.prod.yaml').find((e) => e.variable === 'NEXT_PUBLIC_DONATIONS_ENABLED')
    expect(prod?.value).toBe('false')
  })

  it('keeps the design tools off in prod (MCA-91: dev/uat review only)', () => {
    const prod = readEnv('apphosting.prod.yaml').find((e) => e.variable === 'NEXT_PUBLIC_DESIGN_TOOLS_ENABLED')
    expect(prod?.value).toBe('false')
  })
})
