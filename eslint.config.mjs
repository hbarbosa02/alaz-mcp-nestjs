import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
import pluginPrettier from 'eslint-plugin-prettier';
import configPrettier from 'eslint-config-prettier/flat';
import globals from 'globals';

const eslintPluginPrettierRecommended = [
  configPrettier,
  {
    plugins: { prettier: pluginPrettier },
    rules: {
      ...pluginPrettier.configs.recommended.rules,
    },
  },
];

export default tseslint.config(
  eslint.configs.recommended,
  tseslint.configs.stylistic,
  ...tseslint.configs.recommendedTypeChecked,
  ...eslintPluginPrettierRecommended,
  {
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.jest,
      },
      sourceType: 'commonjs',
      parserOptions: {
        projectService: {
          allowDefaultProject: ['*.js', '*.mjs', '*.cjs'],
        },
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
  {
    rules: {
      'prefer-const': 'error',
      'no-console': 'warn',
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_' },
      ],
      '@typescript-eslint/consistent-type-imports': [
        'warn',
        { prefer: 'type-imports' },
      ],
      eqeqeq: ['error', 'always'],
    },
  },
  {
    files: ['test/**/*.ts'],
    rules: {
      '@typescript-eslint/unbound-method': 'off',
      '@typescript-eslint/no-unsafe-assignment': 'off',
    },
  },
);
