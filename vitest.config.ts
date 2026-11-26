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
        'src/core/ui/icons/**',
        'src/core/ui/BottomSheet.tsx',
        'src/core/ui/Checkbox.tsx',
        'src/core/ui/DropIndicator.tsx',
        'src/core/ui/FilterButton.tsx',
        'src/core/ui/LabelChip.tsx',
        'src/core/ui/LabelRow.tsx',
        'src/core/ui/Option.tsx',
        'src/core/ui/Panel.tsx',
        'src/core/ui/Popover.tsx',
        'src/core/ui/Swatch.tsx',
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
          include: ['src/**/*.test.ts', 'scripts/**/*.test.ts'],
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
