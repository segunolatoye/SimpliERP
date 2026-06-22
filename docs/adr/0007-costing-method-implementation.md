# 7. Costing Method Implementation

Date: 2026-06-22

## Status

Accepted

## Context

Inventory valuation needs to be calculated accurately for the General Ledger and Cost of Goods Sold (COGS). We need to determine the default costing method.

## Decision

We will implement FIFO (First-In, First-Out) as the default costing method. The `stock_ledger` table is append-only, which naturally supports FIFO by evaluating stock movements sequentially by `created_at`. Average Costing will be supported as a secondary fallback.

## Consequences

- The `stock_ledger` must remain strictly append-only (no destructive updates) to ensure accurate FIFO batch consumption.
- Valuations are calculated at the time of movement, preventing retrospective changes from breaking historical financial reports.
