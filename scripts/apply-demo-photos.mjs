// Applies the curated demo photography in packages/db/prisma/demo-photos.json
// to an existing seeded database. Only image URLs are changed; no rows are
// deleted and no other product data is touched.
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const mapping = JSON.parse(
  readFileSync(join(root, "packages", "db", "prisma", "demo-photos.json"), "utf8"),
);

const escape = (value) => String(value).replace(/'/g, "''");
const statements = [];

for (const [slug, entry] of Object.entries(mapping)) {
  if (!entry || typeof entry !== "object") continue;
  for (const [color, url] of Object.entries(entry.colors ?? {})) {
    statements.push(`
UPDATE "ProductImage" pi
SET url = '${escape(url)}'
FROM "Product" p
WHERE pi."productId" = p.id AND p.slug = '${escape(slug)}' AND pi.color = '${escape(color)}';

UPDATE "Variant" v
SET "imageUrl" = '${escape(url)}'
FROM "Product" p
WHERE v."productId" = p.id AND p.slug = '${escape(slug)}' AND v.color = '${escape(color)}';
`);
  }
  if (entry.default) {
    statements.push(`
UPDATE "ProductImage" pi
SET url = '${escape(entry.default)}'
FROM "Product" p
WHERE pi."productId" = p.id AND p.slug = '${escape(slug)}' AND pi.url LIKE '/art/%';

UPDATE "Variant" v
SET "imageUrl" = '${escape(entry.default)}'
FROM "Product" p
WHERE v."productId" = p.id AND p.slug = '${escape(slug)}' AND v."imageUrl" LIKE '/art/%';
`);
  }
}

statements.push(`
UPDATE "Category" SET "imageUrl" = '/images/products/tee-white-hanger.jpg' WHERE slug IN ('women', 'unisex-essentials', 't-shirts', 'essential-basics');
UPDATE "Category" SET "imageUrl" = '/images/products/shirt-denim.jpg' WHERE slug = 'men';
UPDATE "Category" SET "imageUrl" = '/images/products/sneaker-white.jpg' WHERE slug = 'shoes';
UPDATE "Category" SET "imageUrl" = '/images/products/bag-orange.jpg' WHERE slug = 'bags';
UPDATE "Category" SET "imageUrl" = '/images/products/sunglasses-round.jpg' WHERE slug = 'accessories';
`);

const sql = `BEGIN;\n${statements.join("\n")}\nCOMMIT;\n`;
const result = spawnSync(
  "docker",
  ["exec", "-i", "dayshift-postgres", "psql", "-U", "dayshift", "-d", "dayshift", "-v", "ON_ERROR_STOP=1"],
  { input: sql, encoding: "utf8", maxBuffer: 10 * 1024 * 1024 },
);

if (result.status !== 0) {
  console.error(result.stderr || result.stdout || "psql failed");
  process.exit(1);
}
console.log(result.stdout.trim());
console.log("Demo photography applied.");
