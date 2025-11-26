export default {
  preset: 'ts-jest/presets/default-esm',
  testEnvironment: 'node',
  extensionsToTreatAsEsm: ['.ts'],
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
    '^@kasarlabs/ask-starknet-core$': '<rootDir>/../../core/src/index.ts',
  },
  transformIgnorePatterns: [
    'node_modules/(?!(@kasarlabs/ask-starknet-core)/)',
  ],
  transform: {
    '^.+\\.tsx?$': [
      'ts-jest',
      {
        useESM: true,
        tsconfig: {
          module: 'ESNext',
        },
      },
    ],
  },
  testMatch: ['**/__tests__/**/*.test.ts', '**/__tests__/**/*.e2e.test.ts'],
  collectCoverageFrom: ['src/**/*.ts'],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
  testTimeout: 60000, // 60 seconds timeout for E2E tests
  setupFilesAfterEnv: ['<rootDir>/__tests__/setup.ts'],
};

