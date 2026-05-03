#!/usr/bin/env node
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("../services/case-service/src/models/User");

const MONGO_URI = process.env.MONGODB_URI || process.env.MONGO_URI || "mongodb://127.0.0.1:27017/udyogsetu360";
const DEMO_PASSWORD = "password123";

const USERS = [
  ["investor@udyogsetu.local", "Demo Investor", "investor"],
  ["officer.pollution@udyogsetu.local", "Pollution Officer", "department_officer", "pollution"],
  ["officer.power@udyogsetu.local", "Power Officer", "department_officer", "power"],
  ["officer.fire@udyogsetu.local", "Fire Officer", "department_officer", "fire"],
  ["officer.industrial@udyogsetu.local", "Industrial Safety Officer", "department_officer", "industrial_safety"],
  ["officer.labour@udyogsetu.local", "Labour Officer", "department_officer", "labour"],
  ["supervisor.pollution@udyogsetu.local", "Pollution Supervisor", "department_supervisor", "pollution"],
  ["supervisor.power@udyogsetu.local", "Power Supervisor", "department_supervisor", "power"],
  ["supervisor.fire@udyogsetu.local", "Fire Supervisor", "department_supervisor", "fire"],
  ["supervisor.industrial@udyogsetu.local", "Industrial Safety Supervisor", "department_supervisor", "industrial_safety"],
  ["supervisor.labour@udyogsetu.local", "Labour Supervisor", "department_supervisor", "labour"],
  ["nodal@udyogsetu.local", "Demo Nodal Officer", "nodal_officer"],
  ["admin@udyogsetu.local", "Demo Admin", "admin"],
  ["auditor@udyogsetu.local", "Demo Auditor", "auditor"],
  ["system@udyogsetu.local", "Demo System", "system"]
];

async function main() {
  if (process.env.NODE_ENV === "production" && process.env.DEMO_SEED_ENABLED !== "true") {
    throw new Error("Refusing to seed demo users in production without DEMO_SEED_ENABLED=true.");
  }
  if (process.env.DEMO_SEED_ENABLED !== "true") {
    throw new Error("Set DEMO_SEED_ENABLED=true to run demo user seed.");
  }
  await mongoose.connect(MONGO_URI);
  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);
  for (const [email, name, role, departmentCode] of USERS) {
    await User.updateOne(
      { email },
      {
        $set: {
          name,
          email,
          passwordHash,
          roles: [role],
          primaryRole: role,
          status: "active",
          emailVerifiedAt: new Date(),
          locale: "en-IN",
          timezone: "Asia/Kolkata",
          "preferences.demoDepartmentCode": departmentCode || null
        }
      },
      { upsert: true, runValidators: false }
    );
  }
  if (process.env.NODE_ENV !== "production") {
    console.log(`Seeded ${USERS.length} demo users with password: ${DEMO_PASSWORD}`);
  } else {
    console.log(`Seeded ${USERS.length} demo users.`);
  }
  await mongoose.disconnect();
}

main().catch(async (error) => {
  console.error(error.message);
  await mongoose.disconnect().catch(() => {});
  process.exit(1);
});
