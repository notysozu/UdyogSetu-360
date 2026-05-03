const { createApp } = require('./app');
const mongoose = require('mongoose');
const { createRabbitConnection, closeRabbitConnection, isRabbitEnabled } = require('../../../../packages/shared/src');
const { loadActiveAdapters } = require('./services/adapter-factory');

async function start() {
  const port = Number(process.env.ADAPTER_RUNTIME_PORT || 4102);
  const mongoUri =
    process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/udyogsetu360';

  await mongoose.connect(mongoUri, {
    autoIndex: process.env.NODE_ENV !== 'production'
  });

  if (isRabbitEnabled()) {
    await createRabbitConnection().catch((error) => {
      if (process.env.NODE_ENV === 'production') {
        throw error;
      }
      console.warn('RabbitMQ unavailable during adapter-runtime startup:', error.message);
    });
  }

  await loadActiveAdapters().catch((error) => {
    if (process.env.NODE_ENV === 'production') {
      throw error;
    }
    console.warn('Adapter preload skipped:', error.message);
  });

  const app = createApp();
  const server = app.listen(port, () => {
    console.log(`Adapter runtime listening on http://localhost:${port}`);
  });

  const shutdown = async () => {
    server.close(() => {});
    await closeRabbitConnection().catch(() => {});
    await mongoose.disconnect().catch(() => {});
    process.exit(0);
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

start().catch((error) => {
  console.error('Adapter runtime failed to start:', error);
  process.exit(1);
});
