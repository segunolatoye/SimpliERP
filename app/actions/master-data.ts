'use server';

import { requireAuth, requirePermission } from '@/lib/auth';
import { runActionSafe } from '@/lib/errors/handler';
import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/db';
import { createId } from '@paralleldrive/cuid2';

// --- CURRENCIES ---

export async function createCurrencyAction(orgSlugOrId: string, formData: FormData) {
  return await runActionSafe(async () => {
    const { orgMember } = await requirePermission(orgSlugOrId, 'core.settings.manage');
    const data = Object.fromEntries(formData);
    
    await prisma.currencies.create({
      data: {
        id: createId(),
        org_id: orgMember.org_id,
        code: data.code as string,
        name: data.name as string,
        symbol: data.symbol as string,
        exchange_rate: parseFloat(data.exchange_rate as string) || 1.0,
        is_base_currency: data.is_base_currency === 'on',
        updated_at: new Date()
      }
    });
    
    revalidatePath(`/${orgSlugOrId}/settings/currencies`);
    return { success: true };
  });
}

export async function updateCurrencyAction(orgSlugOrId: string, id: string, formData: FormData) {
  return await runActionSafe(async () => {
    const { orgMember } = await requirePermission(orgSlugOrId, 'core.settings.manage');
    const data = Object.fromEntries(formData);
    
    await prisma.currencies.update({
      where: { id },
      data: {
        code: data.code as string,
        name: data.name as string,
        symbol: data.symbol as string,
        exchange_rate: parseFloat(data.exchange_rate as string) || 1.0,
        is_base_currency: data.is_base_currency === 'on',
        updated_at: new Date()
      }
    });
    
    revalidatePath(`/${orgSlugOrId}/settings/currencies`);
    return { success: true };
  });
}

export async function deleteCurrencyAction(orgSlugOrId: string, id: string) {
  return await runActionSafe(async () => {
    const { orgMember } = await requirePermission(orgSlugOrId, 'core.settings.manage');
    
    await prisma.currencies.update({
      where: { id },
      data: {
        deleted_at: new Date(),
        updated_at: new Date()
      }
    });
    
    revalidatePath(`/${orgSlugOrId}/settings/currencies`);
    return { success: true };
  });
}

// --- TAX CODES ---

export async function createTaxCodeAction(orgSlugOrId: string, formData: FormData) {
  return await runActionSafe(async () => {
    const { orgMember } = await requirePermission(orgSlugOrId, 'core.settings.manage');
    const data = Object.fromEntries(formData);
    
    await prisma.tax_rates.create({
      data: {
        id: createId(),
        org_id: orgMember.org_id,
        name: data.name as string,
        rate: parseFloat(data.rate as string) || 0,
        is_compound: data.is_compound === 'on',
        updated_at: new Date()
      }
    });
    
    revalidatePath(`/${orgSlugOrId}/settings/tax-codes`);
    return { success: true };
  });
}

export async function updateTaxCodeAction(orgSlugOrId: string, id: string, formData: FormData) {
  return await runActionSafe(async () => {
    const { orgMember } = await requirePermission(orgSlugOrId, 'core.settings.manage');
    const data = Object.fromEntries(formData);
    
    await prisma.tax_rates.update({
      where: { id },
      data: {
        name: data.name as string,
        rate: parseFloat(data.rate as string) || 0,
        is_compound: data.is_compound === 'on',
        updated_at: new Date()
      }
    });
    
    revalidatePath(`/${orgSlugOrId}/settings/tax-codes`);
    return { success: true };
  });
}

export async function deleteTaxCodeAction(orgSlugOrId: string, id: string) {
  return await runActionSafe(async () => {
    const { orgMember } = await requirePermission(orgSlugOrId, 'core.settings.manage');
    
    // We physically delete tax codes here to keep it simple, or soft delete if we had deleted_at.
    // The tax_rates schema doesn't have deleted_at natively based on previous grep. Let's physically delete.
    await prisma.tax_rates.delete({
      where: { id }
    });
    
    revalidatePath(`/${orgSlugOrId}/settings/tax-codes`);
    return { success: true };
  });
}

// --- UNITS OF MEASURE (UOM) ---

export async function createUOMAction(orgSlugOrId: string, formData: FormData) {
  return await runActionSafe(async () => {
    const { orgMember } = await requirePermission(orgSlugOrId, 'core.settings.manage');
    const data = Object.fromEntries(formData);
    
    await prisma.units.create({
      data: {
        id: createId(),
        org_id: orgMember.org_id,
        name: data.name as string,
        symbol: data.symbol as string,
        updated_at: new Date()
      }
    });
    
    revalidatePath(`/${orgSlugOrId}/settings/uoms`);
    return { success: true };
  });
}

export async function updateUOMAction(orgSlugOrId: string, id: string, formData: FormData) {
  return await runActionSafe(async () => {
    const { orgMember } = await requirePermission(orgSlugOrId, 'core.settings.manage');
    const data = Object.fromEntries(formData);
    
    await prisma.units.update({
      where: { id },
      data: {
        name: data.name as string,
        symbol: data.symbol as string,
        updated_at: new Date()
      }
    });
    
    revalidatePath(`/${orgSlugOrId}/settings/uoms`);
    return { success: true };
  });
}

export async function deleteUOMAction(orgSlugOrId: string, id: string) {
  return await runActionSafe(async () => {
    const { orgMember } = await requirePermission(orgSlugOrId, 'core.settings.manage');
    
    await prisma.units.update({
      where: { id },
      data: {
        deleted_at: new Date(),
        updated_at: new Date()
      }
    });
    
    revalidatePath(`/${orgSlugOrId}/settings/uoms`);
    return { success: true };
  });
}
