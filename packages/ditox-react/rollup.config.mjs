import terser from '@rollup/plugin-terser';
import typescript from '@rollup/plugin-typescript';
import dts from 'rollup-plugin-dts';
import pkg from './package.json' with {type: 'json'};

const EXTERNALS = ['ditox', 'react'];

const UMD_LIB_NAME = 'DitoxReact';
const UMD_GLOBALS = {
  ditox: 'Ditox',
  react: 'React',
};

export default [
  {
    input: 'src/index.ts',
    output: [{file: 'dist/browser/index.d.ts'}, {file: 'dist/umd/index.d.ts'}],
    plugins: [dts()],
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
        declaration: false,
      }),
      terser({
        output: {comments: false},
      }),
    ],
  },
];
