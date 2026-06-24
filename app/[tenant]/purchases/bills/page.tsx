import { requirePermission } from "@/lib/auth";
import { getPurchaseOrdersAction, getVendorsAction } from "@/app/actions/purchases";
import { prisma } from "@/lib/db";
import { AppLayout } from "@/modules/core/ui/AppLayout";
import { VendorBillsClient } from "@/modules/purchases/ui/VendorBillsClient";

export default async function VendorBillsPage({ params }: { params: { tenant: string } }) {
  const { user, orgMember } = await requirePermission(params.tenant, 'purchases.view');
  
  const bills = await prisma.vendor_bills.findMany({
    where: { org_id: orgMember.org_id, deleted_at: null },
    include: { vendors: true, purchase_orders: true },
    orderBy: { created_at: 'desc' }
  });
  
  const vendors = await getVendorsAction(params.tenant);
  const purchaseOrders = await getPurchaseOrdersAction(params.tenant);

  const items = await prisma.item.findMany({
    where: { org_id: orgMember.org_id, deleted_at: null },
    select: { id: true, name: true, sku: true }
  });

  return (
    <AppLayout 
      userName={user.user_metadata?.full_name || user.email || 'User'}
      userRole={orgMember.role}
      tenantSlug={params.tenant}
    >
      <div className="p-8 max-w-7xl mx-auto space-y-6 animate-in fade-in duration-500">
        <VendorBillsClient 
          tenantSlug={params.tenant} 
          bills={bills} 
          vendors={vendors}
          purchaseOrders={purchaseOrders}
          items={items}
        />
      </div>
    </AppLayout>
  );
}
