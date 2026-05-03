#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const { publishEvent } = require('../packages/shared/src/kafka/event-producer');

const SAMPLE_MAP = {
  'case-submitted': 'case-submitted.sample.json',
  'task-created': 'task-created.sample.json',
  'document-uploaded': 'document-uploaded.sample.json',
  'grievance-created': 'grievance-created.sample.json',
  'inspection-scheduled': 'inspection-scheduled.sample.json',
  'fee-demanded': 'fee-demanded.sample.json',
  'fee-paid': 'fee-paid.sample.json',
  'certificate-issued': 'certificate-issued.sample.json'
};

async function main() {
  const key = process.argv[2];
  if (!SAMPLE_MAP[key]) {
    throw new Error(`Unknown sample ${key}.`);
  }
  const filePath = path.join(process.cwd(), 'events', 'samples', SAMPLE_MAP[key]);
  const eventEnvelope = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  const result = await publishEvent(eventEnvelope);
  console.log(
    JSON.stringify(
      {
        topic: result.topic,
        partitionKey: eventEnvelope.partitionkey,
        eventId: eventEnvelope.id
      },
      null,
      2
    )
  );
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
