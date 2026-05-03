#!/usr/bin/env node
const mongoose = require('mongoose');
const { loadEnv } = require('../packages/shared/src/utils/config');
const {
  publishEvent
} = require('../packages/shared/src/kafka/event-producer');
const outboxRepository = require('../services/case-service/src/outbox/outbox.repository');

function parseArgs(argv) {
  const args = {};
  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    if (!token.startsWith('--')) {
      continue;
    }
    const key = token.slice(2);
    const next = argv[index + 1];
    if (!next || next.startsWith('--')) {
      args[key] = true;
    } else {
      args[key] = next;
      index += 1;
    }
  }
  return args;
}

async function main() {
  loadEnv();
  const args = parseArgs(process.argv.slice(2));
  const dryRun = Boolean(args['dry-run']);
  const republish = Boolean(args.republish);
  const confirm = Boolean(args.confirm);

  await mongoose.connect(process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/udyogsetu360');

  const filter = {};
  if (args.case) {
    filter.universalCaseId = args.case;
  }
  if (args.event) {
    filter.eventName = args.event;
  }
  if (args.from || args.to) {
    filter.createdAt = {};
    if (args.from) {
      filter.createdAt.$gte = new Date(args.from);
    }
    if (args.to) {
      filter.createdAt.$lte = new Date(args.to);
    }
  }

  const events = await outboxRepository.findByFilter(filter, {
    limit: Number(process.env.EVENT_REPLAY_BATCH_SIZE || 100)
  });

  const replayedAt = new Date().toISOString();
  const replayReason = args.reason || 'manual_replay';

  console.log(`Found ${events.length} event(s).`);

  if (dryRun || !republish) {
    events.forEach((event) => {
      console.log(`${event.eventId} ${event.eventName} ${event.universalCaseId || ''}`);
    });
    await mongoose.disconnect();
    return;
  }

  if (process.env.NODE_ENV === 'production' && !confirm) {
    throw new Error('Production replay requires --confirm.');
  }

  for (const event of events) {
    const envelope = {
      ...(event.envelope || {}),
      data: {
        ...(event.envelope?.data || {}),
        metadata: {
          ...(event.envelope?.data?.metadata || {}),
          replayedAt,
          replayedBy: 'scripts/replay-events.js',
          replayReason,
          originalEventId: event.eventId
        }
      }
    };
    await publishEvent(envelope, { topic: event.topic });
    console.log(`Republished ${event.eventId} to ${event.topic}`);
  }

  await mongoose.disconnect();
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
