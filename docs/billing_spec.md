# SimpliERP — Pricing, Plans & Billing Module Build Prompt

> Copy this entire document into your AI coding tool (Claude Code, Cursor, etc.) as the spec for implementing the subscription/billing layer of SimpliERP.

---

## Role & context

You are implementing the **subscription, plan-limits, and billing module** for SimpliERP, a multi-tenant SaaS ERP platform for small and growing Nigerian businesses.

**Stack:**
- Next.js 14 (App Router), TypeScript strict mode
- PostgreSQL + Prisma ORM
- Multi-tenant architecture using Postgres Row-Level Security (RLS) — every tenant-scoped table includes `tenant_id`
- RBAC already implemented at the tenant level — this module must respect existing role checks, not bypass them
- Payments: Paystack (subscriptions, plan codes, webhooks)
- Notification channels: email (Resend), WhatsApp/SMS (provider TBD — abstract behind an interface)

Build this as a self-contained module (`/lib/billing/`, `/lib/plans/`) that the rest of the app calls into. Do not scatter quota-checking logic across feature code — centralize it.

---

## 1. Plan definitions (source of truth)

Define these as a typed constant (`PLAN_DEFINITIONS`), not as hardcoded magic numbers scattered in code. This object is the single source of truth and should also seed the `plans` database table on deploy.

```ts
type PlanTier = "free" | "starter" | "growth" | "business" | "enterprise";

interface PlanLimits {
  maxUsers: number | null;        // null = unlimited
  maxLocations: number | null;
  maxActiveSkus: number | null;
  maxInvoicesPerMonth: number | null;
  reportHistoryDays: number | null;
  modules: ModuleKey[];           // which ERP modules are unlocked
  approvalWorkflows: boolean;
  apiAccess: boolean;
  whiteLabel: boolean;
  supportTierSlaHours: number | null;
}

type ModuleKey =
  | "inventory" | "sales" | "purchasing" | "finance"
  | "reporting_audit" | "manufacturing" | "multi_entity";
```

| Plan | Price (NGN/mo) | Annual price (NGN/yr, ~20% off) | maxUsers | maxLocations | maxActiveSkus | maxInvoicesPerMonth | Modules | reportHistoryDays | apiAccess | whiteLabel |
|---|---|---|---|---|---|---|---|---|---|---|
| free | 0 | — | 1 | 1 | 50 | 30 | inventory, sales | 90 | false | false |
| starter | 6500 | 62400 | 2 | 1 | 300 | 200 | + purchasing | 365 | false | false |
| growth | 16500 | 158400 | 5 | 2 | 2000 | 1000 | + finance | 1095 | false | false |
| business | 38000 | 364800 | 15 | 5 | null | null | + reporting_audit | null | true | false |
| enterprise | custom | custom | null | null | null | null | + manufacturing, multi_entity | null | true | true |

Free plan adds a forced "Powered by SimpliERP" footer on all generated invoices/documents — implement this as a flag (`brandingRequired: true`) checked at PDF/document render time, removed automatically the moment a tenant upgrades off `free`.

---

## 2. Database schema (Prisma)

Add these models. Keep `Plan` decoupled from `Subscription` so plan definitions can change without rewriting subscription history.

```prisma
model Plan {
  id                String   @id @default(cuid())
  tier              String   @unique // "free" | "starter" | "growth" | "business" | "enterprise"
  priceMonthlyKobo  Int
  priceAnnualKobo   Int?
  paystackPlanCode  String?  // null for free / custom enterprise
  limits            Json     // serialized PlanLimits
  isActive          Boolean  @default(true)
  createdAt         DateTime @default(now())
}

model Subscription {
  id                 String    @id @default(cuid())
  tenantId           String    @unique
  planId             String
  plan               Plan      @relation(fields: [planId], references: [id])
  billingCycle       String    // "monthly" | "annual"
  status             String    // "active" | "past_due" | "cancelled" | "trialing"
  paystackSubCode    String?
  paystackCustomerCode String?
  currentPeriodEnd   DateTime?
  cancelAtPeriodEnd  Boolean   @default(false)
  createdAt          DateTime  @default(now())
  updatedAt          DateTime  @updatedAt
}

model UsageCounter {
  id            String   @id @default(cuid())
  tenantId      String
  metric        String   // "invoices_this_month" | "active_skus" | "active_users" | "active_locations"
  periodStart   DateTime // month bucket for monthly-reset metrics; null/epoch for point-in-time metrics
  count         Int      @default(0)

  @@unique([tenantId, metric, periodStart])
}

model AddOn {
  id            String   @id @default(cuid())
  tenantId      String
  type          String   // "extra_user" | "extra_location" | "sms_credits" | "custom_domain"
  quantity      Int      @default(1)
  priceKobo     Int
  active        Boolean  @default(true)
  createdAt     DateTime @default(now())
}

model BillingEvent {
  id            String   @id @default(cuid())
  tenantId      String
  type          String   // "invoice_created" | "payment_succeeded" | "payment_failed" | "plan_changed" | "subscription_cancelled"
  paystackRef   String?
  metadata      Json?
  createdAt     DateTime @default(now())
}
```

---

## 3. Quota enforcement layer

Build a single function every mutating endpoint calls **before** creating a new user, location, SKU, or invoice:

```ts
async function assertWithinQuota(
  tenantId: string,
  metric: "users" | "locations" | "skus" | "invoices_this_month",
): Promise<void>
```

