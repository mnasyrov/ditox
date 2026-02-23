import { defineConfig } from 'tsdown';

export default defineConfig({
  attw: true,
  publint: true,
  entry: 'src/index.ts',
  format: ['cjs', 'esm', 'umd'],
  target: 'es2015',
  dts: true,
  clean: true,
  sourcemap: true,
  platform: 'neutral',
  globalName: 'Ditox',
});
