import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, it, expect } from 'vitest'

// Guard: nothing under src/ may import next.config. The App Hosting adapter
// swaps next.config.ts for a wrapper without a default export during its build,
// so such an import breaks `next build`'s type check on App Hosting only; CI and
// local builds still pass (it broke the dev and uat rollouts after MCA-130).
// Put testable config logic in src/lib/firebaseConfig.ts instead.
function sourceFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name)
    if (entry.isDirectory()) return sourceFiles(path)
    return /\.(ts|tsx)$/.test(entry.name) ? [path] : []
  })
}

describe('next.config imports', () => {
  it('no file under src/ imports next.config', () => {
    const offenders = sourceFiles('src').filter((file) =>
      /from\s+['"][./]*next\.config['"]|import\(\s*['"][./]*next\.config['"]/.test(
        readFileSync(file, 'utf8'),
      ),
    )
    expect(offenders).toEqual([])
  })
})
