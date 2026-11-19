import test from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { promises as fs } from "node:fs";
import path from "node:path";
import { tmpdir } from "node:os";
import { randomUUID, scryptSync } from "node:crypto";

test(
  "complete encrypted backup restores accounts, all tables, binary evidence and source into an empty database",
  { timeout: 180000 },
  async () => {
    const directory = await fs.mkdtemp(
      path.join(tmpdir(), "observadoras-backup-test-"),
    );
    const prefix = "ovp-backup-test-" + randomUUID().slice(0, 8);
    const containers = [prefix + "-source", prefix + "-target"];
    const secret = randomUUID() + randomUUID();
    function command(binary, args, input) {
      const result = spawnSync(binary, args, {
        input,
        encoding: "utf8",
        maxBuffer: 10 * 1024 * 1024,
        env: { ...process.env, OBS_BACKUP_PASSWORD: secret },
      });
      assert.equal(
        result.status,
        0,
        `${binary} failed: ${result.stderr?.slice(0, 300)}`,
      );
      return result.stdout.trim();
    }
    function query(container, sql) {
      return command(
        "docker",
        [
          "exec",
          "-i",
          container,
          "psql",
          "-X",
          "-qAt",
          "-v",
          "ON_ERROR_STOP=1",
          "-U",
          "testuser",
          "-d",
          "testdb",
        ],
        sql,
      );
    }
    function backup(args, password = secret) {
      return spawnSync(process.execPath, ["scripts/backup.mjs", ...args], {
        encoding: "utf8",
        env: { ...process.env, OBS_BACKUP_PASSWORD: password },
        timeout: 60000,
      });
    }
    async function fingerprints(container) {
      const tables = JSON.parse(
        query(
          container,
          "SELECT json_agg(tablename ORDER BY tablename) FROM pg_tables WHERE schemaname='public'",
        ),
      );
      const result = {};
      for (const table of tables.filter((table) => table !== "sessions")) {
        result[table] = query(
          container,
          `SELECT md5(coalesce(string_agg(row_to_json(t)::text,'' ORDER BY row_to_json(t)::text),'')) FROM "${table}" t`,
        );
      }
      return result;
    }
    try {
      for (const container of containers) {
        command("docker", [
          "run",
          "-d",
          "--name",
          container,
          "--memory",
          "512m",
          "--cpus",
          "1",
          "--tmpfs",
          "/var/lib/postgresql/data:rw,size=256m",
          "-e",
          "POSTGRES_USER=testuser",
          "-e",
          "POSTGRES_DB=testdb",
          "-e",
          "POSTGRES_PASSWORD=synthetic-test-password",
          "postgres:17-alpine",
        ]);
        let ready = false;
        for (let attempt = 0; attempt < 40; attempt++) {
          const check = spawnSync("docker", [
            "exec",
            container,
            "pg_isready",
            "-U",
            "testuser",
            "-d",
            "testdb",
          ]);
          if (check.status === 0) {
            ready = true;
            break;
          }
          await new Promise((resolve) => setTimeout(resolve, 500));
        }
        assert.ok(ready, "isolated PostgreSQL ready");
      }
      query(
        containers[0],
        "CREATE TABLE migrations(name text PRIMARY KEY, applied_at timestamptz DEFAULT now());",
      );
      const migrations = (await fs.readdir("db/migrations"))
        .filter((name) => name.endsWith(".sql"))
        .sort();
      for (const name of migrations)
        query(
          containers[0],
          (await fs.readFile(path.join("db/migrations", name), "utf8")) +
            `\nINSERT INTO migrations(name) VALUES('${name}');`,
        );
      const user = randomUUID();
      const report = randomUUID();
      const publication = randomUUID();
      const salt = "synthetic-test-salt";
      const hash =
        salt +
        ":" +
        scryptSync("synthetic-account-password", salt, 64).toString("hex");
      query(
        containers[0],
        `
      INSERT INTO users(id,username,password_hash,role,full_name,can_manage_users) VALUES('${user}','synthetic-admin','${hash}','reviewer','Synthetic reviewer',true);
      INSERT INTO sessions(token_hash,user_id,expires_at) VALUES('synthetic-token','${user}',now()+interval '1 hour');
      INSERT INTO reports(id,title,description,status,validated_by,validated_at,validation_source) VALUES('${report}','Synthetic report','Synthetic private description','published','${user}',now(),'explicit');
      INSERT INTO report_evidence(report_id,content,width,height,sha256) VALUES('${report}',decode('000102ff','hex'),1,1,'synthetic-hash');
      INSERT INTO publications(id,report_id,title,body,published_by,summary) VALUES('${publication}','${report}','Synthetic publication','Synthetic approved public body','${user}','Synthetic summary');
      INSERT INTO publication_images(publication_id,asset_id,content,width,height,description,approved_by,authorization_version) VALUES('${publication}','${randomUUID()}',decode('030405ff','hex'),1,1,'Synthetic image','${user}','synthetic');
      INSERT INTO publication_events(id,publication_id,actor_id,action,version,snapshot) VALUES('${randomUUID()}','${publication}','${user}','published',1,'{"synthetic":true}');
      INSERT INTO user_events(id,target_id,action,origin,changed_fields) VALUES('${randomUUID()}','${user}','created','operational',ARRAY['username']);
      INSERT INTO report_events(id,report_id,actor_id,action) VALUES('${randomUUID()}','${report}','${user}','published');
      INSERT INTO report_followup_events(id,report_id,kind,note,reviewer_id) VALUES('${randomUUID()}','${report}','note','Synthetic followup note','${user}');
      INSERT INTO intake_analyses(id,report_id,report_version,state,result,ai_consent,consent_version,consented_at) VALUES('${randomUUID()}','${report}',1,'completed','{"synthetic":true}',true,'2026-10-29-reports-v3',now());
    `,
      );
      const before = await fingerprints(containers[0]);
      const fixture = path.join(directory, "source");
      await fs.mkdir(path.join(fixture, "public"), { recursive: true });
      await fs.writeFile(
        path.join(fixture, "package.json"),
        '{"name":"synthetic-project"}',
      );
      await fs.writeFile(
        path.join(fixture, "public", "fixture.bin"),
        Buffer.from([0, 1, 2, 255]),
      );
      await fs.writeFile(
        path.join(fixture, ".env"),
        "AUTH_SECRET=synthetic-configuration-only\n",
      );
      await fs.writeFile(path.join(fixture, ".env.example"), "AUTH_SECRET=\n");
      await fs.mkdir(path.join(fixture, "node_modules"));
      await fs.writeFile(
        path.join(fixture, "node_modules", "excluded"),
        "excluded",
      );
      const output = path.join(directory, "full.ovpbackup");
      const exported = backup([
        "export",
        "--container",
        containers[0],
        "--project-dir",
        fixture,
        "--output",
        output,
      ]);
      assert.equal(exported.status, 0, exported.stderr);
      assert.ok(
        !(await fs.readFile(output)).includes(
          Buffer.from("synthetic-configuration-only"),
        ),
      );
      const wrong = backup(
        [
          "import",
          "--container",
          containers[1],
          "--input",
          output,
          "--files-to",
          path.join(directory, "wrong"),
        ],
        "wrong-password-long-enough",
      );
      assert.notEqual(wrong.status, 0);
      assert.match(wrong.stderr, /Wrong password or damaged/);
      const damaged = path.join(directory, "damaged.ovpbackup");
      const bytes = await fs.readFile(output);
      bytes[60] ^= 1;
      await fs.writeFile(damaged, bytes);
      const corrupt = backup([
        "import",
        "--container",
        containers[1],
        "--input",
        damaged,
        "--files-to",
        path.join(directory, "damaged"),
      ]);
      assert.notEqual(corrupt.status, 0);
      assert.equal(
        query(
          containers[1],
          "SELECT count(*) FROM pg_tables WHERE schemaname='public'",
        ),
        "0",
      );
      const destination = path.join(directory, "restored");
      const restored = backup([
        "import",
        "--container",
        containers[1],
        "--input",
        output,
        "--files-to",
        destination,
      ]);
      assert.equal(restored.status, 0, restored.stderr);
      assert.deepEqual(await fingerprints(containers[1]), before);
      assert.deepEqual(await fingerprints(containers[0]), before);
      assert.equal(query(containers[1], "SELECT count(*) FROM sessions"), "0");
      assert.equal(query(containers[0], "SELECT count(*) FROM sessions"), "1");
      assert.equal(
        query(containers[1], "SELECT password_hash FROM users"),
        hash,
      );
      assert.equal(
        await fs.readFile(path.join(destination, ".env.reference"), "utf8"),
        "AUTH_SECRET=synthetic-configuration-only\n",
      );
      assert.equal(
        await fs.readFile(path.join(destination, ".env.example"), "utf8"),
        "AUTH_SECRET=\n",
      );
      assert.deepEqual(
        await fs.readFile(path.join(destination, "public", "fixture.bin")),
        Buffer.from([0, 1, 2, 255]),
      );
      await assert.rejects(fs.access(path.join(destination, "node_modules")));
      const repeated = backup([
        "import",
        "--container",
        containers[1],
        "--input",
        output,
        "--files-to",
        path.join(directory, "repeat"),
      ]);
      assert.notEqual(repeated.status, 0);
      assert.match(repeated.stderr, /database must be empty/);
      assert.deepEqual(await fingerprints(containers[1]), before);
    } finally {
      for (const container of containers)
        spawnSync("docker", ["rm", "-f", "-v", container], { stdio: "ignore" });
      assert.ok(
        directory.startsWith(path.join(tmpdir(), "observadoras-backup-test-")),
      );
      await fs.rm(directory, { recursive: true, force: true });
    }
  },
);
