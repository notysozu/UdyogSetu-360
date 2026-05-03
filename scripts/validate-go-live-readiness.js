#!/usr/bin/env node
const net = require("net");

const checks = [
  ["MONGODB_URI or MONGO_URI", () => Boolean(process.env.MONGODB_URI || process.env.MONGO_URI)],
  ["JWT_SECRET", () => Boolean(process.env.JWT_SECRET)],
  ["SERVICE_JWT_SECRET", () => Boolean(process.env.SERVICE_JWT_SECRET)],
  ["S3_BUCKET", () => Boolean(process.env.S3_BUCKET)],
  ["AI_SERVICE_BASE_URL", () => Boolean(process.env.AI_SERVICE_BASE_URL || process.env.AI_SERVICE_URL)],
  ["Kafka configured", () => process.env.KAFKA_ENABLED !== "true" || Boolean(process.env.KAFKA_BROKERS)],
  ["RabbitMQ configured", () => process.env.RABBITMQ_ENABLED !== "true" || Boolean(process.env.RABBITMQ_URL)]
];

function tcpCheck(host, port) {
  return new Promise((resolve) => {
    const socket = net.createConnection({ host, port, timeout: 1200 }, () => {
      socket.destroy();
      resolve(true);
    });
    socket.on("error", () => resolve(false));
    socket.on("timeout", () => {
      socket.destroy();
      resolve(false);
    });
  });
}

async function main() {
  const results = checks.map(([name, fn]) => ({ name, ok: fn() }));
  results.push({ name: "MongoDB TCP reachable", ok: await tcpCheck(process.env.MONGO_HOST || "127.0.0.1", Number(process.env.MONGO_PORT || 27017)) });
  results.push({ name: "RabbitMQ TCP reachable", ok: process.env.RABBITMQ_ENABLED === "false" ? true : await tcpCheck(process.env.RABBITMQ_HOST || "127.0.0.1", Number(process.env.RABBITMQ_PORT || 5672)) });
  results.push({ name: "Kafka TCP reachable", ok: process.env.KAFKA_ENABLED === "false" ? true : await tcpCheck(process.env.KAFKA_HOST || "127.0.0.1", Number(process.env.KAFKA_PORT || 9092)) });
  for (const result of results) {
    console.log(`${result.ok ? "PASS" : "WARN"} ${result.name}`);
  }
  const failed = results.filter((result) => !result.ok);
  if (failed.length) {
    console.log("Go-live readiness has warnings. Review docs/go-live-readiness.md before proceeding.");
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
