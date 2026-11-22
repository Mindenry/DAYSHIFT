 
import { PrismaClient, Prisma } from "@prisma/client";
import bcrypt from "bcryptjs";
import {
  DEFAULT_ROLE_PERMISSIONS,
  PERMISSION_GROUPS,
  PERMISSION_KEYS,
  type PermissionKey,
} from "@dayshift/config";
import demoPhotos from "./demo-photos.json";
import { products } from "./catalog-th";
import { productsEn } from "./catalog-en";
import { brandEn, categoryEn, collectionEn, contentEn, navEn, reviewEn, sizeGuideEn } from "./content-en";

const prisma = new PrismaClient();
const d = (value: number) => new Prisma.Decimal(value.toFixed(2));

const DEMO_PHOTOS = demoPhotos as Record<
  string,
  { default?: string; colors?: Record<string, string> }
>;

function photoFor(slug: string, color: string, fallback: string): string {
  const entry = DEMO_PHOTOS[slug];
  return entry?.colors?.[color] ?? entry?.default ?? fallback;
}

const IMG = {
  hero: "/art/tee-oat.svg",
  editorial1: "/images/editorial-01.jpg",
  editorial2: "/images/editorial-02.jpg",
  editorial3: "/images/editorial-03.jpg",
  teeWhite: "/art/tee-optic-white.svg",
  teeBlack: "/art/tee-washed-black.svg",
  shirtOat: "/art/shirt-oat.svg",
  dressStone: "/art/dress-stone.svg",
  jeansIndigo: "/art/jeans-indigo.svg",
  hoodieGrey: "/art/hoodie-heather-grey.svg",
  jacketBlack: "/art/jacket-black.svg",
  trousersTaupe: "/art/trousers-taupe.svg",
  knitCream: "/art/knit-cream.svg",
  bagTote: "/art/bag-tan.svg",
  sneakerWhite: "/art/sneaker-white.svg",
  capBlack: "/art/cap-black.svg",
  sunglasses: "/art/sunglasses-black.svg",
};

// Product imagery is a generated studio illustration per colourway (see
// scripts/generate-product-art.mjs). It is clearly demo art, never presented
// as photographed inventory. Replace `imageUrl` values in production.
const ART_BY_CATEGORY: Record<string, string> = {
  "women-t-shirts": "tee",
  "women-shirts": "shirt",
  "women-blouses": "shirt",
  "women-tops": "knit",
  "women-dresses": "dress",
  "women-jackets": "jacket",
  "women-hoodies": "hoodie",
  "women-sweatshirts": "sweatshirt",
  "women-trousers": "trousers",
  "women-jeans": "jeans",
  "women-skirts": "skirt",
  "women-shorts": "shorts",
  "men-t-shirts": "tee",
  "men-shirts": "shirt",
  "men-polos": "polo",
  "men-jackets": "bomber",
  "men-hoodies": "hoodie",
  "men-sweatshirts": "sweatshirt",
  "men-trousers": "trousers",
  "men-jeans": "jeans",
  "men-shorts": "shorts",
  "unisex-oversized-tees": "tee",
  "unisex-hoodies": "hoodie",
  "unisex-sweatshirts": "sweatshirt",
  "unisex-streetwear": "hoodie",
  "unisex-essentials": "tee",
  "shoes-sneakers": "sneaker",
  "shoes-casual": "loafer",
  "shoes-sandals": "sandal",
  "bags-shoulder": "bag",
  "bags-tote": "bag",
  "bags-crossbody": "crossbody",
  "bags-backpacks": "backpack",
  "accessories-caps": "cap",
  "accessories-hats": "hat",
  "accessories-belts": "belt",
  "accessories-wallets": "wallet",
  "accessories-socks": "socks",
  "accessories-sunglasses": "sunglasses",
  "accessories-jewelry": "jewelry",
};

const colorSlug = (value: string) =>
  value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

const artFor = (artType: string, colorName: string) =>
  `/art/${artType}-${colorSlug(colorName)}.svg`;

const categoryDefs: Array<{ name: string; slug: string; parent?: string; description?: string }> = [
  { name: "ผู้หญิง", slug: "women", description: "เสื้อผ้าผู้หญิงที่ใส่ได้จริงในทุกวัน" },
  { name: "เสื้อยืด", slug: "women-t-shirts", parent: "women" },
  { name: "เสื้อเชิ้ต", slug: "women-shirts", parent: "women" },
  { name: "เสื้อบลาวส์", slug: "women-blouses", parent: "women" },
  { name: "เสื้อท็อป", slug: "women-tops", parent: "women" },
  { name: "เดรส", slug: "women-dresses", parent: "women" },
  { name: "แจ็กเก็ต", slug: "women-jackets", parent: "women" },
  { name: "ฮู้ดดี้", slug: "women-hoodies", parent: "women" },
  { name: "สเวตเชิ้ต", slug: "women-sweatshirts", parent: "women" },
  { name: "กางเกงขายาว", slug: "women-trousers", parent: "women" },
  { name: "กางเกงยีนส์", slug: "women-jeans", parent: "women" },
  { name: "กระโปรง", slug: "women-skirts", parent: "women" },
  { name: "กางเกงขาสั้น", slug: "women-shorts", parent: "women" },
  { name: "ผู้ชาย", slug: "men", description: "เสื้อผ้าผู้ชายทรงคลาสสิกที่ใส่ได้นาน" },
  { name: "เสื้อยืด", slug: "men-t-shirts", parent: "men" },
  { name: "เสื้อเชิ้ต", slug: "men-shirts", parent: "men" },
  { name: "โปโล", slug: "men-polos", parent: "men" },
  { name: "แจ็กเก็ต", slug: "men-jackets", parent: "men" },
  { name: "ฮู้ดดี้", slug: "men-hoodies", parent: "men" },
  { name: "สเวตเชิ้ต", slug: "men-sweatshirts", parent: "men" },
  { name: "กางเกงขายาว", slug: "men-trousers", parent: "men" },
  { name: "กางเกงยีนส์", slug: "men-jeans", parent: "men" },
  { name: "กางเกงขาสั้น", slug: "men-shorts", parent: "men" },
  { name: "ยูนิเซ็กซ์", slug: "unisex", description: "ทรงที่ใส่ได้ทุกคน" },
  { name: "เสื้อยืดโอเวอร์ไซซ์", slug: "unisex-oversized-tees", parent: "unisex" },
  { name: "ฮู้ดดี้", slug: "unisex-hoodies", parent: "unisex" },
  { name: "สเวตเชิ้ต", slug: "unisex-sweatshirts", parent: "unisex" },
  { name: "สตรีทแวร์", slug: "unisex-streetwear", parent: "unisex" },
  { name: "เสื้อผ้าพื้นฐาน", slug: "unisex-essentials", parent: "unisex" },
  { name: "รองเท้า", slug: "shoes", description: "รองเท้าสำหรับใช้ในทุกวัน" },
  { name: "รองเท้าผ้าใบ", slug: "shoes-sneakers", parent: "shoes" },
  { name: "รองเท้าลำลอง", slug: "shoes-casual", parent: "shoes" },
  { name: "รองเท้าแตะ", slug: "shoes-sandals", parent: "shoes" },
  { name: "กระเป๋า", slug: "bags", description: "กระเป๋าที่ใช้ได้จริง พกน้อยแต่พอดี" },
  { name: "กระเป๋าสะพายไหล่", slug: "bags-shoulder", parent: "bags" },
  { name: "กระเป๋าโท้ต", slug: "bags-tote", parent: "bags" },
  { name: "กระเป๋าสะพายข้าง", slug: "bags-crossbody", parent: "bags" },
  { name: "เป้", slug: "bags-backpacks", parent: "bags" },
  { name: "เครื่องประดับ", slug: "accessories", description: "รายละเอียดเล็ก ๆ ที่ทำให้ลุคสมบูรณ์" },
  { name: "หมวกแก๊ป", slug: "accessories-caps", parent: "accessories" },
  { name: "หมวก", slug: "accessories-hats", parent: "accessories" },
  { name: "เข็มขัด", slug: "accessories-belts", parent: "accessories" },
  { name: "กระเป๋าสตางค์", slug: "accessories-wallets", parent: "accessories" },
  { name: "ถุงเท้า", slug: "accessories-socks", parent: "accessories" },
  { name: "แว่นกันแดด", slug: "accessories-sunglasses", parent: "accessories" },
  { name: "จิวเวลรี่", slug: "accessories-jewelry", parent: "accessories" },
];

