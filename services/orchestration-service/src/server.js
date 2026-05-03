const mongoose = require('mongoose');
const { createApp } = require('./app');

async function start() {
  const port = Number(process.env.ORCHESTRATION_SERVICE_PORT || 4101);
  const mongoUri =
    process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/udyogsetu360';

  try {
    await mongoose.connect(mongoUri, {
      autoIndex: process.env.NODE_ENV !== 'production'
    });
  } catch (error) {
    console.warn('Orchestration service started without MongoDB connectivity.', error.message);
  }

  const app = createApp();
  app.listen(port, () => {
    console.log(`Orchestration service listening on http://localhost:${port}`);
  });
}

start().catch((error) => {
  console.error('Orchestration service failed to start:', error);
  process.exit(1);
});
