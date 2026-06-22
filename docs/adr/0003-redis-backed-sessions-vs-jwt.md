# ADR 0003: Redis-backed sessions vs. JWT-in-cookie

## Context
We need a secure, scalable session management strategy for API requests and server actions.

## Decision
We use stateful Redis-backed sessions combined with Supabase Auth rather than stateless JWT-in-cookie, allowing for instant session revocation and centralized rate limiting.

## Status
Accepted

## Consequences
- Redis is a hard operational dependency.
- Immediate logout and forced invalidation are fully supported.
