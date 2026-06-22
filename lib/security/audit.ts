import { Prisma } from '@prisma/client'

export type AuditLogInput = {
  orgId: string
  userId: string
  module: string
  action: string
  entityType: string
  entityId: string
  diff?: any
  ip?: string
  userAgent?: string
}

/**
 * Record an audit log entry within an existing Prisma transaction.
 * As mandated by the engineering excellence prompt, this MUST be called inside a $transaction.
 */
export async function recordAudit(
  tx: Prisma.TransactionClient,
  input: AuditLogInput
) {
  return await tx.auditLog.create({
    data: {
      org_id: input.orgId,
      user_id: input.userId,
      module: input.module,
      action: input.action,
      entity_type: input.entityType,
      entity_id: input.entityId,
      diff: input.diff ?? Prisma.JsonNull,
      ip: input.ip,
      user_agent: input.userAgent,
    },
  })
}
