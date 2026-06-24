import { prisma } from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';

export class SalesOrderRepository {
  static async create(orgId: string, payload: any, userId: string) {
    // Generate a simple SO ID. In production, this might use a sequence generator.
    const soId = `SO-${Math.floor(Math.random() * 1000000)}`;

    return await prisma.sales_orders.create({
      data: {
        id: soId,
        org_id: orgId,
        customer_id: payload.customerId,
        notes: payload.notes,
        total_amount: payload.lines.reduce((sum: number, line: any) => sum + (line.qtyOrdered * line.unitPrice), 0),
        status: 'draft',
        so_lines: {
          create: payload.lines.map((line: any) => ({
            id: uuidv4(),
            org_id: orgId,
            item_id: line.itemId,
            qty_ordered: line.qtyOrdered,
            unit_price: line.unitPrice,
            tax_rate: line.taxRate || 0,
            line_total: line.qtyOrdered * line.unitPrice,
            requires_delivery_match: line.requires_delivery_match
          }))
        }
      },
      include: {
        so_lines: true
      }
    });
  }

  static async findById(id: string, orgId: string) {
    return await prisma.sales_orders.findFirst({
      where: { id, org_id: orgId, deleted_at: null },
      include: {
        so_lines: {
          include: { items: true }
        },
        customers: true,
        delivery_notes: true,
        invoices: true
      }
    });
  }

  static async findAll(orgId: string) {
    return await prisma.sales_orders.findMany({
      where: { org_id: orgId, deleted_at: null },
      include: { customers: true },
      orderBy: { created_at: 'desc' }
    });
  }

  static async updateStatus(id: string, orgId: string, status: any) {
    return await prisma.sales_orders.updateMany({
      where: { id, org_id: orgId },
      data: { status }
    });
  }
}
