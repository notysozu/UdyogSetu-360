const { publishCallbackReconciliationJob } = require('../services/adapter-runtime/src/producers/queue-producer');

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
  if (!args.department || !args.case || !args.type) {
    throw new Error('--department, --case, and --type are required');
  }

  const result = await publishCallbackReconciliationJob(
    {
      departmentCode: args.department,
      universalCaseId: args.case,
      callbackType: args.type,
      status: args.type === 'inspection_completed' ? 'completed' : args.type,
      remarks: 'Test callback',
      documents: [],
      receivedAt: new Date().toISOString()
    },
    {
      correlationId: args.case
    }
  );

  console.log(JSON.stringify(result, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
