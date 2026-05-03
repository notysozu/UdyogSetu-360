require('dotenv').config();

const { connectMongo } = require('../packages/shared/src');
const projectionService = require('../services/case-service/src/services/analytics-projection.service');

async function main() {
  await connectMongo();
  const result = await projectionService.rebuildAllProjections(
    {},
    {
      correlationId: `analytics-rebuild-${Date.now()}`,
      userId: 'system',
      role: 'system'
    }
  );
  // eslint-disable-next-line no-console
  console.log(JSON.stringify(result, null, 2));
  process.exit(0);
}

main().catch((error) => {
  // eslint-disable-next-line no-console
  console.error(error);
  process.exit(1);
});
