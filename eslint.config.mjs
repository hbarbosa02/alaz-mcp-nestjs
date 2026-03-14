// @ts-check
import eslint from '@eslint/js';
import eslintPluginPrettierRecommended from 'eslint-plugin-prettier/recommended';
import globals from 'globals';
import tseslint from 'typescript-eslint';
import stylistcTs from '@stylistic/eslint-plugin';

export default tseslint.config(
  {
    ignores: ['eslint.config.mjs', '**/*.spec.ts', '**/*.e2e-spec.ts'],
  },
  eslint.configs.recommended,
  tseslint.configs.strict,
  tseslint.configs.stylistic,
  tseslint.configs.recommendedTypeChecked,
  eslintPluginPrettierRecommended,
  {
    plugins: {
      '@stylistic/ts': stylistcTs,
    },
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.jest,
      },
      ecmaVersion: 5,
      sourceType: 'module',
      parserOptions: {
        projectService: true,
        tsconfigRootDir: process.cwd(),
      },
    },
  },
  {
    rules: {
      '@typescript-eslint/no-floating-promises': 'warn',
      '@typescript-eslint/no-unsafe-argument': 'warn',
      '@typescript-eslint/no-unsafe-assignment': 'warn',
      '@typescript-eslint/no-unsafe-member-access': 'warn',
      '@typescript-eslint/no-extraneous-class': 'off',
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/prefer-readonly': 'error',
      '@typescript-eslint/method-signature-style': ['error', 'method'],
      '@typescript-eslint/explicit-module-boundary-types': 'error',
      '@typescript-eslint/explicit-function-return-type': ['error', { allowExpressions: true }],

      '@stylistic/ts/comma-dangle': ['error', 'always-multiline'],
      '@stylistic/ts/space-before-function-paren': [
        'error',
        { anonymous: 'always', named: 'never', asyncArrow: 'always' },
      ],

      'max-params': ['error', 6],
      'no-console': ['error'],
      'no-else-return': ['error'],
      'no-nested-ternary': ['error'],
      'no-return-await': ['error'],
      'no-throw-literal': 'error',
      'prefer-template': 'error',
      'require-await': ['error'],

      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['../*', './*'],
              message: 'Imports relative to parent directories (../) are not allowed. Use aliases (@/).',
            },
          ],
        },
      ],
    },
  },
);
