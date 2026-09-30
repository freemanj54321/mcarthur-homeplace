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
      // The admin server actions + structured registry are the only write
      // path, so they're gated too (MCA-115).
      include: [
        'src/lib/**/*.ts',
        'src/app/admin/**/actions.ts',
        'src/app/admin/structured/registry.ts',
      ],
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
      // Raised 2026-09-29 by MCA-113 (first photosAdmin.ts tests).
      // Actuals then: 87.4 lines / 90 functions / 87.12 statements /
      // 83.89 branches.
      // Raised 2026-09-29 by MCA-111 (dead src/lib/photos.ts removed, photo
      // schema moved into content-schema). Actuals then: 89.35 lines /
      // 92.64 functions / 89.05 statements / 83.89 branches.
      // Raised 2026-09-29 by MCA-112 (navigation schema tests). Actuals then:
      // 89.54 lines / 92.64 functions / 89.19 statements / 84.57 branches.
      // Raised 2026-09-29 by MCA-115 (admin server actions + registry added to
      // the gate, with tests). Actuals then: 90.61 lines / 94.93 functions /
      // 90.4 statements / 85.45 branches.
      // Raised 2026-09-30 by MCA-29 (seed-editor argument checks + tests).
      // Actuals then: 90.63 lines / 94.11 functions / 90.47 statements /
      // 86.19 branches.
      // Raised 2026-09-30 by MCA-114 (first tests for lib/auth: server, client,
      // session route). Actuals then: 95.94 lines / 98.24 functions /
      // 95.52 statements / 89.42 branches.
      // Raised 2026-09-30 by MCA-32 (logged fallbacks + failure-path tests).
      // Actuals then: 96.21 lines / 98.26 functions / 95.77 statements /
      // 89.9 branches.
      thresholds: {
        lines: 95,
        functions: 97,
        statements: 94,
        branches: 88,
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
