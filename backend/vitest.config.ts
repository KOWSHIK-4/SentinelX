import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    setupFiles: ['./src/test/setup.ts'],
    testTimeout: 30000,
    hookTimeout: 30000,
    exclude: ['dist/**', 'node_modules/**'],
    passWithNoTests: true,
    env: {
      DATABASE_URL: 'postgresql://sentinelx:sentinelx_secret@localhost:5432/sentinelx?schema=public',
      NODE_ENV: 'test',
    },
  },
});
