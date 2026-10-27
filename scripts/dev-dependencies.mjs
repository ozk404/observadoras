import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import { spawnSync } from "node:child_process";

// This cache belongs only to the Linux development volume, never host node_modules.
const stamp = "node_modules/.observadoras-dev-deps";
const fingerprint = createHash("sha256")
  .update(await readFile("package-lock.json"))
  .update(`${process.version}:${process.platform}:${process.arch}`)
  .digest("hex");
let installed = "";
try {
  installed = await readFile(stamp, "utf8");
} catch (error) {
  if (error.code !== "ENOENT") throw error;
}
if (installed !== fingerprint) {
  const result = spawnSync(
    "npm",
    ["ci", "--include=optional", "--no-audit", "--no-fund"],
    { stdio: "inherit" },
  );
  if (result.status !== 0) process.exit(result.status ?? 1);
  await writeFile(stamp, fingerprint);
  console.log("Development dependencies installed.");
} else console.log("Development dependencies unchanged; reusing Linux volume.");
