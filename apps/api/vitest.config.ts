import { defineConfig } from 'vitest/config'

/**
 * Two projects form the lower two layers of the test pyramid:
 *   - `unit`        — pure logic (zod schemas), no I/O, runs anywhere.
 *   - `integration` — tRPC procedures against a real Postgres (`app_test`),
 *                     migrated once in global-setup. Files run serially since
 *                     they share one database and truncate between tests.
 */
export default defineConfig({
  test: {
    projects: [
      {
        test: {
          name: 'unit',
          environment: 'node',
          include: ['src/**/*.test.ts'],
        },
      },
      {
        test: {
          name: 'integration',
          environment: 'node',
          include: ['test/**/*.test.ts'],
          globalSetup: ['./test/global-setup.ts'],
          fileParallelism: false,
        },
      },
    ],
  },
})
