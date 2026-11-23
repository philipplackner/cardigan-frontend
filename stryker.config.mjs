const MIN_SCORE_PATTERN = /^\d+(\.\d+)?$/

function minScoreFromEnv() {
  const raw = process.env.MUTATION_MIN_SCORE
  if (raw === undefined || raw === '') return null
  const value = Number(raw)
  if (!MIN_SCORE_PATTERN.test(raw) || value > 100) {
    throw new Error(
      `MUTATION_MIN_SCORE must be a number from 0 to 100, got "${raw}"`,
    )
  }
  return value
}

/** @type {import('@stryker-mutator/api/core').PartialStrykerOptions} */
const config = {
  testRunner: 'vitest',
  vitest: { configFile: 'vitest.config.ts' },
  coverageAnalysis: 'perTest',
  // Keep in sync with coverage.exclude in vitest.config.ts.
  mutate: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.test.{ts,tsx}',
    '!src/testSetup.ts',
    '!src/**/*.d.ts',
    '!src/app/routeTree.gen.ts',
    '!src/core/api/generated/**',
    '!src/preview/**',
    '!src/**/testing/**',
    '!src/main.tsx',
    '!src/core/ui/icons/**',
  ],
  ignoreStatic: true,
  incremental: false,
  incrementalFile: 'reports/mutation/stryker-incremental.json',
  reporters: ['clear-text', 'progress', 'html'],
  htmlReporter: { fileName: 'reports/mutation/mutation.html' },
  thresholds: { high: 80, low: 60, break: minScoreFromEnv() },
  tempDirName: '.stryker-tmp',
  ignorePatterns: ['dist', 'coverage', 'reports'],
}

export default config
