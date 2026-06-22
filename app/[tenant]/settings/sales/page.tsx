import { prisma } from '@/lib/db';
import { requirePermission } from '@/lib/auth';
import { SalesSettingsForm } from '@/modules/sales/ui/SalesSettingsForm';

export default async function SalesSettingsPage({ params }: { params: Promise<{ tenant: string }> }) {
  const { tenant } = await params;
  
  // Require manage permission for modules or specific sales settings
  const { orgMember } = await requirePermission(tenant, 'core.modules.manage');

  // Fetch the current sales module settings
  const salesModule = await prisma.org_modules.findUnique({
    where: { 
      org_id_module_name: {
        org_id: orgMember.org_id,
        module_name: 'sales'
      }
    }
  });

  const initialSettings = salesModule?.settings || {};

  return (
    <div className="animate-in fade-in duration-500">
      <SalesSettingsForm tenantSlug={tenant} initialSettings={initialSettings} />
    </div>
  );
}
