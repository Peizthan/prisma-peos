import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['apps-script/tests/**/*.test.ts'],
    environment: 'node'
  }
});
