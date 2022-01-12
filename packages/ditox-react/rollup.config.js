import typescript from '@rollup/plugin-typescript';
import {terser} from 'rollup-plugin-terser';
import dts from 'rollup-plugin-dts';
import pkg from './package.json';

const EXTERNALS = ['ditox', 'react'];

const UMD_LIB_NAME = 'DitoxReact';
const UMD_GLOBALS = {
  ditox: 'Ditox',
  react: 'React',
};

export default [
  {
    input: 'src/index.ts',
    output: [
      {file: 'lib/index.d.ts'},
      {file: 'dist/index.d.ts'},
      {file: 'dist/index.module.d.ts'},
      {file: 'dist/index.umd.d.ts'},
    ],
    plugins: [dts()],
  },
  {
    external: EXTERNALS,
    input: 'src/index.ts',
    output: [{file: pkg.main, format: 'cjs', sourcemap: true}],
    plugins: [typescript()],
  },
  {
    external: EXTERNALS,
    input: 'src/index.ts',
    output: [
      {file: pkg.module, format: 'es', sourcemap: true},
      {file: 'lib/index.js', format: 'es', sourcemap: true},
    ],
    plugins: [typescript()],
  },
  {
    external: EXTERNALS,
    input: 'src/index.ts',
    output: [
      {
        name: UMD_LIB_NAME,
        file: pkg.browser,
        format: 'es',
        globals: UMD_GLOBALS,
        sourcemap: true,
      },
      {
        name: UMD_LIB_NAME,
        file: pkg['umd:main'],
        format: 'umd',
        globals: UMD_GLOBALS,
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
