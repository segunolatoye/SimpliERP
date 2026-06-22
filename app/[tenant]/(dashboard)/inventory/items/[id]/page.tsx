import { prisma } from '@/lib/db';
import { requirePermission } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { ItemForm } from '@/modules/inventory/ui/ItemForm';

export default async function EditItemPage({ params }: { params: Promise<{ tenant: string, id: string }> }) {
  const resolvedParams = await params;
  const tenantSlug = resolvedParams.tenant;
  const itemId = resolvedParams.id;

  await requirePermission(tenantSlug, 'core.inventory.manage');

  const org = await prisma.organisations.findUnique({
    where: { slug: tenantSlug },
    select: { id: true }
  });

  if (!org) redirect('/onboarding');

  // Fetch the item
  const item = await prisma.item.findFirst({
    where: { id: itemId, org_id: org.id, deleted_at: null }
  });

  if (!item) redirect(`/${tenantSlug}/inventory/items`);

  // Fetch reference data for dropdowns
  const [categories, groups, units, accounts, vendors] = await Promise.all([
    prisma.item_categories.findMany({ where: { org_id: org.id, deleted_at: null }, orderBy: { name: 'asc' } }),
    prisma.item_groups.findMany({ where: { org_id: org.id }, orderBy: { name: 'asc' } }),
    prisma.units.findMany({ where: { org_id: org.id, deleted_at: null }, orderBy: { name: 'asc' } }),
    prisma.accounts.findMany({ where: { org_id: org.id, is_active: true, deleted_at: null }, orderBy: { name: 'asc' } }),
    prisma.vendors.findMany({ where: { org_id: org.id, deleted_at: null }, orderBy: { name: 'asc' } })
  ]);

  return (
    <div className="h-[calc(100vh-4rem)]">
      <ItemForm 
        tenantSlug={tenantSlug} 
        initialData={item}
        categories={categories}
        groups={groups}
        units={units}
        accounts={accounts}
        vendors={vendors}
      />
    </div>
  );
}
