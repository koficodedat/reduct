import { defineConfig } from 'vitest/config';
import { resolve } from 'path';
import { fileURLToPath } from 'url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov', 'json', 'html'],
      include: ['packages/*/src/**/*.ts'],
      exclude: ['**/*.test.ts', '**/*.d.ts', '**/examples/**'],
      all: true,
      thresholds: {
        lines: 80,
        statements: 80,
        branches: 80,
        functions: 80,
        autoUpdate: true
      }
    },
  },
  resolve: {
    alias: {
      '@reduct/core': resolve(__dirname, 'packages/core/src'),
      '@reduct/core/testing/property': resolve(__dirname, 'packages/core/src/testing/property.ts'),
      '@reduct/data-structures': resolve(__dirname, 'packages/data-structures/src'),
      '@reduct/algorithms': resolve(__dirname, 'packages/algorithms/src'),
      '@reduct/benchmark': resolve(__dirname, 'packages/benchmark/src')
    }
  }
});
