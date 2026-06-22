import { requirePermission } from "@/lib/auth";
import { getStockHistoryAction } from "@/app/actions/inventory-stock";
import { prisma } from "@/lib/db";
import { AppLayout } from "@/modules/core/ui/AppLayout";
import { StockAdjustmentsClient } from "@/modules/inventory/ui/StockAdjustmentsClient";

export default async function StockAdjustmentsPage({ params }: { params: { tenant: string } }) {
  const { user, orgMember } = await requirePermission(params.tenant, 'core.inventory.view');
  
  const history = await getStockHistoryAction(params.tenant);

  const org = await prisma.organisations.findUnique({
    where: { slug: params.tenant },
    select: { id: true }
  });

  const locations = await prisma.location.findMany({
    where: { org_id: org?.id, deleted_at: null }
  });

  const items = await prisma.item.findMany({
    where: { org_id: org?.id, deleted_at: null, status: 'Active' }
  });

  return (
    <AppLayout 
      userName={user.user_metadata?.full_name || user.email || 'User'}
      userRole={orgMember.role}
      tenantSlug={params.tenant}
    >
      <div className="p-8 max-w-7xl mx-auto space-y-6 animate-in fade-in duration-500">
        <StockAdjustmentsClient 
          tenantSlug={params.tenant} 
          history={history} 
          locations={locations}
          items={items}
        />
      </div>
    </AppLayout>
  );
}
