# ADR 0001: Choosing PostgreSQL RLS + Prisma scoping for tenant isolation

## Context
SimpliERP is a multi-tenant SaaS application. We need a reliable strategy to enforce tenant isolation.

## Decision
We chose logical tenant isolation using `org_id` scoped queries in Prisma, paired with PostgreSQL Row-Level Security (RLS) as a defense-in-depth measure, rather than isolated schemas per tenant or physical databases.

## Status
Accepted

## Consequences
- Single database schema simplifies migrations and connection pooling.
- Application code (Prisma) must diligently include `org_id` in all queries.
- Composite indexes heavily rely on `org_id` as the leading column.
