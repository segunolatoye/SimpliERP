'use server'

import { revalidatePath } from 'next/cache';
import { requirePermission } from '@/lib/auth';
import { PurchaseOrderService } from '@/modules/purchases/services/po.service';
import { PurchaseOrderRepository } from '@/modules/purchases/repositories/po.repository';
import { VendorRepository } from '@/modules/purchases/repositories/vendor.repository';
import { prisma } from '@/lib/db';

export async function getPurchaseOrdersAction(tenantSlug: string) {
  const { orgMember } = await requirePermission(tenantSlug, 'purchases.view');
  return PurchaseOrderRepository.findAll(orgMember.org_id);
}

export async function getVendorsAction(tenantSlug: string) {
  const { orgMember } = await requirePermission(tenantSlug, 'purchases.view');
  return VendorRepository.findAll(orgMember.org_id);
}

export async function createPurchaseOrderAction(tenantSlug: string, payload: any) {
  const { user, orgMember } = await requirePermission(tenantSlug, 'purchases.manage');
  
  await PurchaseOrderService.createPO(orgMember.org_id, payload, user.id);
  
  revalidatePath(`/${tenantSlug}/purchases/orders`);
}
