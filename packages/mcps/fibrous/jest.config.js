export default {
  preset: 'ts-jest/presets/default-esm',
  testEnvironment: 'node',
  extensionsToTreatAsEsm: ['.ts'],
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
    '^@kasarlabs/ask-starknet-core$': '<rootDir>/../../core/src/index.ts',
    // Force CJS build in Jest (avoids ESM .mjs parsing issues in jest-runtime)
    '^fibrous-router-sdk$':
      '<rootDir>/node_modules/fibrous-router-sdk/dist/index.js',
  },
  transformIgnorePatterns: [
    'node_modules/(?!(@kasarlabs/ask-starknet-core|fibrous-router-sdk)/)',
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
  testTimeout: 180000,
  setupFilesAfterEnv: ['<rootDir>/__tests__/setup.ts'],
  forceExit: true,
  detectOpenHandles: true,
};
