# API

Base path: `/api/v1`. Swagger UI: `/api/docs` in non-production. Responses are wrapped as `{ "data": ... }`; paginated endpoints return `data.items` and `data.meta`.

Errors:

```json
{ "statusCode": 409, "code": "CONFLICT", "message": "Only 1 available in that size and colour.", "requestId": "…" }
```

Money values are two-decimal strings. Timestamps are ISO-8601 UTC.

## Authentication

| Method | Path | Auth | Notes |
| --- | --- | --- | --- |
| POST | `/auth/register` | public | Creates customer, session cookie, welcome + verification email |
| POST | `/auth/login` | public | Customer or staff; per-email/IP throttling |
| POST | `/auth/staff/login` | public | Requires an active `StaffProfile` |
| POST | `/auth/logout` | session | Revokes session, clears cookie |
| GET | `/auth/me` | session | Profile, staff role and permissions |
| PATCH | `/auth/profile` | session | Name/phone |
| POST | `/auth/change-password` | session | Revokes other sessions |
| GET/DELETE | `/auth/sessions`, `/auth/sessions/:id` | session | List/revoke devices |
| POST | `/auth/forgot-password`, `/auth/reset-password`, `/auth/verify-email` | public | Generic responses avoid enumeration |
| POST | `/auth/verify-email/resend` | session | |

Session cookie: `ds_session`, `HttpOnly`, `SameSite=Lax`, `Secure` in production, 30 days.

## Catalogue (public)

| Method | Path | Notes |
| --- | --- | --- |
| GET | `/categories` | Active tree with product counts |
| GET | `/categories/:slug` | Breadcrumbs, children, SEO fields |
| GET | `/collections`, `/collections/:slug` | Active/scheduled collections |
| GET | `/brands` | |
| GET | `/products` | `category, collection, brand, q, size, color, minPrice, maxPrice, inStock, sort, page, pageSize` |
| GET | `/products/facets` | Size/colour counts and price range for the current scope |
| GET | `/products/featured` | |
| GET | `/products/:slug` | Variants with per-warehouse availability, reviews, related, size guide |
| GET | `/products/:slug/reviews` | Paginated approved reviews |
| GET | `/variants/:id/availability` | Live available quantity |
| GET | `/search/suggestions?q=` | Products, categories, collections, popular terms (debounced client) |

Search uses PostgreSQL full-text (`to_tsvector`/`websearch_to_tsquery`) with ILIKE fallback on name/SKU. Filters are applied in the database; the browser never loads the whole catalogue.

## Cart and wishlist

| Method | Path | Notes |
| --- | --- | --- |
| GET | `/cart` | Creates a guest cart + `ds_cart` cookie if absent |
| POST | `/cart/items` | `{variantId, quantity}`; validates live stock |
| PATCH | `/cart/items/:id` | `{quantity}` |
| DELETE | `/cart/items/:id` | |
| DELETE | `/cart` | Clear |
| POST/DELETE | `/cart/coupon` | Apply/remove a code |
| POST | `/cart/merge` | Merge guest cart after login |
| GET | `/wishlist` | Auth |
| POST | `/wishlist/items` | `{productId, variantId?}` |
| DELETE | `/wishlist/items/:productId` | |
| POST | `/wishlist/items/:productId/move-to-cart` | Optional `{variantId}`, otherwise first in-stock |

## Checkout and payments

| Method | Path | Notes |
| --- | --- | --- |
| GET | `/checkout/config` | Enabled payment methods, return window |
| POST | `/checkout/quote` | `{couponCode?, shippingMethod?}`; authoritative totals |
| POST | `/checkout` | Address, shipping/payment method, `idempotencyKey` |
| POST | `/payments/sandbox/confirm` | `{reference, outcome, email?}`; ownership enforced |
| POST | `/payments/webhooks/sandbox` | HMAC header `x-dayshift-signature`, idempotent `eventId` |

Checkout errors: `409` when stock cannot be reserved (including the last unit), `422` for invalid coupons/address/state, `403` for another customer’s idempotency key or payment.

