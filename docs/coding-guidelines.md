# Coding Guidelines & Development Standards

## 1. Layered Architecture
SimpliERP uses a strict, layered modular architecture enforcing clear boundaries.
- **`app/`**: Next.js App Router boundary. Connects UI components with Server Actions.
- **`modules/`**: Contains isolated business domains (`inventory`, `sales`, `purchases`). A module cannot import from another module.
- **`lib/`**: Shared core platform utilities, middleware, and base classes.
- **`repositories/`**: The exclusive layer allowed to communicate with Prisma DB. Services must use repositories.

## 2. Naming Conventions
- **Files**: `kebab-case.ts` (e.g., `stock-ledger.service.ts`)
- **Components**: `PascalCase.tsx` (e.g., `ItemTable.tsx`)
- **Variables/Functions**: `camelCase` (e.g., `calculateReorderPoint`)
- **Types/Interfaces**: `PascalCase` without `I` prefix (e.g., `StockLedgerEntry`)
- **DB Tables**: `snake_case`, plural (e.g., `stock_ledger`)
- **DB Columns**: `snake_case` (e.g., `created_at`)
- **Env Vars**: `SCREAMING_SNAKE_CASE` (e.g., `DATABASE_URL`)
- **Events**: `module.past_tense_event` (e.g., `inventory.stock_low`)
- **Branches**: `type/short-description` (e.g., `feat/inventory-reorder-rules`)

## 3. Error Handling
- Use the central `AppError` hierarchy (`AuthError`, `ForbiddenError`, `NotFoundError`, etc.) located in `/lib/errors/appError.ts`.
- Never throw raw strings or generic Errors from services.
- Server Actions should wrap service calls with the `runActionSafe` mapper from `/lib/errors/handler.ts` to guarantee a consistent JSON response and Request ID tracing.

## 4. Dependency Injection
- Services depend on interfaces, injected via the DI container, never on concrete infrastructure classes (e.g., `EmailSender` interface vs. `ResendSender` concrete class).

## 5. Adding a New Module
1. Create schema fragment in `prisma/schema.prisma`.
2. Generate Zod validations (`/modules/{name}/validations/`).
3. Build Repository layer (`/modules/{name}/repositories/`).
4. Build Service layer (`/modules/{name}/services/`).
5. Wire EventBus subscriptions/publishers.
6. Create API routes / Server Actions in `app/`.
7. Build React UI pages and components in `app/`.
8. Apply `requireAuth` and `requirePermission` guards.
9. Write unit tests (≥80% coverage).
10. Write Playwright E2E tests.
