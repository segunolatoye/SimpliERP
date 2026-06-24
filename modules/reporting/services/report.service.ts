import { prisma } from '@/lib/db';

export class ReportService {
  /**
   * Generates a Stock Balance CSV report for a given organization.
   * Returns a raw CSV string.
   */
  static async generateStockBalanceReport(orgId: string): Promise<string> {
    const stockItems = await prisma.stock_ledger.groupBy({
      by: ['item_id', 'location_id'],
      where: { items: { org_id: orgId } },
      _sum: { qty: true },
    });

    const items = await prisma.item.findMany({
      where: { org_id: orgId },
      select: { id: true, sku: true, name: true, cost_price: true }
    });

    const locations = await prisma.Location.findMany({
      where: { org_id: orgId },
      select: { id: true, name: true }
    });

    const itemMap = new Map(items.map(i => [i.id, i]));
    const locMap = new Map(locations.map(l => [l.id, l]));

    let csv = 'SKU,Item Name,Location,Quantity,Unit Cost,Total Value\n';

    for (const record of stockItems) {
      const item = itemMap.get(record.item_id);
      const loc = locMap.get(record.location_id);
      const qty = record._sum.qty || 0;
      
      if (!item || !loc || qty === 0) continue;

      const totalValue = qty * (item.cost_price || 0);
      
      // Escape CSV values
      const safeName = `"${item.name.replace(/"/g, '""')}"`;
      const safeLoc = `"${loc.name.replace(/"/g, '""')}"`;

      csv += `${item.sku},${safeName},${safeLoc},${qty},${item.cost_price},${totalValue}\n`;
    }

    return csv;
  }

  /**
   * Generates a simple AR summary CSV report.
   */
  static async generateARReport(orgId: string): Promise<string> {
    const invoices = await prisma.invoices.findMany({
      where: { org_id: orgId, status: 'posted' },
      include: { customers: { select: { name: true } } },
      orderBy: { due_date: 'asc' }
    });

    let csv = 'Invoice No,Customer,Invoice Date,Due Date,Total Amount\n';

    for (const inv of invoices) {
      const safeName = inv.customers ? `"${inv.customers.name.replace(/"/g, '""')}"` : 'Unknown';
      const invDate = inv.invoice_date?.toISOString().split('T')[0] || '';
      const dueDate = inv.due_date?.toISOString().split('T')[0] || '';

      csv += `${inv.invoice_no},${safeName},${invDate},${dueDate},${inv.total_amount}\n`;
    }

    return csv;
  }
}