const collectionDefs = [
  { name: "สินค้าใหม่", slug: "new-arrivals", type: "NEW_ARRIVALS" as const, description: "ชิ้นใหม่ล่าสุดจากสตูดิโอ" },
  { name: "ขายดี", slug: "best-sellers", type: "BEST_SELLERS" as const, description: "ชิ้นที่ลูกค้ากลับมาซื้อซ้ำ" },
  { name: "เสื้อผ้าพื้นฐาน", slug: "essentials", type: "EDITORIAL" as const, description: "ชิ้นเรียบง่ายที่ใส่ได้บ่อยและเข้ากับทุกอย่าง" },
  { name: "คอลเลกชันตามฤดูกาล", slug: "seasonal-2026", type: "SEASONAL" as const, description: "คัดสรรสำหรับฤดูกาลนี้" },
  { name: "ลิมิเต็ดดรอป", slug: "limited-drops", type: "LIMITED" as const, description: "ผลิตจำนวนจำกัด หมดแล้วหมดเลย" },
  { name: "ลดราคา", slug: "sale", type: "SALE" as const, description: "ชิ้นสุดท้าย ลดพิเศษ" },
];

async function hash(password: string) {
  return bcrypt.hash(password, 12);
}

async function main() {
  const existing = await prisma.product.count();
  if (existing > 0 && process.env.SEED_RESET !== "1") {
    console.log(`Database already has ${existing} products. Set SEED_RESET=1 to rebuild demo data.`);
    return;
  }
  if (existing > 0 && process.env.SEED_RESET === "1") {
    console.log("Resetting demo data (SEED_RESET=1)…");
    // Demo-reset only. Financial tables are cleared in dependency order.
    await prisma.ticketMessage.deleteMany();
    await prisma.supportTicket.deleteMany();
    await prisma.reviewVote.deleteMany();
    await prisma.review.deleteMany();
    await prisma.refundItem.deleteMany();
    await prisma.refund.deleteMany();
    await prisma.returnItem.deleteMany();
    await prisma.returnRequest.deleteMany();
    await prisma.shipmentEvent.deleteMany();
    await prisma.shipment.deleteMany();
    await prisma.paymentEvent.deleteMany();
    await prisma.payment.deleteMany();
    await prisma.orderStatusHistory.deleteMany();
    await prisma.orderItem.deleteMany();
    await prisma.couponRedemption.deleteMany();
    await prisma.stockReservation.deleteMany();
    await prisma.loyaltyTransaction.deleteMany();
    await prisma.order.deleteMany();
    await prisma.cartItem.deleteMany();
    await prisma.cart.deleteMany();
    await prisma.wishlistItem.deleteMany();
    await prisma.wishlist.deleteMany();
    await prisma.inventoryMovement.deleteMany();
    await prisma.inventory.deleteMany();
    await prisma.purchaseOrderItem.deleteMany();
    await prisma.purchaseOrder.deleteMany();
    await prisma.variant.deleteMany();
    await prisma.productImage.deleteMany();
    await prisma.productCategory.deleteMany();
    await prisma.productCollection.deleteMany();
    await prisma.product.deleteMany();
    await prisma.couponProductCollection.deleteMany();
    await prisma.couponProduct.deleteMany();
    await prisma.couponCategory.deleteMany();
    await prisma.coupon.deleteMany();
    await prisma.promotion.deleteMany();
    await prisma.sizeGuide.deleteMany();
    await prisma.collection.deleteMany();
    await prisma.brand.deleteMany();
    await prisma.category.deleteMany();
    await prisma.notification.deleteMany();
    await prisma.newsletterSubscriber.deleteMany();
    await prisma.contentBlock.deleteMany();
    await prisma.navigationItem.deleteMany();
    await prisma.setting.deleteMany();
    await prisma.supplier.deleteMany();
    await prisma.warehouse.deleteMany();
    await prisma.auditLog.deleteMany();
    await prisma.session.deleteMany();
    await prisma.address.deleteMany();
    await prisma.loyaltyAccount.deleteMany();
    await prisma.customerProfile.deleteMany();
    await prisma.staffProfile.deleteMany();
    await prisma.rolePermission.deleteMany();
    await prisma.permission.deleteMany();
    await prisma.role.deleteMany();
    await prisma.user.deleteMany();
  }

  // ── Roles & permissions ────────────────────────────────────────────────
  const permissions = new Map<PermissionKey, string>();
  for (const key of PERMISSION_KEYS) {
    const p = await prisma.permission.upsert({
      where: { key },
      update: { group: PERMISSION_GROUPS[key] },
      create: { key, group: PERMISSION_GROUPS[key], description: key.replace(/\./g, " ") },
    });
    permissions.set(key, p.id);
  }
  const roleIds = new Map<string, string>();
  for (const [name, keys] of Object.entries(DEFAULT_ROLE_PERMISSIONS)) {
    const role = await prisma.role.upsert({
      where: { name },
      update: {},
      create: { name, isSystem: true, description: `${name.replace(/_/g, " ").toLowerCase()} role` },
    });
    roleIds.set(name, role.id);
    for (const key of keys) {
      await prisma.rolePermission.upsert({
        where: { roleId_permissionId: { roleId: role.id, permissionId: permissions.get(key)! } },
        update: {},
        create: { roleId: role.id, permissionId: permissions.get(key)! },
      });
    }
  }

  // ── Users ───────────────────────────────────────────────────────────────
  const staffSpecs = [
    { email: "admin@dayshift.example", first: "ณัฐพงษ์", last: "ศรีสุวรรณ", role: "SUPER_ADMIN", code: "DS-EMP-001", title: "ผู้ก่อตั้งและผู้ดูแลระบบ", password: "Admin1234!Pass" },
    { email: "manager@dayshift.example", first: "พิมพ์ชนก", last: "วงศ์อารีย์", role: "STORE_MANAGER", code: "DS-EMP-002", title: "ผู้จัดการร้าน", password: "Manager1234!Pass" },
    { email: "warehouse@dayshift.example", first: "สมชาย", last: "ใจดี", role: "WAREHOUSE_STAFF", code: "DS-EMP-003", title: "เจ้าหน้าที่คลังสินค้า", password: "Warehouse1234!Pass" },
    { email: "support@dayshift.example", first: "อารยา", last: "บุญมา", role: "CUSTOMER_SUPPORT", code: "DS-EMP-004", title: "ฝ่ายบริการลูกค้า", password: "Support1234!Pass" },
    { email: "analyst@dayshift.example", first: "ธนภัทร", last: "รุ่งเรือง", role: "ANALYST", code: "DS-EMP-005", title: "นักวิเคราะห์ธุรกิจ", password: "Analyst1234!Pass" },
  ];
  const staff: Record<string, { id: string }> = {};
  for (const s of staffSpecs) {
    const user = await prisma.user.upsert({
      where: { email: s.email },
      update: { firstName: s.first, lastName: s.last },
      create: {
        email: s.email,
        firstName: s.first,
        lastName: s.last,
        passwordHash: await hash(s.password),
        emailVerifiedAt: new Date("2026-01-10T09:00:00Z"),
        staffProfile: {
          create: {
            roleId: roleIds.get(s.role)!,
            employeeCode: s.code,
            jobTitle: s.title,
          },
        },
      },
    });
    staff[s.role] = { id: user.id };
  }

  const customerSpecs = [
    {
      email: "customer@dayshift.example", first: "ณิชา", last: "วรรณศิลป์", password: "Customer1234!Pass",
      segment: "High-value", tags: ["สมาชิกสะสมแต้ม", "แฟชั่นผู้หญิง"],
      phone: "081-234-5678", line1: "88/8 ซอยอารีย์ 4", line2: "คอนโดเดอะทรี อารีย์", city: "เขตรพญาไท", state: "กรุงเทพมหานคร", postalCode: "10400",
      points: 840, lifetime: 2140, tier: "GOLD" as const,
    },
    {
      email: "jirawat@example.com", first: "จิรวัฒน์", last: "พงษ์พันธ์", password: "Customer1234!Pass",
      segment: "Returning", tags: ["แฟชั่นผู้ชาย"],
      phone: "089-771-2244", line1: "199/45 หมู่บ้านปริญสิริ", line2: "ถนนรามคำแหง", city: "เขตบางกะปิ", state: "กรุงเทพมหานคร", postalCode: "10240",
      points: 320, lifetime: 620, tier: "SILVER" as const,
    },
    {
      email: "areerata@example.com", first: "อารีรัตน์", last: "แสงทอง", password: "Customer1234!Pass",
      segment: "New", tags: [],
      phone: "086-452-9018", line1: "45 หมู่ 3 ตำบลสุเทพ", line2: "ถนนห้วยแก้ว", city: "อำเภอเมืองเชียงใหม่", state: "เชียงใหม่", postalCode: "50200",
      points: 0, lifetime: 0, tier: "BRONZE" as const,
    },
  ];
  const customers: Record<string, { id: string }> = {};
  for (const c of customerSpecs) {
    const user = await prisma.user.upsert({
      where: { email: c.email },
      update: {},
      create: {
        email: c.email,
        firstName: c.first,
        lastName: c.last,
        passwordHash: await hash(c.password),
        emailVerifiedAt: new Date("2026-02-01T10:00:00Z"),
        phone: c.phone,
        customerProfile: { create: { segment: c.segment, tags: c.tags, marketingOptIn: true } },
        loyaltyAccount: {
          create: { pointsBalance: c.points, lifetimePoints: c.lifetime, tier: c.tier },
        },
        addresses: {
          create: [
            {
              label: "บ้าน",
              firstName: c.first,
              lastName: c.last,
              line1: c.line1,
              line2: c.line2,
              city: c.city,
              state: c.state,
              postalCode: c.postalCode,
              country: "TH",
              phone: c.phone,
              isDefaultShipping: true,
              isDefaultBilling: true,
            },
          ],
        },
      },
    });
    customers[c.email] = { id: user.id };
  }

  // ── Warehouses / suppliers ─────────────────────────────────────────────
  const mainWarehouse = await prisma.warehouse.upsert({
    where: { code: "BKK1" },
    update: {},
    create: {
      name: "คลังบางนา",
      code: "BKK1",
      line1: "123/4 ถนนเทพรัตน",
      city: "เขตบางนา",
      state: "กรุงเทพมหานคร",
      postalCode: "10260",
      country: "TH",
      phone: "02-745-1188",
      isDefault: true,
    },
  });
  const westWarehouse = await prisma.warehouse.upsert({
    where: { code: "CNX1" },
    update: {},
    create: {
      name: "สตูดิโอเชียงใหม่",
      code: "CNX1",
      line1: "88 ถนนนิมมานเหมินท์",
      city: "อำเภอเมืองเชียงใหม่",
      state: "เชียงใหม่",
      postalCode: "50200",
      country: "TH",
      phone: "053-218-990",
    },
  });

  const supplier = await prisma.supplier.upsert({
    where: { code: "SUP-001" },
    update: {},
    create: {
      name: "บางกอกเท็กซ์ไทล์",
      code: "SUP-001",
      contactName: "คุณกมลรัตน์ ธีระวัฒน์",
      email: "orders@bangkoktex.example",
      phone: "02-123-4567",
      address: "อำเภอบางพลี สมุทรปราการ",
      notes: "ซัพพลายเออร์หลักสำหรับผ้าถักและเสื้อเชิ้ต",
    },
  });
  const supplier2 = await prisma.supplier.upsert({
    where: { code: "SUP-002" },
    update: {},
    create: {
      name: "เชียงใหม่เลเธอร์เวิร์ก",
      code: "SUP-002",
      contactName: "คุณอนุชา คำแสน",
      email: "trade@cmleather.example",
      phone: "053-456-789",
      address: "อำเภอสันกำแพง เชียงใหม่",
      notes: "งานหนังและเครื่องประดับ ทำมือ",
    },
  });

  // ── Categories ─────────────────────────────────────────────────────────
  const categoryIds = new Map<string, string>();
  for (const [index, c] of categoryDefs.entries()) {
    const en = categoryEn[c.slug];
    const parentId = c.parent ? categoryIds.get(c.parent) : null;
    const cat = await prisma.category.upsert({
      where: { slug: c.slug },
      update: {
        name: c.name,
        parentId: parentId ?? null,
        position: index,
        nameEn: en?.name ?? c.name,
        descriptionEn: en?.description ?? null,
      },
      create: {
        name: c.name,
        slug: c.slug,
        description: c.description,
        nameEn: en?.name ?? c.name,
        descriptionEn: en?.description ?? null,
        metaTitleEn: en ? `${en.name} — DAYSHIFT` : null,
        metaDescriptionEn: en?.description ?? null,
        parentId: parentId ?? null,
        position: index,
        isActive: true,
        metaTitle: `${c.name} — DAYSHIFT`,
        metaDescription: c.description ?? `เลือกซื้อ${c.name}ที่ DAYSHIFT`,
        imageUrl: c.slug === "women" ? IMG.editorial1 : c.slug === "men" ? IMG.editorial2 : c.slug === "shoes" ? "/images/products/sneaker-white.jpg" : c.slug === "bags" ? "/images/products/bag-orange.jpg" : c.slug === "accessories" ? "/images/products/sunglasses-black.jpg" : undefined,
      },
    });
    categoryIds.set(c.slug, cat.id);
  }

  const brands = new Map<string, string>();
  for (const b of [
    { name: "DAYSHIFT", slug: "dayshift", description: "แบรนด์ของสตูดิโอเราเอง เสื้อผ้าใส่ทุกวัน ตัดเย็บอย่างตั้งใจ" },
    { name: "NORTHLINE", slug: "northline", description: "โรงงานหนังเล็ก ๆ ในเชียงใหม่ งานทำมือทุกชิ้น" },
    { name: "ATELIER NINE", slug: "atelier-nine", description: "เครื่องประดับจากวัสดุธรรมชาติ ดีไซน์เรียบง่าย" },
  ]) {
    const brand = await prisma.brand.upsert({
      where: { slug: b.slug },
      update: { descriptionEn: brandEn[b.slug] ?? b.description },
      create: { ...b, descriptionEn: brandEn[b.slug] ?? b.description },
    });
    brands.set(b.slug, brand.id);
  }

  const collectionIds = new Map<string, string>();
  for (const [index, c] of collectionDefs.entries()) {
    const en = collectionEn[c.slug];
    const col = await prisma.collection.upsert({
      where: { slug: c.slug },
      update: { nameEn: en?.name ?? c.name, descriptionEn: en?.description ?? null },
      create: {
        name: c.name,
        slug: c.slug,
        description: c.description,
        nameEn: en?.name ?? c.name,
        descriptionEn: en?.description ?? null,
        metaTitleEn: en ? `${en.name} — DAYSHIFT` : null,
        metaDescriptionEn: en?.description ?? null,
        type: c.type,
        position: index,
        isActive: true,
        imageUrl: c.slug === "new-arrivals" ? IMG.editorial3 : c.slug === "best-sellers" ? IMG.editorial1 : c.slug === "seasonal-2026" ? "/images/products/jacket-tan.jpg" : c.slug === "limited-drops" ? "/images/products/tee-graphic.jpg" : undefined,
        startsAt: c.slug === "seasonal-2026" ? new Date("2026-09-01T00:00:00Z") : undefined,
      },
    });
    collectionIds.set(c.slug, col.id);
  }

  const sizeGuideWomen = await prisma.sizeGuide.create({
    data: {
      name: "เสื้อผ้าผู้หญิง",
      nameEn: sizeGuideEn.women.name,
      notesEn: sizeGuideEn.women.notes,
      categoryId: categoryIds.get("women")!,
      notes: "หน่วยเป็นเซนติเมตร นางแบบสูง 175 ซม. ใส่ไซซ์ S",
      chart: {
        columns: ["Size", "EU", "UK", "US", "Bust", "Waist", "Hip"],
        rows: [
          ["XS", "34", "6", "2", "80–84", "62–66", "88–92"],
          ["S", "36", "8", "4", "84–88", "66–70", "92–96"],
          ["M", "38", "10", "6", "88–92", "70–74", "96–100"],
          ["L", "40", "12", "8", "92–96", "74–78", "100–104"],
          ["XL", "42", "14", "10", "96–102", "78–84", "104–110"],
          ["XXL", "44", "16", "12", "102–108", "84–90", "110–116"],
        ],
      },
    },
  });
  const sizeGuideMen = await prisma.sizeGuide.create({
    data: {
      name: "เสื้อผ้าผู้ชาย",
      nameEn: sizeGuideEn.men.name,
      notesEn: sizeGuideEn.men.notes,
      categoryId: categoryIds.get("men")!,
      notes: "หน่วยเป็นเซนติเมตร นายแบบสูง 187 ซม. ใส่ไซซ์ M",
      chart: {
        columns: ["Size", "EU", "UK", "US", "Chest", "Waist"],
        rows: [
          ["S", "46", "36", "36", "92–96", "76–80"],
          ["M", "48", "38", "38", "96–100", "80–84"],
          ["L", "50", "40", "40", "100–104", "84–88"],
          ["XL", "52", "42", "42", "104–108", "88–92"],
        ],
      },
    },
  });
  const sizeGuideShoes = await prisma.sizeGuide.create({
    data: {
      name: "รองเท้า",
      nameEn: sizeGuideEn.shoes.name,
      notesEn: sizeGuideEn.shoes.notes,
      categoryId: categoryIds.get("shoes")!,
      notes: "ใช้ไซซ์ EU หากอยู่ระหว่างสองไซซ์แนะนำให้เลือกไซซ์ใหญ่กว่า",
      chart: {
        columns: ["EU", "UK", "US Men", "US Women", "Foot length (cm)"],
        rows: [
          ["40", "6", "7", "8.5", "25.5"],
          ["41", "7", "8", "9.5", "26.2"],
          ["42", "8", "9", "10.5", "27.0"],
          ["43", "9", "10", "11.5", "27.8"],
          ["44", "10", "11", "12.5", "28.5"],
          ["45", "11", "12", "13.5", "29.3"],
        ],
      },
    },
  });

  // ── Products & inventory ───────────────────────────────────────────────
  const productIds = new Map<string, string>();
  const variantIds = new Map<string, string>(); // `${slug}|${color}|${size}`
  const allVariants: Array<{ id: string; slug: string; price: number; stock: number }> = [];
  let imageSort = 0;

  for (const [index, def] of products.entries()) {
    const primaryCategory = categoryIds.get(def.category)!;
    const artType = def.art ?? ART_BY_CATEGORY[def.category] ?? "tee";
    const parentSlug = categoryDefs.find((c) => c.slug === def.category)?.parent;
    const categoryLinks = [primaryCategory];
    if (parentSlug && categoryIds.get(parentSlug)) categoryLinks.push(categoryIds.get(parentSlug)!);

    const en = productsEn[def.slug];
    const isSale = def.compareAt !== undefined;
    const collectionSlugs = [...(def.collections ?? [])];
    if (isSale) collectionSlugs.push("sale");

    const product = await prisma.product.create({
      data: {
        name: def.name,
        slug: def.slug,
        sku: def.sku,
        shortDescription: def.short,
        description: def.description,
        brandId: def.category.startsWith("bags") || def.category.startsWith("accessories") ? brands.get("northline")! : brands.get("dayshift")!,
        status: (def.status ?? "ACTIVE") as Prisma.ProductCreateInput["status"],
        visibility: "PUBLIC",
        price: d(def.price),
        compareAtPrice: def.compareAt ? d(def.compareAt) : null,
        costPrice: d(Math.round(def.price * 0.38)),
        material: def.material,
        careInstructions: def.care,
        fitNotes: def.fit,
        features: def.features ?? [],
        tags: def.tags ?? [],
        nameEn: en?.name ?? def.name,
        shortDescriptionEn: en?.short ?? def.short,
        descriptionEn: en?.description ?? def.description,
        materialEn: en?.material ?? def.material,
        careInstructionsEn: en?.care ?? def.care,
        fitNotesEn: en?.fit ?? def.fit,
        featuresEn: en?.features ?? [],
        tagsEn: en?.tags ?? [],
        metaTitleEn: en ? `${en.name} — DAYSHIFT` : null,
        metaDescriptionEn: en?.short ?? null,
        sizeGuideId: def.category.startsWith("shoes") ? sizeGuideShoes.id : def.category.startsWith("women") ? sizeGuideWomen.id : def.category.startsWith("men") ? sizeGuideMen.id : null,
        isFeatured: def.featured ?? false,
        metaTitle: `${def.name} — DAYSHIFT`,
        metaDescription: def.short,
        publishedAt: new Date(Date.UTC(2026, 6, 1 + (index % 45), 9, 0, 0)),
        categories: { create: categoryLinks.map((id, i) => ({ categoryId: id, isPrimary: i === 0 })) },
        collections: { create: collectionSlugs.filter((s) => collectionIds.has(s)).map((s, i) => ({ collectionId: collectionIds.get(s)!, position: i })) },
        images: {
          create: def.colors.map((color, i) => ({
            url: photoFor(def.slug, color.name, color.image ?? artFor(artType, color.name)),
            alt: `${def.name} สี${color.name}`,
            color: color.name,
            position: i,
          })),
        },
      },
    });
    imageSort += 1;
    productIds.set(def.slug, product.id);

    for (const [ci, color] of def.colors.entries()) {
      for (const [si, size] of def.sizes.entries()) {
        const sku = `${def.sku}-${color.name.slice(0, 3).toUpperCase().replace(/\s/g, "")}-${size}`;
        const priceOverride = isSale && ci > 0 ? def.compareAt! : null;
        const variant = await prisma.variant.create({
          data: {
            productId: product.id,
            sku,
            size,
            color: color.name,
            colorHex: color.hex,
            priceOverride: priceOverride ? d(priceOverride) : null,
            position: ci * 100 + si,
            imageUrl: photoFor(def.slug, color.name, color.image ?? artFor(artType, color.name)),
          },
        });
        variantIds.set(`${def.slug}|${color.name}|${size}`, variant.id);

        // Stock: every size has both warehouses; deliberately leave a few gaps.
        const lowStock = def.lowStockSkuSize && size === def.lowStockSkuSize && ci === 0;
        const soldOut = def.slug === "graphic-tee-day-off" && size === "XL";
        const mainStock = soldOut ? 0 : lowStock ? 1 : 4 + ((index * 7 + ci * 5 + si * 3) % 18);
        const westStock = soldOut ? 0 : lowStock ? 0 : (index + si * 2) % 7;
        for (const [wIndex, warehouse] of [mainWarehouse, westWarehouse].entries()) {
          const qty = wIndex === 0 ? mainStock : westStock;
          const inventory = await prisma.inventory.create({
            data: {
              variantId: variant.id,
              warehouseId: warehouse.id,
              onHand: qty,
              safetyStock: 2,
              reorderPoint: 5,
            },
          });
          if (qty > 0) {
            await prisma.inventoryMovement.create({
              data: {
                variantId: variant.id,
                warehouseId: warehouse.id,
                type: "STOCK_IN",
                quantity: qty,
                previousOnHand: 0,
                newOnHand: qty,
                reason: "Opening stock — seed",
                referenceType: "SEED",
                referenceId: `seed-${inventory.id}`,
              },
            });
          }
        }
        allVariants.push({ id: variant.id, slug: def.slug, price: def.price, stock: mainStock + westStock });
      }
    }
  }

  // ── Content & navigation ───────────────────────────────────────────────
  const content = [
    {
      key: "home.hero",
      title: "แต่งตัวง่าย ๆ ในแบบของคุณ",
      subtitle: "คอลเลกชันใหม่",
      body: "เสื้อผ้าและเครื่องประดับที่คิดมาเพื่อวันธรรมดา ผลิตจำนวนไม่มาก และตัดเย็บให้ใส่ได้จริง",
      imageUrl: IMG.editorial1,
      ctaLabel: "ดูสินค้าใหม่",
      ctaUrl: "/collections/new-arrivals",
      status: "PUBLISHED" as const,
      position: 0,
    },
    {
      key: "home.editorial.women",
      title: "เสื้อผ้าผู้หญิงที่ใส่ได้จริง",
      subtitle: "ผู้หญิง",
      body: "ทรงเรียบง่าย ผ้าใยธรรมชาติ และสีที่เข้ากันได้ง่าย",
      imageUrl: IMG.editorial1,
      ctaLabel: "ช้อปผู้หญิง",
      ctaUrl: "/c/women",
      status: "PUBLISHED" as const,
      position: 1,
    },
    {
      key: "home.editorial.men",
      title: "ใส่ทุกวันได้จริง",
      subtitle: "ผู้ชาย",
      body: "เสื้อเชิ้ตทรงหลวม ยีนส์เนื้อดี และแจ็กเก็ตที่ใส่ได้ทั้งปี",
      imageUrl: IMG.editorial3,
      ctaLabel: "ช้อปผู้ชาย",
      ctaUrl: "/c/men",
      status: "PUBLISHED" as const,
      position: 2,
    },
    {
      key: "home.campaign.seasonal",
      title: "คอลเลกชันตามฤดูกาล",
      subtitle: "ปลายฝนต้นหนาว 2569",
      body: "เสื้อผ้าหน้า brushed ไหมพรมเมอริโน และยีนส์ที่ซักนุ่มแล้ว",
      imageUrl: "/images/products/dress-maroon.jpg",
      ctaLabel: "ดูคอลเลกชัน",
      ctaUrl: "/collections/seasonal-2026",
      status: "PUBLISHED" as const,
      position: 3,
    },
    {
      key: "announcement.bar",
      title: "ส่งฟรีเมื่อซื้อครบ ฿1,500",
      body: "คืนสินค้าฟรีภายใน 30 วัน",
      status: "PUBLISHED" as const,
      position: 0,
    },
  ];
  for (const c of content) {
    const en = contentEn[c.key];
    await prisma.contentBlock.upsert({
      where: { key: c.key },
      update: {
        titleEn: en?.title ?? null,
        subtitleEn: en?.subtitle ?? null,
        bodyEn: en?.body ?? null,
        ctaLabelEn: en?.ctaLabel ?? null,
      },
      create: {
        ...c,
        titleEn: en?.title ?? null,
        subtitleEn: en?.subtitle ?? null,
        bodyEn: en?.body ?? null,
        ctaLabelEn: en?.ctaLabel ?? null,
      },
    });
  }

  const nav = [
    { label: "ผู้หญิง", url: "/c/women" },
    { label: "ผู้ชาย", url: "/c/men" },
    { label: "ยูนิเซ็กซ์", url: "/c/unisex" },
    { label: "รองเท้า", url: "/c/shoes" },
    { label: "กระเป๋า", url: "/c/bags" },
    { label: "เครื่องประดับ", url: "/c/accessories" },
    { label: "สินค้าใหม่", url: "/collections/new-arrivals" },
    { label: "ลดราคา", url: "/collections/sale" },
  ];
  for (const [i, n] of nav.entries()) {
    const existingNav = await prisma.navigationItem.findFirst({ where: { label: n.label, parentId: null } });
    if (!existingNav) {
      await prisma.navigationItem.create({ data: { ...n, labelEn: navEn[n.url] ?? n.label, position: i } });
    } else if (navEn[n.url]) {
      await prisma.navigationItem.update({ where: { id: existingNav.id }, data: { labelEn: navEn[n.url] } });
    }
  }

  // ── Coupons & promotions ────────────────────────────────────────────────
  const now = new Date("2026-11-20T00:00:00Z");
  const coupons = [
    { code: "WELCOME10", description: "ลด 10% สำหรับคำสั่งซื้อแรก", type: "PERCENTAGE" as const, value: 10, minOrderSubtotal: 0, firstOrderOnly: true, usageLimitPerCustomer: 1, usageLimitTotal: 10000, startsAt: new Date("2026-01-01"), endsAt: new Date("2027-12-31") },
    { code: "DAYSHIFT15", description: "ลด 15% เมื่อซื้อครบ ฿1,500", type: "PERCENTAGE" as const, value: 15, minOrderSubtotal: 1500, maxDiscount: 500, usageLimitPerCustomer: 3, startsAt: new Date("2026-09-01"), endsAt: new Date("2027-03-31") },
    { code: "STYLE20", description: "ลด 20% สำหรับสินค้าลดราคาที่ร่วมรายการ", type: "PERCENTAGE" as const, value: 20, minOrderSubtotal: 1000, maxDiscount: 400, usageLimitPerCustomer: 2, startsAt: new Date("2026-11-01"), endsAt: new Date("2027-01-31") },
    { code: "FLAT250", description: "ลด ฿250 เมื่อซื้อครบ ฿2,000", type: "FIXED" as const, value: 250, minOrderSubtotal: 2000, usageLimitPerCustomer: 1, startsAt: new Date("2026-10-01"), endsAt: new Date("2027-06-30") },
  ];
  for (const c of coupons) {
    const coupon = await prisma.coupon.upsert({
      where: { code: c.code },
      update: {},
      create: {
        code: c.code,
        description: c.description,
        type: c.type,
        value: d(c.value),
        minOrderSubtotal: d(c.minOrderSubtotal),
        maxDiscount: c.maxDiscount ? d(c.maxDiscount) : null,
        startsAt: c.startsAt,
        endsAt: c.endsAt,
        usageLimitTotal: c.usageLimitTotal ?? null,
        usageLimitPerCustomer: c.usageLimitPerCustomer ?? null,
        firstOrderOnly: c.firstOrderOnly ?? false,
        isActive: true,
      },
    });
    if (c.code === "STYLE20") {
      await prisma.couponProductCollection.create({ data: { couponId: coupon.id, collectionId: collectionIds.get("sale")! } });
    }
  }

  await prisma.promotion.create({
    data: {
      name: "ปลายฝน — แจ็กเก็ตผู้หญิง",
      description: "ลด 15% แจ็กเก็ตผู้หญิง",
      type: "PERCENTAGE",
      value: d(15),
      scope: "CATEGORY",
      categoryId: categoryIds.get("women-jackets")!,
      startsAt: new Date("2026-11-01"),
      endsAt: new Date("2026-12-31"),
      priority: 10,
      isActive: true,
    },
  });
  await prisma.promotion.create({
    data: {
      name: "เสื้อผ้าพื้นฐาน — ลด 10%",
      description: "ลด 10% สำหรับคอลเลกชันเสื้อผ้าพื้นฐาน",
      type: "PERCENTAGE",
      value: d(10),
      scope: "COLLECTION",
      collectionId: collectionIds.get("essentials")!,
      startsAt: new Date("2026-11-01"),
      endsAt: new Date("2027-01-15"),
      priority: 5,
      isActive: true,
    },
  });

  // ── Demo orders ─────────────────────────────────────────────────────────
  const customerId = customers["customer@dayshift.example"].id;
  const address = {
    firstName: "ณิชา",
    lastName: "วรรณศิลป์",
    line1: "88/8 ซอยอารีย์ 4",
    line2: "คอนโดเดอะทรี อารีย์",
    city: "เขตรพญาไท",
    state: "กรุงเทพมหานคร",
    postalCode: "10400",
    country: "TH",
    phone: "081-234-5678",
  };
  const shipping = {
    firstName: "ณิชา",
    lastName: "วรรณศิลป์",
    addressLine1: "88/8 ซอยอารีย์ 4",
    addressLine2: "คอนโดเดอะทรี อารีย์",
    city: "เขตรพญาไท",
    region: "กรุงเทพมหานคร",
    postalCode: "10400",
    country: "TH",
    phone: "081-234-5678",
  };

  async function makeOrder(opts: {
    number: string;
    userId?: string;
    email: string;
    lines: Array<{ slug: string; color: string; size: string; qty: number }>;
    status: "PENDING_PAYMENT" | "PAID" | "PROCESSING" | "PACKED" | "SHIPPED" | "DELIVERED" | "COMPLETED" | "CANCELLED" | "REFUNDED" | "RETURN_REQUESTED";
    paymentStatus: "PENDING" | "PAID" | "REFUNDED" | "FAILED";
    daysAgo: number;
    shippingTotal?: number;
    discountTotal?: number;
    couponCode?: string;
    shipment?: { status: "READY_TO_SHIP" | "PICKED_UP" | "IN_TRANSIT" | "OUT_FOR_DELIVERY" | "DELIVERED"; tracking: string };
    reviewProduct?: string;
  }) {
    const placedAt = new Date(now.getTime() - opts.daysAgo * 86_400_000);
    const items = opts.lines.map((l) => {
      const variantId = variantIds.get(`${l.slug}|${l.color}|${l.size}`)!;
      const product = products.find((p) => p.slug === l.slug)!;
      const unit = product.price;
      return { ...l, variantId, unit, lineTotal: unit * l.qty, product };
    });
    const subtotal = items.reduce((sum, i) => sum + i.lineTotal, 0);
    const discount = opts.discountTotal ?? 0;
    const ship = opts.shippingTotal ?? (subtotal - discount >= 1500 ? 0 : 50);
    const tax = Math.round((subtotal - discount) * 0.07 * 100) / 100;
    const total = Math.round((subtotal - discount + ship + tax) * 100) / 100;

    const order = await prisma.order.create({
      data: {
        orderNumber: opts.number,
        userId: opts.userId ?? null,
        email: opts.email,
        status: opts.status,
        paymentStatus: opts.paymentStatus,
        subtotal: d(subtotal),
        discountTotal: d(discount),
        shippingTotal: d(ship),
        taxTotal: d(tax),
        grandTotal: d(total),
        couponCode: opts.couponCode,
        shippingMethod: "standard",
        shippingAddress: shipping,
        billingAddress: shipping,
        placedAt,
        paidAt: ["PAID", "PROCESSING", "PACKED", "SHIPPED", "DELIVERED", "COMPLETED", "REFUNDED", "RETURN_REQUESTED"].includes(opts.status) ? placedAt : null,
        completedAt: opts.status === "COMPLETED" ? new Date(placedAt.getTime() + 6 * 86_400_000) : null,
        items: {
          create: items.map((i) => ({
            variantId: i.variantId,
            productId: productIds.get(i.product.slug),
            productName: i.product.name,
            productNameEn: productsEn[i.product.slug]?.name ?? i.product.name,
            productSlug: i.product.slug,
            brandName: "DAYSHIFT",
            variantSku: `${i.product.sku}-${i.color.slice(0, 3).toUpperCase()}-${i.size}`,
            size: i.size,
            color: i.color,
            quantity: i.qty,
            unitPrice: d(i.unit),
            lineTotal: d(i.lineTotal),
            imageUrl: artFor(i.product.art ?? ART_BY_CATEGORY[i.product.category] ?? "tee", i.color),
          })),
        },
        statusHistory: {
          create: [
            { toStatus: "PENDING_PAYMENT", actorType: "SYSTEM", createdAt: placedAt },
            ...(opts.status !== "PENDING_PAYMENT" && opts.status !== "CANCELLED"
              ? [{ toStatus: opts.status, fromStatus: "PENDING_PAYMENT" as const, actorType: "SYSTEM" as const, createdAt: new Date(placedAt.getTime() + 60_000) }]
              : []),
            ...(opts.status === "CANCELLED"
              ? [{ toStatus: "CANCELLED" as const, fromStatus: "PENDING_PAYMENT" as const, actorType: "CUSTOMER" as const, reason: "เปลี่ยนใจ", createdAt: new Date(placedAt.getTime() + 3_600_000) }]
              : []),
          ],
        },
      },
    });

    await prisma.payment.create({
      data: {
        orderId: order.id,
        provider: "sandbox",
        method: "SANDBOX_CARD",
        status: opts.paymentStatus,
        amount: d(total),
        providerRef: `sbx_${opts.number.replace(/[^0-9]/g, "")}`,
        capturedAt: opts.paymentStatus === "PAID" || opts.paymentStatus === "REFUNDED" ? placedAt : null,
      },
    });

    if (opts.shipment) {
      const shipment = await prisma.shipment.create({
        data: {
          orderId: order.id,
          carrier: "Kerry Express",
          service: "มาตรฐาน",
          trackingNumber: opts.shipment.tracking,
          status: opts.shipment.status,
          shippedAt: new Date(placedAt.getTime() + 2 * 86_400_000),
          estimatedDelivery: new Date(placedAt.getTime() + 6 * 86_400_000),
        },
      });
      await prisma.shipmentEvent.createMany({
        data: [
          { shipmentId: shipment.id, status: "READY_TO_SHIP", description: "สร้างพัสดุแล้ว", descriptionEn: "Shipment created", occurredAt: new Date(placedAt.getTime() + 1 * 86_400_000) },
          ...(opts.shipment.status !== "READY_TO_SHIP"
            ? [{ shipmentId: shipment.id, status: "IN_TRANSIT" as const, description: "พัสดุอยู่ระหว่างขนส่ง", descriptionEn: "Parcel in transit", location: "กรุงเทพมหานคร", locationEn: "Bangkok", occurredAt: new Date(placedAt.getTime() + 3 * 86_400_000) }]
            : []),
          ...(opts.shipment.status === "DELIVERED"
            ? [{ shipmentId: shipment.id, status: "DELIVERED" as const, description: "ส่งถึงผู้รับแล้ว", descriptionEn: "Delivered to recipient", location: "กรุงเทพมหานคร", locationEn: "Bangkok", occurredAt: new Date(placedAt.getTime() + 5 * 86_400_000) }]
            : []),
        ],
      });
    }

    if (opts.reviewProduct) {
      await prisma.review.create({
        data: {
          productId: productIds.get(opts.reviewProduct)!,
          userId: opts.userId!,
          rating: 5,
          title: "ตรงตามที่ต้องการเลย",
          body: "เนื้อผ้าหนาดี ทรงตรงตามที่อธิบายไว้ กลายเป็นชิ้นที่หยิบใส่บ่อยที่สุดไปแล้ว",
          titleEn: reviewEn[opts.reviewProduct]?.title ?? null,
          bodyEn: reviewEn[opts.reviewProduct]?.body ?? null,
          status: "APPROVED",
          isVerifiedPurchase: true,
          helpfulCount: 6,
        },
      });
    }
    return order;
  }

  const delivered = await makeOrder({
    number: "DS-20260912-000141",
    userId: customerId,
    email: "customer@dayshift.example",
    lines: [
      { slug: "the-everyday-oversized-tee", color: "Optic White", size: "M", qty: 2 },
      { slug: "straight-leg-jeans", color: "Indigo", size: "27", qty: 1 },
    ],
    status: "COMPLETED",
    paymentStatus: "PAID",
    daysAgo: 18,
    shipment: { status: "DELIVERED", tracking: "KRY-8841-2200-19" },
    reviewProduct: "the-everyday-oversized-tee",
  });

  await makeOrder({
    number: "DS-20261003-000228",
    userId: customerId,
    email: "customer@dayshift.example",
    lines: [{ slug: "classic-sneaker", color: "White", size: "40", qty: 1 }],
    status: "SHIPPED",
    paymentStatus: "PAID",
    daysAgo: 5,
    shipment: { status: "IN_TRANSIT", tracking: "KRY-8841-3310-82" },
  });

  await makeOrder({
    number: "DS-20261110-000319",
    userId: customerId,
    email: "customer@dayshift.example",
    lines: [
      { slug: "merino-crew-knit", color: "Cream", size: "S", qty: 1 },
      { slug: "wide-leg-trousers", color: "Taupe", size: "S", qty: 1 },
    ],
    status: "PROCESSING",
    paymentStatus: "PAID",
    daysAgo: 2,
    couponCode: "DAYSHIFT15",
    discountTotal: 417,
  });

  await makeOrder({
    number: "DS-20261119-000402",
    userId: customerId,
    email: "customer@dayshift.example",
    lines: [{ slug: "leather-tote", color: "Tan", size: "One Size", qty: 1 }],
    status: "PENDING_PAYMENT",
    paymentStatus: "PENDING",
    daysAgo: 1,
  });

  await makeOrder({
    number: "DS-20261022-000287",
    userId: customers["jirawat@example.com"].id,
    email: "jirawat@example.com",
    lines: [
      { slug: "mens-oxford-shirt", color: "White", size: "M", qty: 1 },
      { slug: "mens-straight-jeans", color: "Indigo", size: "32", qty: 1 },
    ],
    status: "PACKED",
    paymentStatus: "PAID",
    daysAgo: 3,
  });

  await makeOrder({
    number: "DS-20260815-000092",
    userId: customers["jirawat@example.com"].id,
    email: "jirawat@example.com",
    lines: [{ slug: "mens-fleece-hoodie", color: "Heather Grey", size: "L", qty: 1 }],
    status: "CANCELLED",
    paymentStatus: "FAILED",
    daysAgo: 40,
  });

  // Guest order awaiting fulfillment
  await makeOrder({
    number: "DS-20261118-000388",
    email: "areerata@example.com",
    lines: [
      { slug: "silk-blend-slip-dress", color: "Stone", size: "S", qty: 1 },
      { slug: "gold-hoop-earrings", color: "Gold", size: "One Size", qty: 1 },
    ],
    status: "PAID",
    paymentStatus: "PAID",
    daysAgo: 1,
  });

  // Return request on delivered order
  const deliveredItems = await prisma.orderItem.findMany({ where: { orderId: delivered.id } });
  const teeItem = deliveredItems.find((i) => i.productSlug === "the-everyday-oversized-tee")!;
  await prisma.returnRequest.create({
    data: {
      returnNumber: "RT-2026-000031",
      orderId: delivered.id,
      userId: customerId,
      status: "REQUESTED",
      resolution: "EXCHANGE",
      reason: "WRONG_SIZE",
      customerNote: "เสื้อตัวใหญ่เกินไปนิดหน่อย ขอเปลี่ยนจากไซซ์ M เป็น S ได้ไหมคะ",
      items: {
        create: [
          {
            orderItemId: teeItem.id,
            quantity: 1,
            reason: "WRONG_SIZE",
            conditionNotes: "ยังไม่ได้ใส่ ป้ายยังอยู่",
          },
        ],
      },
    },
  });

  // Support tickets
  const ticket = await prisma.supportTicket.create({
    data: {
      ticketNumber: "TKT-100241",
      userId: customerId,
      orderId: delivered.id,
      subject: "สอบถามเรื่องการเปลี่ยนไซซ์",
      description: "ส่งคำขอเปลี่ยนเสื้อยืด Everyday แล้ว อยากทราบว่าของใหม่จะจัดส่งทันก่อนวันหยุดไหมคะ",
      priority: "NORMAL",
      status: "IN_PROGRESS",
      assignedToId: staff.CUSTOMER_SUPPORT.id,
    },
  });
  await prisma.ticketMessage.createMany({
    data: [
      { ticketId: ticket.id, authorType: "CUSTOMER", authorId: customerId, body: "ส่งคำขอเปลี่ยนเสื้อยืด Everyday แล้ว อยากทราบว่าของใหม่จะจัดส่งทันก่อนวันหยุดไหมคะ", createdAt: new Date(now.getTime() - 2 * 86_400_000) },
      { ticketId: ticket.id, authorType: "STAFF", authorId: staff.CUSTOMER_SUPPORT.id, body: "สวัสดีค่ะคุณณิชา พอตรวจรับสินค้าคืนเรียบร้อยแล้ว ทางร้านจะจัดส่งตัวใหม่ให้ภายในวันเดียวกันค่ะ จะแจ้งความคืบหน้าทางนี้เรื่อย ๆ นะคะ", createdAt: new Date(now.getTime() - 1 * 86_400_000) },
      { ticketId: ticket.id, authorType: "STAFF", authorId: staff.CUSTOMER_SUPPORT.id, body: "ภายใน: ตรวจสต็อกที่คลัง BKK1 แล้ว ไซซ์ S พร้อมส่ง", isInternal: true, createdAt: new Date(now.getTime() - 1 * 86_400_000 + 3600_000) },
    ],
  });

  await prisma.supportTicket.create({
    data: {
      ticketNumber: "TKT-100242",
      userId: customers["jirawat@example.com"].id,
      subject: "ขอเปลี่ยนที่อยู่จัดส่ง",
      description: "คำสั่งซื้อที่แพ็กแล้ว ขอเปลี่ยนที่อยู่จัดส่งได้ไหมครับ",
      priority: "HIGH",
      status: "OPEN",
    },
  });

  // Approved reviews across the catalogue
  const reviewCopy = [
    { slug: "relaxed-linen-shirt", rating: 5, title: "เสื้อลินินที่ตามหามานาน", body: "น้ำหนักผ้าดี สี Oat ตรงตามรูป รีดยากนิดหนึ่งแต่ก็เป็นธรรมชาติของลินินที่ดี" },
    { slug: "leather-tote", rating: 5, title: "ใช้แล้วสวยขึ้นเรื่อย ๆ", body: "พกทุกวันมาหนึ่งเดือน หนังเริ่มนุ่มขึ้นแล้ว ใส่แล็ปท็อปกับขวดน้ำได้สบาย" },
    { slug: "classic-sneaker", rating: 4, title: "ใส่สบายมาก", body: "ทรงสะอาด ใส่ครั้งแรกก็ไม่กัด ไซซ์จริง ใส่กับถุงเท้าบางกำลังพอดี" },
    { slug: "straight-leg-jeans", rating: 5, title: "ขาตรงกำลังดี", body: "ผ้ายีนส์แข็งเล็กน้อยแต่ไม่ยืดออก เอวสูงใส่สบาย ความยาวพอดีกับรองเท้าแตะ" },
    { slug: "everyday-hoodie", rating: 5, title: "หนานุ่มเกินคาด", body: "หนักกว่าที่คิดในทางที่ดี ด้านใน brushed นุ่ม ผ่านการซักหลายครั้งยังทรงอยู่" },
    { slug: "silk-blend-slip-dress", rating: 4, title: "ทิ้งตัวสวย", body: "สี Stone เป็นเทาเบจอุ่น ๆ ตัดเฉียงเข้าทรง เปลี่ยนไซซ์ขึ้นหนึ่งเพื่อความหลวมกำลังดี" },
    { slug: "structured-blazer", rating: 5, title: "คุ้มค่าที่ลงทุน", body: "ไหล่ตั้งสวยแต่ไม่แข็ง ซับในคิวโปรใส่ทับเสื้อบางได้ลื่น ใส่ทำงานได้ทุกวัน" },
  ];
  for (const [i, r] of reviewCopy.entries()) {
    const reviewer = i % 2 === 0 ? customerId : customers["jirawat@example.com"].id;
    await prisma.review.create({
      data: {
        productId: productIds.get(r.slug)!,
        userId: reviewer,
        rating: r.rating,
        title: r.title,
        body: r.body,
        titleEn: reviewEn[r.slug]?.title ?? null,
        bodyEn: reviewEn[r.slug]?.body ?? null,
        status: "APPROVED",
        isVerifiedPurchase: true,
        helpfulCount: 2 + i,
      },
    }).catch(() => undefined);
  }

  // ── Demo carts / wishlist ──────────────────────────────────────────────
  const wishlist = await prisma.wishlist.create({ data: { userId: customerId } });
  await prisma.wishlistItem.createMany({
    data: [
      { wishlistId: wishlist.id, productId: productIds.get("structured-blazer")! },
      { wishlistId: wishlist.id, productId: productIds.get("leather-tote")! },
    ],
  });

  // ── Purchase orders ────────────────────────────────────────────────────
  const po = await prisma.purchaseOrder.create({
    data: {
      poNumber: "PO-2026-0042",
      supplierId: supplier.id,
      warehouseId: mainWarehouse.id,
      status: "ORDERED",
      expectedAt: new Date("2026-12-05"),
      subtotal: d(26400),
      notes: "เติมสต็อกเสื้อยืดผ้าหนักสำหรับช่วงปลายปี",
      createdById: staff.SUPER_ADMIN.id,
      items: {
        create: [
          { variantId: variantIds.get("the-everyday-oversized-tee|Optic White|M")!, quantity: 60, unitCost: d(220) },
          { variantId: variantIds.get("the-everyday-oversized-tee|Washed Black|M")!, quantity: 60, unitCost: d(220) },
        ],
      },
    },
  });
  void po;

  // ── Settings ───────────────────────────────────────────────────────────
  const settings: Array<{ key: string; value: Prisma.InputJsonValue }> = [
    { key: "store", value: { name: "DAYSHIFT", tagline: "แต่งตัวง่าย ๆ ในแบบของคุณ", email: "hello@dayshift.example", phone: "02-745-1188", address: "123/4 ถนนเทพรัตน เขตบางนา กรุงเทพมหานคร 10260" } },
    { key: "tax", value: { rate: 0.07, inclusive: true, label: "ภาษีมูลค่าเพิ่ม 7%" } },
    { key: "shipping", value: { standardPrice: 50, standardFreeOver: 1500, expressPrice: 100 } },
    { key: "returns", value: { windowDays: 30, freeReturns: true, finalSaleReturnable: false } },
    { key: "loyalty", value: { pointsPerDollar: 0.05, centsPerPoint: 100, minRedeemPoints: 500, earnOnShipping: false } },
    { key: "payments", value: { provider: "sandbox", currency: "THB", cashOnDelivery: true } },
    { key: "notifications", value: { orderEmails: true, marketingEmails: true, lowStockAlerts: true } },
    { key: "features", value: { guestCheckout: true, reviewsRequirePurchase: true, wishlistForGuests: false } },
  ];
  for (const s of settings) {
    await prisma.setting.upsert({ where: { key: s.key }, update: { value: s.value }, create: s });
  }

  await prisma.newsletterSubscriber.upsert({
    where: { email: "insider@dayshift.example" },
    update: {},
    create: { email: "insider@dayshift.example", source: "homepage", confirmedAt: new Date() },
  });

  // A few in-app notifications for the support and admin queues
  await prisma.notification.createMany({
    data: [
      { userId: customerId, channel: "IN_APP", template: "order.shipped", subject: "คำสั่งซื้อของคุณจัดส่งแล้ว", body: "คำสั่งซื้อ DS-20261003-000228 อยู่ระหว่างขนส่ง", status: "SENT", sentAt: new Date(now.getTime() - 4 * 86_400_000) },
      { userId: customerId, channel: "IN_APP", template: "return.received", subject: "ได้รับคำขอคืนสินค้าแล้ว", body: "เราได้รับคำขอเปลี่ยนสินค้าของคุณและจะตรวจสอบโดยเร็ว", status: "SENT", sentAt: new Date(now.getTime() - 2 * 86_400_000) },
      { userId: customerId, channel: "EMAIL", email: "customer@dayshift.example", template: "loyalty.tier", subject: "คุณขึ้นระดับ Gold แล้ว", body: "ตอนนี้คุณได้รับ 1 คะแนนทุก ฿20 ที่ใช้จ่าย", status: "SENT", sentAt: new Date(now.getTime() - 20 * 86_400_000) },
    ],
  });

  await prisma.auditLog.createMany({
    data: [
      { actorType: "STAFF", actorId: staff.SUPER_ADMIN.id, actorEmail: "admin@dayshift.example", action: "product.created", entityType: "Product", entityId: productIds.get("the-everyday-oversized-tee"), after: { name: "เสื้อยืดโอเวอร์ไซซ์ Everyday" }, createdAt: new Date(now.getTime() - 30 * 86_400_000) },
      { actorType: "STAFF", actorId: staff.STORE_MANAGER.id, actorEmail: "manager@dayshift.example", action: "order.status_changed", entityType: "Order", entityId: delivered.id, after: { status: "COMPLETED" }, createdAt: new Date(now.getTime() - 10 * 86_400_000) },
      { actorType: "STAFF", actorId: staff.WAREHOUSE_STAFF.id, actorEmail: "warehouse@dayshift.example", action: "inventory.adjusted", entityType: "Inventory", entityId: "seed", after: { variant: "DS-TEE-001-WHI-M", delta: 12 }, createdAt: new Date(now.getTime() - 6 * 86_400_000) },
    ],
  });

  const counts = {
    users: await prisma.user.count(),
    products: await prisma.product.count(),
    variants: await prisma.variant.count(),
    orders: await prisma.order.count(),
    reviews: await prisma.review.count(),
  };
  console.log("DAYSHIFT demo data ready:", counts);
  console.log("Customer: customer@dayshift.example / Customer1234!Pass");
  console.log("Admin:    admin@dayshift.example / Admin1234!Pass");
  void address;
  void sizeGuideWomen;
  void supplier2;
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
