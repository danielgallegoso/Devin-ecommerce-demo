module.exports = {
  testEnvironment: 'node',
  testMatch: ['<rootDir>/backend/**/*.test.js'],
  collectCoverageFrom: [
    'backend/**/*.js',
    '!backend/data.js',
    '!backend/server.js',
  ],
  testTimeout: 30000,
};
