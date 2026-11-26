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
  plugins: ['@stryker-mutator/*', './scripts/stryker/classNameIgnorer.mjs'],
  ignorers: ['class-names'],
  // The coverage list from vitest.config.ts minus visual components and the app root.
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
    '!src/core/ui/BottomSheet.tsx',
    '!src/core/ui/Checkbox.tsx',
    '!src/core/ui/DropIndicator.tsx',
    '!src/core/ui/FilterButton.tsx',
    '!src/core/ui/LabelChip.tsx',
    '!src/core/ui/LabelRow.tsx',
    '!src/core/ui/Option.tsx',
    '!src/core/ui/Panel.tsx',
    '!src/core/ui/Popover.tsx',
    '!src/core/ui/Swatch.tsx',
    '!src/app/App.tsx',
    '!src/app/BlankPage.tsx',
    '!src/core/ui/Logo.tsx',
    '!src/core/ui/Brand.tsx',
    '!src/core/ui/Spinner.tsx',
    '!src/features/boards/components/BoardListSkeletons.tsx',
    '!src/features/boards/boardView/components/BoardSkeleton.tsx',
  ],
  ignoreStatic: true,
  incremental: true,
  incrementalFile: 'reports/mutation/stryker-incremental.json',
  reporters: ['clear-text', 'progress', 'html'],
  htmlReporter: { fileName: 'reports/mutation/mutation.html' },
  thresholds: { high: 80, low: 60, break: minScoreFromEnv() },
  tempDirName: '.stryker-tmp',
  ignorePatterns: ['dist', 'coverage', 'reports'],
}

export default config
