// Creates local, git-ignored environment files for each app from .env.
// Safe to run repeatedly; it only writes the keys each app needs.
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

function parseEnv(file) {
  if (!existsSync(file)) return {};
  const out = {};
  for (const line of readFileSync(file, "utf8").split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*"?([^"#]*)"?\s*(?:#.*)?$/);
    if (m) out[m[1]] = m[2].trim();
  }
  return out;
}

const env = parseEnv(join(root, ".env"));
if (!Object.keys(env).length) {
  console.error("No .env found. Copy .env.example to .env first.");
  process.exit(1);
}

const shared = {
  DATABASE_URL: env.DATABASE_URL,
  TEST_DATABASE_URL: env.TEST_DATABASE_URL,
  REDIS_URL: env.REDIS_URL,
  SESSION_SECRET: env.SESSION_SECRET,
  PAYMENT_SANDBOX_SECRET: env.PAYMENT_SANDBOX_SECRET,
  APP_URL: env.APP_URL,
  ADMIN_URL: env.ADMIN_URL,
  API_URL: env.API_URL,
  MAIL_MODE: env.MAIL_MODE,
  MAIL_FROM: env.MAIL_FROM,
  SMTP_HOST: env.SMTP_HOST,
  SMTP_PORT: env.SMTP_PORT,
  SMTP_USER: env.SMTP_USER,
  SMTP_PASSWORD: env.SMTP_PASSWORD,
  PAYMENT_PROVIDER: env.PAYMENT_PROVIDER,
  SHIPPING_PROVIDER: env.SHIPPING_PROVIDER,
  NODE_ENV: "development",
};

const files = {
  "packages/db/.env": { DATABASE_URL: env.DATABASE_URL, TEST_DATABASE_URL: env.TEST_DATABASE_URL },
  "apps/api/.env": { ...shared, PORT: "4000" },
  "apps/worker/.env": { ...shared },
  "apps/web/.env.local": {
    NEXT_PUBLIC_API_URL: env.API_URL ?? "http://localhost:4000",
    API_INTERNAL_URL: env.API_URL ?? "http://localhost:4000",
    NEXT_PUBLIC_SITE_URL: env.APP_URL ?? "http://localhost:3000",
  },
  "apps/admin/.env.local": {
    NEXT_PUBLIC_API_URL: env.API_URL ?? "http://localhost:4000",
    API_INTERNAL_URL: env.API_URL ?? "http://localhost:4000",
    NEXT_PUBLIC_ADMIN_URL: env.ADMIN_URL ?? "http://localhost:3001",
  },
  "tests/e2e/.env": {
    E2E_BASE_URL: env.APP_URL ?? "http://localhost:3000",
    E2E_ADMIN_URL: env.ADMIN_URL ?? "http://localhost:3001",
    E2E_API_URL: env.API_URL ?? "http://localhost:4000",
    E2E_DATABASE_URL: env.DATABASE_URL,
    E2E_CUSTOMER_EMAIL: "customer@dayshift.example",
    E2E_CUSTOMER_PASSWORD: "Customer1234!Pass",
    E2E_ADMIN_EMAIL: "admin@dayshift.example",
    E2E_ADMIN_PASSWORD: "Admin1234!Pass",
  },
};

for (const [rel, values] of Object.entries(files)) {
  mkdirSync(dirname(join(root, rel)), { recursive: true });
  const body = Object.entries(values)
    .filter(([, v]) => v !== undefined && v !== "")
    .map(([k, v]) => `${k}=${v}`)
    .join("\n");
  writeFileSync(join(root, rel), `${body}\n`, "utf8");
  console.log(`wrote ${rel}`);
}
