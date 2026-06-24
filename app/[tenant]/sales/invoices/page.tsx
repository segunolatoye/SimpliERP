import { requirePermission } from "@/lib/auth";
import { getSalesOrdersAction } from "@/app/actions/sales";
import { prisma } from "@/lib/db";
import { AppLayout } from "@/modules/core/ui/AppLayout";
import { CustomerInvoicesClient } from "@/modules/sales/ui/CustomerInvoicesClient";

export default async function CustomerInvoicesPage({ params }: { params: { tenant: string } }) {
  const { user, orgMember } = await requirePermission(params.tenant, 'sales.view');
  
  const invoices = await prisma.invoices.findMany({
    where: { org_id: orgMember.org_id, deleted_at: null },
    include: { customers: true, sales_orders: true },
    orderBy: { created_at: 'desc' }
  });
  
  const salesOrders = await getSalesOrdersAction(params.tenant);

  const customers = await prisma.customers.findMany({
    where: { org_id: orgMember.org_id, deleted_at: null }
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
        <CustomerInvoicesClient 
          tenantSlug={params.tenant} 
          invoices={invoices} 
          customers={customers}
          salesOrders={salesOrders}
          items={items}
        />
      </div>
    </AppLayout>
  );
}
