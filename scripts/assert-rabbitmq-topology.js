const mongoose = require('mongoose');
const {
  createChannel,
  createRabbitConnection,
  assertTopology,
  closeRabbitConnection,
  isRabbitEnabled
} = require('../packages/shared/src');

async function main() {
  if (!isRabbitEnabled()) {
    console.log('RabbitMQ disabled. Nothing to assert.');
    return;
  }

  const mongoUri =
    process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/udyogsetu360';
  await mongoose.connect(mongoUri, {
    autoIndex: process.env.NODE_ENV !== 'production'
  });

  await createRabbitConnection();
  const channel = await createChannel();
  await assertTopology(channel);
  await channel.close();
  await closeRabbitConnection();
  await mongoose.disconnect();
  console.log('RabbitMQ topology asserted successfully.');
}

main().catch(async (error) => {
  console.error('Failed to assert RabbitMQ topology:', error);
  await mongoose.disconnect().catch(() => {});
  await closeRabbitConnection().catch(() => {});
  process.exit(1);
});
