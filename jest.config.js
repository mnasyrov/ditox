// For a detailed explanation regarding each configuration property, visit:
// * https://jestjs.io/docs/en/configuration.html
// * https://kulshekhar.github.io/ts-jest/user/config/

export default {
  preset: 'ts-jest/presets/default',
  globals: {
    'ts-jest': {
      tsConfig: {
        allowJs: true,
        module: 'commonjs',
      },
    },
  },
};
