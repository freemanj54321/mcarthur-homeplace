import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, it, expect } from 'vitest'

// MCA-31 — DONE. `.env.example` is the local-setup template. Guard it so a new
// NEXT_PUBLIC_* variable can't ship undocumented, and the template never
// carries a real value or key.

const root = fileURLToPath(new URL('../../', import.meta.url))
const example = readFileSync(join(root, '.env.example'), 'utf8')

function sourceFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name)
    if (statSync(path).isDirectory()) return sourceFiles(path)
    return /\.(ts|tsx)$/.test(name) && !/\.test\.tsx?$/.test(name) ? [path] : []
  })
}

/** Every `process.env.NEXT_PUBLIC_*` the app reads (literal reads only). */
const publicVarsInCode = new Set(
  sourceFiles(join(root, 'src')).flatMap((file) =>
    [...readFileSync(file, 'utf8').matchAll(/process\.env\.(NEXT_PUBLIC_[A-Z0-9_]+)/g)].map((m) => m[1]),
  ),
)

describe('.env.example', () => {
  it('documents every NEXT_PUBLIC_* variable the app reads', () => {
    expect(publicVarsInCode.size).toBeGreaterThan(5)
    for (const name of publicVarsInCode) {
      expect(example, name).toMatch(new RegExp(`^#?\\s*${name}=`, 'm'))
    }
  })

  it('carries no secret values', () => {
    expect(example).toMatch(/^NEXT_PUBLIC_FIREBASE_API_KEY=$/m)
    expect(example).not.toMatch(/^FIREBASE_SERVICE_ACCOUNT_JSON=/m)
    expect(example).not.toMatch(/private_key|BEGIN PRIVATE KEY/)
  })

  it('keeps the emulator switches commented out', () => {
    for (const name of ['NEXT_PUBLIC_FIREBASE_USE_EMULATOR', 'FIRESTORE_EMULATOR_HOST']) {
      expect(example, name).not.toMatch(new RegExp(`^${name}=`, 'm'))
    }
  })
})
