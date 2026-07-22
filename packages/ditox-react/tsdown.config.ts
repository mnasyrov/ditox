import { defineConfig } from 'tsdown';

export default defineConfig({
  attw: true,
  publint: true,
  entry: 'src/index.ts',
  format: ['cjs', 'esm'],
  target: 'es2020',
  dts: true,
  clean: true,
  sourcemap: true,
  platform: 'neutral',
  deps: {
    neverBundle: ['ditox', 'react'],
  },
});
