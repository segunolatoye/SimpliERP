# ADR 0004: Module enable/disable as soft-toggle

## Context
Tenants can subscribe to or activate different modules within the ERP platform.

## Decision
We implemented module enablement as a soft-toggle managed in the `org_modules` registry table. The code for all modules is always deployed, but the application guards prevent access if a module is toggled off for a tenant.

## Status
Accepted

## Consequences
- Rapid onboarding without provisioning overhead.
- Features can be dynamically enabled/disabled per subscription tier.
