import type { Locale } from "./messages";

export interface InfoPage {
  eyebrow: string;
  title: string;
  intro: string;
  sections: Array<{ heading: string; body: string[] }>;
  cta?: { label: string; href: string };
}

const EN: Record<string, InfoPage> = {
  about: {
    eyebrow: "Our story",
    title: "Clothes for the days that make up a life.",
    intro:
      "DAYSHIFT began with a simple frustration: everyday clothing was either disposable or precious. We wanted pieces that could be worn hard, washed often, repaired if needed, and still feel considered.",
    sections: [
      {
        heading: "Made in small runs",
        body: [
          "We produce in limited quantities with a small group of suppliers we know by name. That means fewer markdowns, less waste and more time spent getting each piece right.",
          "Our studio in Bangkok designs the collection. Knitwear and shirting are developed with Bangkok Textile in Samut Prakan; leather goods with Chiang Mai Leatherwork.",
        ],
      },
      {
        heading: "Materials with a reason",
        body: [
          "Organic cotton, European flax linen, extra-fine merino and vegetable-tanned leather form the core of the collection. We choose materials for how they wear, not how they photograph.",
          "Where a synthetic is the right answer — stretch in a rib, recycled nylon in a travel bag — we use it deliberately and say so.",
        ],
      },
      {
        heading: "Built to be kept",
        body: [
          "Every piece is tested through repeated wear and washing before it reaches the store. Seams are reinforced where they take strain; buttons are sewn to stay.",
          "If something needs repairing, contact our care team. We would rather help you keep a piece than sell you a replacement.",
        ],
      },
    ],
    cta: { label: "Shop the collection", href: "/collections/new-arrivals" },
  },
  "about/materials": {
    eyebrow: "About",
    title: "Materials",
    intro: "A short guide to the fibres and finishes we use most, and why.",
    sections: [
      {
        heading: "Cotton",
        body: [
          "Our jersey and fleece use organic cotton grown without synthetic pesticides. Heavyweight styles use compact-spun yarns for a drier hand and better shape retention.",
          "Poplin and oxford shirting use long-staple cotton for smoothness and strength. Garment washing softens the finish without weakening the cloth.",
        ],
      },
      {
        heading: "Linen and lyocell",
        body: [
          "European flax linen is grown with little irrigation and improves with wear. We garment wash it so it arrives soft rather than stiff.",
          "Lyocell and LENZING™ ECOVERO™ viscose bring drape to tailoring and dresses. Both are produced in closed-loop systems that recover process chemicals.",
        ],
      },
      {
        heading: "Wool and leather",
        body: [
          "Our merino is mulesing-free and traced to a small number of farms. Suiting cloth uses a wool blend for resilience and a cupro lining for comfort.",
          "Leather goods use vegetable-tanned full-grain hides. The surface is left largely untreated so it darkens and softens with use.",
        ],
      },
    ],
  },
  "about/stores": {
    eyebrow: "About",
    title: "Visit the studio",
    intro: "Our Bangkok studio is open by appointment for fittings, repairs and collection previews.",
    sections: [
      {
        heading: "Bangkok",
        body: [
          "123/4 Thepharak Road, Bang Na, Bangkok 10260. Monday to Friday, 10:00–18:00, by appointment.",
          "The studio carries the full collection, a small selection of archive pieces, and offers free repairs on DAYSHIFT garments.",
        ],
      },
      {
        heading: "Chiang Mai",
        body: [
          "88 Nimmanhaemin Road, Mueang Chiang Mai 50200. Thursday to Saturday, 11:00–17:00.",
          "Our Chiang Mai space focuses on leather, knitwear and seasonal exclusives.",
        ],
      },
    ],
    cta: { label: "Contact the studio", href: "/support" },
  },
  "about/careers": {
    eyebrow: "About",
    title: "Work with us",
    intro: "We are a small team of designers, makers and operators who care about doing ordinary things properly.",
    sections: [
      {
        heading: "Open roles",
        body: [
          "There are no open roles listed at the moment. We keep a small bench of freelance pattern cutters and technical designers.",
          "To introduce yourself, write to hello@dayshift.example with a short note and relevant work.",
        ],
      },
      {
        heading: "How we work",
        body: [
          "Three days a week in the Bangkok studio, two remote. We protect focused time, write things down and keep meetings short.",
          "We pay fairly, share the collection early and offer a generous product allowance.",
        ],
      },
    ],
  },
  journal: {
    eyebrow: "Journal",
    title: "Notes from the studio",
    intro: "Occasional writing on materials, makers and the way we wear things.",
    sections: [
      {
        heading: "The case for fewer, better hangers",
        body: [
          "A wardrobe is a system, not a pile. Start with the pieces that touch your skin — tees, shirts, knitwear — and buy the best versions you can afford.",
          "Then add structure: one jacket, one pair of trousers, one pair of jeans that actually fits. Everything else is decoration.",
        ],
      },
      {
        heading: "How to wash merino",
        body: [
          "Cold water, a wool-specific detergent, no agitation. Press the water out in a towel and dry flat, away from direct heat.",
          "Wash less often than you think. Merino resists odour and recovers its shape with a day's rest between wears.",
        ],
      },
    ],
    cta: { label: "Shop essentials", href: "/collections/essentials" },
  },
  "help/delivery-returns": {
    eyebrow: "Help",
    title: "Delivery & returns",
    intro: "Everything you need to know about receiving and returning an order.",
    sections: [
      {
        heading: "Delivery",
        body: [
          "Standard delivery is ฿50 and free on orders over ฿1,500. It arrives in 2–4 business days.",
          "Express delivery is ฿100 and arrives the next business day. Orders placed before 13:00 ICT ship the same day.",
          "We currently ship within Thailand. International delivery is being prepared.",
        ],
      },
      {
        heading: "Returns",
        body: [
          "Return unworn pieces with tags attached within 30 days of delivery. Returns are free — start one from your order in the account area.",
          "Refunds are issued to the original payment method after inspection, usually within 3–5 business days of receipt.",
          "Final sale pieces and pierced jewellery cannot be returned unless faulty.",
        ],
      },
      {
        heading: "Exchanges",
        body: [
          "Choose an exchange when starting your return and select the replacement size or colour. We check stock at the time of request and again at inspection.",
          "Replacement items ship once the original is received and inspected. If the replacement is unavailable, we will contact you to arrange a refund or alternative.",
        ],
      },
    ],
    cta: { label: "Start a return", href: "/account/orders" },
  },
  "help/size-guide": {
    eyebrow: "Help",
    title: "Size guide",
    intro: "Our clothing is cut with a relaxed, contemporary fit. If you are between sizes, take the larger size for the intended silhouette.",
    sections: [
      {
        heading: "Women's clothing",
        body: [
          "XS: bust 80–84cm, waist 62–66cm, hip 88–92cm.",
          "S: bust 84–88cm, waist 66–70cm, hip 92–96cm.",
          "M: bust 88–92cm, waist 70–74cm, hip 96–100cm.",
          "L: bust 92–96cm, waist 74–78cm, hip 100–104cm.",
          "XL: bust 96–102cm, waist 78–84cm, hip 104–110cm. XXL: bust 102–108cm, waist 84–90cm, hip 110–116cm.",
        ],
      },
      {
        heading: "Men's clothing",
        body: [
          "S: chest 92–96cm, waist 76–80cm.",
          "M: chest 96–100cm, waist 80–84cm.",
          "L: chest 100–104cm, waist 84–88cm.",
          "XL: chest 104–108cm, waist 88–92cm.",
        ],
      },
      {
        heading: "Footwear",
        body: [
          "We use EU sizing. EU 40 = UK 6 / US 7; 41 = UK 7 / US 8; 42 = UK 8 / US 9; 43 = UK 9 / US 10; 44 = UK 10 / US 11; 45 = UK 11 / US 12.",
          "Measure your foot in the afternoon, standing, and compare to the foot length column on each product's size guide.",
        ],
      },
    ],
  },
  "help/care": {
    eyebrow: "Help",
    title: "Care guide",
    intro: "Good clothes last longer when they are washed less and repaired sooner.",
    sections: [
      {
        heading: "Everyday care",
        body: [
          "Air garments between wears. Spot clean where possible. Wash cold, inside out, with a gentle detergent.",
          "Dry flat or line dry. Tumble drying weakens fibres and shortens garment life, even on low heat.",
        ],
      },
      {
        heading: "Repairs",
        body: [
          "We repair DAYSHIFT garments free of charge within the first year, including seams, buttons, zips and hems.",
          "Contact customer care with photographs and your order number to arrange a repair.",
        ],
      },
      {
        heading: "Storage",
        body: [
          "Fold knitwear; hanging stretches shoulders. Use wide hangers for tailoring and leave space between garments.",
          "Store leather in a breathable bag, away from direct sunlight, and condition it once or twice a year.",
        ],
      },
    ],
    cta: { label: "Contact care", href: "/support" },
  },
  "legal/privacy": {
    eyebrow: "Legal",
    title: "Privacy policy",
    intro: "This demonstration platform processes only the data you enter locally. It is not connected to a production payment or email provider.",
    sections: [
      {
        heading: "What we collect",
        body: [
          "Account details, delivery addresses, order history, reviews and support messages. Passwords are stored as bcrypt hashes, never in plain text.",
          "Session cookies are httpOnly and used only to keep you signed in. Cart cookies identify an anonymous bag and expire after 90 days.",
        ],
      },
      {
        heading: "How data is used",
        body: [
          "To fulfil orders, provide support, prevent abuse and calculate loyalty points. We do not sell personal data.",
          "In this local demo, emails are written to a local folder instead of being sent to a third party.",
        ],
      },
      {
        heading: "Your rights",
        body: [
          "You can download your data from Settings, request correction, or ask for account deletion through customer care.",
          "Financial records may be retained where required for accounting and audit integrity.",
        ],
      },
    ],
  },
  "legal/terms": {
    eyebrow: "Legal",
    title: "Terms of service",
    intro: "A demonstration storefront for an independent fashion retailer. Orders and payments here are simulated.",
    sections: [
      {
        heading: "Orders",
        body: [
          "An order is an offer to purchase. It is accepted when payment is confirmed or, for cash on delivery, when the order is dispatched.",
          "Prices are shown in THB and include 7% VAT. Delivery is ฿50, free over ฿1,500. We may correct pricing errors before dispatch.",
        ],
      },
      {
        heading: "Payments",
        body: [
          "All card payments in this environment use a local sandbox simulator. No real card network is contacted and no money moves.",
          "Cash-on-delivery orders are marked paid only when the carrier collects payment.",
        ],
      },
      {
        heading: "Liability",
        body: [
          "Nothing in these terms limits rights that cannot be limited by law. This demo is provided without warranty for production use.",
        ],
      },
    ],
  },
  "legal/cookies": {
    eyebrow: "Legal",
    title: "Cookie policy",
    intro: "We use the minimum cookies needed to run the store.",
    sections: [
      {
        heading: "Essential cookies",
        body: [
          "ds_session keeps you signed in. It is httpOnly, same-site and expires after 30 days.",
          "ds_cart identifies an anonymous shopping bag and is cleared when merged into your account after sign-in. ds_locale remembers your language choice.",
        ],
      },
      {
        heading: "No advertising cookies",
        body: [
          "This platform does not include third-party advertising or cross-site tracking cookies.",
          "Local storage is used for recently viewed products and search history, and stays in your browser.",
        ],
      },
    ],
  },
  "legal/accessibility": {
    eyebrow: "Legal",
    title: "Accessibility",
    intro: "We aim to meet WCAG 2.2 AA across the storefront and administration tools.",
    sections: [
      {
        heading: "What we have done",
        body: [
          "Semantic landmarks, visible focus states, labelled form controls, keyboard-operable menus and dialogs, and reduced-motion support.",
          "Text and interface colours are chosen for contrast on the paper background; interactive targets are at least 44px where practical.",
        ],
      },
      {
        heading: "Known limitations",
        body: [
          "Some third-party embedded content and complex data tables may not yet be fully optimised for screen readers.",
          "If you encounter a barrier, contact customer care and we will provide the information or complete the task with you directly.",
        ],
      },
    ],
    cta: { label: "Contact us", href: "/support" },
  },
};

