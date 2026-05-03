import http from "k6/http";
import { check, sleep } from "k6";

export const options = { vus: 10, duration: "30s" };

export default function () {
  const baseUrl = __ENV.PUBLIC_PORTAL_URL || "http://localhost:4003";
  const res = http.get(`${baseUrl}/`);
  check(res, { "public portal loads": (r) => r.status >= 200 && r.status < 500 });
  sleep(1);
}
