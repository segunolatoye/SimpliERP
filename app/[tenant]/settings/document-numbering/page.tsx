import { prisma } from '@/lib/db';
import { requirePermission } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { DocumentNumberingClient } from '@/modules/core/settings/ui/DocumentNumberingClient';

export default async function DocumentNumberingPage({ params }: { params: Promise<{ tenant: string }> }) {
  const resolvedParams = await params;
  const tenantSlug = resolvedParams.tenant;

  await requirePermission(tenantSlug, 'core.settings.manage');

  const org = await prisma.organisations.findUnique({
    where: { slug: tenantSlug },
    select: { id: true, name: true }
  });

  if (!org) redirect('/onboarding');

  // Fetch groups and their items
  const groups = await prisma.transaction_series_groups.findMany({
    where: { org_id: org.id, deleted_at: null },
    orderBy: { created_at: 'asc' },
    include: {
      transaction_series_items: true
    }
  });

  // Fetch locations for group assignment
  const locations = await prisma.location.findMany({
    where: { org_id: org.id },
    orderBy: { name: 'asc' },
    select: { id: true, name: true }
  });

  return <DocumentNumberingClient tenantSlug={tenantSlug} groups={groups} locations={locations} />;
}
