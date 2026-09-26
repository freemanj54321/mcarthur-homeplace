import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { describe, it, expect } from 'vitest'

// MCA-44 — DONE. Guard for `apphosting.legacy.yaml`, which YAML can't self-document.
//
// WHY this test exists: the live mcarthur-tour backend is moving from the shared
// apphosting.yaml to this file (Environment = `legacy`). Every entry it relies
// on must be here with exactly the same value/secret, or the live site builds
// with missing or different config once the base entries are removed.

type EnvEntry = { variable: string; value?: string; secret?: string; availability?: string }

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
    const field = line.match(/^\s+(value|secret|availability):\s*(.*?)\s*$/)
    if (field && entries.length > 0) {
      const key = field[1] as 'value' | 'secret' | 'availability'
      entries[entries.length - 1][key] = field[2].replace(/^"(.*)"$/, '$1')
    }
  }
  return entries
}

// The mcarthur-tour config as it stood before the move (MCA-44). Pinned here so
// the test still protects the live site after the base file is emptied.
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

const legacy = readEnv('apphosting.legacy.yaml')

describe('apphosting.legacy.yaml', () => {
  it('carries exactly the live mcarthur-tour config', () => {
    expect(legacy).toEqual(LEGACY_CONFIG)
  })

  it('matches every mcarthur-tour entry still in the base file (no drift during the move)', () => {
    const legacyByName = new Map(legacy.map((e) => [e.variable, e]))
    for (const entry of readEnv('apphosting.yaml')) {
      expect(legacyByName.get(entry.variable), entry.variable).toEqual(entry)
    }
  })
})
