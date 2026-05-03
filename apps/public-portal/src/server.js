const { connectDb } = require('../../../web/src/config/db');
const { createApp } = require('./app');

async function start() {
  await connectDb();
  const port = Number(process.env.PUBLIC_PORTAL_PORT || process.env.PORT || 4003);
  const app = createApp();
  app.listen(port, () => {
    console.log(`Public portal listening on http://localhost:${port}`);
  });
}

start().catch((error) => {
  console.error('Public portal failed to start:', error);
  process.exit(1);
});
