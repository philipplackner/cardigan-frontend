import { describe, expect, it } from 'vitest'
import {
  type CoverageOptions,
  parseCoverageArgs,
  toDiffCoverArgs,
  toVitestArgs,
} from './coverageArgs.ts'

const ROOT = '/repo'

function options(argv: string[]): CoverageOptions {
  const result = parseCoverageArgs(argv, ROOT)
  if (!result.ok) throw new Error(`Expected success, got: ${result.error}`)
  return result.options
}

function error(argv: string[]): string {
  const result = parseCoverageArgs(argv, ROOT)
  if (result.ok) throw new Error('Expected an error')
  return result.error
}

describe('parseCoverageArgs', () => {
  describe('directories', () => {
    it('means the whole codebase when there are no arguments', () => {
      expect(options([])).toEqual({
        dirs: [],
        lines: undefined,
        branches: undefined,
      })
    })

    it('keeps one directory as given', () => {
      expect(options(['src/features/boards']).dirs).toEqual([
        'src/features/boards',
      ])
    })

    it('keeps several directories in order', () => {
      expect(options(['src/features/boards', 'src/core/ui']).dirs).toEqual([
        'src/features/boards',
        'src/core/ui',
      ])
    })

    it('drops a repeated directory, including one spelled differently', () => {
      expect(options(['src/core', './src/core/']).dirs).toEqual(['src/core'])
    })

    it.each([
      ['src/features/boards/'],
      ['src/features/boards///'],
      ['./src/features/boards'],
      ['./src/features/boards/'],
      ['src/./features//boards'],
      ['/repo/src/features/boards'],
      ['/repo/src/features/boards/'],
      ['src/features/../features/boards'],
    ])('normalizes %s', (input) => {
      expect(options([input]).dirs).toEqual(['src/features/boards'])
    })

    it.each([
      ['/elsewhere/src'],
      ['/repository/src'],
      ['../other-repo/src'],
      ['src/../../other-repo'],
      ['..'],
    ])('rejects %s as outside the repository and names it', (input) => {
      expect(error([input])).toContain(`"${input}"`)
    })

    it.each([['.'], ['./'], ['/repo'], ['/repo/']])(
      'rejects the repository root %s, which would match every path',
      (input) => {
        expect(error([input])).toContain(`"${input}"`)
      },
    )
  })

  describe('thresholds', () => {
    it.each([
      [['--lines', '80'], { lines: 80 }],
      [['--lines=80'], { lines: 80 }],
      [['--branches', '75'], { branches: 75 }],
      [['--branches=75'], { branches: 75 }],
      [['--lines', '85.5'], { lines: 85.5 }],
      [['--lines=0'], { lines: 0 }],
      [['--lines', '100'], { lines: 100 }],
      [['--lines', '100.0'], { lines: 100 }],
      [['--lines', '007'], { lines: 7 }],
    ])('accepts %j', (argv, expected) => {
      expect(options(argv)).toMatchObject(expected)
    })

    it('accepts both thresholds mixed with directories in any order', () => {
      expect(
        options(['--branches=60', 'src/core', '--lines', '70', 'src/app']),
      ).toEqual({ dirs: ['src/core', 'src/app'], lines: 70, branches: 60 })
    })

    it.each([
      ['-1'],
      ['-0.5'],
      ['100.01'],
      ['101'],
      ['abc'],
      ['80%'],
      ['1e2'],
      ['.5'],
      ['5.'],
      [' 80'],
      ['0x10'],
      ['Infinity'],
      ['NaN'],
    ])('rejects the value %j and names the option and value', (value) => {
      const message = error(['--lines', value])
      expect(message).toContain('--lines')
      expect(message).toContain(`"${value}"`)
    })

    it.each([
      [['--lines']],
      [['--lines=']],
      [['--branches']],
      [['src/core', '--branches']],
    ])('rejects a missing value in %j', (argv) => {
      expect(error(argv)).toMatch(/--(lines|branches) needs a value/)
    })

    it('does not take the next option as the value', () => {
      expect(error(['--lines', '--branches', '80'])).toContain('"--branches"')
    })

    it('rejects an option given twice', () => {
      expect(error(['--lines', '80', '--lines=90'])).toContain('--lines')
    })
  })

  describe('unknown options', () => {
    it.each([
      ['--line'],
      ['--Lines'],
      ['-l'],
      ['--coverage.enabled'],
      ['--watch'],
      ['--lines80'],
      ['--compare-branch=master'],
      ['--diff=true'],
    ])('rejects %s and names it', (arg) => {
      expect(error([arg])).toContain(`"${arg}"`)
    })
  })

  describe('diff mode', () => {
    it('is off without --diff', () => {
      expect(options(['src/core']).compareBranch).toBeUndefined()
    })

    it('compares against origin/master by default', () => {
      expect(options(['--diff']).compareBranch).toBe('origin/master')
    })

    it.each([
      [['--diff', '--compare-branch', 'master']],
      [['--diff', '--compare-branch=master']],
      [['--compare-branch=master', '--diff']],
      [['--compare-branch', 'master', '--diff']],
    ])('takes the ref from %j', (argv) => {
      expect(options(argv).compareBranch).toBe('master')
    })

    it.each([
      ['origin/release/1.2'],
      ['HEAD~3'],
      ['a1b2c3d'],
      ['v1.0^{commit}'],
    ])('keeps the ref %s as given', (ref) => {
      expect(options(['--diff', `--compare-branch=${ref}`]).compareBranch).toBe(
        ref,
      )
    })

    it('keeps directories and thresholds', () => {
      expect(
        options(['--diff', 'src/core/', '--lines=80', '--branches', '70']),
      ).toEqual({
        dirs: ['src/core'],
        lines: 80,
        branches: 70,
        compareBranch: 'origin/master',
      })
    })

    it.each([
      [['--diff', '--compare-branch']],
      [['--diff', '--compare-branch=']],
      [['--compare-branch', '--diff']],
    ])('rejects a missing ref in %j', (argv) => {
      expect(error(argv)).toMatch(
        /--compare-branch (needs a git ref|must be a git ref, got "--diff")/,
      )
    })

    it('rejects a ref that looks like an option', () => {
      expect(error(['--diff', '--compare-branch', '--lines'])).toContain(
        '"--lines"',
      )
    })

    it('does not take a directory after --diff as its value', () => {
      expect(options(['--diff', 'src/core'])).toMatchObject({
        dirs: ['src/core'],
        compareBranch: 'origin/master',
      })
    })

    it('rejects --compare-branch given twice', () => {
      expect(
        error(['--diff', '--compare-branch=a', '--compare-branch=b']),
      ).toContain('--compare-branch')
    })

    it('rejects --diff given twice', () => {
      expect(error(['--diff', '--diff'])).toContain('--diff')
    })

    it.each([
      [['--compare-branch=master']],
      [['--compare-branch', 'master']],
      [['src/core', '--compare-branch=master', '--lines', '50']],
    ])('rejects --compare-branch without --diff as unknown in %j', (argv) => {
      expect(error(argv)).toMatch(/^Unknown option "--compare-branch/)
    })
  })
})

describe('toVitestArgs', () => {
  it('runs everything with coverage when no directory is given', () => {
    expect(toVitestArgs({ dirs: [] })).toEqual([
      'run',
      '--coverage.enabled',
      '--passWithNoTests',
    ])
  })

  it('passes --passWithNoTests for scoped runs too', () => {
    expect(toVitestArgs({ dirs: ['src/features/cards'] })).toContain(
      '--passWithNoTests',
    )
  })

  it('adds a filter with a trailing slash and an include per directory', () => {
    expect(
      toVitestArgs({ dirs: ['src/features/board', 'src/core/ui'] }),
    ).toEqual([
      'run',
      '--coverage.enabled',
      '--passWithNoTests',
      'src/features/board/',
      'src/core/ui/',
      '--coverage.include=src/features/board/**/*.{ts,tsx}',
      '--coverage.include=src/core/ui/**/*.{ts,tsx}',
    ])
  })

  it('maps the thresholds to Vitest options', () => {
    expect(toVitestArgs({ dirs: [], lines: 85.5, branches: 0 })).toEqual([
      'run',
      '--coverage.enabled',
      '--passWithNoTests',
      '--coverage.thresholds.lines=85.5',
      '--coverage.thresholds.branches=0',
    ])
  })
})

describe('toDiffCoverArgs', () => {
  it('runs the pinned diff-cover on the Cobertura report, report-only', () => {
    expect(toDiffCoverArgs('origin/master')).toEqual([
      '--exclude-newer',
      '2026-11-23',
      'diff-cover==11.0.4',
      'coverage/cobertura-coverage.xml',
      '--compare-branch=origin/master',
      '--include-untracked',
      '--format',
      'html:coverage/diff-cover.html',
    ])
  })

  it('passes the ref as one argument', () => {
    expect(toDiffCoverArgs('feature branch')).toContain(
      '--compare-branch=feature branch',
    )
  })

  it('never passes --fail-under', () => {
    expect(toDiffCoverArgs('master').join(' ')).not.toContain('--fail-under')
  })
})
