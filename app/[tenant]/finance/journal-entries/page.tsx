import { requirePermission } from "@/lib/auth";
import { getJournalEntriesAction } from "@/app/actions/finance-journal";
import { prisma } from "@/lib/db";
import { AppLayout } from "@/modules/core/ui/AppLayout";
import { JournalEntriesClient } from "@/modules/finance/ui/JournalEntriesClient";

export default async function JournalEntriesPage({ params }: { params: { tenant: string } }) {
  const { user, orgMember } = await requirePermission(params.tenant, 'core.settings.view'); // Generic view for now
  
  const entries = await getJournalEntriesAction(params.tenant);

  const org = await prisma.organisations.findUnique({
    where: { slug: params.tenant },
    select: { id: true }
  });

  const accounts = await prisma.accounts.findMany({
    where: { org_id: org?.id, deleted_at: null, is_active: true },
    orderBy: { code: 'asc' }
  });

  return (
    <AppLayout 
      userName={user.user_metadata?.full_name || user.email || 'User'}
      userRole={orgMember.role}
      tenantSlug={params.tenant}
    >
      <div className="p-8 max-w-7xl mx-auto space-y-6 animate-in fade-in duration-500">
        <JournalEntriesClient 
          tenantSlug={params.tenant} 
          entries={entries} 
          accounts={accounts}
        />
      </div>
    </AppLayout>
  );
}
