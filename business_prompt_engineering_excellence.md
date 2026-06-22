# Multi-tenant modular SaaS platform — engineering excellence build prompt

You are acting as a **Senior Product Manager**, **Senior Software Engineer**, and **Senior UI/UX Designer** with 10+ years shipping production SaaS platforms. Build a multi-tenant SaaS system modelled on Odoo's architecture, implementing **only** the modules listed below, to the engineering standard of a well-run platform team — not a prototype.

This document is structured in two parts:

- **Part A** — the product and module scope (what to build)
- **Part B** — the 30 engineering-excellence requirements (how to build it), each mapped to concrete file paths, patterns, and acceptance criteria so nothing is left to interpretation

---

## ACTIVE MODULES

| Status | Module | Scope |
|---|---|---|
| Core | `core/auth` | Organisations, users, sessions, roles, RBAC, audit logs |
| Core | `core/settings` | Billing, subscription, module manager, white-label, theme |
| Core | `core/ui` | Layout shell, sidebar, topbar, notifications, theme engine |
| Optional | `inventory` | Items, SKUs, variants, stock ledger, warehouses, adjustments, reorder |
| Optional | `purchases` | Vendors, RFQs, purchase orders, goods receipts, vendor bills |
| Optional | `sales` | Customers, quotations, sales orders, invoices, credit notes |
| Optional | `crm` | Leads, pipelines, activities, contacts, deal tracking |
| Optional | `reports` | Dashboard builder, custom reports, scheduled exports, KPIs |

**Excluded — do not scaffold, reference, or create placeholder files for:** `accounting`, `projects`, `hr`, `helpdesk`, `ecommerce`.

## STACK

```
Framework   Next.js — App Router, React Server Components, Server Actions
Language    TypeScript strict mode — no `any`, no unexplained type assertions
Database    PostgreSQL 15 via Prisma ORM — RLS enabled
Auth        NextAuth.js v5 (Auth.js) — credentials + Google + Microsoft OAuth
Sessions    Redis (Upstash) — signed session ID in cookie, payload in Redis
Validation  Zod everywhere — .strict() on all inputs
Queue       BullMQ + Redis — email, PDF export, CSV import, scheduled reports
Files       AWS S3 / Cloudflare R2 — uploads via signed-URL Server Action only
UI          Tailwind CSS v3 + shadcn/ui + Radix UI — CSS vars for tenant theming
Testing     Vitest (unit/integration) + Playwright (e2e)
Lint/Format ESLint + Prettier + commitlint + Husky pre-commit hooks
CI/CD       GitHub Actions — lint, type-check, test, audit, build, deploy gates
Docs        TypeDoc (code) + Storybook (UI components) + ADR log (decisions)
```

---

# PART A — MULTI-TENANCY & MODULE SYSTEM

## Tenant model

```
organisations   (id, name, slug, plan, status, created_at)
users           (id, email, password_hash, mfa_secret, mfa_enabled)
org_members     (id, org_id, user_id, role, permissions JSONB, invited_at, joined_at)
org_modules     (id, org_id, module_name, enabled, installed_at, settings JSONB)
domains         (id, org_id, domain, verified, primary)
```

Next.js middleware resolves tenant from the `Host` header (subdomain or custom domain), attaches `orgId` + `tenantSlug` to request headers. Unknown tenant → 404. Unverified custom domain → suspended page.

## Five-layer tenant isolation (all mandatory)

1. **Middleware** rejects any request with no resolved `orgId`.
2. **`requireAuth()`** reads `orgId` from the Redis session only — never from client payload.
3. **PostgreSQL RLS** — every table: `USING (org_id = current_setting('app.current_org_id'))`. Prisma sets this on connection via `$executeRaw`.
4. **Prisma query scoping middleware** — throws if `orgId` is missing on any read or write.
5. **Audit log** — inserted in the same `$transaction` as every write. Append-only (RLS denies UPDATE/DELETE on this table).

## Module system contract (Odoo-style)

```
/modules/[name]/
  manifest.ts        { name, version, label, icon, dependencies[], permissions[] }
  routes/            Next.js API route handlers
  pages/             App Router pages
  services/          business logic — server-only
  schemas/           Prisma schema fragment + Zod schemas
  permissions.ts     permission map
  events.ts          EventBus subscriptions
```

