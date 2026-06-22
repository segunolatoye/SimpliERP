import { requirePermission } from "@/lib/auth";
import { getPendingApprovalsAction } from "@/app/actions/approvals";
import { ApprovalsClient } from "@/modules/core/approvals/ui/ApprovalsClient";
import { AppLayout } from "@/modules/core/ui/AppLayout";

export default async function ApprovalsPage({ params }: { params: { tenant: string } }) {
  const { user, orgMember } = await requirePermission(params.tenant, 'core.settings.view');
  
  const inbox = await getPendingApprovalsAction(params.tenant);

  return (
    <AppLayout 
      userName={user.user_metadata?.full_name || user.email || 'User'}
      userRole={orgMember.role}
      tenantSlug={params.tenant}
    >
      <div className="p-8 max-w-7xl mx-auto space-y-6 animate-in fade-in duration-500">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">Approvals Inbox</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-2">
            Review and action documents that require your authorization.
          </p>
        </div>
        
        <ApprovalsClient tenantSlug={params.tenant} initialRequests={inbox} />
      </div>
    </AppLayout>
  );
}
