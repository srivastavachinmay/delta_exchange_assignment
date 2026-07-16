/**
 * ESLint configuration — TypeScript 7 compatible.
 *
 * @typescript-eslint/parser is not compatible with TypeScript 7.0 (Go compiler API).
 * Using @babel/eslint-parser instead — babel is TS-compiler-independent and handles
 * TypeScript + JSX syntax without invoking the TS programmatic API.
 *
 * Type safety: enforced by `tsc --noEmit` (`npm run typecheck`).
 * ESLint covers: React hooks rules, refresh-safety, no-console.
 *
 * Restore typescript-eslint when TS 7.1 ships with stable programmatic API:
 *   https://github.com/typescript-eslint/typescript-eslint/issues/12518
 */

import js from '@eslint/js';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import babelParser from '@babel/eslint-parser';

export default [
  { ignores: ['dist', 'node_modules', 'coverage'] },
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2022,
      globals: globals.browser,
      parser: babelParser,
      parserOptions: {
        requireConfigFile: false,
        babelOptions: {
          presets: [
            ['@babel/preset-react', { runtime: 'automatic' }],
            '@babel/preset-typescript',
          ],
        },
      },
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      ...js.configs.recommended.rules,
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
      'no-console': ['warn', { allow: ['warn', 'error', 'info', 'debug'] }],
      // TypeScript handles these — babel strips types before ESLint sees them,
      // causing false positives on type-only identifiers. tsc enforces the real rules.
      'no-undef': 'off',
      'no-unused-vars': 'off',
    },
  },
];
