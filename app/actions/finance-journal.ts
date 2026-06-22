'use server'

import { prisma } from '@/lib/db'
import { revalidatePath } from 'next/cache'
import { requirePermission } from '@/lib/auth'
import { JournalEngine } from '@/lib/modules/finance/journal-engine';

export async function getJournalEntriesAction(tenantSlug: string) {
  const org = await prisma.organisations.findUnique({
    where: { slug: tenantSlug },
    select: { id: true }
  });
  if (!org) throw new Error("Organisation not found");

  return prisma.journal_entries.findMany({
    where: { org_id: org.id },
    include: {
      journal_lines: {
        include: { accounts: { select: { code: true, name: true } } }
      }
    },
    orderBy: { date: 'desc' },
    take: 100
  });
}

export async function postJournalEntryAction(tenantSlug: string, data: any) {
  const { user, orgMember } = await requirePermission(tenantSlug, 'core.finance.manage'); // Adjust permission if you have finance
  
  if (!data.description) throw new Error("Description is required");
  if (!data.lines || data.lines.length < 2) throw new Error("At least two lines are required");

  // Parse lines
  const parsedLines = data.lines.map((l: any) => ({
    accountId: l.accountId,
    debit: parseFloat(l.debit) || 0,
    credit: parseFloat(l.credit) || 0
  }));

  await JournalEngine.postJournal({
    orgId: orgMember.org_id,
    description: data.description,
    reference: data.reference,
    lines: parsedLines
  });

  revalidatePath(`/${tenantSlug}/finance/journal-entries`);
}
