import { randomBytes } from "node:crypto";
import { execFileSync, spawnSync } from "node:child_process";
const password = randomBytes(24).toString("hex");
const prefix = `test-${randomBytes(6).toString("hex")}`;
const created = [];
const testArgs = process.argv.slice(2);
const fixtureArg = testArgs.find((arg) => arg.startsWith("--fixtures="));
const fixtureProfile = fixtureArg?.slice("--fixtures=".length) ?? "all";
if (!["all", "core"].includes(fixtureProfile))
  throw Error("Fixtures must be all or core.");
const playwrightArgs = testArgs.filter((arg) => arg !== fixtureArg);
const composeArgs = [
  "compose",
  ...(process.env.TEST_COMPOSE_ENV_FILE
    ? ["--env-file", process.env.TEST_COMPOSE_ENV_FILE]
    : []),
  ...(process.env.TEST_COMPOSE_PROJECT
    ? ["-p", process.env.TEST_COMPOSE_PROJECT]
    : []),
  ...(process.env.TEST_COMPOSE_FILE
    ? ["-f", process.env.TEST_COMPOSE_FILE]
    : []),
];
try {
  for (const [username, role] of [
    ["test-reviewer", "reviewer"],
    ["test-participant", "participant"],
    ["test-other", "participant"],
    ["test-disabled", "participant"],
    ["test-intake-reviewer", "reviewer"],
    ["test-followup-reviewer", "reviewer"],
    ["test-followup-participant", "participant"],
    ["test-alert-reviewer", "reviewer"],
    ["test-alert-participant", "participant"],
    ["test-alert-ai-reviewer", "reviewer"],
    ["test-dashboard-reviewer", "reviewer"],
  ]) {
    if (
      fixtureProfile === "core" &&
      ![
        "test-reviewer",
        "test-participant",
        "test-other",
        "test-disabled",
      ].includes(username)
    )
      continue;
    const name = username.replace(/^test/, prefix);
    execFileSync(
      "docker",
      [
        ...composeArgs,
        "exec",
        "-T",
        "app",
        "npm",
        "run",
        "user",
        "--",
        "create",
        name,
        role,
      ],
      { input: password, stdio: ["pipe", "inherit", "inherit"] },
    );
    created.push(name);
  }
  execFileSync(
    "docker",
    [
      ...composeArgs,
      "exec",
      "-T",
      "app",
      "npm",
      "run",
      "user",
      "--",
      "disable",
      `${prefix}-disabled`,
    ],
    { stdio: "inherit" },
  );
  const result = spawnSync(
    process.execPath,
    ["node_modules/@playwright/test/cli.js", "test", ...playwrightArgs],
    {
      env: { ...process.env, TEST_PASSWORD: password, TEST_PREFIX: prefix },
      stdio: "inherit",
    },
  );
  process.exitCode = result.status ?? 1;
} finally {
  // Never leave test accounts enabled after a run, including failed assertions.
  for (const name of created)
    execFileSync(
      "docker",
      [
        ...composeArgs,
        "exec",
        "-T",
        "app",
        "npm",
        "run",
        "user",
        "--",
        "disable",
        name,
      ],
      { stdio: "inherit" },
    );
}
