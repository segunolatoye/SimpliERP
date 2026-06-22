import { prisma } from '@/lib/db';
import { requirePermission } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { ChartOfAccountsClient } from '@/modules/finance/ui/ChartOfAccountsClient';

export default async function ChartOfAccountsPage({ params }: { params: Promise<{ tenant: string }> }) {
  const resolvedParams = await params;
  const tenantSlug = resolvedParams.tenant;

  await requirePermission(tenantSlug, 'core.settings.manage'); // Change permission scope when you have finance scopes

  const org = await prisma.organisations.findUnique({
    where: { slug: tenantSlug },
    select: { id: true, name: true }
  });

  if (!org) redirect('/onboarding');

  const accounts = await prisma.accounts.findMany({
    where: { org_id: org.id },
    orderBy: { code: 'asc' }
  });

  return <ChartOfAccountsClient tenantSlug={tenantSlug} accounts={accounts} />;
}
