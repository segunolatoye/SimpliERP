'use server'

import { prisma } from '@/lib/db'
import { revalidatePath } from 'next/cache'
import { requirePermission } from '@/lib/auth'

export async function getCategories(tenantSlug: string) {
  const user = await requirePermission(tenantSlug, 'core.settings.manage'); 
  const org = await prisma.organisations.findUnique({
    where: { slug: tenantSlug },
    select: { id: true }
  });
  if (!org) throw new Error("Organisation not found");

  return await prisma.item_categories.findMany({
    where: { org_id: org.id, deleted_at: null },
    orderBy: { name: 'asc' }
  });
}

export async function createCategoryAction(tenantSlug: string, formData: FormData) {
  await requirePermission(tenantSlug, 'core.settings.manage');
  const org = await prisma.organisations.findUnique({
    where: { slug: tenantSlug },
    select: { id: true }
  });
  if (!org) throw new Error("Organisation not found");

  const name = formData.get('name') as string;
  const parent_id = formData.get('parent_id') as string || null;

  if (!name) {
    throw new Error("Name is required");
  }

  const { v4: uuidv4 } = await import('uuid');

  await prisma.item_categories.create({
    data: {
      id: uuidv4(),
      org_id: org.id,
      name,
      parent_id,
      updated_at: new Date()
    }
  });

  revalidatePath(`/${tenantSlug}/inventory/settings/categories`);
}

export async function updateCategoryAction(tenantSlug: string, id: string, formData: FormData) {
  await requirePermission(tenantSlug, 'core.settings.manage');
  const org = await prisma.organisations.findUnique({
    where: { slug: tenantSlug },
    select: { id: true }
  });
  if (!org) throw new Error("Organisation not found");

  const category = await prisma.item_categories.findFirst({
    where: { id, org_id: org.id, deleted_at: null }
  });

  if (!category) throw new Error("Category not found");

  const name = formData.get('name') as string;
  const parent_id = formData.get('parent_id') as string || null;

  if (!name) {
    throw new Error("Name is required");
  }

  // Prevent setting a category as its own parent
  if (parent_id === id) {
    throw new Error("A category cannot be its own parent");
  }

  await prisma.item_categories.updateMany({
    where: { id, org_id: org.id },
    data: {
      name,
      parent_id,
      updated_at: new Date()
    }
  });

  revalidatePath(`/${tenantSlug}/inventory/settings/categories`);
}

export async function deleteCategoryAction(tenantSlug: string, id: string) {
  await requirePermission(tenantSlug, 'core.settings.manage');
  const org = await prisma.organisations.findUnique({
    where: { slug: tenantSlug },
    select: { id: true }
  });
  if (!org) throw new Error("Organisation not found");

  const category = await prisma.item_categories.findFirst({
    where: { id, org_id: org.id, deleted_at: null }
  });

  if (!category) throw new Error("Category not found");

  // Check if it has child categories
  const children = await prisma.item_categories.count({
    where: { parent_id: id, org_id: org.id, deleted_at: null }
  });

  if (children > 0) {
    throw new Error("Cannot delete category with sub-categories. Remove or reassign them first.");
  }

  // Check if it's used by items
  const itemsCount = await prisma.item.count({
    where: { category_id: id, org_id: org.id, deleted_at: null }
  });

  if (itemsCount > 0) {
    throw new Error("Cannot delete category assigned to items.");
  }

  // Soft delete
  await prisma.item_categories.updateMany({
    where: { id, org_id: org.id },
    data: { deleted_at: new Date(), updated_at: new Date() }
  });

  revalidatePath(`/${tenantSlug}/inventory/settings/categories`);
}
