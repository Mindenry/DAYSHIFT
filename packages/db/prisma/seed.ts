 
import { PrismaClient, Prisma } from "@prisma/client";
import bcrypt from "bcryptjs";
import {
  DEFAULT_ROLE_PERMISSIONS,
  PERMISSION_GROUPS,
  PERMISSION_KEYS,
  type PermissionKey,
} from "@dayshift/config";
import demoPhotos from "./demo-photos.json";

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

type ColorDef = { name: string; hex: string; image?: string };

interface ProductDef {
  name: string;
  slug: string;
  sku: string;
  category: string;
  collections?: string[];
  price: number;
  compareAt?: number;
  colors: ColorDef[];
  sizes: string[];
  image?: string;
  art?: string;
  gallery?: string[];
  short: string;
  description: string;
  material: string;
  care: string;
  fit: string;
  features?: string[];
  tags?: string[];
  featured?: boolean;
  status?: "ACTIVE" | "DRAFT" | "ARCHIVED";
  lowStockSkuSize?: string;
}

const APPAREL_SIZES = ["XS", "S", "M", "L", "XL", "XXL"];
const CORE_SIZES = ["S", "M", "L", "XL"];
const SHOE_SIZES = ["40", "41", "42", "43", "44", "45"];
const ONE_SIZE = ["One Size"];

