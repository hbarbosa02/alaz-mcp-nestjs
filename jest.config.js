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
    '^@mcp/core/(.*)$': '<rootDir>/src/mcp/core/$1',
    '^@mcp/domain/nestjs/(.*)$': '<rootDir>/src/mcp/domain/nestjs/$1',
    '^@mcp/domain/angular/(.*)$': '<rootDir>/src/mcp/domain/angular/$1',
    '^@mcp/domain/laravel/(.*)$': '<rootDir>/src/mcp/domain/laravel/$1',
    '^@mcp/domain/shared/(.*)$': '<rootDir>/src/mcp/domain/shared/$1',
    '^@mcp/util/(.*)$': '<rootDir>/src/mcp/util/$1',
  },
};
