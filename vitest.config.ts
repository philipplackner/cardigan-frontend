import { defineConfig } from 'vitest/config'

// Workers inherit this, so every test runs in a non-UTC zone with DST.
process.env.TZ = 'Europe/Berlin'

export default defineConfig({
  resolve: { tsconfigPaths: true },
  test: {
    environment: 'node',
    include: ['src/**/*.test.{ts,tsx}'],
  },
})
