/**
 * English source copy for the demo catalogue, kept alongside the Thai content.
 * Only text fields are used; pricing, colours and sizes come from catalog-th.ts.
 */
export interface ProductEn {
  name: string | null;
  short: string | null;
  description: string | null;
  material: string | null;
  care: string | null;
  fit: string | null;
  features: string[];
  tags: string[];
}

export const productsEn: Record<string, ProductEn> = {
  "the-everyday-oversized-tee": {
    "name": "The Everyday Oversized Tee",
    "short": "The tee we build every collection around — boxy, weighty, endlessly wearable.",
    "description": "Cut from 240gsm combed organic cotton with a dropped shoulder and a boxy body, The Everyday Oversized Tee holds its shape wash after wash. The collar is ribbed and reinforced, the hem is straight, and the finish is garment-washed for softness from the first wear. Designed to sit at the hip with wide trousers or tuck into denim.",
    "material": "100% organic combed cotton, 240gsm",
    "care": "Machine wash cold with like colours. Do not bleach. Tumble dry low. Warm iron if needed.",
    "fit": "Oversized fit. Take your usual size for the intended silhouette, or size down for a closer fit.",
    "features": [
      "240gsm heavyweight jersey",
      "Dropped shoulder",
      "Ribbed reinforced collar",
      "Garment washed"
    ],
    "tags": [
      "organic cotton",
      "everyday",
      "unisex"
    ]
  },
  "classic-cotton-tee": {
    "name": "Classic Cotton Tee",
    "short": "A clean, regular-fit cotton tee with a soft hand feel.",
    "description": "A regular-fit crew neck in 180gsm organic cotton. Clean shoulder line, mid-weight body and a smooth hand feel that layers easily under shirts and knitwear. Pre-shrunk and garment dyed in small batches.",
    "material": "100% organic cotton, 180gsm",
    "care": "Machine wash cold. Tumble dry low.",
    "fit": "Regular fit, true to size.",
    "features": [
      "Pre-shrunk",
      "Garment dyed",
      "Reinforced neck tape"
    ],
    "tags": [
      "essentials",
      "cotton"
    ]
  },
  "heavyweight-boxy-tee": {
    "name": "Heavyweight Boxy Tee",
    "short": "A structured, boxy tee in dense 300gsm cotton.",
    "description": "Our heaviest jersey, built with a wide body, short sleeve and a firm collar that stands up on its own. The surface is brushed for a dry, substantial hand feel. A layering piece that reads as outerwear in summer.",
    "material": "100% organic cotton, 300gsm",
    "care": "Machine wash cold inside out. Dry flat.",
    "fit": "Boxy oversized fit.",
    "features": [
      "300gsm compact jersey",
      "Firm rib collar",
      "Side-seam construction"
    ],
    "tags": [
      "streetwear",
      "heavyweight"
    ]
  },
  "relaxed-linen-shirt": {
    "name": "Relaxed Linen Shirt",
    "short": "A breathable European linen shirt with an easy, borrowed silhouette.",
    "description": "Woven from 100% European flax linen and garment washed for a lived-in softness. Cut with a relaxed body, dropped shoulder and a curved hem that works tucked or loose. Corozo buttons and a single patch pocket finish it.",
    "material": "100% European flax linen",
    "care": "Machine wash cold. Line dry. Warm iron while slightly damp.",
    "fit": "Relaxed fit. Size down for a neater shape.",
    "features": [
      "Garment washed linen",
      "Corozo buttons",
      "Curved hem",
      "Patch pocket"
    ],
    "tags": [
      "linen",
      "summer",
      "natural fibre"
    ]
  },
  "poplin-oversized-shirt": {
    "name": "Poplin Oversized Shirt",
    "short": "Crisp cotton poplin with a generous, architectural cut.",
    "description": "A wardrobe workhorse in compact cotton poplin with a dry, crisp finish. Extended cuffs, a deep back pleat and a longline hem make it equally at home over a slip dress or with tailored trousers.",
    "material": "100% cotton poplin",
    "care": "Machine wash cold. Hang dry. Iron on medium.",
    "fit": "Oversized fit.",
    "features": [
      "Compact poplin",
      "Extended cuff",
      "Back pleat"
    ],
    "tags": [
      "shirting",
      "workwear"
    ]
  },
  "silk-blend-slip-dress": {
    "name": "Silk-Blend Slip Dress",
    "short": "A bias-cut slip in a fluid silk blend that moves with you.",
    "description": "Cut on the bias for a close, fluid drape, this midi slip has adjustable straps, a soft V neckline and a French seam finish. The silk-viscose blend catches the light without clinging. Wear alone in warm weather or layered under knitwear.",
    "material": "60% silk, 40% LENZING™ ECOVERO™ viscose",
    "care": "Dry clean or hand wash cold. Dry flat in shade.",
    "fit": "True to size, bias cut. Midi length.",
    "features": [
      "Bias cut",
      "Adjustable straps",
      "French seams"
    ],
    "tags": [
      "silk",
      "occasion",
      "midi"
    ]
  },
  "ribbed-midi-dress": {
    "name": "Ribbed Midi Dress",
    "short": "A body-skimming rib knit dress with a square neck.",
    "description": "Knitted from a fine organic cotton rib with plenty of stretch and recovery. The square neckline and wide straps frame the shoulders, while the midi length keeps it refined. An everyday dress that travels well.",
    "material": "95% organic cotton, 5% elastane",
    "care": "Machine wash cold. Dry flat.",
    "fit": "Slim fit, stretch rib.",
    "features": [
      "Square neck",
      "Stretch rib",
      "Midi length"
    ],
    "tags": [
      "knit",
      "everyday"
    ]
  },
  "structured-blazer": {
    "name": "Structured Blazer",
    "short": "A single-breasted blazer with a clean shoulder and soft construction.",
    "description": "Tailored in a wool-blend suiting cloth with a half-canvas front, notch lapel and a two-button closure. The shoulder is lightly padded, the body is fully lined in cupro, and the pockets are functional. Sharp enough for work, relaxed enough for the weekend.",
    "material": "68% wool, 30% polyester, 2% elastane; cupro lining",
    "care": "Dry clean only.",
    "fit": "Relaxed tailored fit.",
    "features": [
      "Half-canvas construction",
      "Notch lapel",
      "Functional pockets",
      "Cupro lining"
    ],
    "tags": [
      "tailoring",
      "workwear",
      "wool"
    ]
  },
  "everyday-hoodie": {
    "name": "Everyday Hoodie",
    "short": "A brushed-back fleece hoodie with a substantial, lived-in feel.",
    "description": "Made from 420gsm brushed-back organic cotton fleece, with a double-layer hood, kangaroo pocket and ribbed cuffs and hem. The fit is relaxed without drowning you. Garment washed to soften the seams.",
    "material": "80% organic cotton, 20% recycled polyester, 420gsm",
    "care": "Machine wash cold inside out. Tumble dry low.",
    "fit": "Relaxed fit.",
    "features": [
      "420gsm brushed fleece",
      "Double-layer hood",
      "Kangaroo pocket"
    ],
    "tags": [
      "fleece",
      "everyday",
      "unisex"
    ]
  },
  "french-terry-sweatshirt": {
    "name": "French Terry Sweatshirt",
    "short": "A loopback French terry crew with a clean, boxy cut.",
    "description": "Loopback French terry in a mid weight, with a ribbed crew neck, set-in sleeves and a straight hem. An easy layer that works over a tee or under a coat.",
    "material": "100% organic cotton, 340gsm",
    "care": "Machine wash cold. Dry flat.",
    "fit": "Relaxed fit.",
    "features": [
      "Loopback terry",
      "Ribbed neck",
      "Set-in sleeve"
    ],
    "tags": [
      "terry",
      "essentials"
    ]
  },
  "straight-leg-jeans": {
    "name": "Straight-Leg Jeans",
    "short": "A high-rise straight jean in rigid organic denim.",
    "description": "Cut from 12.5oz rigid organic cotton denim with a high rise, straight leg and a full-length inseam. The waistband is contoured, the pockets are reinforced, and the finish is a clean mid-indigo rinse.",
    "material": "100% organic cotton denim, 12.5oz",
    "care": "Machine wash cold inside out. Line dry.",
    "fit": "High rise, straight leg. True to size.",
    "features": [
      "Rigid organic denim",
      "High rise",
      "Reinforced pockets"
    ],
    "tags": [
      "denim",
      "everyday"
    ]
  },
  "wide-leg-trousers": {
    "name": "Wide-Leg Trousers",
    "short": "Fluid, high-waisted trousers with a long, clean line.",
    "description": "Tailored in a drapey lyocell-wool blend with a high waist, pressed crease and a wide leg that falls to the floor. Hook-and-bar closure, belt loops and side seam pockets. Dress them up with a blazer or down with a tee.",
    "material": "70% lyocell, 30% wool",
    "care": "Dry clean or hand wash cold.",
    "fit": "High waist, wide leg. Long inseam.",
    "features": [
      "Pressed crease",
      "Hook-and-bar closure",
      "Side pockets"
    ],
    "tags": [
      "tailoring",
      "lyocell"
    ]
  },
  "pleated-midi-skirt": {
    "name": "Pleated Midi Skirt",
    "short": "Knife-pleated midi skirt with beautiful movement.",
    "description": "Permanent knife pleats in a soft recycled crepe, with an elasticated back waist for comfort and a clean front. The midi length and fluid weight make it an easy piece for both work and evenings.",
    "material": "100% recycled polyester crepe",
    "care": "Hand wash cold. Hang dry. Do not tumble dry.",
    "fit": "Relaxed A-line, midi length.",
    "features": [
      "Permanent knife pleats",
      "Elastic back waist"
    ],
    "tags": [
      "pleats",
      "occasion"
    ]
  },
  "tailored-shorts": {
    "name": "Tailored Shorts",
    "short": "A crisp tailored short with a high waist and pressed crease.",
    "description": "Cut from a lightweight cotton-linen suiting with a high waist, zip fly and a clean pressed crease. Finished with belt loops and deep side pockets. A polished warm-weather staple.",
    "material": "55% cotton, 45% linen",
    "care": "Machine wash cold. Warm iron.",
    "fit": "High waist, relaxed leg.",
    "features": [
      "Zip fly",
      "Pressed crease",
      "Belt loops"
    ],
    "tags": [
      "summer",
      "tailoring"
    ]
  },
  "merino-crew-knit": {
    "name": "Merino Crew Knit",
    "short": "Fine-gauge extra-fine merino with a clean crew neck.",
    "description": "Knitted in a fine 12-gauge extra-fine merino that is soft against the skin and holds its shape. A slim, slightly cropped body with a ribbed crew neck, cuffs and hem. Wear it alone or layered.",
    "material": "100% extra-fine merino wool",
    "care": "Hand wash cold with wool detergent. Dry flat.",
    "fit": "Slim fit, slightly cropped.",
    "features": [
      "12-gauge extra-fine merino",
      "Ribbed trims",
      "Mulesing-free wool"
    ],
    "tags": [
      "merino",
      "knitwear"
    ]
  },
  "mens-oxford-shirt": {
    "name": "Men's Oxford Shirt",
    "short": "A classic oxford button-down in substantial cotton.",
    "description": "Woven from 140gsm cotton oxford with a soft roll to the button-down collar. A regular fit through the chest with a box pleat and locker loop at the back, single-needle stitching, and a curved hem.",
    "material": "100% cotton oxford, 140gsm",
    "care": "Machine wash warm. Tumble dry low. Iron on medium.",
    "fit": "Regular fit.",
    "features": [
      "Button-down collar",
      "Box pleat",
      "Single-needle stitching"
    ],
    "tags": [
      "shirting",
      "classic"
    ]
  },
  "mens-pique-polo": {
    "name": "Men's Piqué Polo",
    "short": "A relaxed piqué polo with a soft collar and mother-of-pearl buttons.",
    "description": "Knitted in breathable cotton piqué with a relaxed body, ribbed collar and cuffs, and a two-button placket. The collar is unfused for a softer, more contemporary line.",
    "material": "100% cotton piqué",
    "care": "Machine wash cold. Dry flat.",
    "fit": "Relaxed fit.",
    "features": [
      "Unfused collar",
      "Mother-of-pearl buttons"
    ],
    "tags": [
      "polo",
      "everyday"
    ]
  },
  "mens-relaxed-chino": {
    "name": "Men's Relaxed Chino",
    "short": "Garment-dyed cotton twill chinos with a relaxed straight leg.",
    "description": "Cut from 280gsm cotton twill and garment dyed for depth of colour. A relaxed straight leg with a mid rise, slant pockets and a clean finish. Softens with every wash.",
    "material": "100% cotton twill, 280gsm",
    "care": "Machine wash cold. Tumble dry low.",
    "fit": "Relaxed straight leg.",
    "features": [
      "Garment dyed",
      "Mid rise",
      "Slant pockets"
    ],
    "tags": [
      "twill",
      "everyday"
    ]
  },
  "mens-straight-jeans": {
    "name": "Men's Straight Jeans",
    "short": "A mid-rise straight jean in rigid selvedge-style denim.",
    "description": "A straightforward five-pocket jean in 13oz rigid cotton denim, with a mid rise, straight leg and a clean, unfaded indigo finish. Built to break in and last.",
    "material": "100% cotton denim, 13oz",
    "care": "Machine wash cold inside out. Line dry.",
    "fit": "Mid rise, straight leg.",
    "features": [
      "13oz rigid denim",
      "Five-pocket construction"
    ],
    "tags": [
      "denim"
    ]
  },
  "mens-harrington-jacket": {
    "name": "Men's Harrington Jacket",
    "short": "A clean Harrington in water-resistant cotton with a check lining.",
    "description": "The classic Harrington silhouette, refined: a cotton-blend shell with a water-repellent finish, stand collar with throat latch, two-way zip and ribbed cuffs and hem. Fully lined in a tonal cotton check.",
    "material": "65% cotton, 35% recycled polyester; cotton check lining",
    "care": "Machine wash cold. Do not tumble dry.",
    "fit": "Regular fit.",
    "features": [
      "Water-repellent finish",
      "Two-way zip",
      "Throat latch",
      "Check lining"
    ],
    "tags": [
      "outerwear",
      "classic"
    ]
  },
  "mens-everyday-tee": {
    "name": "Men's Everyday Tee",
    "short": "A well-cut everyday tee with a slightly heavier hand.",
    "description": "A regular-fit crew in 200gsm organic cotton with a clean neckline and a straight hem. Substantial enough to wear alone, smooth enough to layer.",
    "material": "100% organic cotton, 200gsm",
    "care": "Machine wash cold. Tumble dry low.",
    "fit": "Regular fit.",
    "features": [
      "200gsm jersey",
      "Ribbed collar"
    ],
    "tags": [
      "essentials"
    ]
  },
  "mens-fleece-hoodie": {
    "name": "Men's Fleece Hoodie",
    "short": "A heavyweight fleece hoodie cut for everyday layering.",
    "description": "A 400gsm brushed-back fleece hoodie with a double-layer hood, ribbed cuffs and hem, and a kangaroo pocket. Cut with a straight body and a comfortable shoulder.",
    "material": "80% cotton, 20% recycled polyester, 400gsm",
    "care": "Machine wash cold. Tumble dry low.",
    "fit": "Regular fit.",
    "features": [
      "Brushed-back fleece",
      "Double-layer hood"
    ],
    "tags": [
      "fleece"
    ]
  },
  "leather-tote": {
    "name": "Leather Tote",
    "short": "An unlined leather tote that softens and ages beautifully.",
    "description": "Cut from vegetable-tanned full-grain leather and left unlined so it slouches with use. Fits a 14-inch laptop, with two internal slip pockets and a magnetic closure. Hand-finished edges.",
    "material": "Vegetable-tanned full-grain leather",
    "care": "Wipe with a soft dry cloth. Condition occasionally.",
    "fit": "One size. 38cm × 32cm × 14cm.",
    "features": [
      "Full-grain leather",
      " laptop",
      "Two internal pockets"
    ],
    "tags": [
      "leather",
      "bags"
    ]
  },
  "nylon-crossbody": {
    "name": "Nylon Crossbody",
    "short": "A lightweight recycled nylon crossbody with an adjustable strap.",
    "description": "A compact everyday bag in recycled ripstop nylon with a water-resistant coating. Zip top, front slip pocket and an adjustable webbing strap. Packs flat for travel.",
    "material": "Recycled ripstop nylon",
    "care": "Wipe clean with a damp cloth.",
    "fit": "One size. 24cm × 18cm × 7cm.",
    "features": [
      "Recycled ripstop",
      "Adjustable strap",
      "Water-resistant"
    ],
    "tags": [
      "nylon",
      "travel"
    ]
  },
  "canvas-backpack": {
    "name": "Canvas Backpack",
    "short": "A sturdy cotton canvas backpack with leather details.",
    "description": "Made from 18oz cotton canvas with leather trim and solid brass hardware. A padded 15-inch laptop sleeve, two external pockets and a roll-top closure. Built for the commute.",
    "material": "18oz cotton canvas, leather trim",
    "care": "Spot clean only.",
    "fit": "One size. 42cm × 30cm × 12cm.",
    "features": [
      " sleeve",
      "Roll-top closure",
      "Brass hardware"
    ],
    "tags": [
      "canvas",
      "commute"
    ]
  },
  "leather-belt": {
    "name": "Leather Belt",
    "short": "A clean 30mm leather belt with a brushed brass buckle.",
    "description": "Full-grain leather, 30mm wide, with hand-painted edges and a brushed brass buckle. Designed to wear with denim and tailoring alike.",
    "material": "Full-grain leather, brass hardware",
    "care": "Wipe clean. Condition occasionally.",
    "fit": "Order your trouser size.",
    "features": [
      "30mm width",
      "Brushed brass buckle"
    ],
    "tags": [
      "leather",
      "accessories"
    ]
  },
  "cotton-baseball-cap": {
    "name": "Cotton Baseball Cap",
    "short": "A six-panel washed cotton cap with a curved brim.",
    "description": "A classic six-panel cap in washed cotton twill with a curved brim, embroidered eyelets and an adjustable brass slider. Subtle DAYSHIFT embroidery at the back.",
    "material": "100% cotton twill",
    "care": "Hand wash cold. Air dry.",
    "fit": "One size, adjustable.",
    "features": [
      "Six-panel construction",
      "Adjustable brass slider"
    ],
    "tags": [
      "cap",
      "everyday"
    ]
  },
  "wool-felt-hat": {
    "name": "Wool Felt Hat",
    "short": "A wide-brim wool felt hat with a grosgrain band.",
    "description": "Blocked from 100% wool felt with a wide brim and a tonal grosgrain ribbon band. A considered finishing piece for cooler months.",
    "material": "100% wool felt",
    "care": "Spot clean. Store flat.",
    "fit": "Two sizes with internal size tape.",
    "features": [
      "Blocked wool felt",
      "Grosgrain band"
    ],
    "tags": [
      "hat",
      "wool"
    ]
  },
  "classic-sneaker": {
    "name": "Classic Sneaker",
    "short": "A minimal leather sneaker with a cupsole and clean lines.",
    "description": "A low-profile sneaker in soft calf leather with a leather lining, waxed cotton laces and a vulcanised rubber cupsole. Padded collar and a removable footbed. Designed to go with everything.",
    "material": "Calf leather upper, rubber sole",
    "care": "Wipe clean with leather cream. Do not machine wash.",
    "fit": "True to size, EU sizing.",
    "features": [
      "Calf leather upper",
      "Vulcanised cupsole",
      "Removable footbed"
    ],
    "tags": [
      "footwear",
      "leather"
    ]
  },
  "suede-loafer": {
    "name": "Suede Loafer",
    "short": "A soft suede penny loafer on a flexible leather sole.",
    "description": "Hand-finished suede loafer with a traditional penny strap, unlined vamp for softness and a Blake-stitched leather sole. An easy smart-casual shoe.",
    "material": "Suede upper, leather sole",
    "care": "Brush with a suede brush. Protect with spray.",
    "fit": "True to size, EU sizing.",
    "features": [
      "Blake-stitched sole",
      "Unlined vamp"
    ],
    "tags": [
      "footwear",
      "suede"
    ]
  },
  "leather-sandal": {
    "name": "Leather Sandal",
    "short": "A two-strap leather sandal with a moulded footbed.",
    "description": "Vegetable-tanned leather straps over a contoured, moulded footbed and a lightweight rubber outsole. Adjustable buckles at the ankle and instep.",
    "material": "Vegetable-tanned leather, rubber outsole",
    "care": "Wipe clean. Condition leather occasionally.",
    "fit": "True to size, EU sizing.",
    "features": [
      "Contoured footbed",
      "Adjustable buckles"
    ],
    "tags": [
      "footwear",
      "summer"
    ]
  },
  "acetate-sunglasses": {
    "name": "Acetate Sunglasses",
    "short": "Hand-polished acetate frames with category 3 lenses.",
    "description": "A classic square frame in Italian acetate, hand polished over several days. Category 3 CR-39 lenses with 100% UV400 protection and adjustable acetate temples.",
    "material": "Italian acetate, CR-39 lenses",
    "care": "Clean with the supplied cloth. Store in case.",
    "fit": "One size. 52-20-145.",
    "features": [
      "UV400 protection",
      "Category 3 lenses",
      "Italian acetate"
    ],
    "tags": [
      "eyewear",
      "summer"
    ]
  },
  "gold-hoop-earrings": {
    "name": "Gold Hoop Earrings",
    "short": "Small 18k gold-plated hoops for everyday wear.",
    "description": "A pair of 20mm hoops in recycled sterling silver with a thick 18k gold plating. Lightweight, hypoallergenic and designed to be worn daily.",
    "material": "Recycled sterling silver, 18k gold plating",
    "care": "Remove before swimming. Wipe with a soft cloth.",
    "fit": "One size. 20mm diameter.",
    "features": [
      "18k gold plating",
      "Recycled silver",
      "Hypoallergenic"
    ],
    "tags": [
      "jewellery",
      "gift"
    ]
  },
  "ribbed-sock-pack": {
    "name": "Ribbed Sock Pack",
    "short": "Three pairs of ribbed organic cotton socks.",
    "description": "A three-pack of crew socks in a soft organic cotton blend with a reinforced heel and toe. Ribbed leg for a secure fit.",
    "material": "78% organic cotton, 20% recycled polyamide, 2% elastane",
    "care": "Machine wash warm. Tumble dry low.",
    "fit": "S/M (EU 36–41), L/XL (EU 42–46).",
    "features": [
      "Three-pack",
      "Reinforced heel and toe"
    ],
    "tags": [
      "socks",
      "essentials"
    ]
  },
  "bifold-wallet": {
    "name": "Bifold Wallet",
    "short": "A slim bifold in vegetable-tanned leather.",
    "description": "A compact bifold with six card slots, two note compartments and a hidden coin pocket. Made from vegetable-tanned leather that patinas with use.",
    "material": "Vegetable-tanned leather",
    "care": "Condition occasionally.",
    "fit": "One size. 11cm × 9cm.",
    "features": [
      "Six card slots",
      "Hidden coin pocket"
    ],
    "tags": [
      "leather",
      "gift"
    ]
  },
  "oversized-denim-jacket": {
    "name": "Oversized Denim Jacket",
    "short": "A slouchy denim jacket in rigid organic cotton.",
    "description": "Cut from 12oz rigid organic denim with a dropped shoulder, oversized body and a cropped hem. Classic trucker detailing with chest flap pockets and adjustable waist tabs.",
    "material": "100% organic cotton denim, 12oz",
    "care": "Machine wash cold inside out. Line dry.",
    "fit": "Oversized fit.",
    "features": [
      "Rigid organic denim",
      "Adjustable waist tabs"
    ],
    "tags": [
      "denim",
      "outerwear"
    ]
  },
  "unisex-track-pant": {
    "name": "Unisex Track Pant",
    "short": "A relaxed track pant in brushed-back fleece.",
    "description": "A relaxed track pant in 360gsm brushed fleece with an elasticated waist, internal drawcord and tapered leg. Side pockets and a single back pocket.",
    "material": "80% organic cotton, 20% recycled polyester",
    "care": "Machine wash cold. Tumble dry low.",
    "fit": "Relaxed, tapered leg.",
    "features": [
      "Brushed fleece",
      "Internal drawcord"
    ],
    "tags": [
      "streetwear",
      "fleece"
    ]
  },
  "linen-blend-blouse": {
    "name": "Linen Blend Blouse",
    "short": "A softly structured linen-blend blouse with a grandad collar.",
    "description": "A lightweight linen-viscose blouse with a grandad collar, half placket and a softly gathered back yoke. The hem is curved and slightly longer at the back.",
    "material": "55% linen, 45% LENZING™ ECOVERO™ viscose",
    "care": "Machine wash cold. Line dry.",
    "fit": "Relaxed fit.",
    "features": [
      "Grandad collar",
      "Gathered back yoke"
    ],
    "tags": [
      "linen",
      "blouse"
    ]
  },
  "graphic-tee-day-off": {
    "name": "Graphic Tee — Day Off",
    "short": "A limited screen-printed tee, made in small runs.",
    "description": "Our heavyweight boxy tee with a hand-drawn 'Day Off' print, screen printed in a water-based ink for a soft, worn-in finish. Limited to 300 pieces.",
    "material": "100% organic cotton, 240gsm",
    "care": "Machine wash cold inside out. Do not iron print.",
    "fit": "Boxy fit.",
    "features": [
      "Limited to 300 pieces",
      "Water-based screen print"
    ],
    "tags": [
      "limited",
      "graphic"
    ]
  },
  "suede-ankle-boot": {
    "name": "Suede Ankle Boot",
    "short": "A rounded suede ankle boot with a stacked leather heel.",
    "description": "A softly constructed ankle boot in suede with a rounded toe, inside zip and a 35mm stacked leather heel. Leather lining and a cushioned insole.",
    "material": "Suede upper, leather lining, leather sole",
    "care": "Brush and protect with suede spray.",
    "fit": "True to size, EU sizing.",
    "features": [
      "Stacked leather heel",
      "Inside zip"
    ],
    "tags": [
      "footwear",
      "suede"
    ]
  }
};
