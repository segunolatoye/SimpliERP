import { requirePermission } from "@/lib/auth";
import { getSalesOrdersAction } from "@/app/actions/sales";
import { prisma } from "@/lib/db";
import { AppLayout } from "@/modules/core/ui/AppLayout";
import { DeliveryNotesClient } from "@/modules/sales/ui/DeliveryNotesClient";

export default async function DeliveryNotesPage({ params }: { params: { tenant: string } }) {
  const { user, orgMember } = await requirePermission(params.tenant, 'sales.view');
  
  const deliveries = await prisma.delivery_notes.findMany({
    where: { org_id: orgMember.org_id, deleted_at: null },
    include: { sales_orders: true, locations: true },
    orderBy: { created_at: 'desc' }
  });
  
  const salesOrders = await getSalesOrdersAction(params.tenant);

  const locations = await prisma.location.findMany({
    where: { org_id: orgMember.org_id, deleted_at: null, type: 'warehouse' }
  });

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
        <DeliveryNotesClient 
          tenantSlug={params.tenant} 
          deliveries={deliveries} 
          salesOrders={salesOrders}
          locations={locations}
          items={items}
        />
      </div>
    </AppLayout>
  );
}
