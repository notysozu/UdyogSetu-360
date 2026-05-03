#!/usr/bin/env node
const fs = require("fs");
const path = require("path");

function parseArgs(argv) {
  const args = { dryRun: true };
  for (let i = 2; i < argv.length; i += 1) {
    if (argv[i] === "--dry-run") args.dryRun = true;
    if (argv[i] === "--execute") args.dryRun = false;
    if (argv[i] === "--input") args.input = argv[i + 1];
  }
  return args;
}

function parseCsv(filePath) {
  const content = fs.readFileSync(filePath, "utf8").trim();
  const [headerLine, ...lines] = content.split(/\r?\n/);
  const headers = headerLine.split(",");
  return lines.filter(Boolean).map((line) => Object.fromEntries(line.split(",").map((value, index) => [headers[index], value])));
}

async function main() {
  const args = parseArgs(process.argv);
  if (!args.input) throw new Error("Usage: node scripts/import-legacy-data.js --dry-run --input tests/fixtures/legacy/legacy-cases.sample.csv");
  const inputPath = path.resolve(args.input);
  const rows = parseCsv(inputPath);
  const report = {
    input: inputPath,
    dryRun: args.dryRun,
    rows: rows.length,
    validRows: rows.filter((row) => row.legacyReferenceId).length,
    errors: rows.filter((row) => !row.legacyReferenceId).map((row, index) => ({ index, error: "legacyReferenceId missing", row })),
    eventsToCreate: ["legacy.case_imported.v1", "legacy.document_imported.v1", "legacy.certificate_imported.v1"]
  };
  fs.mkdirSync("tmp", { recursive: true });
  fs.writeFileSync("tmp/legacy-import-report.json", JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report, null, 2));
  if (!args.dryRun) {
    console.log("Execute mode is a controlled placeholder. Wire to case-service repositories after pilot mapping sign-off.");
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
