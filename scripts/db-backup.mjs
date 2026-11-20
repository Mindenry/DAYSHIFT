// Creates a compressed logical backup using the Docker PostgreSQL container.
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { spawnSync } from "node:child_process";

const container = process.env.PG_CONTAINER ?? "dayshift-postgres";
const user = process.env.PG_USER ?? "dayshift";
const database = process.env.PG_DATABASE ?? "dayshift";
const stamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
const dir = join(process.cwd(), "backups");
mkdirSync(dir, { recursive: true });
const file = join(dir, `dayshift-${stamp}.dump`);

const result = spawnSync(
  "docker",
  ["exec", container, "pg_dump", "-U", user, "-d", database, "-Fc"],
  { maxBuffer: 1024 * 1024 * 512 },
);

if (result.status !== 0) {
  console.error(result.stderr?.toString() || "pg_dump failed");
  process.exit(1);
}
writeFileSync(file, result.stdout);
console.log(`Backup written: ${file}`);
