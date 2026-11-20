# Business workflows

Plain-language operating rules. These are the source of truth for behaviour implemented in the API.

## 1. Discovery and catalogue

Customers browse by category tree (Women, Men, Unisex, Shoes, Bags, Accessories), collections (New Arrivals, Best Sellers, Essentials, Seasonal, Limited, Sale), or search. Only `ACTIVE` + `PUBLIC` products appear. Hidden, draft and discontinued products remain editable in admin but are invisible to customers.

A product has colour/size variants. Each variant has its own SKU, stock and optional price override. “Available” always means on-hand minus reserved minus damaged, summed across warehouses. Items with zero available show “Sold out” and cannot be added.

Prices displayed are current variant prices. Prices are re-read from the database at checkout; the browser never submits a price.

## 2. Cart and promotions

Guest carts are tied to an httpOnly cookie. On sign-in, the guest cart is merged into the account cart (quantities capped at 10), and the guest cookie is cleared.

Pricing rules:
1. Effective unit price = variant override, otherwise product price.
2. Automatic promotions do **not** stack. The single most valuable applicable promotion is applied order-wide, based on scope (all / category / product / collection) and minimum subtotal.
3. One coupon per order, applied after the automatic promotion, only to eligible lines. Coupons are capped by `maxDiscount` and eligible line value.
4. Shipping thresholds are measured after all discounts. Standard shipping is free over $150; express is never free.
5. Tax is a flat configured rate on discounted merchandise; shipping is not taxed.
6. Coupons enforce windows, total usage, per-customer usage, first-order-only and eligibility.

All of the above is computed server-side in integer cents. The cart shows an estimate; checkout is authoritative.

## 3. Checkout and inventory reservation

A checkout requires contact email, delivery address, shipping and payment method, and an idempotency key.

1. Revalidate cart, variants, prices and stock.
2. Recalculate discounts, shipping and tax.
3. Create order + immutable item snapshots (including discount and tax allocation).
4. Reserve stock for 15 minutes using conditional database updates. If any unit is unavailable, the whole transaction aborts with `409`.
5. Create a pending payment and convert the cart.
6. For card payments, the customer completes the sandbox screen.
7. For cash on delivery, the order starts at `PROCESSING`, stock is committed immediately, and payment stays pending until collected.

If payment fails or the reservation expires, stock is released and the order moves to `PAYMENT_FAILED` or `CANCELLED`.

## 4. Order fulfilment

Valid sequence: `PAID → PROCESSING → PICKING → PACKED → SHIPPED → OUT_FOR_DELIVERY → DELIVERED → COMPLETED`.

- Shipping without a shipment record is rejected.
- A shipment starts `READY_TO_SHIP`; carrier events move it through `PICKED_UP`, `IN_TRANSIT`, `OUT_FOR_DELIVERY`, `DELIVERED` (or failure states).
- Shipment events automatically update the order status where valid.
- Customers receive in-app updates and a shipping email (queued).
- Cancellation is allowed before packing. Paid orders are refunded and committed stock is restocked.

Every status change records actor, previous status, new status, reason and timestamp.

## 5. Returns and exchanges

Eligibility: delivered/completed order, within 30 days of delivery, unworn items with tags, no other active return, quantity not already returned/refunded.

Lifecycle:
`REQUESTED → UNDER_REVIEW → APPROVED → RETURN_SHIPPED → RECEIVED → INSPECTED → REFUND_PENDING → REFUNDED → CLOSED` (rejection/cancellation branches exist).

- Approval checks replacement stock for exchanges.
- Receiving records the parcel; it does **not** make stock sellable.
- Inspection restocks accepted items, increments returned quantities, and consumes exchange replacement stock.
- Refunds are calculated from the paid line value including allocated discount and tax. Shipping is not refunded unless the item was faulty.
- Refunds are capped by paid minus already-refunded and are staff-only.
- Returned inventory is never released before inspection.

## 6. Payments

Card payments use a local sandbox. A confirmed payment:
1. Marks the payment paid and the order paid.
2. Commits reservations into on-hand reductions and writes `SALE` movements.
3. Records coupon redemption (registered customers only).
4. Awards loyalty points once.
5. Queues the confirmation email.

Webhook events are HMAC-verified and idempotent by event id. A duplicate success cannot deduct stock twice or award points twice.

## 7. Refunds

Refunds are allowed for paid orders and inspected returns. The amount cannot exceed paid minus processed refunds. A refund creates an auditable record, updates payment and order payment status, emails the customer, and is visible in reports. Full refund makes the order `REFUNDED`; partial refund keeps the order in its return state with `PARTIALLY_REFUNDED` payment status.

## 8. Customers, CRM and support

Customers see only their own orders, addresses, returns, tickets, reviews and loyalty. Guest order lookup requires order number and email. Staff see customer profiles, spend (paid orders only), segments, tags and notes. Support replies are emailed; internal notes are never shown to customers. Ticket status: `OPEN → IN_PROGRESS → WAITING_FOR_CUSTOMER/INTERNAL → RESOLVED → CLOSED`.

## 9. Loyalty

1 point per $1 of discounted merchandise, excluding shipping and tax. 100 points = $5. Tiers: Bronze, Silver (500 lifetime), Gold (2000), Platinum (5000). Points are awarded once per paid order and are not duplicated by webhook retries. Adjustments are audited; redemption is API-backed and staff-assisted in the demo.

## 10. Inventory administration

- Stock-in/adjustment/damage/reconciliation write movements with previous and new balance.
- Warehouse transfers decrement the source and increment destination, with paired movements.
- Damaged stock reduces available but remains on hand.
- Receiving a purchase order writes stock-in for every line and marks the PO received.
- Low stock uses `available <= reorderPoint`; staff with inventory roles receive in-app alerts (deduplicated per variant/warehouse/day).

## 11. Role model

- Customers: own account, cart, orders, returns, reviews, tickets.
- Support: read orders/customers, manage tickets/returns, no staff/refund/price control.
- Warehouse: inventory, fulfilment, shipments/returns; no customers or marketing.
- Product manager: catalogue and content; read-only inventory.
- Marketing: collections, promotions, content, loyalty, reviews.
- Store manager: broad operations including refunds, but not role administration.
- Admin: everything except role permission management.
- Super admin: everything, including roles and settings.

The database is the ultimate authority for permissions; the UI mirrors them for usability only.
