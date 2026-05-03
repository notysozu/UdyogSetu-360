const mongoose = require('mongoose');
const { startCallbackWorker } = require('../services/adapter-runtime/src/consumers/inbound-callback-reconciliation.consumer');
const { createRabbitConnection, closeRabbitConnection, isRabbitEnabled } = require('../packages/shared/src');

async function main() {
  if (!isRabbitEnabled()) {
    console.log('RabbitMQ disabled; callback worker will not start.');
    return;
  }

  const mongoUri =
    process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/udyogsetu360';

  await mongoose.connect(mongoUri, {
    autoIndex: process.env.NODE_ENV !== 'production'
  });
  await createRabbitConnection();
  await startCallbackWorker();
  console.log('Started callback reconciliation worker.');

  const shutdown = async () => {
    await closeRabbitConnection().catch(() => {});
    await mongoose.disconnect().catch(() => {});
    process.exit(0);
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

main().catch(async (error) => {
  console.error(error);
  await mongoose.disconnect().catch(() => {});
  await closeRabbitConnection().catch(() => {});
  process.exit(1);
});
