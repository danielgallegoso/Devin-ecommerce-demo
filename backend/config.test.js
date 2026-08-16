const ENV_KEYS = [
  'PORT',
  'MONGODB_URL',
  'JWT_SECRET',
  'PAYPAL_CLIENT_ID',
  'accessKeyId',
  'secretAccessKey',
];

const loadConfig = () => {
  let config;
  jest.isolateModules(() => {
    // eslint-disable-next-line global-require
    config = require('./config').default;
  });
  return config;
};

describe('config', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
    ENV_KEYS.forEach((key) => delete process.env[key]);
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  test('falls back to local development defaults when nothing is configured', () => {
    // Arrange
    // (all relevant env vars removed in beforeEach)

    // Act
    const result = loadConfig();

    // Assert
    expect(result).toEqual({
      PORT: 5000,
      MONGODB_URL: 'mongodb://localhost/tmobile',
      JWT_SECRET: 'somethingsecret',
      PAYPAL_CLIENT_ID: 'sb',
      accessKeyId: 'accessKeyId',
      secretAccessKey: 'secretAccessKey',
    });
  });

  test('prefers environment variables over the defaults', () => {
    process.env.PORT = '8080';
    process.env.MONGODB_URL = 'mongodb://db.example.com/store';
    process.env.JWT_SECRET = 'production-secret';
    process.env.PAYPAL_CLIENT_ID = 'live-client-id';

    const result = loadConfig();

    expect(result).toMatchObject({
      PORT: '8080',
      MONGODB_URL: 'mongodb://db.example.com/store',
      JWT_SECRET: 'production-secret',
      PAYPAL_CLIENT_ID: 'live-client-id',
    });
  });

  test('keeps defaults for the keys that are not overridden', () => {
    process.env.JWT_SECRET = 'production-secret';

    expect(loadConfig().PORT).toBe(5000);
  });
});
