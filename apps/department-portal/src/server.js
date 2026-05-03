const { connectDb } = require('../../../web/src/config/db');
const { createApp } = require('./app');

async function start() {
  await connectDb();
  const port = Number(process.env.DEPARTMENT_PORTAL_PORT || process.env.PORT || 4002);
  const app = createApp();
  app.listen(port, () => {
    console.log(`Department portal listening on http://localhost:${port}`);
  });
}

start().catch((error) => {
  console.error('Department portal failed to start:', error);
  process.exit(1);
});
