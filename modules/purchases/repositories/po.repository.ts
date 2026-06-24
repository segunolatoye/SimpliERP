import { prisma } from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';

export class PurchaseOrderRepository {
  static async create(orgId: string, poId: string, data: any, lines: any[], totalAmount: number) {
    return prisma.$transaction(async (tx) => {
      const po = await tx.purchase_orders.create({
        data: {
          id: poId,
          org_id: orgId,
          vendor_id: data.vendor_id,
          status: 'draft',
          expected_date: data.expected_date,
          currency: data.currency,
          notes: data.notes,
          total_amount: totalAmount,
          updated_at: new Date()
        }
      });

      const dbLines = lines.map(line => ({
        id: uuidv4(),
        org_id: orgId,
        po_id: poId,
        item_id: line.item_id,
        qty_ordered: line.qty_ordered,
        unit_price: line.unit_price,
        tax_rate: line.tax_rate,
        line_total: line.qty_ordered * line.unit_price * (1 + line.tax_rate / 100),
        fulfillment_method: line.fulfillment_method,
        requires_grn_match: line.requires_grn_match,
        grn_skip_reason: line.grn_skip_reason,
        updated_at: new Date()
      }));

      await tx.po_lines.createMany({
        data: dbLines
      });

      return tx.purchase_orders.findUnique({
        where: { id: poId },
        include: { po_lines: true }
      });
    });
  }

  static async findAll(orgId: string) {
    return prisma.purchase_orders.findMany({
      where: { org_id: orgId, deleted_at: null },
      include: {
        vendors: { select: { name: true } }
      },
      orderBy: { created_at: 'desc' }
    });
  }
}
