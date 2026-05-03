const mongoose = require('mongoose');
const { createApp } = require('./app');

async function start() {
  const port = Number(process.env.NOTIFICATION_SERVICE_PORT || 4103);
  const mongoUri =
    process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/udyogsetu360';

  await mongoose.connect(mongoUri, {
    autoIndex: process.env.NODE_ENV !== 'production'
  });

  const app = createApp();
  app.listen(port, () => {
    console.log(`Notification service listening on http://localhost:${port}`);
  });
}

start().catch((error) => {
  console.error('Notification service failed to start:', error);
  process.exit(1);
});
