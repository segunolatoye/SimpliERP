import { requirePermission } from "@/lib/auth";
import { getWorkflowsAction } from "@/app/actions/workflows";
import { WorkflowsClient } from "@/modules/core/settings/ui/WorkflowsClient";
import { prisma } from "@/lib/db";

export default async function WorkflowsSettingsPage({ params }: { params: { tenant: string } }) {
  await requirePermission(params.tenant, 'core.settings.view');
  
  const workflows = await getWorkflowsAction(params.tenant);
  
  const org = await prisma.organisations.findUnique({
    where: { slug: params.tenant },
    select: { id: true }
  });

  const roles = await prisma.role.findMany({
    where: { org_id: org?.id, deleted_at: null }
  });

  return (
    <WorkflowsClient 
      tenantSlug={params.tenant} 
      workflows={workflows} 
      roles={roles}
    />
  );
}
