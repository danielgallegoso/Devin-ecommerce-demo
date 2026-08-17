import crypto from 'crypto';
import dotenv from 'dotenv';

dotenv.config();

const isProduction = process.env.NODE_ENV === 'production';

const requiredInProduction = (name) => {
  const value = process.env[name];
  if (!value && isProduction) {
    throw new Error(`${name} must be set in production.`);
  }
  return value;
};

// Outside production a random per-process secret keeps tokens unforgeable
// without requiring any local configuration.
const JWT_SECRET =
  requiredInProduction('JWT_SECRET') || crypto.randomBytes(32).toString('hex');

export default {
  PORT: process.env.PORT || 5000,
  MONGODB_URL: process.env.MONGODB_URL || 'mongodb://localhost/tmobile',
  JWT_SECRET,
  PAYPAL_CLIENT_ID: process.env.PAYPAL_CLIENT_ID || 'sb',
  accessKeyId: process.env.accessKeyId,
  secretAccessKey: process.env.secretAccessKey,
  S3_BUCKET: process.env.S3_BUCKET || 'tmobile-demo-bucket',
  isProduction,
};
