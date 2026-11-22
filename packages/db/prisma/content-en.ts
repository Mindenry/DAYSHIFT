/** English copy for seeded taxonomy, merchandising and customer reviews. */
export const categoryEn: Record<string, { name: string; description?: string }> = {
  women: { name: "Women", description: "Considered everyday clothing for women." },
  "women-t-shirts": { name: "T-Shirts" },
  "women-shirts": { name: "Shirts" },
  "women-blouses": { name: "Blouses" },
  "women-tops": { name: "Tops" },
  "women-dresses": { name: "Dresses" },
  "women-jackets": { name: "Jackets" },
  "women-hoodies": { name: "Hoodies" },
  "women-sweatshirts": { name: "Sweatshirts" },
  "women-trousers": { name: "Trousers" },
  "women-jeans": { name: "Jeans" },
  "women-skirts": { name: "Skirts" },
  "women-shorts": { name: "Shorts" },
  men: { name: "Men", description: "Modern staples, built to last." },
  "men-t-shirts": { name: "T-Shirts" },
  "men-shirts": { name: "Shirts" },
  "men-polos": { name: "Polos" },
  "men-jackets": { name: "Jackets" },
  "men-hoodies": { name: "Hoodies" },
  "men-sweatshirts": { name: "Sweatshirts" },
  "men-trousers": { name: "Trousers" },
  "men-jeans": { name: "Jeans" },
  "men-shorts": { name: "Shorts" },
  unisex: { name: "Unisex", description: "Shapes that work for everyone." },
  "unisex-oversized-tees": { name: "Oversized Tees" },
  "unisex-hoodies": { name: "Hoodies" },
  "unisex-sweatshirts": { name: "Sweatshirts" },
  "unisex-streetwear": { name: "Streetwear" },
  "unisex-essentials": { name: "Essential Basics" },
  shoes: { name: "Shoes", description: "Footwear made for the everyday." },
  "shoes-sneakers": { name: "Sneakers" },
  "shoes-casual": { name: "Casual Shoes" },
  "shoes-sandals": { name: "Sandals" },
  bags: { name: "Bags", description: "Carry less, carry better." },
  "bags-shoulder": { name: "Shoulder Bags" },
  "bags-tote": { name: "Tote Bags" },
  "bags-crossbody": { name: "Crossbody Bags" },
  "bags-backpacks": { name: "Backpacks" },
  accessories: { name: "Accessories", description: "The details that finish the look." },
  "accessories-caps": { name: "Caps" },
  "accessories-hats": { name: "Hats" },
  "accessories-belts": { name: "Belts" },
  "accessories-wallets": { name: "Wallets" },
  "accessories-socks": { name: "Socks" },
  "accessories-sunglasses": { name: "Sunglasses" },
  "accessories-jewelry": { name: "Jewelry" },
};

export const collectionEn: Record<string, { name: string; description: string }> = {
  "new-arrivals": { name: "New Arrivals", description: "Just landed — the newest pieces from the studio." },
  "best-sellers": { name: "Best Sellers", description: "The pieces our customers come back for." },
  essentials: { name: "The Essentials", description: "Quiet, versatile pieces that form the base of a wardrobe." },
  "seasonal-2026": { name: "Seasonal Edit", description: "A considered edit for the season ahead." },
  "limited-drops": { name: "Limited Drops", description: "Small runs. Once they're gone, they're gone." },
  sale: { name: "Sale", description: "Last pieces, reduced." },
};

export const brandEn: Record<string, string> = {
  dayshift: "Our own studio label. Everyday pieces, made properly.",
  northline: "A small leather workshop in Chiang Mai, finishing every piece by hand.",
  "atelier-nine": "Considered accessories in natural materials.",
};

export const contentEn: Record<string, { title?: string; subtitle?: string; body?: string; ctaLabel?: string }> = {
  "home.hero": {
    title: "Everyday style. Your way.",
    subtitle: "New season essentials",
    body: "Considered clothing and accessories for the days that make up a life. Made in small runs, built to be worn.",
    ctaLabel: "Shop new arrivals",
  },
  "home.editorial.women": {
    title: "The soft tailoring edit",
    subtitle: "Women",
    body: "Clean lines, natural fibres and a palette that works together.",
    ctaLabel: "Shop women",
  },
  "home.editorial.men": {
    title: "Built for the everyday",
    subtitle: "Men",
    body: "Relaxed shirting, honest denim and outerwear that earns its place.",
    ctaLabel: "Shop men",
  },
  "home.campaign.seasonal": {
    title: "The Seasonal Edit",
    subtitle: "Late rain, early cool 2026",
    body: "Layer up in brushed cotton, fine merino and softened denim.",
    ctaLabel: "Explore the edit",
  },
  "announcement.bar": {
    title: "Complimentary standard delivery over ฿1,500",
    body: "Free returns within 30 days.",
  },
};

export const navEn: Record<string, string> = {
  "/c/women": "Women",
  "/c/men": "Men",
  "/c/unisex": "Unisex",
  "/c/shoes": "Shoes",
  "/c/bags": "Bags",
  "/c/accessories": "Accessories",
  "/collections/new-arrivals": "New arrivals",
  "/collections/sale": "Sale",
};

export const sizeGuideEn: Record<string, { name: string; notes: string }> = {
  women: { name: "Women's clothing", notes: "Measurements in centimetres. Model is 175cm and wears size S." },
  men: { name: "Men's clothing", notes: "Measurements in centimetres. Model is 187cm and wears size M." },
  shoes: { name: "Footwear", notes: "EU sizing. If you are between sizes, take the larger size." },
};

export const reviewEn: Record<string, { title: string; body: string }> = {
  "the-everyday-oversized-tee": {
    title: "Exactly what I wanted",
    body: "The fabric is substantial and the fit is just as described. It has quickly become the piece I reach for most days.",
  },
  "relaxed-linen-shirt": {
    title: "The linen shirt I was looking for",
    body: "Beautiful weight and the oat colour is exactly as photographed. It creases in the way good linen should.",
  },
  "leather-tote": {
    title: "Ages beautifully",
    body: "I have carried this every day for a month and the leather has already started to soften. It holds a laptop and a water bottle easily.",
  },
  "classic-sneaker": {
    title: "Very comfortable",
    body: "Clean shape and comfortable from the first wear. I went true to size and it fits well with a thin sock.",
  },
  "straight-leg-jeans": {
    title: "The perfect straight leg",
    body: "Rigid denim that does not stretch out. The high rise is comfortable and the length works with flats.",
  },
  "everyday-hoodie": {
    title: "Substantial and soft",
    body: "Much heavier than I expected in the best way. The inside is brushed and it has held its shape through several washes.",
  },
  "silk-blend-slip-dress": {
    title: "Lovely drape",
    body: "The stone colour is a warm grey-beige and the bias cut is flattering. I sized up for a slightly looser fit.",
  },
  "structured-blazer": {
    title: "Worth the investment",
    body: "The shoulder line is clean without being stiff, and the cupro lining makes it easy to layer.",
  },
};
