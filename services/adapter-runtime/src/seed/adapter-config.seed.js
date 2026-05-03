const mongoose = require('mongoose');
const adapterConfigRepository = require('../repositories/adapter-config.repository');
const { STATIC_ADAPTER_CONFIGS } = require('../config/static-adapter-configs');

async function seedAdapterConfigs() {
  const results = [];
  for (const config of STATIC_ADAPTER_CONFIGS) {
    results.push(await adapterConfigRepository.upsertConfig(config));
  }
  return results;
}

async function run() {
  const mongoUri =
    process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/udyogsetu360';
  await mongoose.connect(mongoUri, {
    autoIndex: process.env.NODE_ENV !== 'production'
  });
  const results = await seedAdapterConfigs();
  console.log(`Seeded ${results.length} adapter configs.`);
  await mongoose.disconnect();
}

if (require.main === module) {
  run().catch(async (error) => {
    console.error(error);
    await mongoose.disconnect().catch(() => {});
    process.exit(1);
  });
}

module.exports = { seedAdapterConfigs };
