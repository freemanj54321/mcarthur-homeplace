/**
 * Fixture identifiers shared between the emulator seed (scripts/seed-emulator.mjs)
 * and the E2E specs. Keep these in sync with the seed script.
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
