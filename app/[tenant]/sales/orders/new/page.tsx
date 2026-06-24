import { requirePermission } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { AppLayout } from "@/modules/core/ui/AppLayout";
import { SalesOrderForm } from "@/modules/sales/ui/SalesOrderForm";

export default async function NewSalesOrderPage({ params }: { params: { tenant: string } }) {
  const { user, orgMember } = await requirePermission(params.tenant, 'sales.manage');
  
  // We need customers and items
  const customers = await prisma.customers.findMany({
    where: { org_id: orgMember.org_id, deleted_at: null },
    select: { id: true, name: true }
  });

  const items = await prisma.item.findMany({
    where: { org_id: orgMember.org_id, deleted_at: null },
    select: { id: true, name: true, sku: true, selling_price: true }
  });

  return (
    <AppLayout 
      userName={user.user_metadata?.full_name || user.email || 'User'}
      userRole={orgMember.role}
      tenantSlug={params.tenant}
    >
      <SalesOrderForm 
        tenantSlug={params.tenant} 
        customers={customers}
        items={items}
      />
    </AppLayout>
  );
}
