const path = require('path');
const dotenv = require('dotenv');

function loadEnv({ cwd = process.cwd(), fallback = '.env' } = {}) {
  dotenv.config({ path: path.resolve(cwd, fallback) });

  const env = {
    nodeEnv: process.env.NODE_ENV || 'development',
    appName: process.env.APP_NAME || 'UdyogSetu 360',
    mongodbUri:
      process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/udyogsetu360',
    jwtSecret: process.env.JWT_SECRET || '',
    sessionSecret: process.env.SESSION_SECRET || '',
    logLevel: process.env.LOG_LEVEL || 'info'
  };

  if (env.nodeEnv === 'production') {
    if (!env.jwtSecret || !env.sessionSecret) {
      throw new Error('Missing required JWT_SECRET or SESSION_SECRET for production startup.');
    }
  }

  return env;
}

module.exports = { loadEnv };
