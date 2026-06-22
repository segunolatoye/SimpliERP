'use server'

import { prisma } from '@/lib/db'
import { revalidatePath } from 'next/cache'
import { requirePermission } from '@/lib/auth'
import { WorkflowEngine } from '@/lib/modules/workflow'

export async function getPendingApprovalsAction(tenantSlug: string) {
  const { user, orgMember } = await requirePermission(tenantSlug, 'core.settings.view'); // Allow generic view to see inbox
  const org = await prisma.organisations.findUnique({
    where: { slug: tenantSlug },
    select: { id: true }
  });
  if (!org) throw new Error("Organisation not found");

  // Resolve the user's custom Role ID by matching orgMember.role name
  const customRole = await prisma.role.findFirst({
    where: { org_id: org.id, name: { equals: orgMember.role, mode: 'insensitive' } }
  });
  const userRoleId = customRole?.id;

  // We need to fetch all PENDING approval requests for this org
  const requests = await prisma.approval_requests.findMany({
    where: { org_id: org.id, status: 'PENDING' },
    include: {
      workflows: true,
      users: { select: { email: true } },
      steps: {
        orderBy: { workflow_steps: { tier_order: 'asc' } },
        include: { workflow_steps: { include: { roles: true } } }
      }
    },
    orderBy: { created_at: 'desc' }
  });

  // Filter requests to only show ones where it is THIS user's turn to approve.
  // The active step is the first PENDING step in the chain.
  const inbox = requests.filter(request => {
    const activeStep = request.steps.find((s: any) => s.status === 'PENDING');
    if (!activeStep) return false;

    // Is the user allowed to approve this step?
    const requiredRoleId = activeStep.workflow_steps.role_id;
    if (!requiredRoleId) return true; // Any Role can approve
    if (userRoleId && userRoleId === requiredRoleId) return true; // User has required role
    
    // Fallback: If user is Owner, they can override and approve anything
    if (orgMember.role.toLowerCase() === 'owner') return true;

    return false;
  });

  return inbox;
}

export async function actionApprovalStepAction(
  tenantSlug: string, 
  requestId: string, 
  stepId: string, 
  action: 'APPROVED' | 'REJECTED', 
  comments?: string
) {
  const { user } = await requirePermission(tenantSlug, 'core.settings.view');
  
  await WorkflowEngine.actionStep(requestId, stepId, user.id, action, comments);

  revalidatePath(`/${tenantSlug}/approvals`);
}
