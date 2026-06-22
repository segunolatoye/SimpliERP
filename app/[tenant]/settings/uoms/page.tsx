import { prisma } from '@/lib/db';
import { requirePermission } from '@/lib/auth';
import { UOMsClient } from '@/modules/core/master-data/ui/UOMsClient';

export default async function UOMsPage({ params }: { params: Promise<{ tenant: string }> }) {
  const { tenant } = await params;
  await requirePermission(tenant, 'core.settings.view');

  const uoms = await prisma.units.findMany({
    where: { organisations: { slug: tenant }, deleted_at: null },
    orderBy: { name: 'asc' }
  });

  return (
    <div className="max-w-6xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <UOMsClient tenantSlug={tenant} uoms={uoms} />
    </div>
  );
}
