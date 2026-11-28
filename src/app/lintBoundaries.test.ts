import { fileURLToPath } from 'node:url'
import { ESLint, type Linter } from 'eslint'
import { describe, expect, it } from 'vitest'

const RULES = {
  restrictedImports: 'no-restricted-imports',
  noDefaultExport: 'import-x/no-default-export',
  typeDefinitions: '@typescript-eslint/consistent-type-definitions',
  noExplicitAny: '@typescript-eslint/no-explicit-any',
}

const RULES_UNDER_TEST = Object.values(RULES)

const FORBIDDEN: { file: string; source: string; rule: string }[] = [
  {
    file: 'src/core/coreImportsFeature.ts',
    source: "export { a } from '@/features/boards/api/a'",
    rule: RULES.restrictedImports,
  },
  {
    file: 'src/core/auth/coreAuthImportsFeature.ts',
    source: "export { LoginRoot } from '@/features/auth/index'",
    rule: RULES.restrictedImports,
  },
  {
    file: 'src/core/auth/coreAuthClimbsIntoFeatures.ts',
    source: "export { a } from '../../features/auth/a'",
    rule: RULES.restrictedImports,
  },
  {
    file: 'src/core/coreImportsApp.ts',
    source: "export { App } from '@/app/App'",
    rule: RULES.restrictedImports,
  },
  {
    file: 'src/core/utils/coreClimbsIntoApp.ts',
    source: "export { App } from '../../app/App'",
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
    file: 'src/features/boards/featureImportsUnifiedRadix.ts',
    source: "export { Dialog } from 'radix-ui'",
    rule: RULES.restrictedImports,
  },
  {
    file: 'src/features/boards/featureImportsUnifiedRadixSubpath.ts',
    source: "export { Root } from 'radix-ui/internal'",
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
    file: 'src/features/boards/components/featureImportsCoreAuth.ts',
    source: "export { useSession } from '@/core/auth/SessionContext'",
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

const eslint = new ESLint({
  cwd: fileURLToPath(new URL('../..', import.meta.url)),
  overrideConfigFile: 'eslint.config.mjs',
})

async function messagesFor(
  file: string,
  source: string,
): Promise<Linter.LintMessage[]> {
  const results = await eslint.lintText(`${source}\n`, { filePath: file })
  return results.flatMap((result) => result.messages)
}

describe('lint boundaries', () => {
  it.each(FORBIDDEN)('$file reports $rule', async ({ file, source, rule }) => {
    expect(await messagesFor(file, source)).toContainEqual(
      expect.objectContaining({ ruleId: rule, severity: 2 }),
    )
  })

  it.each(ALLOWED)(
    '$file reports none of the rules under test',
    async ({ file, source }) => {
      const ruleIds = (await messagesFor(file, source)).map((m) => m.ruleId)
      expect(
        ruleIds.filter((id) => id !== null && RULES_UNDER_TEST.includes(id)),
      ).toEqual([])
    },
  )
})
