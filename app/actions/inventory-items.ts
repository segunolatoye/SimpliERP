'use server'

import { prisma } from '@/lib/db'
import { revalidatePath } from 'next/cache'
import { requirePermission } from '@/lib/auth'

export async function createItemAction(tenantSlug: string, formData: FormData) {
  await requirePermission(tenantSlug, 'core.inventory.manage');
  const org = await prisma.organisations.findUnique({
    where: { slug: tenantSlug },
    select: { id: true }
  });
  if (!org) throw new Error("Organisation not found");

  const sku = formData.get('sku') as string;
  const name = formData.get('name') as string;
  
  if (!sku || !name) {
    throw new Error("SKU and Name are required");
  }

  // Parse booleans
  const is_purchasable = formData.get('is_purchasable') === 'on';
  const is_sellable = formData.get('is_sellable') === 'on';
  const track_inventory = formData.get('track_inventory') === 'on';
  const track_bin = formData.get('track_bin') === 'on';
  const track_lot = formData.get('track_lot') === 'on';
  const track_serial = formData.get('track_serial') === 'on';

  // Parse numbers
  const cost_price = parseFloat(formData.get('cost_price') as string) || 0;
  const selling_price = parseFloat(formData.get('selling_price') as string) || 0;
  const reorder_point = parseInt(formData.get('reorder_point') as string) || 0;
  const lead_time_days = parseInt(formData.get('lead_time_days') as string) || 0;
  const weight = parseFloat(formData.get('weight') as string) || null;
  const length = parseFloat(formData.get('length') as string) || null;
  const width = parseFloat(formData.get('width') as string) || null;
  const height = parseFloat(formData.get('height') as string) || null;
  const gst_rate = parseFloat(formData.get('gst_rate') as string) || null;
  
  // Create item
  await prisma.item.create({
    data: {
      org_id: org.id,
      sku,
      name,
      description: formData.get('description') as string || null,
      type: formData.get('type') as string || 'Goods',
      status: formData.get('status') as string || 'Active',
      
      category_id: formData.get('category_id') as string || null,
      item_group_id: formData.get('item_group_id') as string || null,
      brand: formData.get('brand') as string || null,
      manufacturer: formData.get('manufacturer') as string || null,
      
      is_purchasable,
      is_sellable,
      cost_price,
      selling_price,
      preferred_vendor_id: formData.get('preferred_vendor_id') as string || null,
      
      track_inventory,
      track_bin,
      track_lot,
      track_serial,
      reorder_point,
      lead_time_days,
      
      weight,
      length,
      width,
      height,
      unit_id: formData.get('unit_id') as string || null,
      
      inventory_account_id: formData.get('inventory_account_id') as string || null,
      purchase_account_id: formData.get('purchase_account_id') as string || null,
      sales_account_id: formData.get('sales_account_id') as string || null,
      tax_preference: formData.get('tax_preference') as string || 'Taxable',
      gst_rate,
      hsn_sac_code: formData.get('hsn_sac_code') as string || null,

      updated_at: new Date()
    }
  });

  revalidatePath(`/${tenantSlug}/inventory/items`);
}

