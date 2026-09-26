import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { describe, it, expect } from 'vitest'

// MCA-38 — DONE. Guard for `.firebaserc`, which JSON can't self-document.
//
// WHY this test exists: every CLI deploy (`firebase deploy --project <alias>`)
// resolves its target through these aliases, so a typo'd or swapped id would
// push rules/indexes to the wrong environment. Project ids are immutable, so
// the expected values are pinned here rather than derived.

const firebasercPath = fileURLToPath(new URL('../../.firebaserc', import.meta.url))
const { projects } = JSON.parse(readFileSync(firebasercPath, 'utf8')) as {
  projects: Record<string, string>
}

describe('.firebaserc', () => {
  it.each([
    ['dev', 'mcarthur-web-dev'],
    ['uat', 'mcarthur-web-uat'],
    ['prod', 'mcarthur-web-prod'],
  ])('maps the %s alias to %s', (alias, projectId) => {
    expect(projects[alias]).toBe(projectId)
  })

  // WHY no default: with no `default` alias the CLI refuses to run without an
  // explicit `--project`, so no command can land in an environment by accident.
  // (`mcarthur-tour` lives in a personal account the foundation login can't see,
  // so it was never a usable default anyway.)
  it('has no default alias, forcing an explicit --project', () => {
    expect(projects).not.toHaveProperty('default')
  })

  // TODO(MCA-59): remove the `legacy` alias once mcarthur-tour is decommissioned.
  // Until then it is the content-migration source (MCA-47/48/49).
  it('maps the legacy alias to the old mcarthur-tour project', () => {
    expect(projects.legacy).toBe('mcarthur-tour')
  })

  it('never targets an emulator-only demo- project', () => {
    // `demo-*` ids are emulator-only (E2E uses demo-mcarthur via --project).
    for (const id of Object.values(projects)) {
      expect(id.startsWith('demo-')).toBe(false)
    }
  })
})