const products: ProductDef[] = [
  {
    name: "The Everyday Oversized Tee",
    slug: "the-everyday-oversized-tee",
    sku: "DS-TEE-001",
    category: "unisex-oversized-tees",
    collections: ["new-arrivals", "best-sellers", "essentials"],
    price: 45,
    colors: [
      { name: "Optic White", hex: "#F4F1EA", image: IMG.teeWhite },
      { name: "Washed Black", hex: "#1C1B19", image: IMG.teeBlack },
    ],
    sizes: APPAREL_SIZES,
    image: IMG.teeWhite,
    gallery: [IMG.teeBlack],
    short: "The tee we build every collection around — boxy, weighty, endlessly wearable.",
    description:
      "Cut from 240gsm combed organic cotton with a dropped shoulder and a boxy body, The Everyday Oversized Tee holds its shape wash after wash. The collar is ribbed and reinforced, the hem is straight, and the finish is garment-washed for softness from the first wear. Designed to sit at the hip with wide trousers or tuck into denim.",
    material: "100% organic combed cotton, 240gsm",
    care: "Machine wash cold with like colours. Do not bleach. Tumble dry low. Warm iron if needed.",
    fit: "Oversized fit. Take your usual size for the intended silhouette, or size down for a closer fit.",
    features: ["240gsm heavyweight jersey", "Dropped shoulder", "Ribbed reinforced collar", "Garment washed"],
    tags: ["organic cotton", "everyday", "unisex"],
    featured: true,
    lowStockSkuSize: "M",
  },
  {
    name: "Classic Cotton Tee",
    slug: "classic-cotton-tee",
    sku: "DS-TEE-002",
    category: "unisex-essentials",
    collections: ["essentials", "best-sellers"],
    price: 32,
    colors: [
      { name: "Optic White", hex: "#F4F1EA", image: IMG.teeWhite },
      { name: "Washed Black", hex: "#1C1B19", image: IMG.teeBlack },
    ],
    sizes: CORE_SIZES,
    image: IMG.teeWhite,
    short: "A clean, regular-fit cotton tee with a soft hand feel.",
    description:
      "A regular-fit crew neck in 180gsm organic cotton. Clean shoulder line, mid-weight body and a smooth hand feel that layers easily under shirts and knitwear. Pre-shrunk and garment dyed in small batches.",
    material: "100% organic cotton, 180gsm",
    care: "Machine wash cold. Tumble dry low.",
    fit: "Regular fit, true to size.",
    features: ["Pre-shrunk", "Garment dyed", "Reinforced neck tape"],
    tags: ["essentials", "cotton"],
  },
  {
    name: "Heavyweight Boxy Tee",
    slug: "heavyweight-boxy-tee",
    sku: "DS-TEE-003",
    category: "unisex-streetwear",
    collections: ["new-arrivals", "limited-drops"],
    price: 55,
    colors: [
      { name: "Washed Black", hex: "#1C1B19", image: IMG.teeBlack },
      { name: "Stone", hex: "#C8BFAE", image: IMG.teeWhite },
    ],
    sizes: APPAREL_SIZES,
    image: IMG.teeBlack,
    short: "A structured, boxy tee in dense 300gsm cotton.",
    description:
      "Our heaviest jersey, built with a wide body, short sleeve and a firm collar that stands up on its own. The surface is brushed for a dry, substantial hand feel. A layering piece that reads as outerwear in summer.",
    material: "100% organic cotton, 300gsm",
    care: "Machine wash cold inside out. Dry flat.",
    fit: "Boxy oversized fit.",
    features: ["300gsm compact jersey", "Firm rib collar", "Side-seam construction"],
    tags: ["streetwear", "heavyweight"],
    featured: true,
  },
  {
    name: "Relaxed Linen Shirt",
    slug: "relaxed-linen-shirt",
    sku: "DS-SHT-001",
    category: "women-shirts",
    collections: ["new-arrivals", "seasonal-2026"],
    price: 89,
    colors: [
      { name: "Oat", hex: "#D6C9B4", image: IMG.shirtOat },
      { name: "Chalk", hex: "#EFEBE2", image: IMG.shirtOat },
    ],
    sizes: APPAREL_SIZES,
    image: IMG.shirtOat,
    short: "A breathable European linen shirt with an easy, borrowed silhouette.",
    description:
      "Woven from 100% European flax linen and garment washed for a lived-in softness. Cut with a relaxed body, dropped shoulder and a curved hem that works tucked or loose. Corozo buttons and a single patch pocket finish it.",
    material: "100% European flax linen",
    care: "Machine wash cold. Line dry. Warm iron while slightly damp.",
    fit: "Relaxed fit. Size down for a neater shape.",
    features: ["Garment washed linen", "Corozo buttons", "Curved hem", "Patch pocket"],
    tags: ["linen", "summer", "natural fibre"],
    featured: true,
  },
  {
    name: "Poplin Oversized Shirt",
    slug: "poplin-oversized-shirt",
    sku: "DS-SHT-002",
    category: "women-shirts",
    collections: ["essentials", "best-sellers"],
    price: 79,
    colors: [
      { name: "Chalk", hex: "#EFEBE2", image: IMG.shirtOat },
      { name: "Pale Blue", hex: "#B9C7CE", image: IMG.shirtOat },
    ],
    sizes: APPAREL_SIZES,
    image: IMG.shirtOat,
    short: "Crisp cotton poplin with a generous, architectural cut.",
    description:
      "A wardrobe workhorse in compact cotton poplin with a dry, crisp finish. Extended cuffs, a deep back pleat and a longline hem make it equally at home over a slip dress or with tailored trousers.",
    material: "100% cotton poplin",
    care: "Machine wash cold. Hang dry. Iron on medium.",
    fit: "Oversized fit.",
    features: ["Compact poplin", "Extended cuff", "Back pleat"],
    tags: ["shirting", "workwear"],
  },
  {
    name: "Silk-Blend Slip Dress",
    slug: "silk-blend-slip-dress",
    sku: "DS-DRS-001",
    category: "women-dresses",
    collections: ["new-arrivals", "limited-drops", "seasonal-2026"],
    price: 129,
    colors: [
      { name: "Stone", hex: "#B8AFA0", image: IMG.dressStone },
      { name: "Black", hex: "#161514", image: IMG.dressStone },
    ],
    sizes: APPAREL_SIZES,
    image: IMG.dressStone,
    short: "A bias-cut slip in a fluid silk blend that moves with you.",
    description:
      "Cut on the bias for a close, fluid drape, this midi slip has adjustable straps, a soft V neckline and a French seam finish. The silk-viscose blend catches the light without clinging. Wear alone in warm weather or layered under knitwear.",
    material: "60% silk, 40% LENZING™ ECOVERO™ viscose",
    care: "Dry clean or hand wash cold. Dry flat in shade.",
    fit: "True to size, bias cut. Midi length.",
    features: ["Bias cut", "Adjustable straps", "French seams"],
    tags: ["silk", "occasion", "midi"],
    featured: true,
  },
  {
    name: "Ribbed Midi Dress",
    slug: "ribbed-midi-dress",
    sku: "DS-DRS-002",
    category: "women-dresses",
    collections: ["essentials", "best-sellers"],
    price: 98,
    colors: [
      { name: "Black", hex: "#161514", image: IMG.dressStone },
      { name: "Oat", hex: "#D6C9B4", image: IMG.dressStone },
    ],
    sizes: APPAREL_SIZES,
    image: IMG.dressStone,
    short: "A body-skimming rib knit dress with a square neck.",
    description:
      "Knitted from a fine organic cotton rib with plenty of stretch and recovery. The square neckline and wide straps frame the shoulders, while the midi length keeps it refined. An everyday dress that travels well.",
    material: "95% organic cotton, 5% elastane",
    care: "Machine wash cold. Dry flat.",
    fit: "Slim fit, stretch rib.",
    features: ["Square neck", "Stretch rib", "Midi length"],
    tags: ["knit", "everyday"],
  },
  {
    name: "Structured Blazer",
    slug: "structured-blazer",
    sku: "DS-JKT-001",
    category: "women-jackets",
    collections: ["new-arrivals", "seasonal-2026"],
    price: 189,
    colors: [
      { name: "Black", hex: "#161514", image: IMG.jacketBlack },
      { name: "Taupe", hex: "#A79A87", image: IMG.jacketBlack },
    ],
    sizes: APPAREL_SIZES,
    image: IMG.jacketBlack,
    short: "A single-breasted blazer with a clean shoulder and soft construction.",
    description:
      "Tailored in a wool-blend suiting cloth with a half-canvas front, notch lapel and a two-button closure. The shoulder is lightly padded, the body is fully lined in cupro, and the pockets are functional. Sharp enough for work, relaxed enough for the weekend.",
    material: "68% wool, 30% polyester, 2% elastane; cupro lining",
    care: "Dry clean only.",
    fit: "Relaxed tailored fit.",
    features: ["Half-canvas construction", "Notch lapel", "Functional pockets", "Cupro lining"],
    tags: ["tailoring", "workwear", "wool"],
    featured: true,
  },
  {
    name: "Everyday Hoodie",
    slug: "everyday-hoodie",
    sku: "DS-HOD-001",
    category: "unisex-hoodies",
    collections: ["best-sellers", "essentials"],
    price: 78,
    colors: [
      { name: "Heather Grey", hex: "#A8A5A0", image: IMG.hoodieGrey },
      { name: "Washed Black", hex: "#1C1B19", image: IMG.hoodieGrey },
    ],
    sizes: APPAREL_SIZES,
    image: IMG.hoodieGrey,
    short: "A brushed-back fleece hoodie with a substantial, lived-in feel.",
    description:
      "Made from 420gsm brushed-back organic cotton fleece, with a double-layer hood, kangaroo pocket and ribbed cuffs and hem. The fit is relaxed without drowning you. Garment washed to soften the seams.",
    material: "80% organic cotton, 20% recycled polyester, 420gsm",
    care: "Machine wash cold inside out. Tumble dry low.",
    fit: "Relaxed fit.",
    features: ["420gsm brushed fleece", "Double-layer hood", "Kangaroo pocket"],
    tags: ["fleece", "everyday", "unisex"],
    featured: true,
  },
  {
    name: "French Terry Sweatshirt",
    slug: "french-terry-sweatshirt",
    sku: "DS-SWT-001",
    category: "unisex-sweatshirts",
    collections: ["essentials"],
    price: 68,
    colors: [
      { name: "Oat", hex: "#D6C9B4", image: IMG.hoodieGrey },
      { name: "Heather Grey", hex: "#A8A5A0", image: IMG.hoodieGrey },
    ],
    sizes: APPAREL_SIZES,
    image: IMG.hoodieGrey,
    short: "A loopback French terry crew with a clean, boxy cut.",
    description:
      "Loopback French terry in a mid weight, with a ribbed crew neck, set-in sleeves and a straight hem. An easy layer that works over a tee or under a coat.",
    material: "100% organic cotton, 340gsm",
    care: "Machine wash cold. Dry flat.",
    fit: "Relaxed fit.",
    features: ["Loopback terry", "Ribbed neck", "Set-in sleeve"],
    tags: ["terry", "essentials"],
  },
  {
    name: "Straight-Leg Jeans",
    slug: "straight-leg-jeans",
    sku: "DS-JNS-001",
    category: "women-jeans",
    collections: ["best-sellers", "essentials"],
    price: 98,
    colors: [
      { name: "Indigo", hex: "#3B4A5A", image: IMG.jeansIndigo },
      { name: "Washed Black", hex: "#2A2927", image: IMG.jeansIndigo },
    ],
    sizes: ["24", "25", "26", "27", "28", "29", "30", "31"],
    image: IMG.jeansIndigo,
    short: "A high-rise straight jean in rigid organic denim.",
    description:
      "Cut from 12.5oz rigid organic cotton denim with a high rise, straight leg and a full-length inseam. The waistband is contoured, the pockets are reinforced, and the finish is a clean mid-indigo rinse.",
    material: "100% organic cotton denim, 12.5oz",
    care: "Machine wash cold inside out. Line dry.",
    fit: "High rise, straight leg. True to size.",
    features: ["Rigid organic denim", "High rise", "Reinforced pockets"],
    tags: ["denim", "everyday"],
    featured: true,
  },
  {
    name: "Wide-Leg Trousers",
    slug: "wide-leg-trousers",
    sku: "DS-TRS-001",
    category: "women-trousers",
    collections: ["new-arrivals", "essentials"],
    price: 88,
    colors: [
      { name: "Taupe", hex: "#A79A87", image: IMG.trousersTaupe },
      { name: "Black", hex: "#161514", image: IMG.trousersTaupe },
    ],
    sizes: APPAREL_SIZES,
    image: IMG.trousersTaupe,
    short: "Fluid, high-waisted trousers with a long, clean line.",
    description:
      "Tailored in a drapey lyocell-wool blend with a high waist, pressed crease and a wide leg that falls to the floor. Hook-and-bar closure, belt loops and side seam pockets. Dress them up with a blazer or down with a tee.",
    material: "70% lyocell, 30% wool",
    care: "Dry clean or hand wash cold.",
    fit: "High waist, wide leg. Long inseam.",
    features: ["Pressed crease", "Hook-and-bar closure", "Side pockets"],
    tags: ["tailoring", "lyocell"],
    featured: true,
  },
  {
    name: "Pleated Midi Skirt",
    slug: "pleated-midi-skirt",
    sku: "DS-SKT-001",
    category: "women-skirts",
    collections: ["new-arrivals", "seasonal-2026"],
    price: 79,
    colors: [
      { name: "Stone", hex: "#B8AFA0", image: IMG.trousersTaupe },
      { name: "Black", hex: "#161514", image: IMG.trousersTaupe },
    ],
    sizes: APPAREL_SIZES,
    image: IMG.trousersTaupe,
    short: "Knife-pleated midi skirt with beautiful movement.",
    description:
      "Permanent knife pleats in a soft recycled crepe, with an elasticated back waist for comfort and a clean front. The midi length and fluid weight make it an easy piece for both work and evenings.",
    material: "100% recycled polyester crepe",
    care: "Hand wash cold. Hang dry. Do not tumble dry.",
    fit: "Relaxed A-line, midi length.",
    features: ["Permanent knife pleats", "Elastic back waist"],
    tags: ["pleats", "occasion"],
  },
  {
    name: "Tailored Shorts",
    slug: "tailored-shorts",
    sku: "DS-SHR-001",
    category: "women-shorts",
    collections: ["seasonal-2026"],
    price: 58,
    colors: [
      { name: "Oat", hex: "#D6C9B4", image: IMG.trousersTaupe },
      { name: "Black", hex: "#161514", image: IMG.trousersTaupe },
    ],
    sizes: APPAREL_SIZES,
    image: IMG.trousersTaupe,
    short: "A crisp tailored short with a high waist and pressed crease.",
    description:
      "Cut from a lightweight cotton-linen suiting with a high waist, zip fly and a clean pressed crease. Finished with belt loops and deep side pockets. A polished warm-weather staple.",
    material: "55% cotton, 45% linen",
    care: "Machine wash cold. Warm iron.",
    fit: "High waist, relaxed leg.",
    features: ["Zip fly", "Pressed crease", "Belt loops"],
    tags: ["summer", "tailoring"],
  },
  {
    name: "Merino Crew Knit",
    slug: "merino-crew-knit",
    sku: "DS-KNT-001",
    category: "women-tops",
    collections: ["essentials", "best-sellers"],
    price: 110,
    colors: [
      { name: "Cream", hex: "#E7DFD0", image: IMG.knitCream },
      { name: "Black", hex: "#161514", image: IMG.knitCream },
    ],
    sizes: APPAREL_SIZES,
    image: IMG.knitCream,
    short: "Fine-gauge extra-fine merino with a clean crew neck.",
    description:
      "Knitted in a fine 12-gauge extra-fine merino that is soft against the skin and holds its shape. A slim, slightly cropped body with a ribbed crew neck, cuffs and hem. Wear it alone or layered.",
    material: "100% extra-fine merino wool",
    care: "Hand wash cold with wool detergent. Dry flat.",
    fit: "Slim fit, slightly cropped.",
    features: ["12-gauge extra-fine merino", "Ribbed trims", "Mulesing-free wool"],
    tags: ["merino", "knitwear"],
    featured: true,
  },
  {
    name: "Men's Oxford Shirt",
    slug: "mens-oxford-shirt",
    sku: "DS-MSHT-001",
    category: "men-shirts",
    collections: ["essentials", "best-sellers"],
    price: 85,
    colors: [
      { name: "White", hex: "#F4F1EA", image: IMG.shirtOat },
      { name: "Light Blue", hex: "#B9C7CE", image: IMG.shirtOat },
    ],
    sizes: CORE_SIZES,
    image: IMG.shirtOat,
    short: "A classic oxford button-down in substantial cotton.",
    description:
      "Woven from 140gsm cotton oxford with a soft roll to the button-down collar. A regular fit through the chest with a box pleat and locker loop at the back, single-needle stitching, and a curved hem.",
    material: "100% cotton oxford, 140gsm",
    care: "Machine wash warm. Tumble dry low. Iron on medium.",
    fit: "Regular fit.",
    features: ["Button-down collar", "Box pleat", "Single-needle stitching"],
    tags: ["shirting", "classic"],
  },
  {
    name: "Men's Piqué Polo",
    slug: "mens-pique-polo",
    sku: "DS-POL-001",
    category: "men-polos",
    collections: ["essentials"],
    price: 65,
    colors: [
      { name: "Oat", hex: "#D6C9B4", image: IMG.shirtOat },
      { name: "Navy", hex: "#28313D", image: IMG.shirtOat },
    ],
    sizes: CORE_SIZES,
    image: IMG.shirtOat,
    short: "A relaxed piqué polo with a soft collar and mother-of-pearl buttons.",
    description:
      "Knitted in breathable cotton piqué with a relaxed body, ribbed collar and cuffs, and a two-button placket. The collar is unfused for a softer, more contemporary line.",
    material: "100% cotton piqué",
    care: "Machine wash cold. Dry flat.",
    fit: "Relaxed fit.",
    features: ["Unfused collar", "Mother-of-pearl buttons"],
    tags: ["polo", "everyday"],
  },
  {
    name: "Men's Relaxed Chino",
    slug: "mens-relaxed-chino",
    sku: "DS-MTRS-001",
    category: "men-trousers",
    collections: ["essentials", "best-sellers"],
    price: 88,
    colors: [
      { name: "Sand", hex: "#C9B99F", image: IMG.trousersTaupe },
      { name: "Olive", hex: "#6B6B52", image: IMG.trousersTaupe },
    ],
    sizes: ["28", "30", "32", "34", "36", "38"],
    image: IMG.trousersTaupe,
    short: "Garment-dyed cotton twill chinos with a relaxed straight leg.",
    description:
      "Cut from 280gsm cotton twill and garment dyed for depth of colour. A relaxed straight leg with a mid rise, slant pockets and a clean finish. Softens with every wash.",
    material: "100% cotton twill, 280gsm",
    care: "Machine wash cold. Tumble dry low.",
    fit: "Relaxed straight leg.",
    features: ["Garment dyed", "Mid rise", "Slant pockets"],
    tags: ["twill", "everyday"],
  },
  {
    name: "Men's Straight Jeans",
    slug: "mens-straight-jeans",
    sku: "DS-MJNS-001",
    category: "men-jeans",
    collections: ["essentials"],
    price: 95,
    colors: [
      { name: "Indigo", hex: "#3B4A5A", image: IMG.jeansIndigo },
      { name: "Washed Black", hex: "#2A2927", image: IMG.jeansIndigo },
    ],
    sizes: ["28", "30", "32", "34", "36", "38"],
    image: IMG.jeansIndigo,
    short: "A mid-rise straight jean in rigid selvedge-style denim.",
    description:
      "A straightforward five-pocket jean in 13oz rigid cotton denim, with a mid rise, straight leg and a clean, unfaded indigo finish. Built to break in and last.",
    material: "100% cotton denim, 13oz",
    care: "Machine wash cold inside out. Line dry.",
    fit: "Mid rise, straight leg.",
    features: ["13oz rigid denim", "Five-pocket construction"],
    tags: ["denim"],
  },
  {
    name: "Men's Harrington Jacket",
    slug: "mens-harrington-jacket",
    sku: "DS-MJKT-001",
    category: "men-jackets",
    collections: ["new-arrivals", "seasonal-2026"],
    price: 165,
    colors: [
      { name: "Black", hex: "#161514", image: IMG.jacketBlack },
      { name: "Sand", hex: "#C9B99F", image: IMG.jacketBlack },
    ],
    sizes: CORE_SIZES,
    image: IMG.jacketBlack,
    short: "A clean Harrington in water-resistant cotton with a check lining.",
    description:
      "The classic Harrington silhouette, refined: a cotton-blend shell with a water-repellent finish, stand collar with throat latch, two-way zip and ribbed cuffs and hem. Fully lined in a tonal cotton check.",
    material: "65% cotton, 35% recycled polyester; cotton check lining",
    care: "Machine wash cold. Do not tumble dry.",
    fit: "Regular fit.",
    features: ["Water-repellent finish", "Two-way zip", "Throat latch", "Check lining"],
    tags: ["outerwear", "classic"],
    featured: true,
  },
  {
    name: "Men's Everyday Tee",
    slug: "mens-everyday-tee",
    sku: "DS-MTEE-001",
    category: "men-t-shirts",
    collections: ["essentials"],
    price: 38,
    colors: [
      { name: "Optic White", hex: "#F4F1EA", image: IMG.teeWhite },
      { name: "Washed Black", hex: "#1C1B19", image: IMG.teeBlack },
    ],
    sizes: CORE_SIZES,
    image: IMG.teeWhite,
    short: "A well-cut everyday tee with a slightly heavier hand.",
    description:
      "A regular-fit crew in 200gsm organic cotton with a clean neckline and a straight hem. Substantial enough to wear alone, smooth enough to layer.",
    material: "100% organic cotton, 200gsm",
    care: "Machine wash cold. Tumble dry low.",
    fit: "Regular fit.",
    features: ["200gsm jersey", "Ribbed collar"],
    tags: ["essentials"],
  },
  {
    name: "Men's Fleece Hoodie",
    slug: "mens-fleece-hoodie",
    sku: "DS-MHOD-001",
    category: "men-hoodies",
    collections: ["best-sellers"],
    price: 82,
    colors: [
      { name: "Heather Grey", hex: "#A8A5A0", image: IMG.hoodieGrey },
      { name: "Black", hex: "#161514", image: IMG.hoodieGrey },
    ],
    sizes: CORE_SIZES,
    image: IMG.hoodieGrey,
    short: "A heavyweight fleece hoodie cut for everyday layering.",
    description:
      "A 400gsm brushed-back fleece hoodie with a double-layer hood, ribbed cuffs and hem, and a kangaroo pocket. Cut with a straight body and a comfortable shoulder.",
    material: "80% cotton, 20% recycled polyester, 400gsm",
    care: "Machine wash cold. Tumble dry low.",
    fit: "Regular fit.",
    features: ["Brushed-back fleece", "Double-layer hood"],
    tags: ["fleece"],
  },
  {
    name: "Leather Tote",
    slug: "leather-tote",
    sku: "DS-BAG-001",
    category: "bags-tote",
    collections: ["best-sellers", "essentials"],
    price: 145,
    colors: [
      { name: "Tan", hex: "#9A6F4C", image: IMG.bagTote },
      { name: "Black", hex: "#161514", image: IMG.bagTote },
    ],
    sizes: ONE_SIZE,
    image: IMG.bagTote,
    short: "An unlined leather tote that softens and ages beautifully.",
    description:
      "Cut from vegetable-tanned full-grain leather and left unlined so it slouches with use. Fits a 14-inch laptop, with two internal slip pockets and a magnetic closure. Hand-finished edges.",
    material: "Vegetable-tanned full-grain leather",
    care: "Wipe with a soft dry cloth. Condition occasionally.",
    fit: "One size. 38cm × 32cm × 14cm.",
    features: ["Full-grain leather", "Fits 14\" laptop", "Two internal pockets"],
    tags: ["leather", "bags"],
    featured: true,
  },
  {
    name: "Nylon Crossbody",
    slug: "nylon-crossbody",
    sku: "DS-BAG-002",
    category: "bags-crossbody",
    collections: ["new-arrivals"],
    price: 68,
    colors: [
      { name: "Black", hex: "#161514", image: IMG.bagTote },
      { name: "Stone", hex: "#B8AFA0", image: IMG.bagTote },
    ],
    sizes: ONE_SIZE,
    image: IMG.bagTote,
    short: "A lightweight recycled nylon crossbody with an adjustable strap.",
    description:
      "A compact everyday bag in recycled ripstop nylon with a water-resistant coating. Zip top, front slip pocket and an adjustable webbing strap. Packs flat for travel.",
    material: "Recycled ripstop nylon",
    care: "Wipe clean with a damp cloth.",
    fit: "One size. 24cm × 18cm × 7cm.",
    features: ["Recycled ripstop", "Adjustable strap", "Water-resistant"],
    tags: ["nylon", "travel"],
  },
  {
    name: "Canvas Backpack",
    slug: "canvas-backpack",
    sku: "DS-BAG-003",
    category: "bags-backpacks",
    collections: ["essentials"],
    price: 95,
    colors: [
      { name: "Stone", hex: "#B8AFA0", image: IMG.bagTote },
      { name: "Black", hex: "#161514", image: IMG.bagTote },
    ],
    sizes: ONE_SIZE,
    image: IMG.bagTote,
    short: "A sturdy cotton canvas backpack with leather details.",
    description:
      "Made from 18oz cotton canvas with leather trim and solid brass hardware. A padded 15-inch laptop sleeve, two external pockets and a roll-top closure. Built for the commute.",
    material: "18oz cotton canvas, leather trim",
    care: "Spot clean only.",
    fit: "One size. 42cm × 30cm × 12cm.",
    features: ["Padded 15\" sleeve", "Roll-top closure", "Brass hardware"],
    tags: ["canvas", "commute"],
  },
  {
    name: "Leather Belt",
    slug: "leather-belt",
    sku: "DS-ACC-001",
    category: "accessories-belts",
    collections: ["essentials"],
    price: 55,
    colors: [
      { name: "Black", hex: "#161514" },
      { name: "Tan", hex: "#9A6F4C" },
    ],
    sizes: ["S", "M", "L", "XL"],
    image: IMG.capBlack,
    short: "A clean 30mm leather belt with a brushed brass buckle.",
    description:
      "Full-grain leather, 30mm wide, with hand-painted edges and a brushed brass buckle. Designed to wear with denim and tailoring alike.",
    material: "Full-grain leather, brass hardware",
    care: "Wipe clean. Condition occasionally.",
    fit: "Order your trouser size.",
    features: ["30mm width", "Brushed brass buckle"],
    tags: ["leather", "accessories"],
  },
  {
    name: "Cotton Baseball Cap",
    slug: "cotton-baseball-cap",
    sku: "DS-ACC-002",
    category: "accessories-caps",
    collections: ["essentials", "best-sellers"],
    price: 35,
    colors: [
      { name: "Black", hex: "#161514", image: IMG.capBlack },
      { name: "Stone", hex: "#B8AFA0", image: IMG.capBlack },
    ],
    sizes: ONE_SIZE,
    image: IMG.capBlack,
    short: "A six-panel washed cotton cap with a curved brim.",
    description:
      "A classic six-panel cap in washed cotton twill with a curved brim, embroidered eyelets and an adjustable brass slider. Subtle DAYSHIFT embroidery at the back.",
    material: "100% cotton twill",
    care: "Hand wash cold. Air dry.",
    fit: "One size, adjustable.",
    features: ["Six-panel construction", "Adjustable brass slider"],
    tags: ["cap", "everyday"],
  },
  {
    name: "Wool Felt Hat",
    slug: "wool-felt-hat",
    sku: "DS-ACC-003",
    category: "accessories-hats",
    collections: ["seasonal-2026"],
    price: 68,
    colors: [
      { name: "Camel", hex: "#B08D62" },
      { name: "Black", hex: "#161514" },
    ],
    sizes: ["S/M", "L/XL"],
    image: IMG.capBlack,
    short: "A wide-brim wool felt hat with a grosgrain band.",
    description:
      "Blocked from 100% wool felt with a wide brim and a tonal grosgrain ribbon band. A considered finishing piece for cooler months.",
    material: "100% wool felt",
    care: "Spot clean. Store flat.",
    fit: "Two sizes with internal size tape.",
    features: ["Blocked wool felt", "Grosgrain band"],
    tags: ["hat", "wool"],
  },
  {
    name: "Classic Sneaker",
    slug: "classic-sneaker",
    sku: "DS-SHO-001",
    category: "shoes-sneakers",
    collections: ["best-sellers", "essentials"],
    price: 110,
    colors: [
      { name: "White", hex: "#F4F1EA", image: IMG.sneakerWhite },
      { name: "Black", hex: "#161514", image: IMG.sneakerWhite },
    ],
    sizes: SHOE_SIZES,
    image: IMG.sneakerWhite,
    short: "A minimal leather sneaker with a cupsole and clean lines.",
    description:
      "A low-profile sneaker in soft calf leather with a leather lining, waxed cotton laces and a vulcanised rubber cupsole. Padded collar and a removable footbed. Designed to go with everything.",
    material: "Calf leather upper, rubber sole",
    care: "Wipe clean with leather cream. Do not machine wash.",
    fit: "True to size, EU sizing.",
    features: ["Calf leather upper", "Vulcanised cupsole", "Removable footbed"],
    tags: ["footwear", "leather"],
    featured: true,
    lowStockSkuSize: "42",
  },
  {
    name: "Suede Loafer",
    slug: "suede-loafer",
    sku: "DS-SHO-002",
    category: "shoes-casual",
    collections: ["new-arrivals", "seasonal-2026"],
    price: 135,
    colors: [
      { name: "Tan", hex: "#9A6F4C", image: IMG.sneakerWhite },
      { name: "Black", hex: "#161514", image: IMG.sneakerWhite },
    ],
    sizes: SHOE_SIZES,
    image: IMG.sneakerWhite,
    short: "A soft suede penny loafer on a flexible leather sole.",
    description:
      "Hand-finished suede loafer with a traditional penny strap, unlined vamp for softness and a Blake-stitched leather sole. An easy smart-casual shoe.",
    material: "Suede upper, leather sole",
    care: "Brush with a suede brush. Protect with spray.",
    fit: "True to size, EU sizing.",
    features: ["Blake-stitched sole", "Unlined vamp"],
    tags: ["footwear", "suede"],
  },
  {
    name: "Leather Sandal",
    slug: "leather-sandal",
    sku: "DS-SHO-003",
    category: "shoes-sandals",
    collections: ["seasonal-2026"],
    price: 85,
    colors: [
      { name: "Black", hex: "#161514", image: IMG.sneakerWhite },
      { name: "Tan", hex: "#9A6F4C", image: IMG.sneakerWhite },
    ],
    sizes: SHOE_SIZES,
    image: IMG.sneakerWhite,
    short: "A two-strap leather sandal with a moulded footbed.",
    description:
      "Vegetable-tanned leather straps over a contoured, moulded footbed and a lightweight rubber outsole. Adjustable buckles at the ankle and instep.",
    material: "Vegetable-tanned leather, rubber outsole",
    care: "Wipe clean. Condition leather occasionally.",
    fit: "True to size, EU sizing.",
    features: ["Contoured footbed", "Adjustable buckles"],
    tags: ["footwear", "summer"],
  },
  {
    name: "Acetate Sunglasses",
    slug: "acetate-sunglasses",
    sku: "DS-ACC-004",
    category: "accessories-sunglasses",
    collections: ["new-arrivals", "limited-drops"],
    price: 75,
    colors: [
      { name: "Black", hex: "#161514", image: IMG.sunglasses },
      { name: "Tortoise", hex: "#6B4A2F", image: IMG.sunglasses },
    ],
    sizes: ONE_SIZE,
    image: IMG.sunglasses,
    short: "Hand-polished acetate frames with category 3 lenses.",
    description:
      "A classic square frame in Italian acetate, hand polished over several days. Category 3 CR-39 lenses with 100% UV400 protection and adjustable acetate temples.",
    material: "Italian acetate, CR-39 lenses",
    care: "Clean with the supplied cloth. Store in case.",
    fit: "One size. 52-20-145.",
    features: ["UV400 protection", "Category 3 lenses", "Italian acetate"],
    tags: ["eyewear", "summer"],
    featured: true,
  },
  {
    name: "Gold Hoop Earrings",
    slug: "gold-hoop-earrings",
    sku: "DS-ACC-005",
    category: "accessories-jewelry",
    collections: ["essentials", "best-sellers"],
    price: 45,
    colors: [{ name: "Gold", hex: "#C6A15B" }],
    sizes: ONE_SIZE,
    image: IMG.sunglasses,
    short: "Small 18k gold-plated hoops for everyday wear.",
    description:
      "A pair of 20mm hoops in recycled sterling silver with a thick 18k gold plating. Lightweight, hypoallergenic and designed to be worn daily.",
    material: "Recycled sterling silver, 18k gold plating",
    care: "Remove before swimming. Wipe with a soft cloth.",
    fit: "One size. 20mm diameter.",
    features: ["18k gold plating", "Recycled silver", "Hypoallergenic"],
    tags: ["jewellery", "gift"],
  },
  {
    name: "Ribbed Sock Pack",
    slug: "ribbed-sock-pack",
    sku: "DS-ACC-006",
    category: "accessories-socks",
    collections: ["essentials"],
    price: 22,
    colors: [
      { name: "White", hex: "#F4F1EA" },
      { name: "Black", hex: "#161514" },
    ],
    sizes: ["S/M", "L/XL"],
    image: IMG.capBlack,
    short: "Three pairs of ribbed organic cotton socks.",
    description:
      "A three-pack of crew socks in a soft organic cotton blend with a reinforced heel and toe. Ribbed leg for a secure fit.",
    material: "78% organic cotton, 20% recycled polyamide, 2% elastane",
    care: "Machine wash warm. Tumble dry low.",
    fit: "S/M (EU 36–41), L/XL (EU 42–46).",
    features: ["Three-pack", "Reinforced heel and toe"],
    tags: ["socks", "essentials"],
  },
  {
    name: "Bifold Wallet",
    slug: "bifold-wallet",
    sku: "DS-ACC-007",
    category: "accessories-wallets",
    collections: ["essentials"],
    price: 49,
    colors: [
      { name: "Black", hex: "#161514" },
      { name: "Tan", hex: "#9A6F4C" },
    ],
    sizes: ONE_SIZE,
    image: IMG.bagTote,
    short: "A slim bifold in vegetable-tanned leather.",
    description:
      "A compact bifold with six card slots, two note compartments and a hidden coin pocket. Made from vegetable-tanned leather that patinas with use.",
    material: "Vegetable-tanned leather",
    care: "Condition occasionally.",
    fit: "One size. 11cm × 9cm.",
    features: ["Six card slots", "Hidden coin pocket"],
    tags: ["leather", "gift"],
  },
  {
    name: "Oversized Denim Jacket",
    slug: "oversized-denim-jacket",
    sku: "DS-JKT-002",
    category: "women-jackets",
    collections: ["new-arrivals", "best-sellers"],
    price: 145,
    compareAt: 175,
    colors: [
      { name: "Indigo", hex: "#3B4A5A", image: IMG.jeansIndigo },
      { name: "Washed Black", hex: "#2A2927", image: IMG.jeansIndigo },
    ],
    sizes: APPAREL_SIZES,
    image: IMG.jeansIndigo,
    short: "A slouchy denim jacket in rigid organic cotton.",
    description:
      "Cut from 12oz rigid organic denim with a dropped shoulder, oversized body and a cropped hem. Classic trucker detailing with chest flap pockets and adjustable waist tabs.",
    material: "100% organic cotton denim, 12oz",
    care: "Machine wash cold inside out. Line dry.",
    fit: "Oversized fit.",
    features: ["Rigid organic denim", "Adjustable waist tabs"],
    tags: ["denim", "outerwear"],
    featured: true,
  },
  {
    name: "Unisex Track Pant",
    slug: "unisex-track-pant",
    sku: "DS-TRK-001",
    category: "unisex-streetwear",
    collections: ["new-arrivals", "limited-drops"],
    price: 72,
    colors: [
      { name: "Black", hex: "#161514", image: IMG.trousersTaupe },
      { name: "Heather Grey", hex: "#A8A5A0", image: IMG.trousersTaupe },
    ],
    sizes: APPAREL_SIZES,
    image: IMG.trousersTaupe,
    art: "trousers",
    short: "A relaxed track pant in brushed-back fleece.",
    description:
      "A relaxed track pant in 360gsm brushed fleece with an elasticated waist, internal drawcord and tapered leg. Side pockets and a single back pocket.",
    material: "80% organic cotton, 20% recycled polyester",
    care: "Machine wash cold. Tumble dry low.",
    fit: "Relaxed, tapered leg.",
    features: ["Brushed fleece", "Internal drawcord"],
    tags: ["streetwear", "fleece"],
  },
  {
    name: "Linen Blend Blouse",
    slug: "linen-blend-blouse",
    sku: "DS-BLS-001",
    category: "women-blouses",
    collections: ["new-arrivals"],
    price: 72,
    colors: [
      { name: "Chalk", hex: "#EFEBE2", image: IMG.shirtOat },
      { name: "Oat", hex: "#D6C9B4", image: IMG.shirtOat },
    ],
    sizes: APPAREL_SIZES,
    image: IMG.shirtOat,
    short: "A softly structured linen-blend blouse with a grandad collar.",
    description:
      "A lightweight linen-viscose blouse with a grandad collar, half placket and a softly gathered back yoke. The hem is curved and slightly longer at the back.",
    material: "55% linen, 45% LENZING™ ECOVERO™ viscose",
    care: "Machine wash cold. Line dry.",
    fit: "Relaxed fit.",
    features: ["Grandad collar", "Gathered back yoke"],
    tags: ["linen", "blouse"],
  },
  {
    name: "Graphic Tee — Day Off",
    slug: "graphic-tee-day-off",
    sku: "DS-TEE-004",
    category: "unisex-oversized-tees",
    collections: ["limited-drops"],
    price: 48,
    colors: [
      { name: "Washed Black", hex: "#1C1B19", image: IMG.teeBlack },
      { name: "Chalk", hex: "#EFEBE2", image: IMG.teeWhite },
    ],
    sizes: CORE_SIZES,
    image: IMG.teeBlack,
    short: "A limited screen-printed tee, made in small runs.",
    description:
      "Our heavyweight boxy tee with a hand-drawn 'Day Off' print, screen printed in a water-based ink for a soft, worn-in finish. Limited to 300 pieces.",
    material: "100% organic cotton, 240gsm",
    care: "Machine wash cold inside out. Do not iron print.",
    fit: "Boxy fit.",
    features: ["Limited to 300 pieces", "Water-based screen print"],
    tags: ["limited", "graphic"],
  },
  {
    name: "Suede Ankle Boot",
    slug: "suede-ankle-boot",
    sku: "DS-SHO-004",
    category: "shoes-casual",
    collections: ["seasonal-2026"],
    price: 155,
    colors: [
      { name: "Tan", hex: "#9A6F4C", image: IMG.sneakerWhite },
      { name: "Black", hex: "#161514", image: IMG.sneakerWhite },
    ],
    sizes: SHOE_SIZES,
    image: IMG.sneakerWhite,
    short: "A rounded suede ankle boot with a stacked leather heel.",
    description:
      "A softly constructed ankle boot in suede with a rounded toe, inside zip and a 35mm stacked leather heel. Leather lining and a cushioned insole.",
    material: "Suede upper, leather lining, leather sole",
    care: "Brush and protect with suede spray.",
    fit: "True to size, EU sizing.",
    features: ["Stacked leather heel", "Inside zip"],
    tags: ["footwear", "suede"],
  },
];

