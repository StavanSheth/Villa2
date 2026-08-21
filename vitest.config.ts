import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    testTimeout: 20000,
    fileParallelism: false, // Run test files sequentially since they share a single DB
    include: ['test/**/*.test.ts'],
    exclude: ['**/node_modules/**', '**/dist/**', 'tests/**'],
    setupFiles: ['./test/setup.ts'],
    alias: {
      '@villa-platform/database': path.resolve(__dirname, './packages/database/index.ts'),
      '@villa-platform/payment': path.resolve(__dirname, './packages/payment/index.ts'),
    }
  },
});
