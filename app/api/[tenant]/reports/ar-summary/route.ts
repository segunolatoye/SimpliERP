import { NextRequest, NextResponse } from 'next/server';
import { requirePermission } from '@/lib/auth';
import { ReportService } from '@/modules/reporting/services/report.service';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ tenant: string }> }
) {
  try {
    const { tenant } = await params;
    const { orgMember } = await requirePermission(tenant, 'core.settings.view');
    
    const csvData = await ReportService.generateARReport(orgMember.org_id);

    return new NextResponse(csvData, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="ar_summary_${tenant}_${new Date().toISOString().split('T')[0]}.csv"`
      }
    });
  } catch (error: any) {
    console.error("Report generation failed:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
