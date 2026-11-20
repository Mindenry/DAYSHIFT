# Storefront UX, responsive rules and SEO/AEO

This document is the handoff reference for the customer-facing storefront in `apps/web`. It describes the design system, the responsive behaviour verified in this release, the accessibility rules, and the structured-data setup so the storefront can be extended without guessing.

## 1. Design principles

- **Product first.** Every page keeps the product, the price and the next action visible. Editorial type supports the product rather than replacing it.
- **One system.** Two typefaces, one palette, one button pair, one card style, one radius scale. New components should reuse the classes in `app/globals.css` rather than introduce a second visual language.
- **Mobile-first.** Layouts are authored from 320px upward. Desktop is an enhancement, not the baseline.
- **Calm, not empty.** Generous spacing and hairline rules, but no decorative gradients, parallax or scroll effects. Motion is limited to hover, press and modal entry.
- **Real content only.** No invented reviews, ratings, stock counts or delivery promises. Values come from the API, the seed or the documented policy.

## 2. Design tokens

Defined in `apps/web/app/globals.css` under `@theme`:

| Token | Value | Use |
| --- | --- | --- |
| `--color-paper` | `#f6f2e9` | Page background |
| `--color-paper-deep` | `#ede7db` | Alternating band, cards |
| `--color-ink` | `#1a1917` | Text, primary buttons |
| `--color-ink-soft` | `#2f2c28` | Long-form body |
| `--color-muted` | `#5d584f` | Secondary text (AA on paper) |
| `--color-sand` | `#e4dccd` | Image placeholders |
| `--color-line` | `#d8d0c1` | Hairlines and borders |
| `--color-sale` | `#8a3b2e` | Sale price, destructive notes |

Typography is self-hosted via `@fontsource-variable` packages imported in `app/layout.tsx`, so builds never call Google Fonts:

- **Display:** Bodoni Moda, weights 400/500/600, normal and italic. Used for `h1`–`h3`, product names and editorial statements.
- **UI/body:** Manrope, variable. Used for navigation, controls, prices, labels and body copy.

Type scale in practice: hero `clamp(3.1rem, 13vw, 4.8rem)` on phones and up to `7rem` on desktop; section `h2` `text-3xl` to `text-5xl`; product card name `15px` mobile / `17px` desktop; body `14–16px`; overline `10–11px` with `0.22em` tracking.

## 3. Layout and breakpoints

- `.wrap` is the single content container: max `1560px`, padding `20px` / `40px` at `md` / `56px` at `xl`, centred.
- Breakpoints used: `360` (product grid), `380` (header logo), `420` (account icon), `640` (`sm`), `768` (`md`), `1024` (`lg`), `1280` (`xl`).
- Product grids: `grid-cols-1` below 360, `grid-cols-2` from 360, three columns from `xl`.
- No page may scroll horizontally. The regression check enforces `scrollWidth === clientWidth` at 320 and 390.

## 4. Component patterns

### Header
`components/site-header*.tsx`. Sticky, announcement bar above, desktop mega-menu, mobile slide-over menu and a full-screen search overlay. The overlays are rendered **outside** the `<header>` so the header's `backdrop-filter` cannot trap fixed positioning.

### Product card
`components/product-card.tsx`. 3:4 image, optional second image on hover, sale/new/sold-out badges, two-line clamped name, brand, price, up to three colour dots and a wishlist control. Wishlist is always visible on touch and on hover/focus on desktop.

### Product detail
`components/product-experience.tsx`. Sticky buy panel on desktop; breadcrumb strip; gallery with thumbnails and counter; colour/size selection with stock state; low-stock copy; quantity; add/buy; delivery and returns notes; expandable description, materials, delivery and fit; accessible size-guide dialog; fixed mobile add-to-bag bar.

### Cart
`components/cart-view.tsx`. Free-delivery progress, warning banners, 80px thumbnails on mobile, 44px quantity controls, order summary, coupon form, fixed mobile checkout bar, and a reserved spacer so the bar never covers the footer.

### Checkout
`components/checkout-view.tsx`. Four numbered sections (contact, address, delivery, payment), single-column address fields below `sm`, inline required-state handling, sticky summary on desktop, fixed mobile submit bar wired to the same form via `form="checkout-form"`.

### Account
`components/account-nav.tsx`. Two-column chip grid on mobile, vertical rail on desktop, `aria-current` on the active route.

### Dialogs
Mobile menu, search, filters and size guide all lock `body` scrolling, close on Escape, and use `role="dialog"` with `aria-modal`. Reuse this pattern for any new overlay, and render it outside transformed or filtered ancestors.

## 5. Motion

Motion is deliberate and short; there are no scroll-jacking, timed carousels or hover tilt effects.

