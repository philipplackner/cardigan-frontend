import path from 'node:path'

export type CoverageOptions = {
  dirs: string[]
  lines?: number
  branches?: number
}

export type ParseResult =
  { ok: true; options: CoverageOptions } | { ok: false; error: string }

const THRESHOLD_OPTIONS = ['--lines', '--branches'] as const
type ThresholdOption = (typeof THRESHOLD_OPTIONS)[number]

const PERCENT = /^\d+(\.\d+)?$/

/**
 * Turns a directory argument into a path relative to `repoRoot`, using `/` as
 * the separator and without leading `./` or trailing slashes. Returns
 * `undefined` for the repository root itself and for paths outside it.
 */
export function normalizeDir(
  input: string,
  repoRoot: string,
): string | undefined {
  const relative = path.relative(repoRoot, path.resolve(repoRoot, input))
  if (
    relative === '' ||
    relative === '..' ||
    relative.startsWith(`..${path.sep}`) ||
    path.isAbsolute(relative)
  ) {
    return undefined
  }
  return relative.split(path.sep).join('/')
}

function parsePercent(
  option: string,
  value: string | undefined,
): { value: number } | { error: string } {
  if (value === undefined || value === '') {
    return { error: `${option} needs a value from 0 to 100.` }
  }
  const number = Number(value)
  if (!PERCENT.test(value) || number > 100) {
    return {
      error: `${option} must be a number from 0 to 100, got "${value}".`,
    }
  }
  return { value: number }
}

/**
 * Parses the arguments of `npm run coverage`. Doesn't touch the file system:
 * the caller checks that the directories exist.
 */
export function parseCoverageArgs(
  argv: readonly string[],
  repoRoot: string,
): ParseResult {
  const dirs: string[] = []
  const thresholds: Partial<Record<ThresholdOption, number>> = {}

  const args = argv[Symbol.iterator]()
  for (const arg of args) {
    if (arg.startsWith('-')) {
      const [name, inlineValue] = splitOption(arg)
      if (!isThresholdOption(name)) {
        return { ok: false, error: `Unknown option "${arg}".` }
      }
      if (thresholds[name] !== undefined) {
        return { ok: false, error: `${name} is given more than once.` }
      }
      const value = inlineValue ?? args.next().value
      const parsed = parsePercent(name, value)
      if ('error' in parsed) return { ok: false, error: parsed.error }
      thresholds[name] = parsed.value
      continue
    }

    const dir = normalizeDir(arg, repoRoot)
    if (dir === undefined) {
      return {
        ok: false,
        error: `"${arg}" is not a directory inside the repository.`,
      }
    }
    if (!dirs.includes(dir)) dirs.push(dir)
  }

  return {
    ok: true,
    options: {
      dirs,
      lines: thresholds['--lines'],
      branches: thresholds['--branches'],
    },
  }
}

function splitOption(arg: string): [string, string | undefined] {
  const equals = arg.indexOf('=')
  return equals === -1
    ? [arg, undefined]
    : [arg.slice(0, equals), arg.slice(equals + 1)]
}

function isThresholdOption(name: string): name is ThresholdOption {
  return (THRESHOLD_OPTIONS as readonly string[]).includes(name)
}

/** The arguments for `vitest` that produce the requested coverage run. */
export function toVitestArgs(options: CoverageOptions): string[] {
  const args = ['run', '--coverage.enabled', '--passWithNoTests']
  // The trailing slash keeps src/features/board from matching src/features/boards.
  for (const dir of options.dirs) args.push(`${dir}/`)
  // A CLI include replaces the config's, so it repeats the file types.
  for (const dir of options.dirs) {
    args.push(`--coverage.include=${dir}/**/*.{ts,tsx}`)
  }
  if (options.lines !== undefined) {
    args.push(`--coverage.thresholds.lines=${options.lines}`)
  }
  if (options.branches !== undefined) {
    args.push(`--coverage.thresholds.branches=${options.branches}`)
  }
  return args
}
