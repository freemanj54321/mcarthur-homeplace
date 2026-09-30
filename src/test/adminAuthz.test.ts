import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, it, expect } from 'vitest'

// MCA-21 — authorization guard. Every admin page and every server action must
// check the editor itself: the /admin proxy only redirects signed-out visitors
// (and can be bypassed, cf. the Next.js advisory patched in MCA-110), and
// server actions are callable directly over HTTP. Static check, so a new page
// or action that forgets requireEditor() fails CI.

const root = fileURLToPath(new URL('../../', import.meta.url))
const adminDir = join(root, 'src/app/admin')

function files(dir: string, name: string): string[] {
  return readdirSync(dir).flatMap((entry) => {
    const path = join(dir, entry)
    if (statSync(path).isDirectory()) return files(path, name)
    return entry === name ? [path] : []
  })
}

const rel = (p: string) => relative(root, p)

describe('admin authorization', () => {
  const pages = files(adminDir, 'page.tsx').filter((p) => !p.includes('/login/'))
  const actionFiles = files(adminDir, 'actions.ts')

  it('finds the admin surface (sanity)', () => {
    expect(pages.length).toBeGreaterThan(10)
    expect(actionFiles.length).toBeGreaterThanOrEqual(4)
  })

  it.each(pages.map(rel))('%s calls requireEditor()', (page) => {
    expect(readFileSync(join(root, page), 'utf8')).toMatch(/await requireEditor\(\)/)
  })

  it.each(actionFiles.map(rel))('%s: every exported action checks the editor first', (file) => {
    const source = readFileSync(join(root, file), 'utf8')
    expect(source.startsWith("'use server'")).toBe(true)
    const actions = source.split(/\nexport async function /).slice(1)
    expect(actions.length).toBeGreaterThan(0)
    for (const body of actions) {
      const name = body.slice(0, body.indexOf('('))
      // The first awaited call in the body must be the editor check.
      const firstAwait = body.match(/await ([\w.]+)\(/)?.[1]
      expect(firstAwait, `${file} → ${name}`).toBe('requireEditor')
    }
  })
})
