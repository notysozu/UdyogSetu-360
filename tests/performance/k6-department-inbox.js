import http from "k6/http";
import { check, sleep } from "k6";

export const options = { vus: 5, duration: "30s" };

export default function () {
  const baseUrl = __ENV.DEPARTMENT_PORTAL_URL || "http://localhost:4002";
  const res = http.get(`${baseUrl}/department/tasks`);
  check(res, { "department inbox route responds": (r) => r.status >= 200 && r.status < 500 });
  sleep(1);
}
