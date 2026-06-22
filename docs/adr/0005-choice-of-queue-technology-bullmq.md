# ADR 0005: Choice of queue technology (BullMQ)

## Context
The platform requires robust asynchronous job processing for heavy tasks such as report generation, email dispatch, and scheduled syncs.

## Decision
We selected BullMQ (running on our existing Redis cluster) as the primary job queue mechanism over specialized message brokers like RabbitMQ or Kafka.

## Status
Accepted

## Consequences
- Utilizes the existing Redis infrastructure, simplifying the deployment topology.
- Supports scheduled and repeatable jobs natively.
