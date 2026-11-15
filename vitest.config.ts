import { defineConfig } from 'vitest/config'

// Workers inherit this, so every test runs in a non-UTC zone with DST.
process.env.TZ = 'Europe/Berlin'

export default defineConfig({
  resolve: { tsconfigPaths: true },
  test: {
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
