import { requirePermission } from "@/lib/auth";
import { getSalesOrdersAction } from "@/app/actions/sales";
import { AppLayout } from "@/modules/core/ui/AppLayout";
import { SalesOrdersClient } from "@/modules/sales/ui/SalesOrdersClient";

export default async function SalesOrdersPage({ params }: { params: { tenant: string } }) {
  const { user, orgMember } = await requirePermission(params.tenant, 'sales.view');
  
  const salesOrders = await getSalesOrdersAction(params.tenant);

  return (
    <AppLayout 
      userName={user.user_metadata?.full_name || user.email || 'User'}
      userRole={orgMember.role}
      tenantSlug={params.tenant}
    >
      <div className="p-8 max-w-7xl mx-auto space-y-6 animate-in fade-in duration-500">
        <SalesOrdersClient 
          tenantSlug={params.tenant} 
          salesOrders={salesOrders} 
        />
      </div>
    </AppLayout>
  );
}
