import { prisma } from '@/lib/db';
import { requirePermission } from '@/lib/auth';
import { TaxCodesClient } from '@/modules/core/master-data/ui/TaxCodesClient';

export default async function TaxCodesPage({ params }: { params: Promise<{ tenant: string }> }) {
  const { tenant } = await params;
  await requirePermission(tenant, 'core.settings.view');

  const taxCodes = await prisma.tax_rates.findMany({
    where: { organisations: { slug: tenant } },
    orderBy: { name: 'asc' }
  });

  return (
    <div className="max-w-6xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <TaxCodesClient tenantSlug={tenant} taxCodes={taxCodes} />
    </div>
  );
}