- Modules **never** import from each other directly — only via a typed `EventBus`.
- `org_modules.enabled` is checked at middleware level before resolving any module route.
- Disabling a module → 404 on its routes, hidden from sidebar, **data untouched**. Re-enabling restores everything immediately.
- Dependent modules auto-disable (with a UI warning) if a dependency is turned off.

## Module specifications

### `inventory`
**Schema:** `items`, `item_variants`, `item_categories`, `units`, `warehouses`, `stock_ledger` (append-only), `stock_balances` (materialised view), `stock_adjustments`, `transfers`
**Workflow:** Reorder rule triggers `inventory.stock_low` event → low-stock notification, optional auto-draft PO.
**Events emitted:** `inventory.stock_low`, `inventory.adjustment_created`, `inventory.transfer_completed`

### `purchases` (depends on `inventory`)
**Schema:** `vendors`, `purchase_orders`, `po_lines`, `goods_receipts`, `gr_lines`, `vendor_bills`
**Workflow:** Draft → Send → Confirm → GRN (partial allowed, creates stock_ledger receipt entries) → Bill → Paid.
**Events emitted:** `purchases.grn_completed`, `purchases.po_overdue`

### `sales` (depends on `inventory`)
**Schema:** `customers`, `quotations`, `sales_orders`, `so_lines`, `invoices`, `credit_notes`, `delivery_notes`
**Workflow:** Quotation → Accept → Sales Order → Pick/Pack → Ship (stock_ledger sale entry) → Invoice → Paid. Returns issue a credit note + stock reversal.
**Events emitted:** `sales.order_confirmed`, `sales.order_shipped`, `sales.invoice_overdue`

### `crm`
**Schema:** `contacts`, `leads`, `pipelines`, `pipeline_stages`, `activities`, `crm_notes`
**Workflow:** Lead → Pipeline stage progression → Won (creates customer via EventBus) / Lost.
**Events emitted:** `crm.lead_won`, `crm.lead_lost`

### `reports`
**Schema:** `report_definitions`, `report_exports`, `dashboard_widgets`, `dashboards`
**Built-ins:** stock valuation, low-stock, spend by vendor, revenue by period, pipeline summary, ageing reports.
**Builder:** drag-and-drop 12-column dashboard grid; custom report builder with column/filter/sort selection and live preview; scheduled exports via BullMQ → email.

---

# PART B — ENGINEERING EXCELLENCE REQUIREMENTS

Each of the 30 requirements below is **mandatory** and must be demonstrably satisfied in the delivered codebase — not just mentioned in a README.

### 1. Clear and consistent project structure

```
/app                          Next.js App Router — routing only, no business logic
  /[tenant]/(dashboard)/[module]/   thin pages — compose UI + call services
  /admin                       super-admin panel (separate auth context)
  /auth                        login, register, MFA, OAuth callbacks
  /api/v1/[...route]           REST handlers — delegate to services immediately
/modules/[name]                see module contract above — identical shape every time
/lib
  /auth                        requireAuth, requirePermission, session, mfa
  /db                          Prisma singleton, orgId + soft-delete middleware
  /events                      typed EventBus
  /modules                     registry, manifest loader, enablement checker
  /theme                       org_settings → CSS var resolver
  /queue                       BullMQ workers and job definitions
  /validations                 Zod schemas, one file per module domain
  /security                    rateLimit, csrf, headers, audit
  /errors                      AppError hierarchy, error mapper (see #7)
  /logger                      structured logger (see #18)
  /config                      typed config loader (see #4)
  /di                          dependency injection container (see #12)
/packages                      internal shared packages (see #13)
  /ui-kit                      shared design-system components
  /core-types                  shared TypeScript types/interfaces across modules
  /api-client                  typed fetch client for the REST API
/tests
  /unit  /integration  /e2e
/docs
  /adr                         architecture decision records (see #30)
  /api                         OpenAPI spec + generated reference
/.github/workflows             CI/CD pipelines
```

**Rule:** every module folder has the identical 7-file shape. A new engineer should be able to predict file locations without being told.

