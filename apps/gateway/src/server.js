const mongoose = require('mongoose');
const { createApp } = require('./app');
const { getGatewayConfig } = require('./config/gateway.config');

async function start() {
  const config = getGatewayConfig();

  try {
    await mongoose.connect(config.mongodbUri, {
      autoIndex: config.nodeEnv !== 'production'
    });
  } catch (error) {
    console.warn(`[gateway] MongoDB unavailable at startup: ${error.message}`);
  }

  const app = createApp();
  app.listen(config.port, () => {
    console.log(`Gateway listening on http://localhost:${config.port}`);
  });
}

start().catch((error) => {
  console.error('Gateway failed to start:', error);
  process.exit(1);
});
