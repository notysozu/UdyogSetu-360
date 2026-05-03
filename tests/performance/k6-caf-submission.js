import http from "k6/http";
import { check, sleep } from "k6";

export const options = { vus: 5, duration: "30s" };

export default function () {
  const baseUrl = __ENV.BASE_URL || "http://localhost:4000";
  const res = http.get(`${baseUrl}/health`);
  check(res, { "gateway health returned 2xx/3xx": (r) => r.status >= 200 && r.status < 400 });
  sleep(1);
}
