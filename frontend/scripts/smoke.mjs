const baseUrl = (process.env.SMOKE_BASE_URL ?? "http://127.0.0.1:3000").replace(/\/$/, "");
const checks = [
  ["landing", "/", 200],
  ["signup", "/login?mode=signup", 200],
  ["privacy", "/privacy", 200],
  ["health", "/api/health", 200],
];

let failed = false;
for (const [name, path, expected] of checks) {
  try {
    const response = await fetch(`${baseUrl}${path}`, { redirect: "manual" });
    const pass = response.status === expected;
    console.log(`${pass ? "PASS" : "FAIL"} ${name}: ${response.status}`);
    failed ||= !pass;
  } catch (error) {
    console.error(`FAIL ${name}: ${error instanceof Error ? error.message : "request failed"}`);
    failed = true;
  }
}

if (failed) process.exitCode = 1;
