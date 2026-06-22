# ADR 0002: EventBus pattern for inter-module communication

## Context
Directly importing services across bounded contexts (e.g., Sales module calling Inventory module directly) creates tight coupling and spaghetti architecture.

## Decision
We enforce strict architectural boundaries using ESLint and implement a pub/sub EventBus for cross-module communication.

## Status
Accepted

## Consequences
- Modules remain completely decoupled and testable in isolation.
- Workflows spanning multiple modules rely on asynchronous event handlers.
