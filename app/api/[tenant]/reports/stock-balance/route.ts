import { NextRequest, NextResponse } from 'next/server';
import { requirePermission } from '@/lib/auth';
import { ReportService } from '@/modules/reporting/services/report.service';

export async function GET(
  request: NextRequest,
  { params }: { params: { tenant: string } }
) {
  try {
    const { orgMember } = await requirePermission(params.tenant, 'core.settings.view');
    
    const csvData = await ReportService.generateStockBalanceReport(orgMember.org_id);

    return new NextResponse(csvData, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="stock_balance_${params.tenant}_${new Date().toISOString().split('T')[0]}.csv"`
      }
    });
  } catch (error: any) {
    console.error("Report generation failed:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
