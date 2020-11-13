import typescript from '@wessberg/rollup-plugin-ts';
import {terser} from 'rollup-plugin-terser';
import pkg from './package.json';

export default [
  {
    input: 'src/index.ts',
    output: [{file: pkg.main, format: 'cjs', sourcemap: true}],
    plugins: [typescript()],
  },
  {
    input: 'src/index.ts',
    output: [{file: pkg.module, format: 'es', sourcemap: true}],
    plugins: [typescript()],
  },
  {
    input: 'src/index.ts',
    output: [
      {
        name: 'Ditox',
        file: pkg.browser,
        format: 'es',
        sourcemap: true,
      },
      {
        name: 'Ditox',
        file: pkg['umd:main'],
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
