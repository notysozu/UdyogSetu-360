#!/usr/bin/env node
const mongoose = require("mongoose");

const MONGO_URI = process.env.MONGODB_URI || process.env.MONGO_URI || "mongodb://127.0.0.1:27017/udyogsetu360";

const DEPARTMENTS = [
  ["pollution", "Pollution Control Board", "mock"],
  ["power", "Power Department", "mock"],
  ["fire", "Fire and Emergency Services", "mock"],
  ["industrial_safety", "Industrial Safety and Health", "mock"],
  ["labour", "Labour Department", "mock"]
];

async function main() {
  if (process.env.NODE_ENV === "production" && process.env.DEMO_SEED_ENABLED !== "true") {
    throw new Error("Refusing to seed pilot departments in production without DEMO_SEED_ENABLED=true.");
  }
  if (process.env.DEMO_SEED_ENABLED !== "true") {
    throw new Error("Set DEMO_SEED_ENABLED=true to run pilot department seed.");
  }
  await mongoose.connect(MONGO_URI);
  const collection = mongoose.connection.collection("departments");
  for (const [code, name, adapterMode] of DEPARTMENTS) {
    await collection.updateOne(
      { code },
      {
        $set: {
          code,
          name,
          displayName: name,
          adapterMode,
          isPilotDepartment: true,
          status: "active",
          updatedAt: new Date()
        },
        $setOnInsert: { createdAt: new Date() }
      },
      { upsert: true }
    );
  }
  console.log(`Seeded ${DEPARTMENTS.length} pilot departments.`);
  await mongoose.disconnect();
}

main().catch(async (error) => {
  console.error(error.message);
  await mongoose.disconnect().catch(() => {});
  process.exit(1);
});
