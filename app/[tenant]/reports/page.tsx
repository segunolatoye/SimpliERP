import { requirePermission } from "@/lib/auth";
import { AppLayout } from "@/modules/core/ui/AppLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/packages/ui-kit/components/ui/card";
import { Button } from "@/packages/ui-kit/components/ui/button";
import { FileSpreadsheet, Download } from "lucide-react";

export default async function ReportsPage({ params }: { params: { tenant: string } }) {
  const { user, orgMember } = await requirePermission(params.tenant, 'core.settings.view');

  const reports = [
    {
      id: 'stock-balance',
      title: 'Stock Balance',
      description: 'Current quantity on hand and valuation across all locations.',
      apiPath: `/api/${params.tenant}/reports/stock-balance`
    },
    {
      id: 'ar-summary',
      title: 'Accounts Receivable (AR) Summary',
      description: 'List of all outstanding customer invoices and their due dates.',
      apiPath: `/api/${params.tenant}/reports/ar-summary`
    }
  ];

  return (
    <AppLayout 
      userName={user.user_metadata?.full_name || user.email || 'User'}
      userRole={orgMember.role}
      tenantSlug={params.tenant}
    >
      <div className="p-8 max-w-5xl mx-auto space-y-6 animate-in fade-in duration-500">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Reports</h2>
          <p className="text-muted-foreground mt-2">
            Download operational and financial reports in CSV format.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {reports.map(report => (
            <Card key={report.id} className="hover:border-primary/50 transition-colors">
              <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
                <div className="space-y-1">
                  <CardTitle className="text-base font-semibold">{report.title}</CardTitle>
                  <CardDescription className="text-sm">{report.description}</CardDescription>
                </div>
                <div className="p-2 bg-primary/10 rounded-lg text-primary">
                  <FileSpreadsheet className="w-5 h-5" />
                </div>
              </CardHeader>
              <CardContent className="pt-4">
                <form action={report.apiPath} method="GET">
                  <Button type="submit" variant="secondary" className="w-full">
                    <Download className="w-4 h-4 mr-2" /> Download CSV
                  </Button>
                </form>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </AppLayout>
  );
}
