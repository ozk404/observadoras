import {
  createCipheriv,
  createDecipheriv,
  randomBytes,
  scryptSync,
  createHash,
} from "node:crypto";
import { spawn } from "node:child_process";
import { createReadStream, createWriteStream } from "node:fs";
import { promises as fs } from "node:fs";
import { pipeline } from "node:stream/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import readline from "node:readline";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const magic = Buffer.from("OVPBACK1");
const names = [
  "database.dump",
  "source.tar.gz",
  "environment.env",
  "manifest.json",
];
const [operation, ...args] = process.argv.slice(2);
const options = new Map();
for (let i = 0; i < args.length; i += 2) {
  if (!args[i].startsWith("--") || !args[i + 1] || options.has(args[i]))
    throw new Error("Invalid arguments.");
  options.set(args[i], args[i + 1]);
}
const allowed =
  operation === "export"
    ? ["--container", "--output", "--project-dir"]
    : ["--container", "--input", "--files-to"];
if (
  !["export", "import"].includes(operation) ||
  [...options.keys()].some((key) => !allowed.includes(key))
) {
  console.error(
    "Export: node scripts/backup.mjs export --container DATABASE_CONTAINER --output FILE.ovpbackup\nImport: node scripts/backup.mjs import --container EMPTY_DATABASE_CONTAINER --input FILE.ovpbackup --files-to NEW_DIRECTORY",
  );
  process.exit(1);
}
const container = options.get("--container");
if (!container || !/^[a-zA-Z0-9][a-zA-Z0-9_.-]*$/.test(container))
  throw new Error("Specify a database container.");
let work;
let partial;

