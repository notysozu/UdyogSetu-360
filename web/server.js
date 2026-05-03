const { createApp } = require('./src/app');
const { connectDb } = require('./src/config/db');
const { env } = require('./src/config/env');

async function start() {
  await connectDb();
  const app = createApp();
  app.listen(env.PORT, () => {
    console.log(`UdyogSetu 360 web portal running on http://localhost:${env.PORT}`);
  });
}

start().catch((error) => {
  console.error('Failed to start UdyogSetu 360:', error);
  process.exit(1);
});
