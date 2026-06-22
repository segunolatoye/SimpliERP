import { prisma } from '@/lib/db';
import { requirePermission } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { ItemGroupsClient } from '@/modules/inventory/ui/ItemGroupsClient';

export default async function ItemGroupsPage({ params }: { params: Promise<{ tenant: string }> }) {
  const resolvedParams = await params;
  const tenantSlug = resolvedParams.tenant;

  await requirePermission(tenantSlug, 'core.settings.manage');

  const org = await prisma.organisations.findUnique({
    where: { slug: tenantSlug },
    select: { id: true }
  });

  if (!org) redirect('/onboarding');

  const groups = await prisma.item_groups.findMany({
    where: { org_id: org.id },
    orderBy: { name: 'asc' }
  });

  const units = await prisma.units.findMany({
    where: { org_id: org.id },
    orderBy: { name: 'asc' }
  });

  return <ItemGroupsClient tenantSlug={tenantSlug} groups={groups} units={units} />;
}