const TH: Record<string, InfoPage> = {
  about: {
    eyebrow: "เรื่องราวของเรา",
    title: "เสื้อผ้าสำหรับวันที่ประกอบกันเป็นชีวิต",
    intro:
      "DAYSHIFT เริ่มจากความหงุดหงิดง่าย ๆ ว่าเสื้อผ้าใส่ทุกวันมักเป็นได้แค่ของใช้แล้วทิ้งหรือของแพงเกินเอื้อม เราอยากทำชิ้นที่ใส่ได้หนัก ซักบ่อย ซ่อมได้ และยังดูตั้งใจ",
    sections: [
      {
        heading: "ผลิตจำนวนจำกัด",
        body: [
          "เราผลิตจำนวนไม่มากกับซัพพลายเออร์กลุ่มเล็กที่เรารู้จักชื่อทุกคน จึงลดของค้างสต็อก ลดขยะ และมีเวลาเก็บรายละเอียดแต่ละชิ้นมากขึ้น",
          "สตูดิโอของเราที่กรุงเทพฯ เป็นผู้ออกแบบคอลเลกชัน เสื้อถักและเสื้อเชิ้ตพัฒนากับบางกอกเท็กซ์ไทล์ จังหวัดสมุทรปราการ ส่วนงานหนังทำกับเชียงใหม่เลเธอร์เวิร์ก",
        ],
      },
      {
        heading: "วัสดุที่มีเหตุผล",
        body: [
          "คอตตอนออร์แกนิก ผ้าลินินยุโรป ไหมพรมเมอริโนเนื้อละเอียด และหนังฟอกฝาด เป็นแกนหลักของคอลเลกชัน เราเลือกวัสดุจากวิธีที่มันใส่ ไม่ใช่วิธีที่มันถ่ายรูปออกมา",
          "ถ้าใยสังเคราะห์เป็นคำตอบที่ถูก เช่นความยืดในผ้าริบหรือไนลอนรีไซเคิลในกระเป๋าเดินทาง เราก็ใช้อย่างตั้งใจและบอกตรง ๆ",
        ],
      },
      {
        heading: "ทำมาให้เก็บไว้",
        body: [
          "ทุกชิ้นผ่านการทดสอบใส่และซักซ้ำก่อนถึงหน้าร้าน ตะเข็บที่รับแรงได้รับการเสริม กระดุมเย็บให้อยู่ทน",
          "หากต้องการซ่อม ติดต่อทีมดูแลลูกค้าได้เลย เราอยากช่วยคุณเก็บชิ้นเดิมไว้มากกว่าขายชิ้นใหม่",
        ],
      },
    ],
    cta: { label: "ช้อปคอลเลกชัน", href: "/collections/new-arrivals" },
  },
  "about/materials": {
    eyebrow: "เกี่ยวกับเรา",
    title: "วัสดุ",
    intro: "คู่มือสั้น ๆ เกี่ยวกับเส้นใยและการตกแต่งที่เราใช้บ่อย และเหตุผลที่เลือก",
    sections: [
      {
        heading: "คอตตอน",
        body: [
          "ผ้าถักและผ้าฟลีซใช้คอตตอนออร์แกนิกที่ปลูกโดยไม่ใช้สารกำจัดศัตรูพืชสังเคราะห์ รุ่นผ้าหนักใช้เส้นด้ายปั่นแน่นให้สัมผัสแห้งและทรงอยู่ตัวกว่า",
          "ผ้าปอปลินและอ็อกซ์ฟอร์ดใช้คอตตอนเส้นใยยาวเพื่อความเนียนและความแข็งแรง การซักทั้งตัวช่วยให้นุ่มโดยไม่ทำให้ผ้าอ่อนแอ",
        ],
      },
      {
        heading: "ลินินและไลโอเซลล์",
        body: [
          "ผ้าลินินยุโรปปลูกโดยใช้น้ำน้อยและยิ่งใส่ยิ่งดี เราซักทั้งตัวให้มาถึงมือนุ่ม ไม่แข็ง",
          "ไลโอเซลล์และวิสโคส LENZING™ ECOVERO™ ช่วยให้เสื้อสูทและเดรสทิ้งตัวสวย ทั้งสองผลิตในระบบปิดที่นำสารเคมีกลับมาใช้",
        ],
      },
      {
        heading: "ขนสัตว์และหนัง",
        body: [
          "เมอริโนของเราไม่ผ่านการตัดหนังรอบก้น (mulesing-free) และตรวจย้อนถึงฟาร์มจำนวนน้อย ผ้าสูทใช้ขนสัตว์ผสมเพื่อความทนและซับคิวโปรเพื่อความสบาย",
          "งานหนังใช้หนังฟอกฝาดเต็มผิว ปล่อยผิวไว้แทบไม่เคลือบ จึงเข้มและนุ่มขึ้นเมื่อใช้",
        ],
      },
    ],
  },
  "about/stores": {
    eyebrow: "เกี่ยวกับเรา",
    title: "มาที่สตูดิโอ",
    intro: "สตูดิโอกรุงเทพฯ เปิดให้เข้าพบตามนัดสำหรับลองไซซ์ ซ่อม และดูคอลเลกชันใหม่",
    sections: [
      {
        heading: "กรุงเทพฯ",
        body: [
          "123/4 ถนนเทพรัตน เขตบางนา กรุงเทพฯ 10260 จันทร์–ศุกร์ 10:00–18:00 น. ตามนัดหมาย",
          "สตูดิโอมีสินค้าครบคอลเลกชัน ชิ้นอาร์ไคฟ์จำนวนหนึ่ง และซ่อมเสื้อผ้า DAYSHIFT ฟรี",
        ],
      },
      {
        heading: "เชียงใหม่",
        body: [
          "88 ถนนนิมมานเหมินท์ อำเภอเมืองเชียงใหม่ 50200 พฤหัสบดี–เสาร์ 11:00–17:00 น.",
          "พื้นที่เชียงใหม่เน้นงานหนัง เสื้อถัก และสินค้าพิเศษตามฤดูกาล",
        ],
      },
    ],
    cta: { label: "ติดต่อสตูดิโอ", href: "/support" },
  },
  "about/careers": {
    eyebrow: "เกี่ยวกับเรา",
    title: "ร่วมงานกับเรา",
    intro: "เราเป็นทีมเล็ก ๆ ของนักออกแบบ ช่างฝีมือ และทีมปฏิบัติการที่ใส่ใจการทำงานธรรมดาให้ดี",
    sections: [
      {
        heading: "ตำแหน่งที่เปิดรับ",
        body: [
          "ขณะนี้ยังไม่มีตำแหน่งที่เปิดรับ เราทำงานกับช่างแพตเทิร์นและนักออกแบบเทคนิคแบบฟรีแลนซ์เป็นครั้งคราว",
          "หากสนใจแนะนำตัว เขียนมาที่ hello@dayshift.example พร้อมข้อความสั้น ๆ และผลงานที่เกี่ยวข้อง",
        ],
      },
      {
        heading: "วิธีการทำงาน",
        body: [
          "เข้าสตูดิโอกรุงเทพฯ สัปดาห์ละสามวัน อีกสองวันทำงานระยะไกล เราให้เวลากับงานที่ต้องใช้สมาธิ จดสิ่งที่ตกลงกัน และประชุมให้สั้น",
          "เราจ่ายอย่างเป็นธรรม ให้ดูคอลเลกชันก่อนใคร และมีส่วนลดสินค้าที่เหมาะสม",
        ],
      },
    ],
  },
  journal: {
    eyebrow: "บทความ",
    title: "บันทึกจากสตูดิโอ",
    intro: "เรื่องเล่าเป็นครั้งคราวเกี่ยวกับวัสดุ ช่างฝีมือ และวิธีที่เราใส่เสื้อผ้า",
    sections: [
      {
        heading: "ทำไมควรมีไม้แขวนน้อยลงแต่ดีขึ้น",
        body: [
          "ตู้เสื้อผ้าคือระบบ ไม่ใช่กองของ เริ่มจากชิ้นที่สัมผัสผิว — เสื้อยืด เสื้อเชิ้ต เสื้อถัก — แล้วซื้อเวอร์ชันที่ดีที่สุดที่จ่ายไหว",
          "จากนั้นเพิ่มโครงสร้าง: แจ็กเก็ตหนึ่งตัว กางเกงขายาวหนึ่งตัว ยีนส์หนึ่งตัวที่ใส่พอดี ที่เหลือคือการตกแต่ง",
        ],
      },
      {
        heading: "ซักเมอริโนอย่างไร",
        body: [
          "น้ำเย็น ผงซักสำหรับผ้าขนสัตว์ ไม่ขยี้ บีบน้ำออกด้วยผ้าเช็ดตัวแล้วผึ่งราบให้ห่างความร้อนโดยตรง",
          "ซักน้อยกว่าที่คิด เมอริโนต้านกลิ่นและคืนทรงได้ด้วยการพักหนึ่งวันระหว่างใส่",
        ],
      },
    ],
    cta: { label: "ช้อปเสื้อผ้าพื้นฐาน", href: "/collections/essentials" },
  },
  "help/delivery-returns": {
    eyebrow: "ช่วยเหลือ",
    title: "การจัดส่งและการคืนสินค้า",
    intro: "ทุกเรื่องที่ควรรู้เกี่ยวกับการรับสินค้าและการคืนคำสั่งซื้อ",
    sections: [
      {
        heading: "การจัดส่ง",
        body: [
          "จัดส่งมาตรฐาน ฿50 และฟรีเมื่อซื้อครบ ฿1,500 ใช้เวลา 2–4 วันทำการ",
          "จัดส่งด่วน ฿100 ถึงในวันทำการถัดไป คำสั่งซื้อที่ชำระก่อน 13:00 น. จัดส่งในวันเดียวกัน",
          "ปัจจุบันจัดส่งภายในประเทศไทย การจัดส่งต่างประเทศอยู่ระหว่างเตรียมการ",
        ],
      },
      {
        heading: "การคืนสินค้า",
        body: [
          "คืนสินค้าที่ยังไม่ใส่และป้ายยังอยู่ภายใน 30 วันหลังได้รับ คืนฟรี — เริ่มได้จากคำสั่งซื้อในหน้าบัญชี",
          "เงินจะคืนไปยังช่องทางเดิมหลังตรวจสอบ โดยปกติภายใน 3–5 วันทำการหลังได้รับสินค้า",
          "สินค้าลดราคาสุดท้ายและต่างหูเจาะหูไม่รับคืน เว้นแต่ชำรุด",
        ],
      },
      {
        heading: "การเปลี่ยนสินค้า",
        body: [
          "เลือกเปลี่ยนสินค้าตอนเริ่มคืน แล้วเลือกไซซ์หรือสีใหม่ เราตรวจสต็อกตอนส่งคำขอและอีกครั้งตอนตรวจรับ",
          "สินค้าใหม่จะจัดส่งหลังได้รับและตรวจสอบของเดิม หากของใหม่หมด เราจะติดต่อเพื่อคืนเงินหรือหาทางเลือกอื่น",
        ],
      },
    ],
    cta: { label: "เริ่มคืนสินค้า", href: "/account/orders" },
  },
  "help/size-guide": {
    eyebrow: "ช่วยเหลือ",
    title: "ตารางไซซ์",
    intro: "เสื้อผ้าเราตัดทรงหลวมแบบร่วมสมัย หากอยู่ระหว่างสองไซซ์ แนะนำไซซ์ใหญ่กว่าเพื่อทรงตามแบบ",
    sections: [
      {
        heading: "เสื้อผ้าผู้หญิง",
        body: [
          "XS: รอบอก 80–84 ซม. เอว 62–66 ซม. สะโพก 88–92 ซม.",
          "S: รอบอก 84–88 ซม. เอว 66–70 ซม. สะโพก 92–96 ซม.",
          "M: รอบอก 88–92 ซม. เอว 70–74 ซม. สะโพก 96–100 ซม.",
          "L: รอบอก 92–96 ซม. เอว 74–78 ซม. สะโพก 100–104 ซม.",
          "XL: รอบอก 96–102 ซม. เอว 78–84 ซม. สะโพก 104–110 ซม. XXL: รอบอก 102–108 ซม. เอว 84–90 ซม. สะโพก 110–116 ซม.",
        ],
      },
      {
        heading: "เสื้อผ้าผู้ชาย",
        body: [
          "S: รอบอก 92–96 ซม. เอว 76–80 ซม.",
          "M: รอบอก 96–100 ซม. เอว 80–84 ซม.",
          "L: รอบอก 100–104 ซม. เอว 84–88 ซม.",
          "XL: รอบอก 104–108 ซม. เอว 88–92 ซม.",
        ],
      },
      {
        heading: "รองเท้า",
        body: [
          "เราใช้ไซซ์ EU: EU 40 = UK 6 / US 7; 41 = UK 7 / US 8; 42 = UK 8 / US 9; 43 = UK 9 / US 10; 44 = UK 10 / US 11; 45 = UK 11 / US 12",
          "วัดเท้าตอนบ่ายขณะยืน แล้วเทียบกับคอลัมน์ความยาวเท้าในตารางไซซ์ของแต่ละสินค้า",
        ],
      },
    ],
  },
  "help/care": {
    eyebrow: "ช่วยเหลือ",
    title: "วิธีดูแลสินค้า",
    intro: "เสื้อผ้าดีจะอยู่กับเราได้นานขึ้นเมื่อซักน้อยลงและซ่อมเร็วขึ้น",
    sections: [
      {
        heading: "การดูแลทุกวัน",
        body: [
          "ผึ่งลมระหว่างการใส่ ทำความสะอาดเฉพาะจุดเมื่อทำได้ ซักน้ำเย็นกลับด้านด้วยผงซักอ่อน",
          "ผึ่งราบหรือผึ่งบนราว การอบแห้งทำให้เส้นใยอ่อนแอและอายุการใช้งานสั้นลงแม้ใช้ไฟต่ำ",
        ],
      },
      {
        heading: "การซ่อม",
        body: [
          "เราซ่อมเสื้อผ้า DAYSHIFT ฟรีภายในปีแรก รวมตะเข็บ กระดุม ซิป และชายเสื้อ",
          "ติดต่อฝ่ายบริการลูกค้าพร้อมรูปถ่ายและเลขคำสั่งซื้อเพื่อนัดซ่อม",
        ],
      },
      {
        heading: "การเก็บรักษา",
        body: [
          "พับเสื้อถัก การแขวนจะทำให้ไหล่ยืด ใช้ไม้แขวนกว้างกับเสื้อสูทและเว้นระยะระหว่างชิ้น",
          "เก็บหนังในถุงที่ระบายอากาศได้ หลีกเลี่ยงแสงแดดตรง และบำรุงปีละหนึ่งถึงสองครั้ง",
        ],
      },
    ],
    cta: { label: "ติดต่อฝ่ายดูแล", href: "/support" },
  },
  "legal/privacy": {
    eyebrow: "กฎหมาย",
    title: "นโยบายความเป็นส่วนตัว",
    intro: "แพลตฟอร์มสาธิตนี้ประมวลผลเฉพาะข้อมูลที่คุณกรอกในเครื่อง และไม่ได้เชื่อมต่อผู้ให้บริการชำระเงินหรืออีเมลจริง",
    sections: [
      {
        heading: "ข้อมูลที่เราเก็บ",
        body: [
          "ข้อมูลบัญชี ที่อยู่จัดส่ง ประวัติคำสั่งซื้อ รีวิว และข้อความสนับสนุน รหัสผ่านเก็บเป็น bcrypt hash ไม่เคยเก็บเป็นข้อความธรรมดา",
          "คุกกี้เซสชันเป็น httpOnly ใช้เพื่อให้คุณอยู่ในระบบ คุกกี้ตะกร้าระบุถุงสินค้าแบบไม่ระบุตัวตนและหมดอายุใน 90 วัน",
        ],
      },
      {
        heading: "การใช้ข้อมูล",
        body: [
          "เพื่อจัดส่งสินค้า ให้บริการสนับสนุน ป้องกันการใช้งานผิด และคำนวณคะแนนสะสม เราไม่ขายข้อมูลส่วนบุคคล",
          "ในเดโมนี้ อีเมลถูกเขียนลงโฟลเดอร์ในเครื่องแทนการส่งออกไปยังบุคคลที่สาม",
        ],
      },
      {
        heading: "สิทธิของคุณ",
        body: [
          "คุณดาวน์โหลดข้อมูลได้จากหน้าตั้งค่า ขอแก้ไขข้อมูล หรือขอลบบัญชีผ่านฝ่ายบริการลูกค้า",
          "ข้อมูลทางการเงินอาจเก็บไว้ตามที่กฎหมายกำหนดเพื่อการบัญชีและการตรวจสอบ",
        ],
      },
    ],
  },
  "legal/terms": {
    eyebrow: "กฎหมาย",
    title: "ข้อกำหนดการให้บริการ",
    intro: "หน้าร้านสาธิตสำหรับแบรนด์แฟชั่นอิสระ คำสั่งซื้อและการชำระเงินในระบบนี้เป็นการจำลอง",
    sections: [
      {
        heading: "คำสั่งซื้อ",
        body: [
          "คำสั่งซื้อถือเป็นข้อเสนอซื้อ และจะได้รับการยอมรับเมื่อชำระเงินยืนยันแล้ว หรือสำหรับเก็บเงินปลายทางเมื่อจัดส่งสินค้า",
          "ราคาแสดงเป็นบาทและรวม VAT 7% ค่าจัดส่ง ฿50 ฟรีเมื่อซื้อครบ ฿1,500 เราอาจแก้ไขราคาที่ผิดพลาดก่อนจัดส่ง",
        ],
      },
      {
        heading: "การชำระเงิน",
        body: [
          "การชำระด้วยบัตรในสภาพแวดล้อมนี้ใช้ระบบจำลองในเครื่อง ไม่เชื่อมต่อเครือข่ายบัตรจริงและไม่มีการเคลื่อนย้ายเงิน",
          "คำสั่งซื้อแบบเก็บเงินปลายทางจะถือว่าชำระแล้วเมื่อผู้ขนส่งเก็บเงินได้",
        ],
      },
      {
        heading: "ความรับผิด",
        body: [
          "ข้อกำหนดนี้ไม่จำกัดสิทธิที่กฎหมายห้ามจำกัด เดโมนี้ให้บริการโดยไม่รับประกันสำหรับการใช้งานจริงในProduction",
        ],
      },
    ],
  },
  "legal/cookies": {
    eyebrow: "กฎหมาย",
    title: "นโยบายคุกกี้",
    intro: "เราใช้คุกกี้เท่าที่จำเป็นต่อการทำงานของร้าน",
    sections: [
      {
        heading: "คุกกี้ที่จำเป็น",
        body: [
          "ds_session ทำให้คุณอยู่ในระบบ เป็น httpOnly same-site และหมดอายุใน 30 วัน",
          "ds_cart ระบุถุงสินค้าแบบไม่ระบุตัวตน และถูกล้างเมื่อรวมเข้าบัญชีหลังเข้าสู่ระบบ ส่วน ds_locale จำภาษาที่คุณเลือก",
        ],
      },
      {
        heading: "ไม่มีคุกกี้โฆษณา",
        body: [
          "แพลตฟอร์มนี้ไม่มีคุกกี้โฆษณาของบุคคลที่สามหรือคุกกี้ติดตามข้ามเว็บไซต์",
          "เราใช้ local storage สำหรับสินค้าที่ดูล่าสุดและประวัติการค้นหา ซึ่งอยู่ในเบราว์เซอร์ของคุณเท่านั้น",
        ],
      },
    ],
  },
  "legal/accessibility": {
    eyebrow: "กฎหมาย",
    title: "การเข้าถึง",
    intro: "เราตั้งเป้าที่ WCAG 2.2 AA ทั้งหน้าร้านและเครื่องมือผู้ดูแล",
    sections: [
      {
        heading: "สิ่งที่เราทำแล้ว",
        body: [
          "โครงสร้าง Semantic จุดโฟกัสมองเห็นชัด ป้ายกำกับฟอร์ม เมนูและไดอะล็อกที่ใช้คีย์บอร์ดได้ และรองรับการลดการเคลื่อนไหว",
          "สีข้อความและอินเทอร์เฟซเลือกให้คอนทราสต์บนพื้นกระดาษ และเป้าสัมผัสมีขนาดอย่างน้อย 44px ในจุดที่ทำได้",
        ],
      },
      {
        heading: "ข้อจำกัดที่ทราบ",
        body: [
          "เนื้อหาฝังจากบุคคลที่สามและตารางข้อมูลซับซ้อนบางส่วนอาจยังไม่เหมาะกับโปรแกรมอ่านหน้าจอเต็มที่",
          "หากพบอุปสรรค ติดต่อฝ่ายบริการลูกค้า เราจะให้ข้อมูลหรือทำงานนั้นร่วมกับคุณโดยตรง",
        ],
      },
    ],
    cta: { label: "ติดต่อเรา", href: "/support" },
  },
};

export function getInfoPage(key: string, locale: Locale): InfoPage | null {
  const table = locale === "th" ? TH : EN;
  return table[key] ?? null;
}

export function infoPageSlugs(): string[] {
  return Object.keys(EN);
}
