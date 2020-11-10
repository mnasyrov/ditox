// For a detailed explanation regarding each configuration property, visit:
// * https://jestjs.io/docs/en/configuration.html
// * https://kulshekhar.github.io/ts-jest/user/config/

const typescript = {
  displayName: 'Typescript',
  roots: ['src'],
  preset: 'ts-jest',
  globals: {
    'ts-jest': {
      tsConfig: {
        module: 'commonjs',
      },
    },
  },
};

const flow = {
  displayName: 'Flow',
  roots: ['test-flow'],
  clearMocks: true,
  transform: {
    '^.+\\.jsx?$': 'babel-jest',
  },
};

export default {
  projects: [typescript, flow],
};
