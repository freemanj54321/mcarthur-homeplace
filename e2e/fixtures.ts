/**
 * Fixture identifiers shared between the emulator seed (scripts/seed-emulator.mjs)
 * and the E2E specs. Keep these in sync with the seed script.
 *
 * Status: DONE for the active specs. TODO(MCA-20): add fixtures here as the
 * test.fixme flows are filled in (e.g. a second editor without allowlist
 * access for a negative-auth case, a draft project, a photo doc).
 */
export const SEED = {
  editor: {
    uid: 'e2e-editor',
    email: 'editor@example.com',
    displayName: 'E2E Editor',
  },
  publishedPage: { slug: 'e2e-published', title: 'E2E Published Page' },
  draftPage: { slug: 'e2e-draft', title: 'E2E Draft Page' },
  publishedProject: { slug: 'e2e-project', title: 'E2E Project' },
} as const
