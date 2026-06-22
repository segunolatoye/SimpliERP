import { prisma } from '@/lib/db';
import { requirePermission } from '@/lib/auth';
import { CurrenciesClient } from '@/modules/core/master-data/ui/CurrenciesClient';

export default async function CurrenciesPage({ params }: { params: Promise<{ tenant: string }> }) {
  const { tenant } = await params;
  await requirePermission(tenant, 'core.settings.view');

  const currencies = await prisma.currencies.findMany({
    where: { organisations: { slug: tenant }, deleted_at: null },
    orderBy: { code: 'asc' }
  });

  return (
    <div className="max-w-6xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <CurrenciesClient tenantSlug={tenant} currencies={currencies} />
    </div>
  );
}
