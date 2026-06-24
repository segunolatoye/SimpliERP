import { prisma } from "@/lib/db";
import { QuotaExceededError } from "@/lib/errors/appError";
import { PLAN_DEFINITIONS, PlanLimits } from "./plans";

export type QuotaMetric = "users" | "locations" | "skus" | "invoices_this_month";

/**
 * Returns the currently active plan limits for a tenant.
 * Defaults to "free" limits if no subscription is found.
 */
export async function getTenantLimits(tenantId: string): Promise<PlanLimits> {
  const subscription = await prisma.subscriptions.findUnique({
    where: { tenantId },
    include: { plan: true },
  });

  if (subscription && subscription.status === "active" && subscription.plan) {
    return subscription.plan.limits as unknown as PlanLimits;
  }

  // Default to free
  return PLAN_DEFINITIONS.free.limits;
}

/**
 * Asserts that creating one more of the specified metric won't exceed the tenant's quota.
 * Throws QuotaExceededError if it would.
 */
export async function assertWithinQuota(
  tenantId: string,
  metric: QuotaMetric
): Promise<void> {
  const limits = await getTenantLimits(tenantId);
  let currentCount = 0;
  let limit: number | null = null;

  switch (metric) {
    case "users":
      limit = limits.maxUsers;
      if (limit !== null) {
        currentCount = await prisma.user.count({
          where: {
            organization_members: { some: { org_id: tenantId } },
          },
        });
      }
      break;

    case "locations":
      limit = limits.maxLocations;
      if (limit !== null) {
        currentCount = await prisma.location.count({
          where: { org_id: tenantId, is_active: true },
        });
      }
      break;

    case "skus":
      limit = limits.maxActiveSkus;
      if (limit !== null) {
        currentCount = await prisma.item.count({
          where: { org_id: tenantId, deleted_at: null },
        });
      }
      break;

    case "invoices_this_month":
      limit = limits.maxInvoicesPerMonth;
      if (limit !== null) {
        const now = new Date();
        const startOfMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
        
        // Track using the usage_counters table instead of a live query to save DB load on a potentially huge table
        const usage = await prisma.usage_counters.findUnique({
          where: {
            tenantId_metric_periodStart: {
              tenantId,
              metric: "invoices_this_month",
              periodStart: startOfMonth
            }
          }
        });
        currentCount = usage?.count || 0;
      }
      break;
  }

  if (limit !== null && currentCount >= limit) {
    throw new QuotaExceededError(metric, limit, currentCount, `/${tenantId}/settings/billing`);
  }
}

/**
 * Increment a monthly usage counter (e.g. after successfully creating an invoice)
 */
export async function incrementMonthlyUsage(tenantId: string, metric: "invoices_this_month", amount = 1) {
  const now = new Date();
  const startOfMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));

  await prisma.usage_counters.upsert({
    where: {
      tenantId_metric_periodStart: {
        tenantId,
        metric,
        periodStart: startOfMonth
      }
    },
    update: { count: { increment: amount } },
    create: {
      tenantId,
      metric,
      periodStart: startOfMonth,
      count: amount
    }
  });
}
