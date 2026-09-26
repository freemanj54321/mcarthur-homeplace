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
      // and their tests) from 24/33/24/23. Actuals then: 52.31 lines /
      // 58.69 functions / 51.75 statements / 48.1 branches.
      thresholds: {
        lines: 52,
        functions: 58,
        statements: 51,
        branches: 48,
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
