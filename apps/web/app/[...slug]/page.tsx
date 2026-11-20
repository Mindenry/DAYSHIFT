import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";

interface Page {
  eyebrow: string;
  title: string;
  intro: string;
  sections: Array<{ heading: string; body: string[] }>;
  cta?: { label: string; href: string };
}

const PAGES: Record<string, Page> = {
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
          "Our studio in Brooklyn designs the collection. Knitwear and shirting are developed with Atelier Textiles in Paris; leather goods with Northline in Florence.",
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
    intro: "Our Brooklyn studio is open by appointment for fittings, repairs and collection previews.",
    sections: [
      {
        heading: "Brooklyn",
        body: [
          "12 Wythe Avenue, Brooklyn, NY. Monday to Friday, 10am–6pm, by appointment.",
          "The studio carries the full collection, a small selection of archive pieces, and offers free repairs on DAYSHIFT garments.",
        ],
      },
      {
        heading: "Los Angeles",
        body: [
          "800 Mateo Street, Los Angeles, CA. Open Thursday to Saturday, 11am–5pm.",
          "Our LA space focuses on denim, leather and seasonal exclusives.",
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
          "Three days a week in the Brooklyn studio, two remote. We protect focused time, write things down and keep meetings short.",
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
          "Standard delivery is $7.95 and free on orders over $150. It arrives in 3–5 business days.",
          "Express delivery is $14.95 and arrives in 1–2 business days. Orders placed before 1pm ET ship the same day.",
          "We currently ship within the United States. International delivery is being prepared.",
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
          "Prices are shown in USD and include applicable tax estimated at checkout. We may correct pricing errors before dispatch.",
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
          "ds_cart identifies an anonymous shopping bag and is cleared when merged into your account after sign-in.",
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

export async function generateMetadata({ params }: { params: Promise<{ slug: string[] }> }): Promise<Metadata> {
  const { slug } = await params;
  const page = PAGES[slug.join("/")];
  if (!page) return { title: "Not found — DAYSHIFT" };
  return { title: `${page.title} — DAYSHIFT`, description: page.intro };
}

export default async function InfoPage({ params }: { params: Promise<{ slug: string[] }> }) {
  const { slug } = await params;
  const page = PAGES[slug.join("/")];
  if (!page) notFound();

  return (
    <article className="wrap py-12 md:py-20">
      <div className="max-w-3xl">
        <p className="overline text-muted">{page.eyebrow}</p>
        <h1 className="mt-3 font-display text-5xl leading-[0.98] md:text-7xl">{page.title}</h1>
        <p className="mt-6 max-w-2xl text-base leading-relaxed text-ink-soft">{page.intro}</p>
      </div>
      <div className="mt-14 grid gap-12 lg:grid-cols-[0.6fr_1.4fr]">
        <div className="hidden lg:block">
          <div className="sticky top-28 border-t border-ink pt-4">
            <p className="overline text-muted">On this page</p>
            <ul className="mt-4 space-y-2">
              {page.sections.map((section) => (
                <li key={section.heading} className="text-sm text-muted">{section.heading}</li>
              ))}
            </ul>
          </div>
        </div>
        <div className="max-w-2xl space-y-10">
          {page.sections.map((section) => (
            <section key={section.heading}>
              <h2 className="border-b border-line pb-3 font-display text-3xl">{section.heading}</h2>
              <div className="mt-4 space-y-4">
                {section.body.map((paragraph) => (
                  <p key={paragraph} className="text-[15px] leading-relaxed text-ink-soft">{paragraph}</p>
                ))}
              </div>
            </section>
          ))}
          {page.cta && (
            <Link href={page.cta.href} className="btn btn-primary">{page.cta.label}</Link>
          )}
          <p className="border-t border-line pt-6 text-xs text-muted">
            Last reviewed November 2026. This content is part of a demonstration platform.
          </p>
        </div>
      </div>
    </article>
  );
}
