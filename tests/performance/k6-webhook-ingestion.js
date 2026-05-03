import http from "k6/http";
import { check, sleep } from "k6";

export const options = { vus: 5, duration: "30s" };

export default function () {
  const baseUrl = __ENV.ADAPTER_RUNTIME_URL || "http://localhost:4102";
  const res = http.get(`${baseUrl}/health`);
  check(res, { "adapter runtime responds": (r) => r.status >= 200 && r.status < 500 });
  sleep(1);
}
