import { defineConfig } from 'vitest/config'

// MCA-149: security-rules tests. They need the Firestore + Storage emulators,
// so they run separately from the unit suite: `npm run test:rules` wraps this
// config in `firebase emulators:exec`. DONE.
export default defineConfig({
  test: {
    include: ['rules-tests/**/*.test.ts'],
    environment: 'node',
    // Emulator round-trips (and a 10 MB upload) are slower than unit tests.
    testTimeout: 30_000,
    hookTimeout: 30_000,
    // One emulator, shared state: run files one after another.
    fileParallelism: false,
  },
})
