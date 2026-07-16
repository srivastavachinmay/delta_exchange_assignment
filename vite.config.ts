/// <reference types="vitest" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },
  server: {
    port: 3000,
    strictPort: true,
  },
  build: {
    target: 'es2022',
    sourcemap: true,
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/tests/setup.ts'],
    include: ['src/tests/**/*.test.ts', 'src/tests/**/*.test.tsx'],
    coverage: {
      reporter: ['text', 'json', 'html'],
      // Domain and application are the layers we enforce test coverage on.
      // Infrastructure and features are harder to unit-test without mocks.
      include: ['src/domain/**', 'src/application/**'],
      exclude: ['src/features/**', 'src/app/**'],
    },
  },
});
