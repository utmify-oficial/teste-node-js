import type { Config } from 'jest';

const config: Config = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  moduleFileExtensions: ['ts', 'js'],
  transform: {
    '^.+\\.ts$': 'ts-jest',
  },
  setupFiles: ['<rootDir>/src/server/setup/jest.setup.ts'],
  clearMocks: true,
  coverageDirectory: "coverage",
  coverageProvider: "v8",
  resetMocks: true,
  restoreMocks: true,
};

export default config;
