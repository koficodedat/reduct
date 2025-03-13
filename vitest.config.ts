import { defineConfig } from 'vitest/config';

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
      thresholdAutoUpdate: true,
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
});
