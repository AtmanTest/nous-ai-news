import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./tests/setup.ts'],
    include: ['tests/**/*.test.ts', 'tests/**/*.test.tsx'],
    coverage: {
      provider: 'v8',
      enabled: true,
      exclude: ['lib/cache/**'],
      thresholds: {
        statements: 75,
        branches: 75,
        functions: 75,
        lines: 75,
        '**/components/**': {
          statements: 80,
          branches: 50,
          functions: 80,
          lines: 80,
        },
        '**/hooks/**': {
          statements: 85,
          branches: 70,
          functions: 85,
          lines: 85,
        },
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    },
  },
});
