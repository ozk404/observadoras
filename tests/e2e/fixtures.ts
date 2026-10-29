import { test as base } from "@playwright/test";
import { execFileSync } from "node:child_process";
export * from "@playwright/test";
export const test = base.extend<{ isolatedRateCounters: void }>({
  isolatedRateCounters: [
    async ({}, use) => {
      if (process.env.TEST_PASSWORD && process.env.TEST_DEV === "true") {
        if (
          process.env.TEST_BASE_URL !== "http://localhost:3100" ||
          process.env.TEST_COMPOSE_PROJECT !== "observadoras-dev" ||
          !process.env.TEST_COMPOSE_FILE
        )
          throw Error(
            "Rate reset is allowed only in the isolated test project",
          );
        const args = [
          "compose",
          ...(process.env.TEST_COMPOSE_ENV_FILE
            ? ["--env-file", process.env.TEST_COMPOSE_ENV_FILE]
            : []),
          "-p",
          "observadoras-dev",
          "-f",
          process.env.TEST_COMPOSE_FILE,
          "exec",
          "-T",
          "app",
          "node",
          "--import",
          "tsx",
          "--input-type=module",
          "-e",
          `import{db}from'./src/server/db.ts';try{if(process.env.APP_ORIGIN!=='http://localhost:3100'||process.env.AI_TEST_MODE!=='true'||process.env.OPENAI_TEST_ENDPOINT!=='http://openai-mock:4000/v1/responses'||(await db.query('SELECT current_database() AS name')).rows[0].name!=='observadoras_dev')throw Error('Not an isolated fixture database');await db.query('DELETE FROM rate_limits');}finally{await db.end()}`,
        ];
        execFileSync("docker", args, { stdio: ["ignore", "pipe", "pipe"] });
      }
      await use();
    },
    { auto: true },
  ],
});
