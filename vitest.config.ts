import { defineConfig } from 'vitest/config';
import { resolve } from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test-setup.ts'],
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
          branches: 80,
          functions: 80,
          lines: 80,
          statements: 80
        },
        'src/components/**/*.{ts,tsx}': {
          branches: 80,
          functions: 80,
          lines: 80,
          statements: 80
        },
        'src/hooks/**/*.{ts,tsx}': {
          branches: 80,
          functions: 80,
          lines: 80,
          statements: 80
        },
        'src/lib/**/*.{ts,tsx}': {
          branches: 80,
          functions: 80,
          lines: 80,
          statements: 80
        },
        'src/pages/**/*.{ts,tsx}': {
          branches: 80,
          functions: 80,
          lines: 80,
          statements: 80
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
