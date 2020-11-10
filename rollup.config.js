import typescript from '@wessberg/rollup-plugin-ts';
import {terser} from 'rollup-plugin-terser';

export default [
  {
    input: 'src/index.ts',
    output: [{file: 'dist/ditox.js', format: 'es', sourcemap: true}],
    plugins: [typescript()],
  },
  {
    input: 'src/index.ts',
    output: [{file: 'dist/ditox.cjs', format: 'cjs', sourcemap: true}],
    plugins: [typescript()],
  },
  {
    input: 'src/index.ts',
    output: [
      {
        name: 'Ditox',
        file: 'dist/ditox.browser.js',
        format: 'es',
        sourcemap: true,
      },
      {
        name: 'Ditox',
        file: 'dist/ditox.umd.js',
        format: 'umd',
        sourcemap: true,
      },
    ],
    plugins: [
      typescript({
        target: 'es5',
      }),
      terser({
        output: {comments: false},
      }),
    ],
  },
];
