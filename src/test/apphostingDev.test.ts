import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { describe, it, expect } from 'vitest'

// MCA-44 — DONE. Guard for `apphosting.dev.yaml`, which YAML can't self-document.
//
// WHY this test exists: the dev backend builds from the same repo as the live
// mcarthur-tour backend, whose apphosting.yaml references mcarthur-tour values
// and Secret Manager secrets that don't exist in mcarthur-web-dev. If a variable
// is added to the base file without a blank override here, dev either fails to
// build (missing secret) or silently runs against mcarthur-tour.

type EnvEntry = { variable: string; value?: string; secret?: string }

// Minimal reader for the `env:` list shape App Hosting uses. A real YAML parser
// is only a transitive dependency here, so this avoids relying on it.
function readEnv(file: string): EnvEntry[] {
  const text = readFileSync(fileURLToPath(new URL(`../../${file}`, import.meta.url)), 'utf8')
  const entries: EnvEntry[] = []
  for (const line of text.split('\n')) {
    const variable = line.match(/^\s*-\s*variable:\s*(\S+)/)
    if (variable) {
      entries.push({ variable: variable[1] })
      continue
    }
    const field = line.match(/^\s+(value|secret):\s*(.*?)\s*$/)
    if (field && entries.length > 0) {
      entries[entries.length - 1][field[1] as 'value' | 'secret'] = field[2].replace(/^"(.*)"$/, '$1')
    }
  }
  return entries
}

const base = readEnv('apphosting.yaml')
const dev = readEnv('apphosting.dev.yaml')
const devByName = new Map(dev.map((e) => [e.variable, e]))

describe('apphosting.dev.yaml', () => {
  it('reads the base file (sanity check for the parser)', () => {
    expect(base.map((e) => e.variable)).toContain('FIREBASE_SERVICE_ACCOUNT_JSON')
  })

  it.each(base.map((e) => [e.variable]))('blanks %s from the legacy base config', (name) => {
    const override = devByName.get(name)
    expect(override, `${name} needs an override in apphosting.dev.yaml`).toBeDefined()
    expect(override?.value).toBe('')
  })

  it('references no secrets (dev is keyless and uses injected config)', () => {
    expect(dev.filter((e) => e.secret !== undefined)).toEqual([])
  })

  it('never points the client SDK at an emulator', () => {
    expect(devByName.get('NEXT_PUBLIC_FIREBASE_USE_EMULATOR')?.value).toBe('false')
    for (const name of ['FIRESTORE_EMULATOR_HOST', 'FIREBASE_AUTH_EMULATOR_HOST', 'FIREBASE_STORAGE_EMULATOR_HOST']) {
      expect(devByName.has(name)).toBe(false)
    }
  })

  it('never mentions the legacy or emulator project ids', () => {
    for (const entry of dev) {
      expect(entry.value ?? '').not.toMatch(/mcarthur-tour|demo-mcarthur/)
    }
  })
})
