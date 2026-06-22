'use server'

import { prisma } from '@/lib/db'
import { revalidatePath } from 'next/cache'
import { requirePermission } from '@/lib/auth'

export async function getLocations(tenantSlug: string) {
  const user = await requirePermission(tenantSlug, 'core.settings.manage');
  const org = await prisma.organisations.findUnique({
    where: { slug: tenantSlug },
    select: { id: true }
  });
  if (!org) throw new Error("Organisation not found");

  return await prisma.location.findMany({
    where: { org_id: org.id },
    orderBy: { name: 'asc' },
    include: {
      parent_location: { select: { name: true } },
      users: { select: { email: true } }
    }
  });
}

export async function createLocationAction(tenantSlug: string, formData: FormData) {
  const user = await requirePermission(tenantSlug, 'core.settings.manage');
  const org = await prisma.organisations.findUnique({
    where: { slug: tenantSlug },
    select: { id: true }
  });
  if (!org) throw new Error("Organisation not found");

  const name = formData.get('name') as string;
  const address = formData.get('address') as string;
  const location_type = formData.get('location_type') as string || 'business';
  const parent_id = formData.get('parent_id') as string;
  const primary_contact_id = formData.get('primary_contact_id') as string;
  const is_headquarters = formData.get('is_headquarters') === 'on';

  if (!name) {
    throw new Error("Name is required");
  }

  await prisma.location.create({
    data: {
      org_id: org.id,
      name,
      address: address || null,
      location_type,
      parent_id: parent_id || null,
      primary_contact_id: primary_contact_id || null,
      is_headquarters,
      updated_at: new Date()
    }
  });

  revalidatePath(`/${tenantSlug}/settings/locations`);
}

export async function updateLocationAction(tenantSlug: string, id: string, formData: FormData) {
  const user = await requirePermission(tenantSlug, 'core.settings.manage');
  const org = await prisma.organisations.findUnique({
    where: { slug: tenantSlug },
    select: { id: true }
  });
  if (!org) throw new Error("Organisation not found");

  const name = formData.get('name') as string;
  const address = formData.get('address') as string;
  const location_type = formData.get('location_type') as string;
  const parent_id = formData.get('parent_id') as string;
  const primary_contact_id = formData.get('primary_contact_id') as string;
  const is_headquarters = formData.get('is_headquarters') === 'on';

  if (!name) {
    throw new Error("Name is required");
  }

  if (parent_id === id) {
    throw new Error("A location cannot be its own parent");
  }

  await prisma.location.updateMany({
    where: { id, org_id: org.id },
    data: {
      name,
      address: address || null,
      location_type,
      parent_id: parent_id || null,
      primary_contact_id: primary_contact_id || null,
      is_headquarters,
      updated_at: new Date()
    }
  });

  revalidatePath(`/${tenantSlug}/settings/locations`);
}

export async function deleteLocationAction(tenantSlug: string, id: string) {
  const user = await requirePermission(tenantSlug, 'core.settings.manage');
  const org = await prisma.organisations.findUnique({
    where: { slug: tenantSlug },
    select: { id: true }
  });
  if (!org) throw new Error("Organisation not found");

  // Check if location has children
  const childrenCount = await prisma.location.count({
    where: { parent_id: id, org_id: org.id }
  });

  if (childrenCount > 0) {
    throw new Error("Cannot delete a location that has child locations");
  }

  await prisma.location.deleteMany({
    where: { id, org_id: org.id }
  });

  revalidatePath(`/${tenantSlug}/settings/locations`);
}