const categoryDefs: Array<{ name: string; slug: string; parent?: string; description?: string }> = [
  { name: "Women", slug: "women", description: "Considered everyday clothing for women." },
  { name: "T-Shirts", slug: "women-t-shirts", parent: "women" },
  { name: "Shirts", slug: "women-shirts", parent: "women" },
  { name: "Blouses", slug: "women-blouses", parent: "women" },
  { name: "Tops", slug: "women-tops", parent: "women" },
  { name: "Dresses", slug: "women-dresses", parent: "women" },
  { name: "Jackets", slug: "women-jackets", parent: "women" },
  { name: "Hoodies", slug: "women-hoodies", parent: "women" },
  { name: "Sweatshirts", slug: "women-sweatshirts", parent: "women" },
  { name: "Trousers", slug: "women-trousers", parent: "women" },
  { name: "Jeans", slug: "women-jeans", parent: "women" },
  { name: "Skirts", slug: "women-skirts", parent: "women" },
  { name: "Shorts", slug: "women-shorts", parent: "women" },
  { name: "Men", slug: "men", description: "Modern staples, built to last." },
  { name: "T-Shirts", slug: "men-t-shirts", parent: "men" },
  { name: "Shirts", slug: "men-shirts", parent: "men" },
  { name: "Polos", slug: "men-polos", parent: "men" },
  { name: "Jackets", slug: "men-jackets", parent: "men" },
  { name: "Hoodies", slug: "men-hoodies", parent: "men" },
  { name: "Sweatshirts", slug: "men-sweatshirts", parent: "men" },
  { name: "Trousers", slug: "men-trousers", parent: "men" },
  { name: "Jeans", slug: "men-jeans", parent: "men" },
  { name: "Shorts", slug: "men-shorts", parent: "men" },
  { name: "Unisex", slug: "unisex", description: "Shapes that work for everyone." },
  { name: "Oversized Tees", slug: "unisex-oversized-tees", parent: "unisex" },
  { name: "Hoodies", slug: "unisex-hoodies", parent: "unisex" },
  { name: "Sweatshirts", slug: "unisex-sweatshirts", parent: "unisex" },
  { name: "Streetwear", slug: "unisex-streetwear", parent: "unisex" },
  { name: "Essential Basics", slug: "unisex-essentials", parent: "unisex" },
  { name: "Shoes", slug: "shoes", description: "Footwear made for the everyday." },
  { name: "Sneakers", slug: "shoes-sneakers", parent: "shoes" },
  { name: "Casual Shoes", slug: "shoes-casual", parent: "shoes" },
  { name: "Sandals", slug: "shoes-sandals", parent: "shoes" },
  { name: "Bags", slug: "bags", description: "Carry less, carry better." },
  { name: "Shoulder Bags", slug: "bags-shoulder", parent: "bags" },
  { name: "Tote Bags", slug: "bags-tote", parent: "bags" },
  { name: "Crossbody Bags", slug: "bags-crossbody", parent: "bags" },
  { name: "Backpacks", slug: "bags-backpacks", parent: "bags" },
  { name: "Accessories", slug: "accessories", description: "The details that finish the look." },
  { name: "Caps", slug: "accessories-caps", parent: "accessories" },
  { name: "Hats", slug: "accessories-hats", parent: "accessories" },
  { name: "Belts", slug: "accessories-belts", parent: "accessories" },
  { name: "Wallets", slug: "accessories-wallets", parent: "accessories" },
  { name: "Socks", slug: "accessories-socks", parent: "accessories" },
  { name: "Sunglasses", slug: "accessories-sunglasses", parent: "accessories" },
  { name: "Jewelry", slug: "accessories-jewelry", parent: "accessories" },
];

