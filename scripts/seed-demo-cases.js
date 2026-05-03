#!/usr/bin/env node
const mongoose = require("mongoose");

const MONGO_URI = process.env.MONGODB_URI || process.env.MONGO_URI || "mongodb://127.0.0.1:27017/udyogsetu360";

const CASES = [
  ["US360-KA-2026-000001", "submitted", "Submitted manufacturing case with five department tasks"],
  ["US360-KA-2026-000002", "under_review", "Case with pollution query and fire inspection"],
  ["US360-KA-2026-000003", "approved", "Case with labour approval and certificate"]
];

const DEPARTMENTS = ["pollution", "power", "fire", "industrial_safety", "labour"];

async function main() {
  if (process.env.NODE_ENV === "production" && process.env.DEMO_SEED_ENABLED !== "true") {
    throw new Error("Refusing to seed demo cases in production without DEMO_SEED_ENABLED=true.");
  }
  if (process.env.DEMO_SEED_ENABLED !== "true") {
    throw new Error("Set DEMO_SEED_ENABLED=true to run demo case seed.");
  }
  await mongoose.connect(MONGO_URI);
  const now = new Date();
  const users = mongoose.connection.collection("users");
  const investor = await users.findOne({ email: "investor@udyogsetu.local" });
  const applicantUserId = investor?._id || new mongoose.Types.ObjectId();
  const organisationId = new mongoose.Types.ObjectId();

  for (const [universalCaseId, status, title] of CASES) {
    await mongoose.connection.collection("organisations").updateOne(
      { _id: organisationId },
      { $set: { legalName: "Demo Manufacturing Pvt Ltd", maskedName: "Demo M*********** Pvt Ltd", sourceSystem: "demo", updatedAt: now }, $setOnInsert: { createdAt: now } },
      { upsert: true }
    );
    const caseDoc = {
      universalCaseId,
      sourceSystem: "demo_seed",
      sourceReferenceId: `DEMO-${universalCaseId}`,
      organisationId,
      applicantUserId,
      caseType: "new_industrial_unit",
      title,
      description: "Demo pilot case for UdyogSetu 360 production readiness.",
      status,
      priority: status === "under_review" ? "high" : "normal",
      requiredDepartments: DEPARTMENTS.map((departmentCode) => ({ departmentCode, reason: "Demo pilot routing", requiredApprovalType: "scrutiny", isMandatory: true })),
      approvalTracks: DEPARTMENTS.map((departmentCode) => ({ departmentCode, status: status === "approved" ? "approved" : "pending" })),
      currentStage: status === "approved" ? "certificate_issued" : "department_review",
      submittedAt: status === "draft" ? null : now,
      lastActivityAt: now,
      tags: ["demo", "pilot"],
      updatedAt: now
    };
    await mongoose.connection.collection("cases").updateOne(
      { universalCaseId },
      { $set: caseDoc, $setOnInsert: { createdAt: now } },
      { upsert: true }
    );
    const caseRecord = await mongoose.connection.collection("cases").findOne({ universalCaseId });
    for (const departmentCode of DEPARTMENTS) {
      await mongoose.connection.collection("approvaltasks").updateOne(
        { caseId: caseRecord._id, departmentCode },
        {
          $set: {
            caseId: caseRecord._id,
            universalCaseId,
            departmentCode,
            taskType: "scrutiny",
            status: status === "approved" ? "approved" : departmentCode === "pollution" && universalCaseId.endsWith("000002") ? "query_raised" : "assigned",
            title: `${departmentCode} demo task`,
            assignedAt: now,
            dueAt: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000),
            updatedAt: now
          },
          $setOnInsert: { createdAt: now }
        },
        { upsert: true }
      );
    }
    await mongoose.connection.collection("domainevents").updateOne(
      { eventId: `demo.${universalCaseId}.seeded` },
      { $set: { eventId: `demo.${universalCaseId}.seeded`, eventType: "demo.case_seeded.v1", aggregateId: universalCaseId, payload: { universalCaseId }, createdAt: now } },
      { upsert: true }
    );
  }
  console.log(`Seeded ${CASES.length} demo cases and pilot tasks.`);
  await mongoose.disconnect();
}

main().catch(async (error) => {
  console.error(error.message);
  await mongoose.disconnect().catch(() => {});
  process.exit(1);
});