## Orders, returns, tracking

| Method | Path | Notes |
| --- | --- | --- |
| GET | `/orders` | Auth; filter by status, pagination |
| GET | `/orders/:orderNumber` | Auth; ownership enforced |
| POST | `/orders/lookup` | Public, throttled; `{orderNumber, email}` |
| GET | `/orders/track?orderNumber=&email=` | Shipment timeline |
| POST | `/orders/:orderNumber/cancel` | Allowed before packing; refunds if paid and restocks |
| POST | `/orders/:orderNumber/reorder` | Adds available items to cart |
| GET/POST | `/returns` | Customer return requests |
| GET | `/returns/:id` | Customer-owned detail |
| GET | `/support/tickets` … | Customer support |

Return creation validates the 30-day window, item quantities, duplicate active returns and exchange stock. Refunds happen only after inspection.

## Account

`GET /account/overview`, `/account/addresses` (CRUD), `/account/notifications` (read/read-all), `/account/loyalty`, `/account/export` (JSON data download), `/reviews` (create/helpful).

## Admin

All admin routes require a staff session and the listed permission.

| Area | Endpoints | Permission |
| --- | --- | --- |
| Dashboard | `GET /admin/dashboard?from=&to=` | `dashboard.read` |
| Products | `GET/POST /admin/catalog/products`, `GET/PATCH /admin/catalog/products/:id`, duplicate, archive, bulk, variants | `products.read/create/update/archive` |
| Taxonomy | categories/collections/brands CRUD | `categories.manage`, `collections.manage`, `brands.manage` |
| Inventory | `GET /admin/inventory`, movements, low-stock, adjust, transfer | `inventory.read/adjust/transfer` |
| Warehouses | CRUD | `warehouses.manage` |
| Suppliers / POs | CRUD, receive | `suppliers.manage`, `purchase_orders.manage` |
| Orders | list/detail, status, notes, cancel, create shipment, payment/refund lists | `orders.read/update/cancel`, `shipments.manage` |
| Shipments | `PATCH /admin/shipments/:id/status` | `shipments.manage` |
| Returns | list/detail, status transitions, refund | `returns.read/manage`, `refunds.create` |
| Customers | list, segments, detail, CRM update | `customers.read/update` |
| Tickets | list/detail/reply/internal note/update | `tickets.read/update` |
| Reviews | list, moderate | `reviews.moderate` |
| Coupons/promotions | list/create/update/toggle | `marketing.manage` |
| Loyalty | list, adjust points | `loyalty.manage` |
| Staff | list/create/update role/active | `staff.manage` |
| Roles | list, permissions, set permissions | `roles.manage` |
| Audit | list filter | `audit.read` |
| Settings | get/update | `settings.manage` |
| Reports | sales JSON + CSV export | `reports.read/export` |
| System | health, queues, counts | `system.read` |

### Example: create an order (guest)

```bash
curl -c cookies.txt -b cookies.txt -X POST http://localhost:4000/api/v1/cart/items \
  -H 'content-type: application/json' \
  -d '{"variantId":"<variant-id>","quantity":1}'

curl -c cookies.txt -b cookies.txt -X POST http://localhost:4000/api/v1/checkout \
  -H 'content-type: application/json' -d '{
    "email":"demo@example.com",
    "shippingAddress":{"firstName":"Demo","lastName":"Shopper","line1":"1 Test St","city":"Brooklyn","state":"NY","postalCode":"11201","country":"US"},
    "shippingMethod":"standard",
    "paymentMethod":"SANDBOX_CARD",
    "idempotencyKey":"demo-001"
  }'

curl -c cookies.txt -b cookies.txt -X POST http://localhost:4000/api/v1/payments/sandbox/confirm \
  -H 'content-type: application/json' -d '{"reference":"<providerRef>","outcome":"success","email":"demo@example.com"}'
```

Reusing the same `idempotencyKey` returns the original order; it cannot create a second order.