const collectionDefs = [
  { name: "New Arrivals", slug: "new-arrivals", type: "NEW_ARRIVALS" as const, description: "Just landed — the newest pieces from the studio." },
  { name: "Best Sellers", slug: "best-sellers", type: "BEST_SELLERS" as const, description: "The pieces our customers come back for." },
  { name: "The Essentials", slug: "essentials", type: "EDITORIAL" as const, description: "Quiet, versatile pieces that form the base of a wardrobe." },
  { name: "Seasonal Edit", slug: "seasonal-2026", type: "SEASONAL" as const, description: "A considered edit for the season ahead." },
  { name: "Limited Drops", slug: "limited-drops", type: "LIMITED" as const, description: "Small runs. Once they're gone, they're gone." },
  { name: "Sale", slug: "sale", type: "SALE" as const, description: "Last pieces, reduced." },
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
    { email: "admin@dayshift.example", first: "Avery", last: "Sinclair", role: "SUPER_ADMIN", code: "DS-EMP-001", title: "Founder & Platform Admin", password: "Admin1234!Pass" },
    { email: "manager@dayshift.example", first: "Morgan", last: "Reed", role: "STORE_MANAGER", code: "DS-EMP-002", title: "Store Manager", password: "Manager1234!Pass" },
    { email: "warehouse@dayshift.example", first: "Jordan", last: "Okafor", role: "WAREHOUSE_STAFF", code: "DS-EMP-003", title: "Warehouse Associate", password: "Warehouse1234!Pass" },
    { email: "support@dayshift.example", first: "Riley", last: "Chen", role: "CUSTOMER_SUPPORT", code: "DS-EMP-004", title: "Customer Support", password: "Support1234!Pass" },
    { email: "analyst@dayshift.example", first: "Sam", last: "Patel", role: "ANALYST", code: "DS-EMP-005", title: "Business Analyst", password: "Analyst1234!Pass" },
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
    { email: "customer@dayshift.example", first: "Elena", last: "Marchetti", password: "Customer1234!Pass", segment: "High-value", tags: ["loyalty", "womenswear"] },
    { email: "james@example.com", first: "James", last: "Whitfield", password: "Customer1234!Pass", segment: "Returning", tags: ["menswear"] },
    { email: "nora@example.com", first: "Nora", last: "Haddad", password: "Customer1234!Pass", segment: "New", tags: [] },
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
        phone: "+1 555 0100",
        customerProfile: { create: { segment: c.segment, tags: c.tags, marketingOptIn: true } },
        loyaltyAccount: {
          create: {
            pointsBalance: c.email.startsWith("customer") ? 840 : c.email.startsWith("james") ? 320 : 0,
            lifetimePoints: c.email.startsWith("customer") ? 2140 : c.email.startsWith("james") ? 620 : 0,
            tier: c.email.startsWith("customer") ? "GOLD" : c.email.startsWith("james") ? "SILVER" : "BRONZE",
          },
        },
        addresses: {
          create: [
            {
              label: "Home",
              firstName: c.first,
              lastName: c.last,
              line1: "44 Court Street",
              line2: "Apt 3B",
              city: "Brooklyn",
              state: "NY",
              postalCode: "11201",
              country: "US",
              phone: "+1 555 0100",
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
    where: { code: "BK1" },
    update: {},
    create: {
      name: "Brooklyn Fulfilment",
      code: "BK1",
      line1: "12 Wythe Avenue",
      city: "Brooklyn",
      state: "NY",
      postalCode: "11249",
      country: "US",
      isDefault: true,
    },
  });
  const westWarehouse = await prisma.warehouse.upsert({
    where: { code: "LA1" },
    update: {},
    create: {
      name: "Los Angeles Studio",
      code: "LA1",
      line1: "800 Mateo Street",
      city: "Los Angeles",
      state: "CA",
      postalCode: "90021",
      country: "US",
    },
  });

  const supplier = await prisma.supplier.upsert({
    where: { code: "SUP-001" },
    update: {},
    create: {
      name: "Atelier Textiles",
      code: "SUP-001",
      contactName: "Camille Roux",
      email: "orders@atelier-textiles.example",
      phone: "+1 555 0188",
      address: "Paris, France",
      notes: "Primary knitwear and shirting supplier.",
    },
  });
  const supplier2 = await prisma.supplier.upsert({
    where: { code: "SUP-002" },
    update: {},
    create: {
      name: "Northline Leather",
      code: "SUP-002",
      contactName: "Marco Bellini",
      email: "trade@northline.example",
      address: "Florence, Italy",
    },
  });

  // ── Categories ─────────────────────────────────────────────────────────
  const categoryIds = new Map<string, string>();
  for (const [index, c] of categoryDefs.entries()) {
    const parentId = c.parent ? categoryIds.get(c.parent) : null;
    const cat = await prisma.category.upsert({
      where: { slug: c.slug },
      update: { name: c.name, parentId: parentId ?? null, position: index },
      create: {
        name: c.name,
        slug: c.slug,
        description: c.description,
        parentId: parentId ?? null,
        position: index,
        isActive: true,
        metaTitle: `${c.name} — DAYSHIFT`,
        metaDescription: c.description ?? `Shop ${c.name.toLowerCase()} at DAYSHIFT.`,
        imageUrl: c.slug === "women" ? "/art/knit-oat.svg" : c.slug === "men" ? IMG.editorial2 : c.slug === "shoes" ? "/art/sneaker-white.svg" : c.slug === "bags" ? "/art/bag-tan.svg" : c.slug === "accessories" ? "/art/sunglasses-black.svg" : undefined,
      },
    });
    categoryIds.set(c.slug, cat.id);
  }

  const brands = new Map<string, string>();
  for (const b of [
    { name: "DAYSHIFT", slug: "dayshift", description: "Our own studio label. Everyday pieces, made properly." },
    { name: "Northline", slug: "northline", description: "A small leather workshop in Florence." },
    { name: "Atelier Nine", slug: "atelier-nine", description: "Considered accessories in natural materials." },
  ]) {
    const brand = await prisma.brand.upsert({ where: { slug: b.slug }, update: {}, create: b });
    brands.set(b.slug, brand.id);
  }

  const collectionIds = new Map<string, string>();
  for (const [index, c] of collectionDefs.entries()) {
    const col = await prisma.collection.upsert({
      where: { slug: c.slug },
      update: {},
      create: {
        name: c.name,
        slug: c.slug,
        description: c.description,
        type: c.type,
        position: index,
        isActive: true,
        imageUrl: c.slug === "new-arrivals" ? IMG.editorial3 : c.slug === "best-sellers" ? IMG.editorial1 : c.slug === "seasonal-2026" ? "/art/jacket-taupe.svg" : c.slug === "limited-drops" ? "/art/tee-washed-black.svg" : undefined,
        startsAt: c.slug === "seasonal-2026" ? new Date("2026-09-01T00:00:00Z") : undefined,
      },
    });
    collectionIds.set(c.slug, col.id);
  }

  const sizeGuideWomen = await prisma.sizeGuide.create({
    data: {
      name: "Women's clothing",
      categoryId: categoryIds.get("women")!,
      notes: "Measurements in centimetres. Model is 175cm and wears size S.",
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
      name: "Men's clothing",
      categoryId: categoryIds.get("men")!,
      notes: "Measurements in centimetres. Model is 187cm and wears size M.",
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
      name: "Footwear",
      categoryId: categoryIds.get("shoes")!,
      notes: "EU sizing. If you are between sizes, take the larger size.",
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
            alt: `${def.name} in ${color.name}`,
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
      title: "Everyday style. Your way.",
      subtitle: "New season essentials",
      body: "Considered clothing and accessories for the days that make up a life. Made in small runs, built to be worn.",
      imageUrl: IMG.editorial1,
      ctaLabel: "Shop new arrivals",
      ctaUrl: "/collections/new-arrivals",
      status: "PUBLISHED" as const,
      position: 0,
    },
    {
      key: "home.editorial.women",
      title: "The soft tailoring edit",
      subtitle: "Women",
      body: "Clean lines, natural fibres and a palette that works together.",
      imageUrl: IMG.editorial1,
      ctaLabel: "Shop women",
      ctaUrl: "/c/women",
      status: "PUBLISHED" as const,
      position: 1,
    },
    {
      key: "home.editorial.men",
      title: "Built for the everyday",
      subtitle: "Men",
      body: "Relaxed shirting, honest denim and outerwear that earns its place.",
      imageUrl: IMG.editorial3,
      ctaLabel: "Shop men",
      ctaUrl: "/c/men",
      status: "PUBLISHED" as const,
      position: 2,
    },
    {
      key: "home.campaign.seasonal",
      title: "The Seasonal Edit",
      subtitle: "Autumn 2026",
      body: "Layer up in brushed cotton, fine merino and softened denim.",
      imageUrl: "/art/dress-stone.svg",
      ctaLabel: "Explore the edit",
      ctaUrl: "/collections/seasonal-2026",
      status: "PUBLISHED" as const,
      position: 3,
    },
    {
      key: "announcement.bar",
      title: "Complimentary standard delivery over $150",
      body: "Free returns within 30 days.",
      status: "PUBLISHED" as const,
      position: 0,
    },
  ];
  for (const c of content) {
    await prisma.contentBlock.upsert({ where: { key: c.key }, update: {}, create: c });
  }

  const nav = [
    { label: "WOMEN", url: "/c/women" },
    { label: "MEN", url: "/c/men" },
    { label: "UNISEX", url: "/c/unisex" },
    { label: "SHOES", url: "/c/shoes" },
    { label: "BAGS", url: "/c/bags" },
    { label: "ACCESSORIES", url: "/c/accessories" },
    { label: "NEW ARRIVALS", url: "/collections/new-arrivals" },
    { label: "SALE", url: "/collections/sale" },
  ];
  for (const [i, n] of nav.entries()) {
    const existingNav = await prisma.navigationItem.findFirst({ where: { label: n.label, parentId: null } });
    if (!existingNav) {
      await prisma.navigationItem.create({ data: { ...n, position: i } });
    }
  }

  // ── Coupons & promotions ────────────────────────────────────────────────
  const now = new Date("2026-11-20T00:00:00Z");
  const coupons = [
    { code: "WELCOME10", description: "10% off your first order", type: "PERCENTAGE" as const, value: 10, minOrderSubtotal: 0, firstOrderOnly: true, usageLimitPerCustomer: 1, usageLimitTotal: 10000, startsAt: new Date("2026-01-01"), endsAt: new Date("2027-12-31") },
    { code: "DAYSHIFT15", description: "15% off orders over $120", type: "PERCENTAGE" as const, value: 15, minOrderSubtotal: 120, maxDiscount: 60, usageLimitPerCustomer: 3, startsAt: new Date("2026-09-01"), endsAt: new Date("2027-03-31") },
    { code: "STYLE20", description: "20% off selected sale styles", type: "PERCENTAGE" as const, value: 20, minOrderSubtotal: 80, maxDiscount: 50, usageLimitPerCustomer: 2, startsAt: new Date("2026-11-01"), endsAt: new Date("2027-01-31") },
    { code: "FLAT25", description: "$25 off orders over $150", type: "FIXED" as const, value: 25, minOrderSubtotal: 150, usageLimitPerCustomer: 1, startsAt: new Date("2026-10-01"), endsAt: new Date("2027-06-30") },
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
      name: "Seasonal Edit — women's outerwear",
      description: "15% off women's jackets",
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
      name: "Essentials — 10% off",
      description: "10% off the essentials collection",
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
    firstName: "Elena",
    lastName: "Marchetti",
    line1: "44 Court Street",
    line2: "Apt 3B",
    city: "Brooklyn",
    state: "NY",
    postalCode: "11201",
    country: "US",
    phone: "+1 555 0100",
  };
  const shipping = {
    firstName: "Elena",
    lastName: "Marchetti",
    addressLine1: "44 Court Street",
    addressLine2: "Apt 3B",
    city: "Brooklyn",
    region: "NY",
    postalCode: "11201",
    country: "US",
    phone: "+1 555 0100",
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
    const ship = opts.shippingTotal ?? (subtotal - discount >= 150 ? 0 : 7.95);
    const tax = Math.round((subtotal - discount) * 0.08 * 100) / 100;
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
              ? [{ toStatus: "CANCELLED" as const, fromStatus: "PENDING_PAYMENT" as const, actorType: "CUSTOMER" as const, reason: "Changed mind", createdAt: new Date(placedAt.getTime() + 3_600_000) }]
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
          carrier: "Northline Express",
          service: "Standard",
          trackingNumber: opts.shipment.tracking,
          status: opts.shipment.status,
          shippedAt: new Date(placedAt.getTime() + 2 * 86_400_000),
          estimatedDelivery: new Date(placedAt.getTime() + 6 * 86_400_000),
        },
      });
      await prisma.shipmentEvent.createMany({
        data: [
          { shipmentId: shipment.id, status: "READY_TO_SHIP", description: "Shipment created", occurredAt: new Date(placedAt.getTime() + 1 * 86_400_000) },
          ...(opts.shipment.status !== "READY_TO_SHIP"
            ? [{ shipmentId: shipment.id, status: "IN_TRANSIT" as const, description: "Parcel in transit", location: "Brooklyn, NY", occurredAt: new Date(placedAt.getTime() + 3 * 86_400_000) }]
            : []),
          ...(opts.shipment.status === "DELIVERED"
            ? [{ shipmentId: shipment.id, status: "DELIVERED" as const, description: "Delivered to recipient", location: "Brooklyn, NY", occurredAt: new Date(placedAt.getTime() + 5 * 86_400_000) }]
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
          title: "Exactly what I wanted",
          body: "The fabric is substantial and the fit is just as described. It has quickly become the piece I reach for most days.",
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
    shipment: { status: "DELIVERED", tracking: "NLE-8841-2200-19" },
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
    shipment: { status: "IN_TRANSIT", tracking: "NLE-8841-3310-82" },
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
    discountTotal: 27,
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
    userId: customers["james@example.com"].id,
    email: "james@example.com",
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
    userId: customers["james@example.com"].id,
    email: "james@example.com",
    lines: [{ slug: "mens-fleece-hoodie", color: "Heather Grey", size: "L", qty: 1 }],
    status: "CANCELLED",
    paymentStatus: "FAILED",
    daysAgo: 40,
  });

  // Guest order awaiting fulfillment
  await makeOrder({
    number: "DS-20261118-000388",
    email: "nora@example.com",
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
      customerNote: "The tee is a little too oversized for me. Could I exchange the M for an S?",
      items: {
        create: [
          {
            orderItemId: teeItem.id,
            quantity: 1,
            reason: "WRONG_SIZE",
            conditionNotes: "Unworn, tags attached",
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
      subject: "Exchange sizing question",
      description: "I submitted an exchange for the Everyday Tee. Will the replacement ship before the weekend?",
      priority: "NORMAL",
      status: "IN_PROGRESS",
      assignedToId: staff.CUSTOMER_SUPPORT.id,
    },
  });
  await prisma.ticketMessage.createMany({
    data: [
      { ticketId: ticket.id, authorType: "CUSTOMER", authorId: customerId, body: "I submitted an exchange for the Everyday Tee. Will the replacement ship before the weekend?", createdAt: new Date(now.getTime() - 2 * 86_400_000) },
      { ticketId: ticket.id, authorType: "STAFF", authorId: staff.CUSTOMER_SUPPORT.id, body: "Thanks Elena — once the return is inspected we'll ship the replacement the same day. I'll keep you posted here.", createdAt: new Date(now.getTime() - 1 * 86_400_000) },
      { ticketId: ticket.id, authorType: "STAFF", authorId: staff.CUSTOMER_SUPPORT.id, body: "Internal: exchange stock checked at BK1, size S available.", isInternal: true, createdAt: new Date(now.getTime() - 1 * 86_400_000 + 3600_000) },
    ],
  });

  await prisma.supportTicket.create({
    data: {
      ticketNumber: "TKT-100242",
      userId: customers["james@example.com"].id,
      subject: "Delivery address change",
      description: "Can I change the delivery address on my packed order?",
      priority: "HIGH",
      status: "OPEN",
    },
  });

  // Approved reviews across the catalogue
  const reviewCopy = [
    { slug: "relaxed-linen-shirt", rating: 5, title: "The linen shirt I was looking for", body: "Beautiful weight and the oat colour is exactly as photographed. It creases in the way good linen should." },
    { slug: "leather-tote", rating: 5, title: "Ages beautifully", body: "I've carried this every day for a month and the leather has already started to soften. Holds a laptop and a water bottle easily." },
    { slug: "classic-sneaker", rating: 4, title: "Very comfortable", body: "Clean shape and comfortable from the first wear. I went true to size and it fits well with a thin sock." },
    { slug: "straight-leg-jeans", rating: 5, title: "The perfect straight leg", body: "Rigid denim that doesn't stretch out. The high rise is comfortable and the length works with flats." },
    { slug: "everyday-hoodie", rating: 5, title: "Substantial and soft", body: "Much heavier than I expected in the best way. The inside is brushed and it has held its shape through several washes." },
    { slug: "silk-blend-slip-dress", rating: 4, title: "Lovely drape", body: "The stone colour is a warm grey-beige and the bias cut is flattering. I sized up for a slightly looser fit." },
    { slug: "structured-blazer", rating: 5, title: "Worth the investment", body: "The shoulder line is clean without being stiff, and the cupro lining makes it easy to layer." },
  ];
  for (const [i, r] of reviewCopy.entries()) {
    const reviewer = i % 2 === 0 ? customerId : customers["james@example.com"].id;
    await prisma.review.create({
      data: {
        productId: productIds.get(r.slug)!,
        userId: reviewer,
        rating: r.rating,
        title: r.title,
        body: r.body,
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
      subtotal: d(2400),
      notes: "Restock of heavyweight tees for the holiday period.",
      createdById: staff.SUPER_ADMIN.id,
      items: {
        create: [
          { variantId: variantIds.get("the-everyday-oversized-tee|Optic White|M")!, quantity: 60, unitCost: d(14) },
          { variantId: variantIds.get("the-everyday-oversized-tee|Washed Black|M")!, quantity: 60, unitCost: d(14) },
        ],
      },
    },
  });
  void po;

  // ── Settings ───────────────────────────────────────────────────────────
  const settings: Array<{ key: string; value: Prisma.InputJsonValue }> = [
    { key: "store", value: { name: "DAYSHIFT", tagline: "Everyday style. Your way.", email: "hello@dayshift.example", phone: "+1 555 0100", address: "12 Wythe Avenue, Brooklyn, NY" } },
    { key: "tax", value: { rate: 0.08, inclusive: false, label: "Estimated sales tax" } },
    { key: "shipping", value: { standardPrice: 7.95, standardFreeOver: 150, expressPrice: 14.95 } },
    { key: "returns", value: { windowDays: 30, freeReturns: true, finalSaleReturnable: false } },
    { key: "loyalty", value: { pointsPerDollar: 1, centsPerPoint: 5, minRedeemPoints: 100, earnOnShipping: false } },
    { key: "payments", value: { provider: "sandbox", currency: "USD", cashOnDelivery: true } },
    { key: "notifications", value: { orderEmails: true, marketingEmails: true, lowStockAlerts: true } },
    { key: "features", value: { guestCheckout: true, reviewsRequirePurchase: true, wishlistForGuests: false } },
  ];
  for (const s of settings) {
    await prisma.setting.upsert({ where: { key: s.key }, update: { value: s.value }, create: s });
  }

  await prisma.newsletterSubscriber.upsert({
    where: { email: "insider@example.com" },
    update: {},
    create: { email: "insider@example.com", source: "homepage", confirmedAt: new Date() },
  });

  // A few in-app notifications for the support and admin queues
  await prisma.notification.createMany({
    data: [
      { userId: customerId, channel: "IN_APP", template: "order.shipped", subject: "Your order has shipped", body: "Order DS-20261003-000228 is on its way.", status: "SENT", sentAt: new Date(now.getTime() - 4 * 86_400_000) },
      { userId: customerId, channel: "IN_APP", template: "return.received", subject: "Return request received", body: "We've received your exchange request and will review it shortly.", status: "SENT", sentAt: new Date(now.getTime() - 2 * 86_400_000) },
      { userId: customerId, channel: "EMAIL", email: "customer@dayshift.example", template: "loyalty.tier", subject: "You've reached Gold", body: "You now earn 1.5 points per dollar.", status: "SENT", sentAt: new Date(now.getTime() - 20 * 86_400_000) },
    ],
  });

  await prisma.auditLog.createMany({
    data: [
      { actorType: "STAFF", actorId: staff.SUPER_ADMIN.id, actorEmail: "admin@dayshift.example", action: "product.created", entityType: "Product", entityId: productIds.get("the-everyday-oversized-tee"), after: { name: "The Everyday Oversized Tee" }, createdAt: new Date(now.getTime() - 30 * 86_400_000) },
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
