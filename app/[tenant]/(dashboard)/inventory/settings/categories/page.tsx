import { prisma } from '@/lib/db';
import { requirePermission } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { CategoriesClient } from '@/modules/inventory/ui/CategoriesClient';

export default async function ItemCategoriesPage({ params }: { params: Promise<{ tenant: string }> }) {
  const resolvedParams = await params;
  const tenantSlug = resolvedParams.tenant;

  await requirePermission(tenantSlug, 'core.settings.manage');

  const org = await prisma.organisations.findUnique({
    where: { slug: tenantSlug },
    select: { id: true }
  });

  if (!org) redirect('/onboarding');

  const categories = await prisma.item_categories.findMany({
    where: { org_id: org.id, deleted_at: null },
    orderBy: { name: 'asc' }
  });

  return <CategoriesClient tenantSlug={tenantSlug} categories={categories} />;
}
