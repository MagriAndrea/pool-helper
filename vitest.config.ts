import { defineConfig } from 'vitest/config';

/**
 * Minimal Vitest config for the pure calculator modules in `src/lib/calculator/`.
 * Node environment only — no DOM/browser tooling needed. Deliberately does not
 * touch the Next.js build pipeline (separate config, separate `tsconfig` include
 * via test files' own `.test.ts` extension, no plugins shared with `next build`).
 */
export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
  resolve: {
    alias: {
      '@': new URL('./src', import.meta.url).pathname,
    },
  },
});
