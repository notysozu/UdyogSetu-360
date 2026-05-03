const mongoose = require('mongoose');
const { createApp } = require('./app');

async function start() {
  const port = Number(process.env.AUDIT_SERVICE_PORT || 4104);
  const mongoUri =
    process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/udyogsetu360';

  await mongoose.connect(mongoUri, {
    autoIndex: process.env.NODE_ENV !== 'production'
  });

  const app = createApp();
  app.listen(port, () => {
    console.log(`Audit service listening on http://localhost:${port}`);
  });
}

start().catch((error) => {
  console.error('Audit service failed to start:', error);
  process.exit(1);
});
