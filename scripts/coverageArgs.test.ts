import { describe, expect, it } from 'vitest'
import {
  type CoverageOptions,
  parseCoverageArgs,
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
      ['--diff'],
    ])('rejects %s and names it', (arg) => {
      expect(error([arg])).toContain(`"${arg}"`)
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
