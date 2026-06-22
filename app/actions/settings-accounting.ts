'use server'

import { prisma } from '@/lib/db'
import { revalidatePath } from 'next/cache'
import { requirePermission } from '@/lib/auth'

export async function getAccountingPeriods(tenantSlug: string) {
  const user = await requirePermission(tenantSlug, 'core.settings.manage');
  const org = await prisma.organisations.findUnique({
    where: { slug: tenantSlug },
    select: { id: true }
  });
  if (!org) throw new Error("Organisation not found");

  return await prisma.accountingPeriod.findMany({
    where: { org_id: org.id },
    orderBy: { start_date: 'asc' }
  });
}

export async function createAccountingPeriodAction(tenantSlug: string, formData: FormData) {
  const user = await requirePermission(tenantSlug, 'core.settings.manage');
  const org = await prisma.organisations.findUnique({
    where: { slug: tenantSlug },
    select: { id: true }
  });
  if (!org) throw new Error("Organisation not found");

  const name = formData.get('name') as string;
  const start_date = new Date(formData.get('start_date') as string);
  const end_date = new Date(formData.get('end_date') as string);
  const status = formData.get('status') as string || 'open';

  if (!name || isNaN(start_date.getTime()) || isNaN(end_date.getTime())) {
    throw new Error("Invalid input");
  }

  if (start_date > end_date) {
    throw new Error("Start date must be before end date");
  }

  await prisma.accountingPeriod.create({
    data: {
      org_id: org.id,
      name,
      start_date,
      end_date,
      status,
      updated_at: new Date()
    }
  });

  revalidatePath(`/${tenantSlug}/settings/accounting-periods`);
}

export async function updateAccountingPeriodAction(tenantSlug: string, id: string, formData: FormData) {
  const user = await requirePermission(tenantSlug, 'core.settings.manage');
  const org = await prisma.organisations.findUnique({
    where: { slug: tenantSlug },
    select: { id: true }
  });
  if (!org) throw new Error("Organisation not found");

  const name = formData.get('name') as string;
  const start_date = new Date(formData.get('start_date') as string);
  const end_date = new Date(formData.get('end_date') as string);
  const status = formData.get('status') as string;

  if (!name || isNaN(start_date.getTime()) || isNaN(end_date.getTime())) {
    throw new Error("Invalid input");
  }

  if (start_date > end_date) {
    throw new Error("Start date must be before end date");
  }

  await prisma.accountingPeriod.updateMany({
    where: { id, org_id: org.id },
    data: {
      name,
      start_date,
      end_date,
      status,
      updated_at: new Date()
    }
  });

  revalidatePath(`/${tenantSlug}/settings/accounting-periods`);
}

export async function deleteAccountingPeriodAction(tenantSlug: string, id: string) {
  const user = await requirePermission(tenantSlug, 'core.settings.manage');
  const org = await prisma.organisations.findUnique({
    where: { slug: tenantSlug },
    select: { id: true }
  });
  if (!org) throw new Error("Organisation not found");

  await prisma.accountingPeriod.deleteMany({
    where: { id, org_id: org.id }
  });

  revalidatePath(`/${tenantSlug}/settings/accounting-periods`);
}

export async function generateYearlyPeriodsAction(tenantSlug: string, year: number) {
  const user = await requirePermission(tenantSlug, 'core.settings.manage');
  const org = await prisma.organisations.findUnique({
    where: { slug: tenantSlug },
    select: { id: true }
  });
  if (!org) throw new Error("Organisation not found");

  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  
  await prisma.$transaction(async (tx) => {
    for (let i = 0; i < 12; i++) {
      const start_date = new Date(year, i, 1);
      const end_date = new Date(year, i + 1, 0); // Last day of month
      const name = `${months[i]} ${year}`;

      // Check if period already exists to avoid unique constraint error
      const existing = await tx.accountingPeriod.findFirst({
        where: { org_id: org.id, name }
      });

      if (!existing) {
        await tx.accountingPeriod.create({
          data: {
            org_id: org.id,
            name,
            start_date,
            end_date,
            status: 'open',
            updated_at: new Date()
          }
        });
      }
    }
  });

  revalidatePath(`/${tenantSlug}/settings/accounting-periods`);
}
