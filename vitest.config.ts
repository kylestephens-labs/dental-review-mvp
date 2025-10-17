import { defineConfig } from 'vitest/config';
import { resolve } from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test-setup.ts'],
    pool: 'forks',
    poolOptions: {
      forks: {
        singleFork: true
      }
    },
    maxThreads: 1,
    minThreads: 1,
    teardownTimeout: 3000,
    testTimeout: 10000,
    hookTimeout: 3000,
    isolate: true,
    sequence: {
      concurrent: false
    },
    passWithNoTests: true,
    bail: 1,
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      '**/tests/playwright/**',
      '**/playwright.config.ts'
    ],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      reportsDirectory: './coverage',
      include: [
        'src/**/*.{ts,tsx}',
        'tools/**/*.{ts,tsx}'
      ],
      exclude: [
        'src/**/*.test.{ts,tsx}',
        'src/**/*.spec.{ts,tsx}',
        'src/**/__tests__/**',
        'src/**/test-setup.ts',
        'src/**/main.tsx',
        'src/**/vite-env.d.ts',
        'tools/**/*.test.{ts,tsx}',
        'tools/**/*.spec.{ts,tsx}',
        'tools/**/__tests__/**'
      ],
      thresholds: {
        all: false,
        'src/App.tsx': {
          branches: 30,
          functions: 30,
          lines: 30,
          statements: 30
        },
        'src/components/**/*.{ts,tsx}': {
          branches: 15,
          functions: 15,
          lines: 15,
          statements: 15
        },
        'src/hooks/**/*.{ts,tsx}': {
          branches: 30,
          functions: 30,
          lines: 30,
          statements: 30
        },
        'src/lib/**/*.{ts,tsx}': {
          branches: 30,
          functions: 30,
          lines: 30,
          statements: 30
        },
        'src/pages/**/*.{ts,tsx}': {
          branches: 30,
          functions: 30,
          lines: 30,
          statements: 30
        }
      }
    },
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },
});
