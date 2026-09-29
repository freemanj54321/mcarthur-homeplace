import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { describe, it, expect } from 'vitest'

// MCA-113 — DONE. Static guard for `storage.rules`: every path editors can
// write from the browser must cap size and require an image content type.
// `photos/**` shipped without these limits while `pages/**` and `content/**`
// had them. This isn't a rules-engine test (that needs the emulator, MCA-21);
// it only stops a limit from being dropped or a new path added without one.

const rulesPath = fileURLToPath(new URL('../../storage.rules', import.meta.url))
const rules = readFileSync(rulesPath, 'utf8')

/** `match /<path>/... { ... }` blocks, keyed by their first path segment. */
function matchBlocks(): Map<string, string> {
  const blocks = new Map<string, string>()
  const re = /match \/([^/{}\s]+)\/\{allPaths=\*\*\}\s*\{([^}]*)\}/g
  for (const m of rules.matchAll(re)) blocks.set(m[1], m[2])
  return blocks
}

describe('storage.rules', () => {
  const blocks = matchBlocks()

  it.each(['pages', 'content', 'photos'])('%s/** is declared', (path) => {
    expect(blocks.has(path)).toBe(true)
  })

  it.each([...blocks.entries()].filter(([, body]) => /allow write: if isEditor\(\)/.test(body)))(
    '%s/** caps editor uploads at 10 MB and image/*',
    (_path, body) => {
      expect(body).toContain('request.resource.size < 10 * 1024 * 1024')
      expect(body).toContain("request.resource.contentType.matches('image/.*')")
    },
  )

  it('denies everything else by default', () => {
    expect(rules).toMatch(/match \/\{allPaths=\*\*\}\s*\{\s*allow read, write: if false;/)
  })
})
