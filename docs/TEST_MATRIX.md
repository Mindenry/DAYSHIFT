# Test Matrix

Status reflects the audited, remediated code. Evidence is a command, test name or file.

| Feature | Scenario | Expected | Actual | Type | Status |
| --- | --- | --- | --- | --- | --- |
| Catalogue | Category tree/products render | 200 with data | 200 | E2E/API | PASS |
| Catalogue | URL filters, facets, sort, pagination | Filtered DB results | Verified | API/E2E | PASS |
| Catalogue | Search full text + SKU | Relevant results | “linen” returns shirt | E2E | PASS |
| Product | Variant stock/price updates | Only in-stock variant purchasable | Verified | API/E2E | PASS |
| Cart | Guest add/update/remove | Server totals | Verified | API/E2E | PASS |
| Cart | Coupon valid/invalid | Apply or inline error | Verified | API/E2E | PASS |
| Cart | Login merges guest cart | One account cart | Verified | API | PASS |
| Checkout | Quote/tax/shipping totals | Integer-cent authoritative | Unit + API | PASS |
| Checkout | Full guest purchase | Order + sandbox payment | E2E 7/7 | E2E | PASS |
| Checkout | Idempotent retry | Same order, no duplicate | API smoke | API | PASS |
| Inventory | Last unit race | 1 success / 1 conflict | 1/1 | Integration | PASS |
| Inventory | Negative/reserved invariants | Never invalid | 0 anomalies SQL | DB | PASS |
| Inventory | Adjustment/transfer/movements | Audited movement | UI/API verified | API/E2E | PASS |
| Payment | Success/failure | Correct order/payment state | Verified | API/E2E | PASS |
| Payment | Duplicate webhook | One effect | duplicate:true | Smoke | PASS |
| Payment | Invalid/missing signature | 401 | 401/401 | Integration | PASS |
| Payment | Manual unpaid → paid | Rejected | 422 | Integration | PASS |
| Orders | Status machine valid/invalid | Controlled transitions | Unit + API | PASS |
| Orders | Shipment to delivered | Tracking + order delivered | Integration | PASS |
| Orders | Manual delivered without shipment | Rejected | Guard added | Code | PASS |
| Orders | Customer cancel | Release/refund/restock once | Verified | API | PASS |
| Returns | Request → approve → receive → inspect → refund | Correct states/stock | Integration | PASS |
| Returns | Direct REFUNDED without refund | Rejected | 422 | Integration | PASS |
| Returns | Concurrent refund | Exactly once | 1 success/1 reject | Integration | PASS |
| Returns | Restock after inspection | +1 on returned SKU | Verified | Integration | PASS |
| Exchange | Request, approve, inspect, close | Returned +1, replacement −1, no refund | 8/8 | Exchange test | PASS |
| Coupons | Guest first-order reuse | Rejected on same email | 422 | Integration | PASS |
| Loyalty | Award once per paid order | No duplicate | Code + payment idempotency | API | PASS |
| Reviews | Verified purchase, moderation | Only buyer; pending/approved | Code/UI | PARTIAL (not E2E) |
| Support | Customer ticket, staff reply, status | Internal notes hidden | Code/UI | PASS (manual) |
| RBAC | Support blocked from staff/refunds | 403 | 403 | Integration | PASS |
| IDOR | Other customer order | 404 | 404 | Integration | PASS |
| Categories | Cycle prevention | 422 | 422 | Integration | PASS |
| XSS | Malicious product name in JSON-LD | Escaped | No script breakout | Integration + unit | PASS |
| Accessibility | Home/product/cart/mobile/admin | No serious Axe issues | 0/0/0/0/0/0 | Axe | PASS |
| Worker | Email queue/delivery/retry | Immediate `.eml` | Completed jobs | Runtime | PASS |
| Worker | Reservation expiry | Releases once | Shared logic, not time-waited | Code | PARTIAL |
| Worker | Daily reconcile | Corrects payment status | Code, not schedule-waited | Code | PARTIAL |
| Docker | API image + health | 200 | 200 | Docker | PASS |
| Docker | Web/admin + API proxy | 200 | 200/200 | Docker | PASS |
| Docker | Worker image starts | Ready log | Ready | Docker | PASS |
| Docker | Full compose app profile | All services | Six containers running, LAN HTTP verified | Docker | PASS |
| CI | YAML + steps | Valid/reproducible | YAML valid, not run remotely | Static | PARTIAL |
| Builds | API/worker/web/admin | Pass | All pass | Build | PASS |

## Failure scenarios verified

- Two buyers, last unit → one order.
- Same checkout key twice → one order.
- Same webhook event twice → one transition.
- Two refund requests → one refund.
- Another customer’s order → 404.
- Support account → 403 for staff/refund.
- Unpaid order forced paid → 422.
- Product name with `</script>` → escaped.
