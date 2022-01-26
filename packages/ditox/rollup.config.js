import typescript from '@rollup/plugin-typescript';
import {terser} from 'rollup-plugin-terser';
import dts from 'rollup-plugin-dts';
import pkg from './package.json';

const UMD_LIB_NAME = 'Ditox';

export default [
  {
    input: 'src/index.ts',
    output: [
      {file: 'lib-deno/index.d.ts'},
      {file: 'dist/browser/index.d.ts'},
      {file: 'dist/umd/index.d.ts'},
    ],
    plugins: [dts()],
  },
  {
    input: 'src/index.ts',
    output: [{file: 'lib-deno/index.js', format: 'es', sourcemap: true}],
    plugins: [
      typescript({
        declaration: false,
      }),
    ],
  },
  {
    input: 'src/index.ts',
    output: [
      {
        name: UMD_LIB_NAME,
        file: pkg.browser,
        format: 'es',
        sourcemap: true,
      },
      {
        name: UMD_LIB_NAME,
        file: pkg['umd:main'],
        format: 'umd',
        sourcemap: true,
      },
    ],
    plugins: [
      typescript({
        target: 'es5',
        declaration: false,
      }),
      terser({
        output: {comments: false},
      }),
    ],
  },
];
