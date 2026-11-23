import { spawnSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import {
  COBERTURA_REPORT,
  DEFAULT_COMPARE_BRANCH,
  parseCoverageArgs,
  toDiffCoverArgs,
  toVitestArgs,
} from './coverageArgs.ts'

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

function run(command: string, args: string[], stdio: 'inherit' | 'ignore') {
  return spawnSync(command, args, { cwd: repoRoot, stdio })
}

const parsed = parseCoverageArgs(process.argv.slice(2), repoRoot)
if (!parsed.ok) fail(parsed.error)
const { options } = parsed

for (const dir of options.dirs) {
  if (!isDirectory(dir)) fail(`"${dir}" is not a directory.`)
}

const { compareBranch } = options
if (compareBranch !== undefined) {
  const ref = run(
    'git',
    ['rev-parse', '--verify', '--quiet', `${compareBranch}^{commit}`],
    'ignore',
  )
  if (ref.status !== 0) {
    const hint =
      compareBranch === DEFAULT_COMPARE_BRANCH
        ? ' Run git fetch, or pass --compare-branch=<ref>.'
        : ''
    fail(`"${compareBranch}" does not resolve to a commit.${hint}`)
  }
  if (run('uv', ['--version'], 'ignore').status !== 0) {
    fail('coverage:diff needs uv on the PATH: https://docs.astral.sh/uv/')
  }
  // Vitest can exit before it cleans the folder, and diff-cover must never read an old report.
  fs.rmSync(path.join(repoRoot, 'coverage'), { recursive: true, force: true })
}

const vitest = run(
  process.execPath,
  [
    path.join(repoRoot, 'node_modules/vitest/vitest.mjs'),
    ...toVitestArgs(options),
  ],
  'inherit',
)
if (vitest.error) fail(`could not start Vitest: ${vitest.error.message}`)
const vitestStatus = vitest.status ?? 1

if (compareBranch === undefined) process.exit(vitestStatus)

// reportOnFailure is off, so a missing report means a test failed.
if (!fs.existsSync(path.join(repoRoot, COBERTURA_REPORT))) {
  process.exit(vitestStatus === 0 ? 1 : vitestStatus)
}

const diffCover = run('uvx', toDiffCoverArgs(compareBranch), 'inherit')
if (diffCover.error) fail(`could not start uvx: ${diffCover.error.message}`)
process.exit(vitestStatus !== 0 ? vitestStatus : (diffCover.status ?? 1))
