import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { describe, it, expect } from 'vitest'

// MCA-64 — DONE. One Node major everywhere, and install scripts the build
// depends on stay approved.
//
// WHY: local, CI and App Hosting drifted onto three Node versions before, and
// npm's `allowScripts` is advisory today but "a future release will block
// unreviewed install scripts" (npm help approve-scripts). @firebase/util's
// postinstall bakes App Hosting's injected config into the SDK (ONBOARDING
// decision 4); if it stopped running, deployed builds would lose their
// Firebase config without any build error.

const root = new URL('../../', import.meta.url)
const read = (path: string) => readFileSync(fileURLToPath(new URL(path, root)), 'utf8')
const pkg = JSON.parse(read('package.json')) as {
  engines?: { node?: string }
  allowScripts?: Record<string, boolean>
  devDependencies: Record<string, string>
}
const nvmrc = read('.nvmrc').trim()
const ci = read('.github/workflows/ci.yml')

describe('Node version pin', () => {
  it('.nvmrc names one major and package.json engines matches it', () => {
    expect(nvmrc).toMatch(/^\d+$/)
    expect(pkg.engines?.node).toBe(`${nvmrc}.x`)
  })

  it('types match the runtime major', () => {
    expect(pkg.devDependencies['@types/node']).toBe(`^${nvmrc}`)
  })

  it('CI reads the version from .nvmrc and installs the exact lock', () => {
    expect(ci).not.toMatch(/node-version:\s/)
    expect(ci.match(/node-version-file: \.nvmrc/g)?.length).toBe(2)
    expect(ci).not.toMatch(/run: npm install\b/)
    expect(ci.match(/run: npm ci\b/g)?.length).toBe(2)
  })
})

describe('allowScripts', () => {
  it('approves the Firebase SDK config bake for every version (name-only)', () => {
    expect(pkg.allowScripts?.['@firebase/util']).toBe(true)
  })

  it('uses name-only entries, so dependency upgrades never silently drop approval', () => {
    for (const key of Object.keys(pkg.allowScripts ?? {})) {
      expect(key, key).not.toMatch(/.@\d/)
    }
  })
})
