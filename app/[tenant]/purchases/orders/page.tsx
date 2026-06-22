import { requirePermission } from "@/lib/auth";
import { getPurchaseOrdersAction, getVendorsAction } from "@/app/actions/purchases";
import { prisma } from "@/lib/db";
import { AppLayout } from "@/modules/core/ui/AppLayout";
import { PurchaseOrdersClient } from "@/modules/purchases/ui/PurchaseOrdersClient";

export default async function PurchaseOrdersPage({ params }: { params: { tenant: string } }) {
  const { user, orgMember } = await requirePermission(params.tenant, 'purchases.view');
  
  const orders = await getPurchaseOrdersAction(params.tenant);
  const vendors = await getVendorsAction(params.tenant);

  // We need items for the PO Form
  const items = await prisma.item.findMany({
    where: { org_id: orgMember.org_id, deleted_at: null, status: 'Active' },
    select: { id: true, name: true, sku: true, cost_price: true }
  });

  return (
    <AppLayout 
      userName={user.user_metadata?.full_name || user.email || 'User'}
      userRole={orgMember.role}
      tenantSlug={params.tenant}
    >
      <div className="p-8 max-w-7xl mx-auto space-y-6 animate-in fade-in duration-500">
        <PurchaseOrdersClient 
          tenantSlug={params.tenant} 
          orders={orders} 
          vendors={vendors}
          items={items}
        />
      </div>
    </AppLayout>
  );
}
