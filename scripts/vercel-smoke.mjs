import http from "node:http";
import { once } from "node:events";
import app from "../.tmp-vercel-api.mjs";

const server = http.createServer(app);
server.listen(0, "127.0.0.1");
await once(server, "listening");
const { port } = server.address();

async function check(path) {
  const response = await fetch(`http://127.0.0.1:${port}${path}`);
  const body = await response.text();
  return { path, status: response.status, contentType: response.headers.get("content-type") ?? "", body };
}

const checks = await Promise.all([
  check("/api/trpc/auth.me"),
  check("/api/index/trpc/auth.me"),
]);

server.close();
await once(server, "close");

for (const result of checks) {
  if (![200, 401, 404].includes(result.status)) {
    throw new Error(`${result.path} returned unexpected ${result.status}: ${result.body.slice(0, 200)}`);
  }
}

if (checks[0].status !== checks[1].status) {
  throw new Error(`rewrite normalization mismatch: ${JSON.stringify(checks)}`);
}

console.log(JSON.stringify(checks.map(({ path, status, contentType }) => ({ path, status, contentType }))));
