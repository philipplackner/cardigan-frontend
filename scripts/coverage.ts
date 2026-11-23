import { spawnSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { parseCoverageArgs, toVitestArgs } from './coverageArgs.ts'

const repoRoot = path.resolve(import.meta.dirname, '..')

function fail(message: string): never {
  console.error(`coverage: ${message}`)
  process.exit(2)
}

function isDirectory(dir: string) {
  try {
    return fs.statSync(path.join(repoRoot, dir)).isDirectory()
  } catch {
    return false
  }
}

const parsed = parseCoverageArgs(process.argv.slice(2), repoRoot)
if (!parsed.ok) fail(parsed.error)
const { options } = parsed

for (const dir of options.dirs) {
  if (!isDirectory(dir)) fail(`"${dir}" is not a directory.`)
}

const vitest = spawnSync(
  process.execPath,
  [
    path.join(repoRoot, 'node_modules/vitest/vitest.mjs'),
    ...toVitestArgs(options),
  ],
  { cwd: repoRoot, stdio: 'inherit' },
)
if (vitest.error) fail(`could not start Vitest: ${vitest.error.message}`)
process.exit(vitest.status ?? 1)
