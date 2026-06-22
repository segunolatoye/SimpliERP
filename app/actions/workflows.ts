'use server'

import { prisma } from '@/lib/db'
import { revalidatePath } from 'next/cache'
import { requirePermission } from '@/lib/auth'

export async function getWorkflowsAction(tenantSlug: string) {
  const org = await prisma.organisations.findUnique({
    where: { slug: tenantSlug },
    select: { id: true }
  });
  if (!org) throw new Error("Organisation not found");

  return prisma.approval_workflows.findMany({
    where: { org_id: org.id, deleted_at: null },
    include: {
      steps: {
        orderBy: { tier_order: 'asc' },
        include: { roles: true }
      }
    },
    orderBy: { created_at: 'desc' }
  });
}

export async function saveWorkflowAction(tenantSlug: string, workflowId: string | null, data: any) {
  await requirePermission(tenantSlug, 'core.settings.manage');
  
  const org = await prisma.organisations.findUnique({
    where: { slug: tenantSlug },
    select: { id: true }
  });
  if (!org) throw new Error("Organisation not found");

  const { name, document_module, is_active, steps } = data;
  
  if (!name || !document_module || !steps || !Array.isArray(steps)) {
    throw new Error("Invalid workflow data");
  }

  // Use a transaction since we modify the workflow and replace steps
  await prisma.$transaction(async (tx) => {
    let workflow;

    if (workflowId) {
      workflow = await tx.approval_workflows.update({
        where: { id: workflowId, org_id: org.id },
        data: { name, document_module, is_active }
      });
      
      // Delete existing steps
      await tx.approval_workflow_steps.deleteMany({
        where: { workflow_id: workflow.id }
      });
    } else {
      // Create new
      workflow = await tx.approval_workflows.create({
        data: {
          org_id: org.id,
          name,
          document_module,
          is_active
        }
      });
    }

    // Insert new steps
    const newSteps = steps.map((s: any, index: number) => ({
      workflow_id: workflow.id,
      tier_order: index + 1,
      role_id: s.role_id || null,
      condition: s.condition || null
    }));

    if (newSteps.length > 0) {
      await tx.approval_workflow_steps.createMany({
        data: newSteps
      });
    }
  });

  revalidatePath(`/${tenantSlug}/settings/workflows`);
}

export async function deleteWorkflowAction(tenantSlug: string, id: string) {
  await requirePermission(tenantSlug, 'core.settings.manage');
  const org = await prisma.organisations.findUnique({
    where: { slug: tenantSlug },
    select: { id: true }
  });
  if (!org) throw new Error("Organisation not found");

  await prisma.approval_workflows.updateMany({
    where: { id, org_id: org.id },
    data: { deleted_at: new Date(), is_active: false }
  });

  revalidatePath(`/${tenantSlug}/settings/workflows`);
}
