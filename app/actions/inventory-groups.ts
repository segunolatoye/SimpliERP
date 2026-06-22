'use server'

import { prisma } from '@/lib/db'
import { revalidatePath } from 'next/cache'
import { requirePermission } from '@/lib/auth'

export async function createGroupAction(tenantSlug: string, formData: FormData) {
  await requirePermission(tenantSlug, 'core.settings.manage');
  const org = await prisma.organisations.findUnique({
    where: { slug: tenantSlug },
    select: { id: true }
  });
  if (!org) throw new Error("Organisation not found");

  const name = formData.get('name') as string;
  const description = formData.get('description') as string || null;
  const unit_id = formData.get('unit_id') as string || null;
  const manufacturer = formData.get('manufacturer') as string || null;
  const brand = formData.get('brand') as string || null;
  const tax_preference = formData.get('tax_preference') as string || null;
  const hsn_sac_code = formData.get('hsn_sac_code') as string || null;

  if (!name) {
    throw new Error("Name is required");
  }

  const { v4: uuidv4 } = await import('uuid');

  await prisma.item_groups.create({
    data: {
      id: uuidv4(),
      org_id: org.id,
      name,
      description,
      unit_id,
      manufacturer,
      brand,
      tax_preference,
      hsn_sac_code,
      updated_at: new Date()
    }
  });

  revalidatePath(`/${tenantSlug}/inventory/settings/groups`);
}

export async function updateGroupAction(tenantSlug: string, id: string, formData: FormData) {
  await requirePermission(tenantSlug, 'core.settings.manage');
  const org = await prisma.organisations.findUnique({
    where: { slug: tenantSlug },
    select: { id: true }
  });
  if (!org) throw new Error("Organisation not found");

  const group = await prisma.item_groups.findFirst({
    where: { id, org_id: org.id }
  });

  if (!group) throw new Error("Group not found");

  const name = formData.get('name') as string;
  const description = formData.get('description') as string || null;
  const unit_id = formData.get('unit_id') as string || null;
  const manufacturer = formData.get('manufacturer') as string || null;
  const brand = formData.get('brand') as string || null;
  const tax_preference = formData.get('tax_preference') as string || null;
  const hsn_sac_code = formData.get('hsn_sac_code') as string || null;

  if (!name) {
    throw new Error("Name is required");
  }

  await prisma.item_groups.updateMany({
    where: { id, org_id: org.id },
    data: {
      name,
      description,
      unit_id,
      manufacturer,
      brand,
      tax_preference,
      hsn_sac_code,
      updated_at: new Date()
    }
  });

  revalidatePath(`/${tenantSlug}/inventory/settings/groups`);
}

export async function deleteGroupAction(tenantSlug: string, id: string) {
  await requirePermission(tenantSlug, 'core.settings.manage');
  const org = await prisma.organisations.findUnique({
    where: { slug: tenantSlug },
    select: { id: true }
  });
  if (!org) throw new Error("Organisation not found");

  const group = await prisma.item_groups.findFirst({
    where: { id, org_id: org.id }
  });

  if (!group) throw new Error("Group not found");

  // Check if it's used by items
  const itemsCount = await prisma.item.count({
    where: { item_group_id: id, org_id: org.id, deleted_at: null }
  });

  if (itemsCount > 0) {
    throw new Error("Cannot delete group assigned to items.");
  }

  // Hard delete since there's no deleted_at on item_groups
  await prisma.item_groups.deleteMany({
    where: { id, org_id: org.id }
  });

  revalidatePath(`/${tenantSlug}/inventory/settings/groups`);
}
