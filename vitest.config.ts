import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

const serverOnlyStub = fileURLToPath(new URL('./src/test/stubs/server-only.ts', import.meta.url))

export default defineConfig({
  plugins: [react()],
  resolve: {
    // Resolve the `@/*` path alias from tsconfig.json natively (Vite 4+).
    tsconfigPaths: true,
    alias: {
      // `server-only` throws when imported outside RSC bundling; stub it so
      // server modules can be unit-tested under Node. See src/test/stubs.
      'server-only': serverOnlyStub,
    },
  },
  test: {
    globals: true,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'text-summary', 'html', 'lcov'],
      reportsDirectory: './coverage',
      // The hard coverage gate covers the pure-logic library only. Components
      // (jsdom) and E2E are excluded from the gate for now — they are covered
      // qualitatively in WS2. Firebase init shims are env wiring, not logic.
      // Vitest 4 reports all files matching `include` by default (uncovered
      // files count toward the denominator), so the gate reflects the whole
      // lib surface, not just imported files.
      include: ['src/lib/**/*.ts'],
      exclude: ['src/lib/firebase.ts', 'src/lib/firebase-admin.ts', '**/*.d.ts'],
      // RATCHET FLOOR — NOT the target. New/changed code ships with its own
      // tests (see AGENTS.md), so these floors sit just under current actuals
      // and act as a no-regression ratchet. Raise them whenever coverage climbs;
      // the target remains ~70% as the lib backfill (Test Coverage & QA) lands.
      // Raised 2026-07-27 by MCA-26 (transport-agnostic read layer, pages fold,
      // and their tests) from 24/33/24/23.
      // Raised 2026-09-26 by MCA-62 after MCA-26 + MCA-44 (firebaseConfig.ts)
      // landed. Actuals then: 54.28 lines / 60.82 functions / 54.16 statements /
      // 51.75 branches.
      // Raised 2026-09-27 by MCA-71 (features.ts + first navigation.ts tests).
      // Actuals then: 67.49 lines / 69.9 functions / 66.66 statements /
      // 59.51 branches.
      // Raised 2026-09-27 by MCA-47 (content migration module + tests).
      // Actuals then: 76.4 lines / 75.78 functions / 75.9 statements /
      // 70.52 branches.
      // Raised 2026-09-28 by MCA-90 (unreferenced photo import + tests).
      // Actuals then: 79.16 lines / 77.85 functions / 79.2 statements /
      // 74.57 branches.
      thresholds: {
        lines: 79,
        functions: 77,
        statements: 79,
        branches: 74,
      },
    },
    projects: [
      {
        extends: true,
        test: {
          name: 'node',
          environment: 'node',
          include: ['src/**/*.test.ts'],
        },
      },
      {
        extends: true,
        test: {
          name: 'jsdom',
          environment: 'jsdom',
          setupFiles: ['./src/test/setup.ts'],
          include: ['src/**/*.test.tsx'],
        },
      },
    ],
  },
})
