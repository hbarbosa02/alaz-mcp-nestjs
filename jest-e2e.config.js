module.exports = {
  ...require('./jest.config.js'),
  testRegex: '.*\\.e2e-spec\\.ts$',
  testTimeout: 30000,
  collectCoverageFrom: [],
  setupFiles: ['<rootDir>/test/e2e/setup/env.setup.js'],
};
