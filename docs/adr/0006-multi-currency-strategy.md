# 6. Multi-currency Strategy

Date: 2026-06-22

## Status

Accepted

## Context

SimpliERP needs to support international transactions where sales, purchases, and invoices can be processed in currencies other than the organization's base currency.

## Decision

We will store both the organization's base currency equivalent and the transaction currency amount on every financial document.
A snapshot of the exchange rate at the time of the transaction will be saved directly on the record to prevent historical values from changing if the live exchange rate fluctuates.

## Consequences

- Historical reporting remains accurate and immutable.
- Requires fetching/updating exchange rates periodically via a background BullMQ job.
- Developers must be careful to use the correct column (`amount_base` vs `amount_foreign`) depending on the context.
