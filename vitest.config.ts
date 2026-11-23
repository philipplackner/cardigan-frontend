import { defineConfig } from 'vitest/config'

// Workers inherit this, so every test runs in a non-UTC zone with DST.
process.env.TZ = 'Europe/Berlin'

export default defineConfig({
  resolve: { tsconfigPaths: true },
  test: {
    coverage: {
      enabled: false,
      provider: 'v8',
      include: ['src/**/*.{ts,tsx}'],
      exclude: [
        'src/**/*.test.{ts,tsx}',
        'src/testSetup.ts',
        'src/**/*.d.ts',
        'src/app/routeTree.gen.ts',
        'src/core/api/generated/**',
        'src/preview/**',
        '**/testing/**',
        'src/main.tsx',
      ],
      reporter: ['text-summary', 'html', 'cobertura'],
      reportsDirectory: 'coverage',
      // scripts/coverage.ts reads a missing Cobertura file as "tests failed".
      reportOnFailure: false,
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
          name: 'dom',
          environment: 'jsdom',
          include: ['src/**/*.test.tsx'],
          setupFiles: ['src/testSetup.ts'],
        },
      },
    ],
  },
})
