import js from '@eslint/js'
import { defineConfig, globalIgnores } from 'eslint/config'
import { importX } from 'eslint-plugin-import-x'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import globals from 'globals'
import tseslint from 'typescript-eslint'

export default defineConfig([
  globalIgnores([
    'src/core/api/generated/**',
    'src/app/routeTree.gen.ts',
    'dist/**',
    'coverage/**',
    'reports/**',
    '.stryker-tmp/**',
    '.claude/**',
  ]),
  {
    files: ['**/*.{ts,tsx,js,mjs}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
    ],
    plugins: {
      'import-x': importX,
    },
    rules: {
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
          destructuredArrayIgnorePattern: '^_',
        },
      ],
      '@typescript-eslint/consistent-type-definitions': ['error', 'type'],
      '@typescript-eslint/no-explicit-any': 'error',
      'import-x/no-default-export': 'error',
    },
  },
  {
    files: ['src/**'],
    languageOptions: {
      globals: globals.browser,
    },
  },
  {
    files: ['*.{ts,mjs,js}', 'scripts/**'],
    languageOptions: {
      globals: globals.node,
    },
  },
  {
    files: ['**/*.tsx'],
    plugins: {
      'react-refresh': reactRefresh,
    },
    rules: {
      'react-refresh/only-export-components': [
        'warn',
        { allowConstantExport: true },
      ],
    },
  },
  {
    files: ['**/*.config.{ts,mjs}'],
    rules: {
      'import-x/no-default-export': 'off',
    },
  },
  {
    files: ['src/core/**'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['@/app', '@/app/**', '@/features', '@/features/**'],
              message: 'core must not import from app or features.',
            },
            {
              regex: '^(\\.\\./)+(app|features)(/|$)',
              message: 'core must not import from app or features.',
            },
          ],
        },
      ],
    },
  },
  {
    files: ['src/features/**'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['@/app', '@/app/**', '@/features', '@/features/**'],
              message:
                'Features must not import from app or other features. Use relative imports inside a feature.',
            },
            {
              regex: '^(\\.\\./)+app(/|$)',
              message: 'Features must not import from app.',
            },
            {
              group: ['@radix-ui/*', 'radix-ui', 'radix-ui/*'],
              message: 'Use the components from @/core/ui instead.',
            },
          ],
        },
      ],
    },
  },
])
