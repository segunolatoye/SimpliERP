'use server'

import { ItemService } from '../../modules/inventory/services/ItemService';
import { StockService } from '../../modules/inventory/services/StockService';
import { requirePermission } from '@/lib/auth';
import { revalidatePath } from 'next/cache';

export async function createItemAction(tenantSlug: string, data: any) {
  const { orgMember } = await requirePermission(tenantSlug, 'core.inventory.manage');
  const orgId = orgMember.org_id;

  try {
    const item = await ItemService.createItem(orgId, data);
    revalidatePath(`/${tenantSlug}/inventory/items`);
    return { success: true, data: item };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function updateItemAction(tenantSlug: string, id: string, data: any) {
  const { orgMember } = await requirePermission(tenantSlug, 'core.inventory.manage');
  const orgId = orgMember.org_id;

  try {
    const item = await ItemService.updateItem(orgId, id, data);
    revalidatePath(`/${tenantSlug}/inventory/items`);
    return { success: true, data: item };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function adjustStockAction(tenantSlug: string, data: any) {
  const { user, orgMember } = await requirePermission(tenantSlug, 'core.inventory.manage');
  const orgId = orgMember.org_id;

  try {
    const entry = await StockService.adjustStock(orgId, data, user.id);
    revalidatePath(`/${tenantSlug}/inventory/stock`);
    return { success: true, data: entry };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
