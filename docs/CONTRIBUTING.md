# Contributing

## Ground rules

1. Money and inventory are authoritative on the server. Never accept prices, totals or stock from the browser.
2. Financial history is immutable. Do not delete orders, payments, refunds or audit entries.
3. Every stock change writes an `InventoryMovement`.
4. New order transitions must be added to `packages/config/src/order-state.ts` and covered by tests.
5. Permissions are enforced on the API. Hiding a button is not authorization.
6. Do not mock the database in integration paths; use the real PostgreSQL schema.

## Setup

See README or ENVIRONMENT.md. Run `pnpm typecheck`, `pnpm lint`, `pnpm --filter @dayshift/api test` before opening a PR.

## Architecture boundaries

- Controllers: HTTP shape, validation DTOs, permissions.
- Services: business workflow and transactions.
- `domain/`: pure logic (pricing, state machine) with unit tests.
- `packages/db`: schema, migrations, seed, shared reservation expiry.
- Frontends call the API; no business logic is duplicated in components.

## Migrations

```bash
# edit packages/db/prisma/schema.prisma
pnpm --filter @dayshift/db exec prisma migrate dev --name meaningful_name
pnpm --filter @dayshift/db generate
```

Commit the migration SQL. Destructive migrations require a backup/restore plan and a documented rollback.

## Tests

- Add pricing/state cases to `apps/api/src/domain/*.spec.ts`.
- Add cross-service behaviour to `scripts/integration-test.mjs`.
- Add user-visible flows to `tests/e2e/specs`.
- Do not weaken assertions to make a flaky test pass; fix timing or state setup.

## Style

- TypeScript strict; no `any` added without reason.
- Prettier (`pnpm format`), ESLint flat config.
- Admin: dense, operational, permission-aware. Storefront: editorial, accessible, no dead controls.
- Accessible labels on icon buttons; visible focus; keyboard-operable dialogs.

## Commits

Conventional-ish prefixes: `feat:`, `fix:`, `test:`, `docs:`, `chore:`, `refactor:`. Keep commits coherent; do not mix migrations with unrelated UI changes.

## Security

Follow `docs/SECURITY.md`. Report vulnerabilities privately. Never commit `.env` files, credentials, customer data or real card numbers.
