// For a detailed explanation regarding each configuration property, visit:
// * https://jestjs.io/docs/en/configuration.html
// * https://kulshekhar.github.io/ts-jest/user/config/

import fastGlob from 'fast-glob';

const typescript = {
  displayName: 'Typescript',
  roots: fastGlob.sync(['packages/*/src'], {onlyDirectories: true}),
  preset: 'ts-jest',
  globals: {
    'ts-jest': {
      tsconfig: {
        module: 'commonjs',
        jsx: 'react',
      },
    },
  },
};

const flow = {
  displayName: 'Flow',
  roots: fastGlob.sync(['packages/*/test-flow'], {onlyDirectories: true}),
};

export default {
  projects: [typescript, flow],
};
