import express from 'express';
import bodyParser from 'body-parser';

/**
 * Mounts a single router on a bare Express app so route handlers can be
 * exercised with supertest without starting the real server or opening a port.
 */
const createTestApp = (mountPath, router) => {
  const app = express();
  app.use(bodyParser.json());
  app.use(mountPath, router);
  return app;
};

export { createTestApp };
