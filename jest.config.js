module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['**/__tests__/**/*.test.ts'],
  clearMocks: true,
  setupFilesAfterEnv: ['<rootDir>/src/__tests__/setupTests.ts'],
};
