import { prisma } from '@/lib/db';
import { ChartOfAccountsTable } from '@/modules/finance/ui/ChartOfAccountsTable';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

export default async function AccountsPage({ params }: { params: { tenant: string } }) {
  const { tenant } = params;

  // Retrieve accounts
  const accounts = await prisma.accounts.findMany({
    where: { org_id: tenant, deleted_at: null },
    orderBy: [
      { type: 'asc' },
      { name: 'asc' }
    ]
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Chart of Accounts</h2>
          <p className="text-muted-foreground mt-2">
            Manage your General Ledger accounts and categories. System accounts cannot be deleted.
          </p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" /> Add Account
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <ChartOfAccountsTable accounts={accounts} />
        </CardContent>
      </Card>
    </div>
  );
}
