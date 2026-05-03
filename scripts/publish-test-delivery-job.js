const { publishDepartmentDeliveryJob } = require('../services/adapter-runtime/src/producers/queue-producer');

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
  const department = args.department || 'pollution';
  const universalCaseId = args.case;
  if (!universalCaseId) {
    throw new Error('--case is required');
  }

  const result = await publishDepartmentDeliveryJob(
    department,
    args.jobType || 'submit',
    {
      departmentCode: department,
      universalCaseId,
      canonicalPayload: {
        enterprise: {},
        project: {},
        documents: []
      }
    },
    {
      correlationId: universalCaseId
    }
  );

  console.log(JSON.stringify(result, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
