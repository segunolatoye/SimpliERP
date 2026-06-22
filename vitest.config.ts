import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./tests/setup.ts'],
    alias: {
      '@': path.resolve(__dirname, './'),
    },
    coverage: {
      provider: 'v8',
      thresholds: {
        lines: 80,
      },
      include: ['lib/**/*.ts', 'modules/**/services/**/*.ts'],
      exclude: ['**/*.d.ts', '**/*.test.ts', '**/index.ts'],
    },
  },
});
