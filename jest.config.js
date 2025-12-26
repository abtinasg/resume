/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/lib/layers', '<rootDir>/__tests__'],
  testMatch: ['**/__tests__/**/*.test.ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },
  transform: {
    '^.+\\.tsx?$': ['ts-jest', {
      tsconfig: {
        target: 'ES2020',
        module: 'CommonJS',
        lib: ['ES2020'],
        esModuleInterop: true,
        resolveJsonModule: true,
        moduleResolution: 'node',
        strict: true,
        skipLibCheck: true,
      },
    }],
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  collectCoverageFrom: [
    'lib/layers/**/*.ts',
    '!lib/layers/**/__tests__/**',
    '!lib/layers/**/index.ts',
  ],
  coverageDirectory: 'coverage',
  verbose: true,
};