- Throws a typed `QuotaExceededError` (with the metric, current count, and limit) if the tenant is at or over the limit for their current plan.
- API routes catch `QuotaExceededError` and return `402 Payment Required` with a machine-readable body: `{ error: "quota_exceeded", metric, limit, current, upgradeUrl }`.
- Frontend intercepts `402` responses globally and shows an upgrade prompt modal rather than a generic error toast.
- `invoices_this_month` resets automatically at the start of each calendar month — implement via the `periodStart` bucket on `UsageCounter`, not a cron job that mutates counts (avoid race conditions; compute the bucket key from the current date at write time).
- SKU and user/location counts are point-in-time (not monthly) — check live counts from the actual tables (`COUNT(*) WHERE tenant_id = ? AND active = true`) rather than trusting a cached counter, to avoid drift. Use `UsageCounter` only for the monthly invoice metric where a live count would be expensive to compute on every write.

**Module gating** is separate from quota gating: a tenant on `starter` simply does not see Finance module routes/nav items at all (check `plan.limits.modules.includes(moduleKey)` in the route layout / middleware), rather than seeing them and hitting an error.

**Soft warning vs hard block:** when a tenant crosses 80% of any quota, surface a non-blocking in-app banner ("You've used 240 of 300 SKUs — upgrade to Growth"). At 100%, hard-block the create action with the 402 above. Never silently block — always return the reason and an upgrade path.

---

## 4. Paystack integration

- Use Paystack's **Plans API** to create one Paystack plan per `(tier, billingCycle)` combination (e.g. `growth-monthly`, `growth-annual`) and store the returned plan code in `Plan.paystackPlanCode`. Free and enterprise tiers have no Paystack plan code.
- **Checkout flow:** initialize a Paystack transaction with `plan` set to the relevant plan code; on success, Paystack auto-creates the subscription. Confirm via webhook, not just the client-side callback.
- **Webhook handler** (`/api/webhooks/paystack`) must verify the `x-paystack-signature` header against the Paystack secret before processing, and handle at minimum:
  - `charge.success` → create/update `Subscription`, write `BillingEvent`
  - `subscription.create` → set `status: "active"`
  - `subscription.disable` → set `status: "cancelled"`, schedule downgrade to free at `currentPeriodEnd`
  - `invoice.payment_failed` → set `status: "past_due"`, trigger dunning email; do not immediately downgrade — allow a grace period (configurable, default 5 days) before forced downgrade to free
- **Annual discount** is just a different Paystack plan code with a 12-month interval and the discounted total — not a coupon applied at checkout.
- **Add-ons** (extra user seat, extra location, SMS credit bundles) are billed as one-off Paystack transactions, not recurring subscriptions, unless you want to model them as Paystack subscription add-ons later. Keep add-on billing decoupled from the core subscription state machine to avoid coupling failures.
- **Upgrade/downgrade:** upgrading mid-cycle should prorate via Paystack's subscription update behavior where supported; if not natively supported, cancel the old Paystack subscription and create a new one effective immediately, crediting unused days as account credit in `BillingEvent` metadata for manual reconciliation in v1.

---

## 5. Free-plan abuse prevention

- One free-tier `Subscription` per verified identity, not per email. Require phone number verification (OTP) at signup; optionally require CAC registration number for the free tier specifically, since registered SMEs are the target segment and this discourages throwaway accounts.
- Store a hash of the verified phone number on the tenant record and check it against existing free-tier tenants before allowing a new free signup. Do not store the raw phone number for this check — hash it.
- This check applies to free signups only; paid tiers don't need it since payment itself is a sufficient filter.

---

## 6. API surface to build

- `GET /api/billing/plan` — current tenant's plan, limits, and live usage against each limit
- `POST /api/billing/checkout` — initialize Paystack transaction for a plan + billing cycle
- `POST /api/billing/change-plan` — upgrade/downgrade (handles proration per section 4)
- `POST /api/billing/cancel` — sets `cancelAtPeriodEnd: true`, does not immediately revoke access
- `POST /api/billing/add-on` — purchase an add-on (extra seat, location, SMS credits)
- `POST /api/webhooks/paystack` — webhook handler (section 4)
- `GET /api/billing/invoices` — billing history for the tenant (their own invoices from SimpliERP, not Paystack's)

---

## 7. Acceptance criteria

- [ ] A new tenant defaults to the `free` plan automatically on signup, no payment step required
- [ ] Attempting to exceed any quota returns a `402` with enough data for the frontend to render a specific, actionable upgrade prompt (not a generic "limit reached")
- [ ] Module nav/routes are hidden (not just blocked) for modules outside the current plan
- [ ] Paystack webhook signature is verified before any state change
- [ ] A failed renewal payment does not immediately lock the tenant out — grace period applies, with a visible in-app warning during the grace period
- [ ] Switching from monthly to annual billing recalculates `currentPeriodEnd` correctly and reflects the discounted price
- [ ] All billing-relevant state changes write a `BillingEvent` row for audit purposes
- [ ] Free-tier signup blocks a second free account on the same verified phone number
- [ ] Removing the "Powered by SimpliERP" footer happens automatically and immediately on upgrade, with no manual flag flip required by support staff

---

## 8. Out of scope for this prompt (flag if asked, don't build)

- Reseller/partner/referral commission logic
- Multi-currency billing (NGN only for v1)
- Usage-based/metered billing beyond the add-ons listed above
- Tax invoice generation for the SaaS subscription itself (separate from the ERP's own invoicing module)
