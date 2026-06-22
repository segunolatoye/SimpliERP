import { prisma } from "@/lib/db";

export class WorkflowEngine {
  
  /**
   * Submit a document for approval based on the organization's workflow configuration.
   * If no workflow exists, returns { status: 'APPROVED' } automatically.
   */
  static async submitForApproval(
    orgId: string, 
    documentModule: string, 
    documentId: string, 
    requestedByUserId: string
  ) {
    // 1. Check if an active workflow exists for this document type
    const workflow = await prisma.approval_workflows.findFirst({
      where: { org_id: orgId, document_module: documentModule, is_active: true },
      include: { steps: { orderBy: { tier_order: 'asc' } } }
    });

    if (!workflow || workflow.steps.length === 0) {
      // No active workflow, document is implicitly approved
      return { status: "APPROVED", message: "No workflow configured, auto-approved." };
    }

    // 2. Create the approval request
    const request = await prisma.approval_requests.create({
      data: {
        org_id: orgId,
        workflow_id: workflow.id,
        document_module: documentModule,
        document_id: documentId,
        requested_by: requestedByUserId,
        status: "PENDING"
      }
    });

    // 3. Create the request steps (evaluating any conditions if needed later)
    // For now, all defined tiers become required steps.
    const requestSteps = workflow.steps.map(step => ({
      request_id: request.id,
      step_id: step.id,
      status: "PENDING",
    }));

    await prisma.approval_request_steps.createMany({
      data: requestSteps
    });

    return { status: "PENDING", request_id: request.id };
  }

  /**
   * Action a step (Approve or Reject)
   */
  static async actionStep(
    requestId: string, 
    stepId: string, 
    actionedByUserId: string, 
    action: 'APPROVED' | 'REJECTED', 
    comments?: string
  ) {
    const request = await prisma.approval_requests.findUnique({
      where: { id: requestId },
      include: { steps: { include: { workflow_steps: true }, orderBy: { workflow_steps: { tier_order: 'asc' } } } }
    });

    if (!request) throw new Error("Approval request not found");
    if (request.status !== "PENDING") throw new Error(`Request is already ${request.status}`);

    const targetStep = request.steps.find(s => s.id === stepId);
    if (!targetStep) throw new Error("Step not found in this request");
    if (targetStep.status !== "PENDING") throw new Error("Step has already been actioned");

    // Enforce sequential approval (ensure all previous tiers are APPROVED)
    const previousSteps = request.steps.filter(
      s => s.workflow_steps.tier_order < targetStep.workflow_steps.tier_order
    );
    if (previousSteps.some(s => s.status !== "APPROVED")) {
      throw new Error("Previous approval tiers must be completed first");
    }

    // Action the step
    await prisma.approval_request_steps.update({
      where: { id: stepId },
      data: {
        status: action,
        actioned_by: actionedByUserId,
        actioned_at: new Date(),
        comments
      }
    });

    // Determine final request status
    if (action === 'REJECTED') {
      // If one tier rejects, the whole request is rejected
      await prisma.approval_requests.update({
        where: { id: requestId },
        data: { status: "REJECTED" }
      });
      return { status: "REJECTED", request_id: requestId };
    }

    // If APPROVED, check if it was the final tier
    const isFinalTier = request.steps.every(
      s => s.id === stepId || s.workflow_steps.tier_order < targetStep.workflow_steps.tier_order
    );

    // Re-fetch all steps to check if ALL are now approved
    const updatedSteps = await prisma.approval_request_steps.findMany({
      where: { request_id: requestId }
    });

    if (updatedSteps.every(s => s.status === "APPROVED")) {
      await prisma.approval_requests.update({
        where: { id: requestId },
        data: { status: "APPROVED" }
      });
      return { status: "APPROVED", request_id: requestId };
    }

    return { status: "PENDING", request_id: requestId };
  }
}
