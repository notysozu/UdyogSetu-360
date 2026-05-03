const mongoose = require('mongoose');
const { createApp } = require('./app');
const { startOutboxPublisher, stopOutboxPublisher } = require('./outbox/outbox-publisher.service');

async function start() {
  const port = Number(process.env.CASE_SERVICE_PORT || 4100);
  const mongoUri =
    process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/udyogsetu360';

  await mongoose.connect(mongoUri, {
    autoIndex: process.env.NODE_ENV !== 'production'
  });

  const app = createApp();
  app.listen(port, () => {
    console.log(`Case service listening on http://localhost:${port}`);
  });
  startOutboxPublisher();

  const shutdown = async () => {
    stopOutboxPublisher();
    await mongoose.disconnect().catch(() => {});
    process.exit(0);
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

start().catch((error) => {
  console.error('Case service failed to start:', error);
  process.exit(1);
});
