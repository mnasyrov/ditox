import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'happy-dom',
    alias: {
      ditox: getPathname('./packages/ditox/src/'),
      'ditox-react': getPathname('./packages/ditox-react/src/'),
    },
    coverage: {
      reporter: ['text', 'html', 'lcov'],
      exclude: ['index.ts', 'index.tsx'],
    },
  },
});

function getPathname(dir: string): string {
  return new URL(dir, import.meta.url).pathname;
}
