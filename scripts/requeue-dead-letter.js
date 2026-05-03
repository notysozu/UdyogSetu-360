const mongoose = require('mongoose');
const queueJobRepository = require('../services/adapter-runtime/src/repositories/queue-job.repository');
const { requeueQueueJob } = require('../services/adapter-runtime/src/services/queue-recovery.service');

function parseArgs(argv) {
  const args = {};
  for (let index = 2; index < argv.length; index += 2) {
    const key = argv[index]?.replace(/^--/, '');
    args[key] = argv[index + 1];
  }
  return args;
}

async function main() {
  const args = parseArgs(process.argv);
  if (!args.reason) {
    throw new Error('--reason is required');
  }

  const mongoUri =
    process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/udyogsetu360';
  await mongoose.connect(mongoUri, {
    autoIndex: process.env.NODE_ENV !== 'production'
  });

  let jobs = [];
  if (args.messageId) {
    const job = await queueJobRepository.findByMessageId(args.messageId);
    if (job) jobs = [job];
  } else {
    jobs = await queueJobRepository.findDeadLettered(
      args.department ? { departmentCode: args.department } : {},
      { limit: Number(args.limit || 10) }
    );
  }

  const results = [];
  for (const job of jobs) {
    results.push(
      await requeueQueueJob(job, args.reason, {
        actor: { id: 'queue-recovery-script', primaryRole: 'system' },
        force: String(args.force || 'false') === 'true'
      })
    );
  }

  console.log(JSON.stringify(results, null, 2));
  await mongoose.disconnect();
}

main().catch(async (error) => {
  console.error(error);
  await mongoose.disconnect().catch(() => {});
  process.exit(1);
});
