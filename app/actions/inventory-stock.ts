'use server'

import { prisma } from '@/lib/db'
import { revalidatePath } from 'next/cache'
import { requirePermission } from '@/lib/auth'
import { StockLedgerEngine } from '@/lib/modules/inventory/stock-ledger';

export async function getStockHistoryAction(tenantSlug: string) {
  const org = await prisma.organisations.findUnique({
    where: { slug: tenantSlug },
    select: { id: true }
  });
  if (!org) throw new Error("Organisation not found");

  return prisma.stock_ledger.findMany({
    where: { org_id: org.id },
    include: {
      items: { select: { name: true, sku: true } },
      locations: { select: { name: true } }
    },
    orderBy: { created_at: 'desc' },
    take: 100 // limit for performance in demo
  });
}

export async function postStockAdjustmentAction(tenantSlug: string, data: any) {
  const { user, orgMember } = await requirePermission(tenantSlug, 'core.inventory.manage');
  
  const qtyDelta = parseInt(data.qtyDelta, 10);
  if (isNaN(qtyDelta) || qtyDelta === 0) {
    throw new Error("Invalid quantity delta");
  }

  // Use the Stock Ledger Engine to safely record the adjustment
  await StockLedgerEngine.postAdjustment({
    orgId: orgMember.org_id,
    itemId: data.itemId,
    locationId: data.locationId,
    qtyDelta: qtyDelta,
    referenceId: data.referenceId || `ADJ-${Date.now()}`, // fallback to auto ID
    referenceType: 'MANUAL_ADJUSTMENT'
  });

  revalidatePath(`/${tenantSlug}/inventory/stock-adjustments`);
}
