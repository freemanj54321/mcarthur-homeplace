import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { describe, it, expect } from 'vitest'

// MCA-35 — DONE. Dependabot must follow the promotion rule: its PRs go into
// `develop` like any feature. Left unset, it targets the default branch
// (`master`, which deploys production), skipping develop and uat.

const config = readFileSync(fileURLToPath(new URL('../../.github/dependabot.yml', import.meta.url)), 'utf8')

describe('dependabot.yml', () => {
  it('covers npm and GitHub Actions', () => {
    expect(config).toMatch(/package-ecosystem: npm/)
    expect(config).toMatch(/package-ecosystem: github-actions/)
  })

  it('targets develop for every ecosystem, never master', () => {
    const ecosystems = config.match(/package-ecosystem:/g)?.length ?? 0
    expect(config.match(/target-branch: develop/g)?.length).toBe(ecosystems)
    expect(config).not.toMatch(/target-branch: (master|uat)/)
  })
})
