import { prisma } from '@/lib/db';
import { requirePermission } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { ItemsClient } from '@/modules/inventory/ui/ItemsClient';

export default async function ItemsPage({ params }: { params: Promise<{ tenant: string }> }) {
  const resolvedParams = await params;
  const tenantSlug = resolvedParams.tenant;

  await requirePermission(tenantSlug, 'core.inventory.view');

  const org = await prisma.organisations.findUnique({
    where: { slug: tenantSlug },
    select: { id: true }
  });

  if (!org) redirect('/onboarding');

  const items = await prisma.item.findMany({
    where: { org_id: org.id, deleted_at: null },
    orderBy: { created_at: 'desc' },
    include: {
      item_categories: true,
      units: true
    }
  });

  return <ItemsClient tenantSlug={tenantSlug} items={items} />;
}
