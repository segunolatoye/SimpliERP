'use server';

import { requirePermission } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { getTenantLimits } from '@/lib/billing/quota';
import { PLAN_DEFINITIONS, PlanTier } from '@/lib/billing/plans';

export type BillingData = {
  currentTier: PlanTier;
  status: string;
  billingCycle: string | null;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
  usage: {
    users: { current: number; limit: number | null };
    locations: { current: number; limit: number | null };
    skus: { current: number; limit: number | null };
    invoicesThisMonth: { current: number; limit: number | null };
  };
};

export async function getBillingData(tenantSlug: string): Promise<BillingData> {
  const { orgMember } = await requirePermission(tenantSlug, 'core.settings.view');
  const orgId = orgMember.org_id;

  // Get subscription
  const subscription = await prisma.subscriptions.findUnique({
    where: { tenantId: orgId },
    include: { plan: true },
  });

  const currentTier = (subscription?.plan?.tier as PlanTier) || 'free';
  const limits = await getTenantLimits(orgId);

  // Fetch live counts
  const [userCount, locationCount, skuCount] = await Promise.all([
    prisma.user.count({
      where: { org_members: { some: { org_id: orgId } } },
    }),
    prisma.location.count({
      where: { org_id: orgId, deleted_at: null },
    }),
    prisma.item.count({
      where: { org_id: orgId, deleted_at: null },
    }),
  ]);

  // Monthly invoice count from usage_counters
  const now = new Date();
  const startOfMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  const invoiceUsage = await prisma.usage_counters.findUnique({
    where: {
      tenantId_metric_periodStart: {
        tenantId: orgId,
        metric: 'invoices_this_month',
        periodStart: startOfMonth,
      },
    },
  });

  return {
    currentTier,
    status: subscription?.status || 'active',
    billingCycle: subscription?.billingCycle || null,
    currentPeriodEnd: subscription?.currentPeriodEnd?.toISOString() || null,
    cancelAtPeriodEnd: subscription?.cancelAtPeriodEnd || false,
    usage: {
      users: { current: userCount, limit: limits.maxUsers },
      locations: { current: locationCount, limit: limits.maxLocations },
      skus: { current: skuCount, limit: limits.maxActiveSkus },
      invoicesThisMonth: { current: invoiceUsage?.count || 0, limit: limits.maxInvoicesPerMonth },
    },
  };
}
