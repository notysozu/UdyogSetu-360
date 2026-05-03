const mongoose = require('mongoose');
const { DEPARTMENT_CODE_VALUES } = require('../packages/shared/src');
const { startOutboundDepartmentWorker } = require('../services/adapter-runtime/src/consumers/outbound-department-delivery.consumer');
const { createRabbitConnection, closeRabbitConnection, isRabbitEnabled } = require('../packages/shared/src');

function parseArgs(argv) {
  const args = {};
  for (let index = 2; index < argv.length; index += 1) {
    const token = argv[index];
    if (token.startsWith('--')) {
      const key = token.replace(/^--/, '');
      const next = argv[index + 1];
      if (!next || next.startsWith('--')) {
        args[key] = true;
      } else {
        args[key] = next;
        index += 1;
      }
    }
  }
  return args;
}

async function main() {
  if (!isRabbitEnabled()) {
    console.log('RabbitMQ disabled; outbound worker will not start.');
    return;
  }

  const args = parseArgs(process.argv);
  const departments = args.all ? DEPARTMENT_CODE_VALUES : [args.department || 'pollution'];
  const mongoUri =
    process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/udyogsetu360';

  await mongoose.connect(mongoUri, {
    autoIndex: process.env.NODE_ENV !== 'production'
  });
  await createRabbitConnection();

  const workers = [];
  for (const department of departments) {
    workers.push(await startOutboundDepartmentWorker(department));
  }

  console.log(`Started outbound workers for: ${departments.join(', ')}`);

  const shutdown = async () => {
    await closeRabbitConnection().catch(() => {});
    await mongoose.disconnect().catch(() => {});
    process.exit(0);
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

main().catch(async (error) => {
  console.error(error);
  await mongoose.disconnect().catch(() => {});
  await closeRabbitConnection().catch(() => {});
  process.exit(1);
});
