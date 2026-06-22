import { requirePermission } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { SettingsLayoutWrapper } from '@/modules/core/settings/ui/SettingsNavigation';

export default async function SettingsLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ tenant: string }>;
}) {
  const { tenant } = await params;

  // Ensure user has at least basic settings view access
  await requirePermission(tenant, 'core.settings.view');

  // Fetch active modules for this organization
  const activeModulesData = await prisma.org_modules.findMany({
    where: { 
      organisations: { slug: tenant },
      enabled: true 
    },
    select: { module_name: true }
  });
  
  const activeModules = activeModulesData.map(m => m.module_name);

  return (
    <SettingsLayoutWrapper tenantSlug={tenant} activeModules={activeModules}>
      {children}
    </SettingsLayoutWrapper>
  );
}