- **Page transition:** every route fades in through `app/template.tsx`.
- **Hero:** the headline lines rise and fade in sequence; the image scales from 1.06 to 1 and drifts with scroll (`ParallaxLayer`).
- **Scroll reveal:** section headers, product cards, category tiles, editorial blocks and FAQ items rise 26px and fade in as they enter the viewport, with a 45–90ms stagger. A position check also reveals content skipped by anchor jumps.
- **Header:** condenses from 81px to 65px on scroll, gains a soft shadow, and shows a live reading-progress line.
- **Mobile menu:** left drawer slides in over a fading backdrop; navigation items stagger in at 30ms intervals. It slides out before unmounting.
- **Search:** full-screen panel fades and drops 12px into place.
- **Filters:** mobile bottom sheet slides up over a fading backdrop.
- **Dialogs:** size guide fades and scales from 0.97.
- **Sticky bars:** product, cart and checkout bars slide up on mount.
- **Buttons:** lift 1px on hover and compress to 0.985 on press.
- **Cards:** product cards lift 1px and zoom their image; the cart badge pops when the count changes.
- **Reduced motion:** every animation, transition, delay and reveal collapses; content is always visible.

Overlays use `components/use-presence.ts`. It keeps the element mounted for the exit transition and waits **two animation frames** before switching to the open state, so the closed layout is painted first and the transition actually runs. The same file explains why a single `requestAnimationFrame` is not enough.

Menu and search are rendered outside `<header>` because the header's `backdrop-filter` creates a containing block that traps `position: fixed` children.

## 6. Accessibility

- One `h1` per page; sections use `h2`/`h3` in order.
- Visible focus ring (`:focus-visible`, 2px ink, 3px offset).
- Touch targets are at least 44px for primary controls; text links in navigation rows have 40–44px hit areas.
- Dialogs are labelled, dismissible and scroll-locked.
- Images have meaningful `alt`; decorative images use empty `alt`.
- `prefers-reduced-motion` disables animation and smooth scrolling.
- Verified by Axe on home, product, cart, mobile home, admin login and admin dashboard: **0 serious or critical violations**.

Run:

```bash
pnpm test:a11y
pnpm test:mobile
```

## 7. SEO and AEO

### Metadata
`app/layout.tsx` defines `metadataBase`, a title template, description, keywords, canonical types, Open Graph, Twitter card, robots directives, icons, theme colour and viewport-fit. Product, collection, category, collection index, support, track and content pages add their own canonical and share images.

The default social image is `public/og-default.png` (1200×630), captured from the running storefront. Product pages use their raster image when available and fall back to the default for SVG studio art.

### Structured data
Validated JSON-LD blocks rendered server-side:

| Page | Types |
| --- | --- |
| All pages | `Organization`, `WebSite` with `SearchAction` |
| Home | `ItemList` of new arrivals, `FAQPage` |
| Product | `Product`, `Offer`, `MerchantReturnPolicy`, `OfferShippingDetails`, `AggregateRating` (when reviews exist), `Review`, `BreadcrumbList` |
| Collection / category / search | `ItemList`, `BreadcrumbList` where a trail exists |
| Support | `FAQPage` |

`serializeJsonLd` from `@dayshift/config` escapes `<`, `>`, `&`, U+2028 and U+2029 before the JSON is placed inside a script tag.

### Crawl and answer engines
- `app/sitemap.ts` is dynamic and returns 112 URLs (static pages, products, categories, collections).
- `app/robots.ts` disallows account, cart, checkout, auth, API and search routes, and explicitly allows GPTBot, ClaudeBot, PerplexityBot, Google-Extended, CCBot and OAI-SearchBot on public pages.
- `app/llms.txt/route.ts` serves a plain-text brand, catalogue, policy and demo summary with absolute URLs.
- `app/manifest.ts` provides the install manifest.

### Extending SEO
When adding a page:

1. Add a `Metadata` export with title, description, canonical and Open Graph image.
2. Add the route to `sitemap.ts` if it is public.
3. Add structured data only for facts the page actually shows.
4. Keep one `h1` and use descriptive link text.
5. Add the page to the mobile audit list in `tests/e2e/mobile-check.mjs`.

When adding product data, extend the Product JSON-LD only if the API exposes the value; never invent ratings, reviews, shipping times or return terms.

## 8. Verified responsive behaviour

`tests/e2e/mobile-check.mjs` opens 11 routes at 390×844 and 320×700, checks:

- document width versus viewport width,
- elements crossing the right edge,
- control sizes below 40px,
- console and page errors.

Latest result: **passed at both widths for all 11 routes**. Interactive checks also cover the menu, search, filters and size guide (scroll lock and close), and a full mobile checkout through the fixed submit bar to the sandbox payment page.

## 9. Known constraints

- Product imagery is generated SVG studio art, not photography. Cards use a 3:4 frame; some art has generous internal padding.
- Fonts ship inside the `@fontsource-variable` packages and are served by Next.js; the running app never calls Google Fonts, and Docker builds do not need font network access.
- The demo uses a sandbox payment provider and local email files.
- Canonical and social URLs use `NEXT_PUBLIC_SITE_URL`, currently the LAN address. Set it to the public HTTPS domain before launch.