export async function updateItemAction(tenantSlug: string, id: string, formData: FormData) {
  await requirePermission(tenantSlug, 'core.inventory.manage');
  const org = await prisma.organisations.findUnique({
    where: { slug: tenantSlug },
    select: { id: true }
  });
  if (!org) throw new Error("Organisation not found");

  const item = await prisma.item.findFirst({
    where: { id, org_id: org.id }
  });
  if (!item) throw new Error("Item not found");

  const sku = formData.get('sku') as string;
  const name = formData.get('name') as string;
  
  if (!sku || !name) {
    throw new Error("SKU and Name are required");
  }

  // Parse booleans
  const is_purchasable = formData.get('is_purchasable') === 'on';
  const is_sellable = formData.get('is_sellable') === 'on';
  const track_inventory = formData.get('track_inventory') === 'on';
  const track_bin = formData.get('track_bin') === 'on';
  const track_lot = formData.get('track_lot') === 'on';
  const track_serial = formData.get('track_serial') === 'on';

  // Parse numbers
  const cost_price = parseFloat(formData.get('cost_price') as string) || 0;
  const selling_price = parseFloat(formData.get('selling_price') as string) || 0;
  const reorder_point = parseInt(formData.get('reorder_point') as string) || 0;
  const lead_time_days = parseInt(formData.get('lead_time_days') as string) || 0;
  const weight = parseFloat(formData.get('weight') as string) || null;
  const length = parseFloat(formData.get('length') as string) || null;
  const width = parseFloat(formData.get('width') as string) || null;
  const height = parseFloat(formData.get('height') as string) || null;
  const gst_rate = parseFloat(formData.get('gst_rate') as string) || null;
  
  await prisma.item.updateMany({
    where: { id, org_id: org.id },
    data: {
      sku,
      name,
      description: formData.get('description') as string || null,
      type: formData.get('type') as string || 'Goods',
      status: formData.get('status') as string || 'Active',
      
      category_id: formData.get('category_id') as string || null,
      item_group_id: formData.get('item_group_id') as string || null,
      brand: formData.get('brand') as string || null,
      manufacturer: formData.get('manufacturer') as string || null,
      
      is_purchasable,
      is_sellable,
      cost_price,
      selling_price,
      preferred_vendor_id: formData.get('preferred_vendor_id') as string || null,
      
      track_inventory,
      track_bin,
      track_lot,
      track_serial,
      reorder_point,
      lead_time_days,
      
      weight,
      length,
      width,
      height,
      unit_id: formData.get('unit_id') as string || null,
      
      inventory_account_id: formData.get('inventory_account_id') as string || null,
      purchase_account_id: formData.get('purchase_account_id') as string || null,
      sales_account_id: formData.get('sales_account_id') as string || null,
      tax_preference: formData.get('tax_preference') as string || 'Taxable',
      gst_rate,
      hsn_sac_code: formData.get('hsn_sac_code') as string || null,

      updated_at: new Date()
    }
  });

  revalidatePath(`/${tenantSlug}/inventory/items`);
}

export async function deleteItemAction(tenantSlug: string, id: string) {
  await requirePermission(tenantSlug, 'core.inventory.manage');
  const org = await prisma.organisations.findUnique({
    where: { slug: tenantSlug },
    select: { id: true }
  });
  if (!org) throw new Error("Organisation not found");

  const item = await prisma.item.findFirst({
    where: { id, org_id: org.id }
  });
  if (!item) throw new Error("Item not found");

  // Soft delete
  await prisma.item.updateMany({
    where: { id, org_id: org.id },
    data: { deleted_at: new Date(), updated_at: new Date() }
  });

  revalidatePath(`/${tenantSlug}/inventory/items`);
}

export async function bulkImportItemsAction(tenantSlug: string, items: any[]) {
  await requirePermission(tenantSlug, 'core.inventory.manage');
  const org = await prisma.organisations.findUnique({
    where: { slug: tenantSlug },
    select: { id: true }
  });
  if (!org) throw new Error("Organisation not found");

  if (!items || items.length === 0) return;

  const validItems = items.filter(i => i.sku && i.name).map(i => ({
    org_id: org.id,
    sku: i.sku,
    name: i.name,
    type: i.type || 'Goods',
    selling_price: parseFloat(i.selling_price) || 0,
    status: i.status || 'Active',
    updated_at: new Date(),
    created_at: new Date()
  }));

  if (validItems.length > 0) {
    await prisma.item.createMany({
      data: validItems,
      skipDuplicates: true // Optionally skip duplicates by SKU if defined by DB constraints, or just ignore errors
    });
  }

  revalidatePath(`/${tenantSlug}/inventory/items`);
}
