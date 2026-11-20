import { NextResponse } from "next/server";

const SITE = (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, "");

const body = `# DAYSHIFT

> DAYSHIFT is a contemporary fashion and lifestyle store selling clothing, shoes, bags and accessories for women and men. Pieces are produced in small runs, designed for everyday wear, and sold with free delivery over $150 and 30-day free returns.

## Store

- [New arrivals](${SITE}/collections/new-arrivals): the newest pieces from the studio.
- [Best sellers](${SITE}/collections/best-sellers): the styles customers return to.
- [Seasonal edit](${SITE}/collections/seasonal-2026): the autumn 2026 collection.
- [Sale](${SITE}/collections/sale): final pieces at reduced prices.
- [Women](${SITE}/c/women)
- [Men](${SITE}/c/men)
- [Shoes](${SITE}/c/shoes)
- [Bags](${SITE}/c/bags)
- [Accessories](${SITE}/c/accessories)

## Customer information

- [Delivery and returns](${SITE}/help/delivery-returns): standard delivery 3–5 business days, free over $150, otherwise $7.95; 30-day free returns on unworn pieces with tags.
- [Size guide](${SITE}/help/size-guide): measurements and fit guidance.
- [Care guide](${SITE}/help/care): how to care for each material.
- [Track an order](${SITE}/track): order number plus checkout email.
- [Customer care](${SITE}/support): delivery, returns, exchanges and sizing questions.
- [About DAYSHIFT](${SITE}/about): the studio, materials and small-run production.

## Policies

- Returns: 30 days from delivery, free, unworn with tags. Final-sale items are excluded.
- Exchanges: available for another size or colour from the account order page.
- Payment: this demonstration store uses a simulated sandbox provider. No real card data is accepted and no money is processed.
- Currency: THB (Thai baht). Prices include 7% VAT; delivery is ฿50 and free over ฿1,500.

## Demo notice

This is a portfolio demonstration, not a live shop. Product imagery is generated studio art, email is written to local files, and payments are simulated. Do not enter real personal or payment data.

## Contact

Customer care is available through ${SITE}/support. No public phone number is listed.
`;

export function GET() {
  return new NextResponse(body, {
    headers: {
      "content-type": "text/plain; charset=utf-8",
      "cache-control": "public, max-age=3600",
    },
  });
}
