// Restores a compressed logical backup into the Docker PostgreSQL container.
// Destructive: requires --yes and refuses to run without it.
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { spawnSync } from "node:child_process";

const file = process.argv[2];
const confirmed = process.argv.includes("--yes");
if (!file) {
  console.error("Usage: node scripts/db-restore.mjs <backup.dump> --yes");
  process.exit(1);
}
if (!confirmed) {
  console.error("Refusing to restore without --yes. This overwrites the target database.");
  process.exit(1);
}

const container = process.env.PG_CONTAINER ?? "dayshift-postgres";
const user = process.env.PG_USER ?? "dayshift";
const database = process.env.PG_DATABASE ?? "dayshift";
const data = readFileSync(resolve(file));

const result = spawnSync(
  "docker",
  ["exec", "-i", container, "pg_restore", "-U", user, "-d", database, "--clean", "--if-exists", "--no-owner"],
  { input: data, maxBuffer: 1024 * 1024 * 512 },
);

if (result.status !== 0) {
  console.error(result.stderr?.toString() || "pg_restore failed");
  process.exit(1);
}
console.log(`Restored ${file} into ${database}.`);