async function run(command, commandArgs, capture = false) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, commandArgs, {
      stdio: ["ignore", capture ? "pipe" : "ignore", "ignore"],
    });
    let output = "";
    child.stdout?.on("data", (data) => {
      output += data;
    });
    child.on("error", () => reject(new Error(`Cannot execute ${command}.`)));
    child.on("close", (code) =>
      code === 0
        ? resolve(output.trim())
        : reject(
            new Error(
              `${command} failed (exit ${code}); private output omitted.`,
            ),
          ),
    );
  });
}
function databaseCommand(command, extra = []) {
  return [
    "exec",
    container,
    "sh",
    "-c",
    `exec ${command} -U "$POSTGRES_USER" -d "$POSTGRES_DB" "$@"`,
    "backup",
    ...extra,
  ];
}
async function sql(query) {
  return run(
    "docker",
    databaseCommand("psql", [
      "-X",
      "-v",
      "ON_ERROR_STOP=1",
      "-At",
      "-c",
      query,
    ]),
    true,
  );
}
async function password(prompt) {
  if (process.env.OBS_BACKUP_PASSWORD) return process.env.OBS_BACKUP_PASSWORD;
  if (!process.stdin.isTTY)
    throw new Error(
      "Use an interactive terminal to enter the backup password.",
    );
  process.stdout.write(prompt);
  readline.emitKeypressEvents(process.stdin);
  process.stdin.setRawMode(true);
  process.stdin.resume();
  return new Promise((resolve, reject) => {
    let value = "";
    function keypress(text, key) {
      if (key.name === "return" || (key.ctrl && key.name === "c")) {
        process.stdin.off("keypress", keypress);
        process.stdin.setRawMode(false);
        process.stdin.pause();
        process.stdout.write("\n");
        if (key.ctrl) reject(new Error("Cancelled."));
        else resolve(value);
      } else if (key.name === "backspace") value = value.slice(0, -1);
      else if (text && !key.ctrl && !key.meta) value += text;
    }
    process.stdin.on("keypress", keypress);
  });
}
async function hash(file) {
  const digest = createHash("sha256");
  for await (const chunk of createReadStream(file)) digest.update(chunk);
  return digest.digest("hex");
}
async function sourceFiles(directory, relative = ".") {
  const excluded = new Set([
    ".git",
    "node_modules",
    ".next",
    "artifacts",
    "backups",
    "test-results",
    "playwright-report",
  ]);
  const files = [];
  for (const entry of await fs.readdir(path.join(directory, relative), {
    withFileTypes: true,
  })) {
    if (
      excluded.has(entry.name) ||
      (entry.name.startsWith(".env") && entry.name !== ".env.example") ||
      entry.name.endsWith(".ovpbackup") ||
      entry.name.includes(".partial-")
    )
      continue;
    const name = path.join(relative, entry.name);
    if (entry.isSymbolicLink())
      throw new Error(
        "Source contains symbolic links. Export regular project files only.",
      );
    if (entry.isDirectory())
      files.push(...(await sourceFiles(directory, name)));
    else if (entry.isFile()) files.push("./" + name.split(path.sep).join("/"));
    else throw new Error("Source contains an unsupported special file.");
  }
  return files;
}
async function counts() {
  const tables = JSON.parse(
    await sql(
      "SELECT coalesce(json_agg(tablename ORDER BY tablename),'[]') FROM pg_tables WHERE schemaname='public'",
    ),
  );
  const result = {};
  for (const table of tables) {
    const identifier = '"' + table.replaceAll('"', '""') + '"';
    result[table] = await sql(`SELECT count(*) FROM public.${identifier}`);
  }
  return result;
}
async function dump(file) {
  const child = spawn(
    "docker",
    databaseCommand("pg_dump", [
      "--format=custom",
      "--no-owner",
      "--no-privileges",
    ]),
    { stdio: ["ignore", "pipe", "ignore"] },
  );
  const completion = new Promise((resolve, reject) => {
    child.on("error", () => reject(new Error("Cannot start pg_dump.")));
    child.on("close", (code) =>
      code === 0
        ? resolve()
        : reject(new Error("pg_dump failed; private output omitted.")),
    );
  });
  await Promise.all([
    pipeline(
      child.stdout,
      createWriteStream(file, { flags: "wx", mode: 0o600 }),
    ),
    completion,
  ]);
}
async function restore(file) {
  const command = databaseCommand("pg_restore", [
    "--single-transaction",
    "--no-owner",
    "--no-privileges",
    "--exit-on-error",
  ]);
  command.splice(1, 0, "-i");
  const child = spawn("docker", command, {
    stdio: ["pipe", "ignore", "ignore"],
  });
  const completion = new Promise((resolve, reject) => {
    child.on("error", () => reject(new Error("Cannot start pg_restore.")));
    child.on("close", (code) =>
      code === 0
        ? resolve()
        : reject(
            new Error(
              "Restore failed and its transaction was rolled back; private output omitted.",
            ),
          ),
    );
  });
  await Promise.all([
    pipeline(createReadStream(file), child.stdin),
    completion,
  ]);
}
async function exportBackup(secret) {
  const sourceRoot = path.resolve(options.get("--project-dir") ?? root);
  const output = path.resolve(
    options.get("--output") ??
      path.join(
        root,
        "backups",
        `observatorio-${new Date().toISOString().replaceAll(":", "-")}.ovpbackup`,
      ),
  );
  await fs.access(path.join(sourceRoot, ".env"));
  await fs.mkdir(path.dirname(output), { recursive: true, mode: 0o700 });
  try {
    await fs.access(output);
    throw new Error("Output already exists.");
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
  }
  console.log("Exporting a consistent PostgreSQL snapshot...");
  await dump(path.join(work, names[0]));
  // Counts are obtained from the dump after restoration, rather than from a changing live database.
  const list = path.join(work, "source-files.list");
  await fs.writeFile(list, (await sourceFiles(sourceRoot)).join("\0") + "\0", {
    mode: 0o600,
  });
  await run("tar", [
    "-czf",
    path.join(work, names[1]),
    "-C",
    sourceRoot,
    "--null",
    "-T",
    list,
  ]);
  await fs.copyFile(path.join(sourceRoot, ".env"), path.join(work, names[2]));
  let revision = "uncommitted";
  try {
    revision = await run("git", ["-C", sourceRoot, "rev-parse", "HEAD"], true);
  } catch {
    /* Source is included even without Git. */
  }
  const manifest = {
    format: 1,
    createdAt: new Date().toISOString(),
    postgres: await sql("SHOW server_version"),
    revision,
    migrations: JSON.parse(
      await sql(
        "SELECT coalesce(json_agg(name ORDER BY name),'[]') FROM migrations",
      ),
    ),
    files: {},
  };
  for (const name of names.slice(0, 3))
    manifest.files[name] = {
      bytes: (await fs.stat(path.join(work, name))).size,
      sha256: await hash(path.join(work, name)),
    };
  await fs.writeFile(
    path.join(work, names[3]),
    JSON.stringify(manifest, null, 2),
    { mode: 0o600 },
  );
  const header = Buffer.from(
    JSON.stringify(
      await Promise.all(
        names.map(async (name) => ({
          name,
          size: (await fs.stat(path.join(work, name))).size,
        })),
      ),
    ),
  );
  const size = Buffer.alloc(4);
  size.writeUInt32BE(header.length);
  const salt = randomBytes(16);
  const iv = randomBytes(12);
  const key = scryptSync(secret, salt, 32);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  cipher.setAAD(Buffer.concat([magic, salt, iv]));
  partial = output + ".partial-" + randomBytes(6).toString("hex");
  async function* payload() {
    yield size;
    yield header;
    for (const name of names) yield* createReadStream(path.join(work, name));
  }
  await fs.writeFile(partial, Buffer.concat([magic, salt, iv]), {
    mode: 0o600,
    flag: "wx",
  });
  await pipeline(
    payload(),
    cipher,
    createWriteStream(partial, { flags: "a", mode: 0o600 }),
  );
  await fs.appendFile(partial, cipher.getAuthTag());
  // Hard link publishes the completed file without overwriting another export.
  await fs.link(partial, output);
  await fs.unlink(partial);
  partial = undefined;
  console.log(`Backup created: ${output}`);
}
async function importBackup(secret) {
  if (!options.get("--input") || !options.get("--files-to"))
    throw new Error("Specify --input and --files-to.");
  const input = path.resolve(options.get("--input"));
  const destination = path.resolve(options.get("--files-to"));
  try {
    await fs.access(destination);
    throw new Error(
      "Destination directory already exists. Choose a new directory.",
    );
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
  }
  if (
    (await sql(
      "SELECT count(*) FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname NOT IN ('pg_catalog','information_schema') AND n.nspname NOT LIKE 'pg_toast%' AND n.nspname NOT LIKE 'pg_temp%'",
    )) !== "0"
  )
    throw new Error(
      "Destination database must be empty. Nothing was restored.",
    );
  const file = await fs.open(input, "r");
  const length = (await file.stat()).size;
  const prefix = Buffer.alloc(36);
  const tag = Buffer.alloc(16);
  await file.read(prefix, 0, 36, 0);
  await file.read(tag, 0, 16, length - 16);
  await file.close();
  if (length < 56 || !prefix.subarray(0, 8).equals(magic))
    throw new Error("Invalid backup format.");
  const decipher = createDecipheriv(
    "aes-256-gcm",
    scryptSync(secret, prefix.subarray(8, 24), 32),
    prefix.subarray(24),
  );
  decipher.setAAD(prefix);
  decipher.setAuthTag(tag);
  const plaintext = path.join(work, "authenticated.payload");
  try {
    await pipeline(
      createReadStream(input, { start: 36, end: length - 17 }),
      decipher,
      createWriteStream(plaintext, { mode: 0o600, flags: "wx" }),
    );
  } catch {
    throw new Error("Wrong password or damaged backup. Nothing was restored.");
  }
  const payload = await fs.open(plaintext, "r");
  let entries;
  let offset;
  try {
    const size = Buffer.alloc(4);
    await payload.read(size, 0, 4, 0);
    const headerSize = size.readUInt32BE();
    if (headerSize > 8192) throw new Error("Invalid package header.");
    const header = Buffer.alloc(headerSize);
    await payload.read(header, 0, headerSize, 4);
    entries = JSON.parse(header.toString());
    offset = 4 + headerSize;
    if (
      !Array.isArray(entries) ||
      entries.length !== names.length ||
      entries.some(
        (entry, index) =>
          entry.name !== names[index] ||
          !Number.isSafeInteger(entry.size) ||
          entry.size <= 0,
      )
    )
      throw new Error("Invalid package entries.");
    if (
      offset + entries.reduce((sum, entry) => sum + entry.size, 0) !==
      (await payload.stat()).size
    )
      throw new Error("Truncated package.");
  } finally {
    await payload.close();
  }
  for (const entry of entries) {
    await pipeline(
      createReadStream(plaintext, {
        start: offset,
        end: offset + entry.size - 1,
      }),
      createWriteStream(path.join(work, entry.name), {
        mode: 0o600,
        flags: "wx",
      }),
    );
    offset += entry.size;
  }
  const manifest = JSON.parse(
    await fs.readFile(path.join(work, "manifest.json"), "utf8"),
  );
  if (manifest.format !== 1) throw new Error("Unsupported manifest.");
  for (const name of names.slice(0, 3))
    if ((await hash(path.join(work, name))) !== manifest.files[name]?.sha256)
      throw new Error("Integrity check failed.");
  const major = (value) => Number(value.split(".")[0]);
  if (major(await sql("SHOW server_version")) !== major(manifest.postgres))
    throw new Error("Use the same PostgreSQL major version as the export.");
  const archive = path.join(work, "source.tar.gz");
  const listing = await run("tar", ["-tzf", archive], true);
  const types = await run("tar", ["-tvzf", archive], true);
  if (
    listing
      .split(/\r?\n/)
      .some(
        (name) =>
          name.startsWith("/") ||
          name.includes("\\") ||
          name.includes(":") ||
          name.split("/").includes(".."),
      ) ||
    types.split(/\r?\n/).some((line) => !["-", "d"].includes(line[0]))
  )
    throw new Error("Source archive contains unsupported paths or links.");
  await fs.mkdir(destination, { mode: 0o700, recursive: false });
  await run("tar", ["-xzf", archive, "--no-same-owner", "-C", destination]);
  await fs.copyFile(
    path.join(work, "environment.env"),
    path.join(destination, ".env.reference"),
  );
  await fs.chmod(path.join(destination, ".env.reference"), 0o600);
  await fs.copyFile(
    path.join(work, "manifest.json"),
    path.join(destination, "backup-manifest.json"),
  );
  console.log("Restoring verified package into the empty database...");
  await restore(path.join(work, "database.dump"));
  await sql("DELETE FROM sessions");
  const restoredMigrations = JSON.parse(
    await sql(
      "SELECT coalesce(json_agg(name ORDER BY name),'[]') FROM migrations",
    ),
  );
  if (
    JSON.stringify(restoredMigrations) !== JSON.stringify(manifest.migrations)
  )
    throw new Error(
      "Restored migrations differ from the manifest. Keep the application stopped.",
    );
  console.log("Database restored. Previous sessions closed.");
  console.log(`Source and private configuration reference: ${destination}`);
  console.log(`Table counts: ${JSON.stringify(await counts())}`);
  console.log(
    "Prepare .env from .env.reference for the destination database, domain and proxy before starting the restored application.",
  );
}
try {
  const secret = await password("Backup password: ");
  if (secret.length < 14)
    throw new Error("Use a backup password of at least 14 characters.");
  if (
    operation === "export" &&
    !process.env.OBS_BACKUP_PASSWORD &&
    secret !== (await password("Confirm password: "))
  )
    throw new Error("Passwords do not match.");
  work = await fs.mkdtemp(path.join(tmpdir(), "observadoras-backup-"));
  await fs.chmod(work, 0o700);
  if (operation === "export") await exportBackup(secret);
  else await importBackup(secret);
} catch (error) {
  console.error(
    error instanceof Error ? error.message : "Backup operation failed.",
  );
  process.exitCode = 1;
} finally {
  if (partial) await fs.rm(partial, { force: true });
  if (
    work &&
    path.dirname(work) === path.resolve(tmpdir()) &&
    path.basename(work).startsWith("observadoras-backup-")
  )
    await fs.rm(work, { recursive: true, force: true });
}
