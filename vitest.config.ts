import { defineConfig } from 'vitest/config';
import { resolve } from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
  },
  resolve: {
    alias: {
      '@reduct/shared-types': resolve(__dirname, 'packages/shared-types/src'),
      '@reduct/shared-types/wasm': resolve(__dirname, 'packages/shared-types/src/wasm'),
      '@reduct/shared-types/registry': resolve(__dirname, 'packages/shared-types/src/registry'),
      '@reduct/shared-types/core': resolve(__dirname, 'packages/shared-types/src/core'),
      '@reduct/shared-types/data-structures': resolve(__dirname, 'packages/shared-types/src/data-structures'),
    },
  },
});
