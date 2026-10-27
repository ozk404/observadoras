import { randomBytes } from "node:crypto";
import { writeFile } from "node:fs/promises";
import { spawnSync } from "node:child_process";

const [action = "up", ...args] = process.argv.slice(2);
const actions = ["up", "down", "logs", "ui", "auth"];
if (!actions.includes(action)) {
  console.error(`Use: node scripts/dev.mjs ${actions.join("|")}`);
  process.exit(1);
}
const password = randomBytes(24).toString("hex");
try {
  await writeFile(
    ".env.dev",
    [
      "POSTGRES_USER=observadoras_dev",
      "POSTGRES_DB=observadoras_dev",
      `POSTGRES_PASSWORD=${password}`,
      `DATABASE_URL=postgresql://observadoras_dev:${password}@db:5432/observadoras_dev`,
      `AUTH_SECRET=${randomBytes(48).toString("hex")}`,
      "APP_ORIGIN=http://localhost:3100",
      "COOKIE_SECURE=false",
      "TRUST_PROXY=false",
      "OPENAI_API_KEY=fictional-development-key",
      "OPENAI_MODEL=simulated-model",
      "AI_DATA_MODE=synthetic",
      "AI_TEST_MODE=true",
      "OPENAI_TEST_ENDPOINT=http://openai-mock:4000/v1/responses",
      "AI_AUTOMATIC_ENABLED=true",
      "",
    ].join("\n"),
    { flag: "wx", mode: 0o600 },
  );
  console.log("Created isolated .env.dev; production configuration unchanged.");
} catch (error) {
  if (error.code !== "EEXIST") throw error;
}
function run(command, parameters, env = process.env) {
  const result = spawnSync(command, parameters, { stdio: "inherit", env });
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status ?? 1);
}
const compose = ["compose", "--env-file", ".env.dev", "-f", "compose.dev.yaml"];
if (action === "up") {
  if (args.some((arg) => arg !== "--ai")) throw Error("up only accepts --ai");
  run("docker", [
    ...compose,
    ...(args.includes("--ai") ? ["--profile", "ai"] : []),
    "up",
    "-d",
  ]);
  console.log(
    "Development: http://localhost:3100 — fictional data and local AI mock only.",
  );
} else if (action === "down") {
  run("docker", [...compose, "--profile", "ai", "down"]);
} else if (action === "logs") {
  run("docker", [...compose, "logs", "-f", "app"]);
} else {
  const env = {
    ...process.env,
    TEST_BASE_URL: "http://localhost:3100",
    TEST_DEV: "true",
    TEST_COMPOSE_FILE: "compose.dev.yaml",
    TEST_COMPOSE_PROJECT: "observadoras-dev",
    TEST_COMPOSE_ENV_FILE: ".env.dev",
    TEST_AI: args.includes("--ai") ? "true" : "false",
  };
  const testArgs = args.filter((arg) => arg !== "--ai");
  if (action === "auth" && args.includes("--ai")) {
    run("docker", [...compose, "--profile", "ai", "up", "-d", "ai-worker"]);
  }
  if (action === "auth") {
    const reset = `import pg from 'pg';
      if (process.env.APP_ORIGIN !== 'http://localhost:3100' || process.env.AI_TEST_MODE !== 'true' || process.env.OPENAI_TEST_ENDPOINT !== 'http://openai-mock:4000/v1/responses') throw Error('Not isolated development');
      const db = new pg.Pool({ connectionString: process.env.DATABASE_URL });
      try { if ((await db.query('SELECT current_database() name')).rows[0].name !== 'observadoras_dev') throw Error('Not development database');
        await db.query('DELETE FROM rate_limits'); console.log('Cleared development-only rate counters.');
      } finally { await db.end(); }`;
    run("docker", [
      ...compose,
      "exec",
      "-T",
      "app",
      "node",
      "--input-type=module",
      "-e",
      reset,
    ]);
  }
  if (action === "ui")
    run(
      process.execPath,
      [
        "node_modules/@playwright/test/cli.js",
        "test",
        ...(testArgs.some((arg) => arg.includes(".spec."))
          ? testArgs
          : ["report-tour.spec.ts", "report-layout-hash.spec.ts", ...testArgs]),
      ],
      env,
    );
  else run(process.execPath, ["scripts/test-e2e.mjs", ...testArgs], env);
}
