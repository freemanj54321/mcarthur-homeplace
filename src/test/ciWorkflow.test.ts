import { existsSync, readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { describe, it, expect } from 'vitest'

// MCA-45 — DONE. Guards for .github/workflows/ci.yml, the one CI gate for all
// three environment branches.
//
// WHY: a gate that silently stops running on a branch, points the build at a
// real project, or pulls in a credential is a regression nobody notices until
// it matters. Text checks are enough; the workflow is small and a YAML parser is
// only a transitive dependency here.

const root = new URL('../../', import.meta.url)
const read = (path: string) => readFileSync(fileURLToPath(new URL(path, root)), 'utf8')
const ci = read('.github/workflows/ci.yml')
// Comments may name the legacy project for history; only config lines count.
const ciConfig = ci
  .split('\n')
  .filter((line) => !line.trimStart().startsWith('#'))
  .join('\n')

/** The branch list under `<event>:` → `branches: [...]`. */
function branchesFor(event: 'pull_request' | 'push'): string[] {
  const match = ci.match(new RegExp(`\\n  ${event}:\\n    branches: \\[([^\\]]*)\\]`))
  return match ? match[1].split(',').map((b) => b.trim()) : []
}

describe('ci.yml', () => {
  it.each(['pull_request', 'push'] as const)('runs on %s for develop, uat, and master', (event) => {
    expect(branchesFor(event).sort()).toEqual(['develop', 'master', 'uat'])
  })

  it('is the only workflow (the old master-only pr-checks/deploy are gone)', () => {
    for (const old of ['pr-checks.yml', 'deploy.yml']) {
      expect(existsSync(fileURLToPath(new URL(`.github/workflows/${old}`, root))), old).toBe(false)
    }
  })

  it('keeps the job names branch protection requires (MCA-68)', () => {
    expect(ci).toContain('name: Lint, type check, test, build')
    expect(ci).toContain('name: E2E (emulator)')
  })

  it('runs the same gate as AGENTS.md, plus build, security rules and E2E', () => {
    for (const step of ['npm run lint', 'npx tsc --noEmit', 'npm run test:coverage', 'npm run build', 'npm run test:rules', 'npm run test:e2e']) {
      expect(ci).toContain(`run: ${step}`)
    }
  })

  it('never references the legacy project or any secret', () => {
    expect(ciConfig).not.toMatch(/mcarthur-tour/)
    // Build config is public (repository variables); no key belongs in CI.
    expect(ciConfig).not.toMatch(/secrets\./)
  })

  it('builds from repository variables, with the donations flag off only for master', () => {
    expect(ci).toMatch(/NEXT_PUBLIC_FIREBASE_PROJECT_ID: \$\{\{ vars\.NEXT_PUBLIC_FIREBASE_PROJECT_ID \}\}/)
    expect(ci).toContain(
      "NEXT_PUBLIC_DONATIONS_ENABLED: ${{ (github.base_ref || github.ref_name) == 'master' && 'false' || 'true' }}",
    )
  })

  it('pins E2E to the emulator project, never a real environment', () => {
    const pkg = JSON.parse(read('package.json')) as { scripts: Record<string, string> }
    expect(pkg.scripts['test:e2e']).toContain('--project demo-mcarthur')
    const e2eJob = ciConfig.slice(ciConfig.indexOf('name: E2E (emulator)'))
    expect(e2eJob).not.toMatch(/NEXT_PUBLIC_FIREBASE_|FIREBASE_SERVICE_ACCOUNT_JSON/)
    expect(e2eJob).toContain("java-version: '21'")
  })
})
