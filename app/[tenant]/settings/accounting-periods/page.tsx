import { prisma } from '@/lib/db';
import { requirePermission } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { AccountingPeriodsClient } from '@/modules/core/settings/ui/AccountingPeriodsClient';

export default async function AccountingPeriodsPage({ params }: { params: Promise<{ tenant: string }> }) {
  const resolvedParams = await params;
  const tenantSlug = resolvedParams.tenant;

  await requirePermission(tenantSlug, 'core.settings.manage');

  const org = await prisma.organisations.findUnique({
    where: { slug: tenantSlug },
    select: { id: true, name: true }
  });

  if (!org) redirect('/onboarding');

  const periods = await prisma.accountingPeriod.findMany({
    where: { org_id: org.id },
    orderBy: { start_date: 'asc' }
  });

  return <AccountingPeriodsClient tenantSlug={tenantSlug} periods={periods} />;
}
