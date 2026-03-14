module.exports = {
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: '.',
  testRegex: '.*\\.spec\\.ts$',
  transform: {
    '^.+\\.(t|j)s$': 'ts-jest',
  },
  collectCoverageFrom: [
    'src/**/*.(t|j)s',
    '!src/main.ts',
    '!src/**/index.ts',
    '!src/mcp/feature/mcp-stdio.entry.ts',
    '!src/mcp/feature/mcp-stdio.module.ts',
    '!src/mcp/feature/stdio-app.module.ts',
    '!src/mcp/core/ports/*.ts',
    '!src/mcp/domain/angular/**/*.ts',
    '!src/mcp/domain/laravel/**/*.ts',
  ],
  coverageDirectory: './coverage',
  coverageThreshold: {
    global: {
      statements: 80,
      branches: 72,
      functions: 80,
      lines: 80,
    },
  },
  testEnvironment: 'node',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@test/(.*)$': '<rootDir>/test/$1',
  },
};
