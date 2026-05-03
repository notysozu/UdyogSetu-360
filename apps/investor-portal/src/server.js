const { connectDb } = require('../../../web/src/config/db');
const { createApp } = require('./app');

async function start() {
  await connectDb();
  const port = Number(process.env.INVESTOR_PORTAL_PORT || process.env.PORT || 4001);
  const app = createApp();
  app.listen(port, () => {
    console.log(`Investor portal listening on http://localhost:${port}`);
  });
}

start().catch((error) => {
  console.error('Investor portal failed to start:', error);
  process.exit(1);
});
