/**
 * Fixture identifiers shared between the emulator seed (scripts/seed-emulator.mjs)
 * and the E2E specs. Keep these in sync with the seed script.
 *
 * Status: DONE (MCA-148). Add fixtures here as new flows need them.
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
  /** Seeded in this order; the reorder test swaps them. */
  milestones: ['E2E Milestone First', 'E2E Milestone Second'],
} as const
