require('dotenv').config();

const { connectMongo } = require('../packages/shared/src');
const { runAnalyticsRollupJob } = require('../services/case-service/src/jobs/analytics-rollup.job');

async function main() {
  await connectMongo();
  const result = await runAnalyticsRollupJob({
    correlationId: `analytics-rollup-${Date.now()}`,
    userId: 'system',
    role: 'system'
  });
  // eslint-disable-next-line no-console
  console.log(JSON.stringify(result, null, 2));
  process.exit(result.ok === false ? 1 : 0);
}

main().catch((error) => {
  // eslint-disable-next-line no-console
  console.error(error);
  process.exit(1);
});
