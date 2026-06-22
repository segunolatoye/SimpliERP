'use server'

import { prisma } from '@/lib/db'
import { revalidatePath } from 'next/cache'
import { requirePermission } from '@/lib/auth'
import { v4 as uuidv4 } from 'uuid'

export async function getAccounts(tenantSlug: string) {
  const { user } = await requirePermission(tenantSlug, 'core.settings.manage'); // Adjust permission if you have finance.manage
  const org = await prisma.organisations.findUnique({
    where: { slug: tenantSlug },
    select: { id: true }
  });
  if (!org) throw new Error("Organisation not found");

  return await prisma.accounts.findMany({
    where: { org_id: org.id },
    orderBy: { code: 'asc' }
  });
}

export async function createAccountAction(tenantSlug: string, formData: FormData) {
  const { user } = await requirePermission(tenantSlug, 'core.settings.manage');
  const org = await prisma.organisations.findUnique({
    where: { slug: tenantSlug },
    select: { id: true }
  });
  if (!org) throw new Error("Organisation not found");

  const name = formData.get('name') as string;
  const code = formData.get('code') as string;
  const type = formData.get('type') as any;
  const description = formData.get('description') as string;
  const is_active = formData.get('is_active') === 'on';

  if (!name || !type) {
    throw new Error("Name and type are required");
  }

  await prisma.accounts.create({
    data: {
      id: uuidv4(),
      org_id: org.id,
      name,
      code: code || null,
      type,
      description: description || null,
      is_active,
      is_system: false, // User created accounts are not system accounts
      updated_at: new Date()
    }
  });

  revalidatePath(`/${tenantSlug}/finance/chart-of-accounts`);
}

export async function updateAccountAction(tenantSlug: string, id: string, formData: FormData) {
  const { user } = await requirePermission(tenantSlug, 'core.settings.manage');
  const org = await prisma.organisations.findUnique({
    where: { slug: tenantSlug },
    select: { id: true }
  });
  if (!org) throw new Error("Organisation not found");

  const account = await prisma.accounts.findFirst({
    where: { id, org_id: org.id }
  });

  if (!account) throw new Error("Account not found");

  const name = formData.get('name') as string;
  const code = formData.get('code') as string;
  const description = formData.get('description') as string;
  const is_active = formData.get('is_active') === 'on';
  
  // Only allow changing type if it's not a system account
  const type = account.is_system ? account.type : (formData.get('type') as any);

  if (!name || !type) {
    throw new Error("Name and type are required");
  }

  await prisma.accounts.updateMany({
    where: { id, org_id: org.id },
    data: {
      name,
      code: code || null,
      type,
      description: description || null,
      is_active,
      updated_at: new Date()
    }
  });

  revalidatePath(`/${tenantSlug}/finance/chart-of-accounts`);
}

export async function deleteAccountAction(tenantSlug: string, id: string) {
  const { user } = await requirePermission(tenantSlug, 'core.settings.manage');
  const org = await prisma.organisations.findUnique({
    where: { slug: tenantSlug },
    select: { id: true }
  });
  if (!org) throw new Error("Organisation not found");

  const account = await prisma.accounts.findFirst({
    where: { id, org_id: org.id }
  });

  if (!account) throw new Error("Account not found");
  if (account.is_system) throw new Error("Cannot delete a system account");

  // Soft delete or hard delete? Let's check schema. Schema has deleted_at but no @default(now()) on deleted_at
  // We'll hard delete if there are no journals. Since we don't have journals yet, we can deleteMany.
  
  // TODO: Add check for journal_lines relation before deleting

  await prisma.accounts.deleteMany({
    where: { id, org_id: org.id, is_system: false }
  });

  revalidatePath(`/${tenantSlug}/finance/chart-of-accounts`);
}
