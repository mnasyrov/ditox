import typescript from '@wessberg/rollup-plugin-ts';
import flowEntryPlugin from 'rollup-plugin-flow-entry';
import {terser} from 'rollup-plugin-terser';
import pkg from './package.json';

const flowEntry = flowEntryPlugin({mode: 'strict', types: 'src/index.js.flow'});

const UMD_LIB_NAME = 'Ditox';

export default [
  {
    input: 'src/index.ts',
    output: [{file: pkg.main, format: 'cjs', sourcemap: true}],
    plugins: [flowEntry, typescript()],
  },
  {
    input: 'src/index.ts',
    output: [
      {file: pkg.module, format: 'es', sourcemap: true},
      {file: 'lib/index.js', format: 'es', sourcemap: true},
    ],
    plugins: [flowEntry, typescript()],
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
      flowEntry,
      typescript({
        target: 'es5',
      }),
      terser({
        output: {comments: false},
      }),
    ],
  },
];