### 2. Extract repeated logic into reusable functions/services

- Each module's `services/` layer holds business logic — **services call other services within the same module only**; cross-module logic goes through `EventBus`.
- Anything used by 2+ modules (currency formatting, address validation, pagination cursor logic, CSV parsing, PDF header generation) is promoted to `/lib/utils/` or a `/packages/` library — never copy-pasted.
- **Acceptance check:** a `jscpd` (copy-paste detector) run in CI fails the build above a 3% duplication threshold.

### 3. Separate API, business logic, and data access layers

Strict three-layer separation, enforced by import boundaries (see #15):

```
Route handler / Server Action   → validates input (Zod), calls service, maps response
        ↓ calls
Service layer (services/*.ts)   → business logic, orchestration, emits events
        ↓ calls
Repository layer (repositories/*.ts) → Prisma queries only, no business logic
```

- Route handlers never call Prisma directly.
- Services never construct HTTP responses.
- Repositories never contain conditional business rules — only data shape and queries.

### 4. Centralize configuration and environment variables

`/lib/config/index.ts` exports a single typed, validated config object built from `process.env` via Zod at startup:

```ts
const envSchema = z.object({
  DATABASE_URL: z.string().url(),
  REDIS_URL: z.string().url(),
  NEXTAUTH_SECRET: z.string().min(32),
  S3_BUCKET: z.string(),
  // ...
}).strict();

export const config = envSchema.parse(process.env); // throws on boot if invalid
```

No file outside `/lib/config` reads `process.env` directly — enforced via an ESLint rule (`no-process-env` with an override only for `lib/config/index.ts`).

### 5. Shared components: logging, notifications, validation

- **Logging:** `/lib/logger` — single structured logger (see #18), imported everywhere, never `console.log` in application code (ESLint `no-console` error-level).
- **Notifications:** `/modules/core/ui/services/notification.service.ts` — single entry point (`notify.send(orgId, userId, payload)`) used by all modules; persists to `notifications` table, pushes via SSE, optionally queues email.
- **Validation:** `/lib/validations/shared/` — common Zod fragments (email, phone, money, pagination, date range) composed into module-specific schemas. Never redefine an email regex twice.

### 6. Define interfaces/contracts for replaceable implementations

Every infrastructure dependency is behind an interface so the implementation can be swapped without touching callers:

```ts
// lib/storage/interface.ts
interface FileStorage {
  getUploadUrl(key: string, mime: string): Promise<string>;
  getDownloadUrl(key: string): Promise<string>;
  delete(key: string): Promise<void>;
}
// lib/storage/s3.ts implements FileStorage
// lib/storage/r2.ts implements FileStorage (alternative)
```

Apply the same pattern to: `EmailSender`, `FileStorage`, `Queue`, `CacheStore`, `PaymentGateway` (Stripe/Paystack), `NotificationChannel`. Services depend on the interface, the DI container (#12) binds the concrete implementation.

### 7. Standardize error handling and exception management

`/lib/errors/` defines a typed error hierarchy:

```ts
class AppError extends Error { constructor(public code: string, message: string, public httpStatus: number, public meta?: Record<string, unknown>) { super(message); } }
class ValidationError extends AppError { /* 400 */ }
class AuthError extends AppError        { /* 401 */ }
class ForbiddenError extends AppError   { /* 403 */ }
class NotFoundError extends AppError    { /* 404 */ }
class ConflictError extends AppError    { /* 409 */ }
class RateLimitError extends AppError   { /* 429 */ }
```

- A single error-mapping middleware in API routes / Server Actions catches `AppError` subclasses and returns a consistent JSON shape: `{ error: { code, message, requestId } }`. Unknown errors are logged with full stack trace and returned as a generic 500 — **internal details never leak to the client.**
- Every error includes a `requestId` correlating to the structured log entry (see #18).

### 8. Implement automated unit and integration tests

- **Unit tests (Vitest):** every service method, validator, utility function, and event handler. Target ≥80% coverage on `/lib` and `/modules/*/services`.
- **Integration tests (Vitest + test database):** repository layer against a real (dockerised) Postgres instance — verifies RLS policies actually deny cross-tenant reads.
- **E2E tests (Playwright):** critical paths — login + MFA, item → PO → GRN → stock update, quotation → order → invoice, module disable/re-enable data persistence.
- CI fails the build if coverage drops below the configured threshold (`vitest --coverage` with `--coverage.thresholds.lines=80`).

### 9. Build reusable utility/helper libraries

`/lib/utils/` — pure, side-effect-free functions only, each unit-tested in isolation:
`money.ts` (formatting, currency conversion rounding), `dates.ts` (timezone-safe formatting), `pagination.ts` (cursor encode/decode), `slug.ts`, `csv.ts`, `pdf-header.ts`, `id.ts` (cuid2 wrapper).
**Rule:** a utility function never imports Prisma, never reads `config`, never throws `AppError` — it throws plain errors or returns a `Result<T, E>` type.

### 10. Enforce coding standards with linters and formatters

```
ESLint    — typescript-eslint strict + plugin:react-hooks + import/order +
            custom rules: no-cross-module-import, no-process-env, no-console
Prettier  — single quotes, trailing commas, 100-char width
Husky     — pre-commit: lint-staged (eslint --fix, prettier --write) + type-check
commitlint — Conventional Commits enforced on commit-msg hook
```
CI re-runs lint and type-check on every PR — local hook bypass does not bypass CI.

### 11. Maintain comprehensive documentation

- **Code-level:** TSDoc comments on every exported service method and complex function → generated into a browsable reference via TypeDoc, published as a CI artifact.
- **API-level:** OpenAPI 3.1 spec for all `/api/v1` routes, kept in sync via a CI check that diffs the spec against route handler signatures.
- **UI-level:** Storybook for every component in `/packages/ui-kit`, documenting props, states, and variants.
- **Project-level:** root `README.md` (setup, env vars, running locally, adding a new module), `/docs/adr/` (see #30), `/docs/runbooks/` (incident response, rollback procedure).

### 12. Use dependency injection for loose coupling

A lightweight DI container (`/lib/di/container.ts`, e.g. using `tsyringe` or a minimal hand-rolled registry) binds interfaces (#6) to implementations at startup:

```ts
container.register<FileStorage>('FileStorage', { useClass: S3Storage });
container.register<EmailSender>('EmailSender', { useClass: ResendSender });
```

Services receive dependencies via constructor injection, never via direct `import { s3Client } from '...'`. This makes every service trivially testable with mock implementations injected in unit tests.

### 13. Create reusable internal packages/modules

`/packages/` holds code shared across the whole monorepo, versioned independently:
- `ui-kit` — shared design-system primitives (buttons, inputs, cards, tables) built once, consumed by every module's `pages/`.
- `core-types` — shared TypeScript types/interfaces (e.g. `Money`, `Address`, `PaginatedResult<T>`) so modules agree on shapes without circular imports.
- `api-client` — typed fetch wrapper for the REST API, used by any future mobile app or external integration.

Each package has its own `package.json`, is built and versioned independently (npm workspaces or Turborepo), and is consumed via workspace protocol (`workspace:*`).

### 14. Implement CI/CD pipelines

`.github/workflows/`:
```
ci.yml        on PR: install → lint → type-check → unit tests → integration tests
              → build → npm audit + Snyk (blocks on high-severity CVE)
e2e.yml       on PR (label-gated) + nightly: Playwright against a preview deploy
deploy.yml    on merge to main: build → run Prisma migrations → deploy → smoke test
              → automatic rollback on smoke-test failure
release.yml   tag-based: version bump + changelog generation for /packages
```
Preview deployments per PR (Vercel or equivalent) for manual QA before merge.

### 15. Define clear architectural boundaries

Enforced with `eslint-plugin-boundaries` (or dependency-cruiser):
- `app/*` may import from `modules/*` and `lib/*`, never the reverse.
- `modules/[a]/*` may **not** import from `modules/[b]/*` (cross-module communication is EventBus-only).
- `lib/db` (Prisma) is only imported by `repositories/*` files — services never import Prisma directly.
- `packages/ui-kit` has zero dependency on `lib/db`, `lib/auth`, or any module — pure presentational.
CI runs a boundary-check step that fails the build on violation.

### 16. Centralize authentication and authorization

- **Single auth entry point:** `requireAuth(role?)` and `requirePermission(module, action)` in `/lib/auth/` are the *only* sanctioned way to check identity/permission — no module re-implements session checks.
- All Server Actions and API routes call one of these as their first line.
- RBAC permission map is defined once per module (`permissions.ts`) and aggregated centrally by `core/auth` into the session payload at login — modules don't maintain their own permission logic.

### 17. Apply consistent security practices

Single `/lib/security/` module applied uniformly:
- `headers.ts` — HSTS, CSP, X-Frame-Options, etc., applied once in `next.config.js`, not per-route.
- `rateLimit.ts` — one Redis-backed limiter used by auth, API write, API read, and upload endpoints with different configs, not four different implementations.
- `csrf.ts` — Server Action built-in protection relied upon; REST `Origin` header validation centralized in API middleware.
- `audit.ts` — single `recordAudit()` function called inside every write transaction across every module — no module writes its own audit row format.

### 18. Introduce logging, monitoring, and observability

- **Structured logging:** `/lib/logger` (pino or equivalent) — every log line is JSON with `{ level, message, requestId, orgId, userId, module, timestamp }`. No PII or secrets logged (enforced by a redaction transform).
- **Request tracing:** every request gets a `requestId` (UUID) attached in middleware, threaded through logger calls and returned in error responses for support correlation.
- **Metrics:** OpenTelemetry instrumentation — request duration, DB query duration, queue job duration, exported to a backend (e.g. Grafana/Prometheus or Datadog).
- **Error tracking:** Sentry (or equivalent) wired into the global error boundary and the API error mapper (#7), with `orgId`/`userId`/`requestId` as tags — never raw request bodies.
- **Health checks:** `/api/health` (liveness) and `/api/health/ready` (readiness — checks DB + Redis connectivity) for the deployment platform.

### 19. Optimize database design and access patterns

- Composite indexes on every `(org_id, <frequently filtered column>)` pair — e.g. `(org_id, sku)`, `(org_id, status, created_at)`.
- `stock_ledger` is append-only (event-sourced) with a materialised `stock_balances` view refreshed via trigger or scheduled job — avoids recalculating balances from the full ledger on every read.
- N+1 query prevention: Prisma `include`/`select` reviewed in PR; a `prisma-query-log` dev tool flags repeated identical queries in a request.
- Connection pooling via PgBouncer (or Prisma Accelerate) sized for serverless concurrency.
- Soft-delete (`deleted_at`) columns indexed as partial indexes (`WHERE deleted_at IS NULL`) to keep hot-path queries fast as data grows.

### 20. Conduct regular technical debt reviews

- A `docs/tech-debt.md` log where any deliberate shortcut is recorded at the time it's taken, with a one-line reason and a suggested follow-up.
- A recurring (e.g. monthly) calendar-tracked review item — not enforced by code, but the repo structure supports it: CI posts a comment on PRs that introduce a `// TODO(debt):` tagged comment, aggregating them into a dashboard.
- `eslint-plugin-no-todo` warns (not errors) on stale TODOs older than a configurable threshold via a custom script in CI.

### 21. Adopt code review and pull request workflows

- Branch protection on `main`: minimum 1 approval, all CI checks green, no direct pushes.
- PR template (`.github/pull_request_template.md`) requiring: summary, related issue, screenshots for UI changes, test coverage confirmation, checklist for security-sensitive changes (auth, RLS, permissions).
- CODEOWNERS file routing module-specific PRs to the relevant owners automatically.

### 22. Use versioning for APIs and shared libraries

- REST API is versioned in the URL path (`/api/v1/...`); breaking changes ship as `/api/v2/...` with the old version maintained until deprecation date communicated in the OpenAPI spec.
- `/packages/*` use semantic versioning (`semver`) with changesets (e.g. `@changesets/cli`) generating changelogs automatically on release.
- Database migrations are versioned and forward-only (Prisma Migrate) — no destructive migration without a corresponding data-backfill script reviewed separately.

### 23. Implement feature flags for controlled releases

- `org_modules.settings` JSONB already supports per-tenant feature toggles within an enabled module (e.g. enabling the dashboard builder only for paid plans).
- A lightweight feature-flag service (`/lib/flags/`) backed by a `feature_flags` table (`key, org_id, enabled, rollout_percentage`) — checked via `isFeatureEnabled(flagKey, orgId)`, allowing percentage rollout and per-tenant override without a redeploy.
- New, risky functionality (e.g. a new costing method) ships behind a flag defaulted to off, enabled gradually.

### 24. Design for scalability and future extensibility

- Stateless application layer (Next.js + Redis sessions) — horizontally scalable behind a load balancer with zero session affinity required.
- BullMQ workers run as a separate deployable process from the web app — can be scaled independently under load (e.g. report generation spikes).
- The module system itself **is** the extensibility mechanism — a new module (e.g. future `accounting`) is added without modifying any existing module's code, only the registry.
- Database partitioning strategy documented for `stock_ledger` and `audit_logs` (the two highest-growth append-only tables) — e.g. partition by `org_id` range or by month, ready to activate when volume warrants it.

### 25. Follow SOLID principles and clean code practices

- **S**ingle responsibility — services do one thing (`InventoryStockService` vs `InventoryReorderService`, not one giant `InventoryService` god-object).
- **O**pen/closed — new movement types extend `stock_ledger.movement_type` enum and a strategy map, without modifying existing movement-handling code.
- **L**iskov substitution — all `FileStorage` implementations (#6) are fully interchangeable; no implementation throws on a method another implementation supports.
- **I**nterface segregation — `requirePermission` interfaces are scoped per module/action, not one giant permissions blob services must depend on entirely.
- **D**ependency inversion — services depend on interfaces (#6), injected via the DI container (#12), never on concrete infra classes.
- Functions are small, named for what they do, and avoid boolean-flag parameters that change behaviour (split into two functions instead).

### 26. Standardize naming conventions across the codebase

```
Files          kebab-case.ts        (stock-ledger.service.ts)
Components     PascalCase.tsx       (ItemTable.tsx)
Variables/fns  camelCase            (calculateReorderPoint)
Types/Interfaces PascalCase, no `I` prefix  (StockLedgerEntry, not IStockLedgerEntry)
DB tables      snake_case, plural   (stock_ledger, purchase_orders)
DB columns     snake_case           (created_at, org_id)
Env vars       SCREAMING_SNAKE_CASE (DATABASE_URL)
Event names    module.past_tense_event (inventory.stock_low, sales.order_confirmed)
Branches       type/short-description (feat/inventory-reorder-rules)
```
Documented once in `/docs/coding-guidelines.md` (#29), enforced where possible by ESLint naming-convention rules.

### 27. Remove dead code and unused dependencies

- `ts-prune` (or `knip`) run in CI to flag unused exports.
- `depcheck` run in CI to flag unused npm dependencies.
- A module that is permanently disabled and deprecated (not just toggled off per-tenant) is archived in `/modules/_archived/` with a removal date noted in an ADR (#30), not left live in the active tree.
- PR review checklist (#21) includes "removed any code this PR makes obsolete."

### 28. Create reusable UI components (frontend)

- `/packages/ui-kit` holds every primitive (Button, Input, Select, Card, Table, Modal, Badge, Toast, Skeleton, DataTable with sort/filter/pagination) built once against the white-label CSS variable theme (`--brand-primary`, etc.).
- Module pages compose `ui-kit` components — they never redefine a button or input style locally.
- Each component documented in Storybook (#11) with all states (default, hover, focus, disabled, loading, error, empty) as required by the design-system standards already established for this platform.
- Components ship with Vitest + Testing Library tests for behaviour (not just snapshot tests).

### 29. Define coding guidelines and development standards

`/docs/coding-guidelines.md` covers:
- The layered architecture (#3) and how to add a new module correctly.
- Naming conventions (#26), error handling pattern (#7), and the DI pattern (#12) with a worked example.
- "How to add a new module" step-by-step guide, since the module contract (Part A) is the platform's core extensibility point.
- PR checklist, branching strategy, and release process references.

### 30. Maintain an architecture decision record (ADR)

`/docs/adr/0001-use-postgres-rls-for-tenant-isolation.md` style log, one file per significant decision, using the standard ADR format (Context / Decision / Status / Consequences). Required entries for this build, at minimum:

```
0001  Choosing PostgreSQL RLS + Prisma scoping for tenant isolation (vs. schema-per-tenant)
0002  EventBus pattern for inter-module communication (vs. direct imports)
0003  Redis-backed sessions vs. JWT-in-cookie
0004  Module enable/disable as soft-toggle vs. uninstall-and-reinstall
0005  Choice of queue technology (BullMQ) and what runs on it
0006  Multi-currency strategy (store both org and customer currency + exchange rate snapshot)
0007  Costing method implementation (FIFO/FEFO/LIFO) and where it's calculated
```
Every future decision that changes architecture, swaps a core dependency, or reverses an earlier ADR gets a new numbered entry — existing ADRs are never edited, only superseded.

---

# DELIVERABLES — BUILD IN THIS ORDER

| # | Deliverable |
|---|---|
| 1 | Monorepo scaffold — workspaces, `/packages` skeleton, ESLint/Prettier/Husky/commitlint config |
| 2 | Prisma schema — all tables, relations, indexes, RLS policies, soft-delete |
| 3 | `/lib/config` — typed env loader with startup validation |
| 4 | `/lib/errors` — AppError hierarchy + API error mapper |
| 5 | `/lib/logger` — structured logger + request ID middleware |
| 6 | `/lib/di` — DI container + interfaces for FileStorage, EmailSender, Queue, PaymentGateway |
| 7 | Module manifest type + registry loader + enablement checker |
| 8 | Next.js middleware — tenant resolver + module guard + security headers |
| 9 | NextAuth.js v5 config — credentials + OAuth + MFA TOTP flow |
| 10 | `requireAuth` + `requirePermission` (centralized auth, #16) |
| 11 | Redis session manager + centralized rate limiter (#17) |
| 12 | Audit logging service — single `recordAudit()`, used everywhere |
| 13 | Typed EventBus — module isolation enforcement |
| 14 | Theme engine — `org_settings` → CSS custom properties, injected server-side |
| 15 | `/packages/ui-kit` — shared component library with Storybook |
| 16 | Core/UI shell — sidebar, topbar, notification drawer, toast system |
| 17 | Module: `inventory` — schema → validations → service → repository → routes → UI |
| 18 | Module: `purchases` — same layered sequence |
| 19 | Module: `sales` — same layered sequence |
| 20 | Module: `crm` — same layered sequence |
| 21 | Module: `reports` — dashboard builder + custom report builder + scheduled exports |
| 22 | `core/settings` — module manager UI, white-label settings, billing, team management |
| 23 | Super-admin panel — org list, plan management, impersonate, global audit log |
| 24 | OpenAPI 3.1 spec + TypeDoc generation wired into CI |
| 25 | Observability — OpenTelemetry, Sentry, `/api/health` endpoints |
| 26 | Feature flag service + `feature_flags` table |
| 27 | Vitest unit + integration tests (≥80% coverage on `/lib` and services) |
| 28 | Playwright e2e — auth+MFA, inventory→PO→GRN, quotation→order→invoice, module disable/re-enable |
| 29 | CI/CD pipelines — `ci.yml`, `e2e.yml`, `deploy.yml`, `release.yml` |
| 30 | Docs — README, coding guidelines, ADR log (seed the 7 required entries), runbooks |

**Within each module deliverable (17–21), implement in this exact sequence:**
`Prisma schema fragment → Zod validations → repository layer → service layer → EventBus wiring → API routes → Server Actions → list page → detail page → create/edit form → permission guards → unit tests → e2e test`.

## Ground rules

- Do not scaffold excluded modules or leave placeholder files for them.
- Every requirement in Part B must be satisfied in the actual delivered code, not described as a future improvement.
- Use Odoo's UX and field-naming conventions as the behavioural reference for ambiguous business rules.
- Proceed without asking clarifying questions unless a business rule is genuinely ambiguous — default to the sensible Odoo-equivalent behaviour.