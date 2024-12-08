module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  setupFiles: ['<rootDir>/jest-setupEnv.ts'],
  moduleNameMapper: {
    '^~/(.+)$': '<rootDir>/src/$1',
  },
}
