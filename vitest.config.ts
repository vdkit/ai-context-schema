import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    include: ['validation/**/*.test.ts', 'validation/**/*.spec.ts'],
    exclude: ['dist/**', 'coverage/**', 'node_modules/**'],
    setupFiles: ['./tests/setup.ts'],
    testTimeout: 10_000,
    clearMocks: true,
    restoreMocks: true,
    coverage: {
      enabled: false,
      provider: 'v8',
      reporter: ['text', 'text-summary', 'html', 'lcov'],
      include: ['validation/**/*.ts'],
      exclude: ['validation/**/*.test.ts', 'validation/**/*.spec.ts'],
      thresholds: {
        branches: 80,
        functions: 80,
        lines: 80,
        statements: 80,
        perFile: true
      }
    }
  }
});
