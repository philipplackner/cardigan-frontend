import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

type Diagnostic = {
  code: string
  severity: string
  filename: string
}

const RULES = {
  restrictedImports: 'eslint(no-restricted-imports)',
  noDefaultExport: 'import(no-default-export)',
  typeDefinitions: 'typescript(consistent-type-definitions)',
  noExplicitAny: 'typescript(no-explicit-any)',
}

const RULES_UNDER_TEST = Object.values(RULES)

const FORBIDDEN: { file: string; source: string; rule: string }[] = [
  {
    file: 'src/core/coreImportsFeature.ts',
    source: "export { a } from '@/features/boards/api/a'",
    rule: RULES.restrictedImports,
  },
  {
    file: 'src/core/coreImportsApp.ts',
    source: "export { App } from '@/app/App'",
    rule: RULES.restrictedImports,
  },
  {
    file: 'src/core/utils/coreClimbsIntoFeatures.ts',
    source: "export { a } from '../../features/boards/a'",
    rule: RULES.restrictedImports,
  },
  {
    file: 'src/features/boards/featureImportsFeature.ts',
    source: "export { a } from '@/features/cards/a'",
    rule: RULES.restrictedImports,
  },
  {
    file: 'src/features/boards/featureImportsApp.ts',
    source: "export { App } from '@/app/App'",
    rule: RULES.restrictedImports,
  },
  {
    file: 'src/features/boards/api/featureClimbsIntoApp.ts',
    source: "export { App } from '../../../app/App'",
    rule: RULES.restrictedImports,
  },
  {
    file: 'src/features/boards/featureImportsRadix.ts',
    source: "export { Root } from '@radix-ui/react-dialog'",
    rule: RULES.restrictedImports,
  },
  {
    file: 'src/core/utils/defaultExport.ts',
    source: 'export default 1',
    rule: RULES.noDefaultExport,
  },
  {
    file: 'src/core/utils/interfaceDefinition.ts',
    source: 'export interface Point { x: number }',
    rule: RULES.typeDefinitions,
  },
  {
    file: 'src/core/utils/explicitAny.ts',
    source: 'export const value: any = 1',
    rule: RULES.noExplicitAny,
  },
]

const ALLOWED: { file: string; source: string }[] = [
  {
    file: 'src/core/coreImportsCore.ts',
    source: "export { a } from '@/core/utils/a'",
  },
  {
    file: 'src/features/boards/components/featureImportsOwnAndCore.ts',
    source: "export { a } from '../api/a'\nexport { b } from '@/core/ui/a'",
  },
  {
    file: 'src/app/appImportsFeature.ts',
    source: "export { a } from '@/features/boards/a'",
  },
  {
    file: 'foo.config.ts',
    source: 'export default 1',
  },
]

let diagnostics: Diagnostic[]
let tempDir: string

function runOxlint(cwd: string): string {
  const oxlint = path.resolve('node_modules/.bin/oxlint')
  try {
    return execFileSync(oxlint, ['--format', 'json'], {
      cwd,
      encoding: 'utf8',
    })
  } catch (error) {
    // oxlint exits non-zero when it reports errors, which the forbidden fixtures always do.
    return (error as { stdout: string }).stdout
  }
}

function diagnosticsFor(file: string): Diagnostic[] {
  return diagnostics.filter((d) => path.normalize(d.filename) === file)
}

beforeAll(() => {
  tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'lint-boundaries-'))
  fs.copyFileSync('.oxlintrc.json', path.join(tempDir, '.oxlintrc.json'))
  for (const { file, source } of [...FORBIDDEN, ...ALLOWED]) {
    const target = path.join(tempDir, file)
    fs.mkdirSync(path.dirname(target), { recursive: true })
    fs.writeFileSync(target, `${source}\n`)
  }
  const output = JSON.parse(runOxlint(tempDir)) as { diagnostics: Diagnostic[] }
  diagnostics = output.diagnostics
})

afterAll(() => {
  fs.rmSync(tempDir, { recursive: true, force: true })
})

describe('lint boundaries', () => {
  it.each(FORBIDDEN)('$file reports $rule', ({ file, rule }) => {
    expect(diagnosticsFor(file)).toContainEqual(
      expect.objectContaining({ code: rule, severity: 'error' }),
    )
  })

  it.each(ALLOWED)('$file reports none of the rules under test', ({ file }) => {
    const codes = diagnosticsFor(file).map((d) => d.code)
    expect(codes.filter((code) => RULES_UNDER_TEST.includes(code))).toEqual([])
  })
})
