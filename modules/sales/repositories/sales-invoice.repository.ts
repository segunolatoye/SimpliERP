import { prisma } from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';

export class SalesInvoiceRepository {
  static async create(orgId: string, payload: any) {
    const { customerId, soId, invoiceNo, lines } = payload;
    const invoiceId = `INV-${Math.floor(Math.random() * 1000000)}`;

    const totalAmount = lines.reduce((sum: number, line: any) => sum + (line.qty * line.unitPrice), 0);

    return await prisma.invoices.create({
      data: {
        id: invoiceId,
        org_id: orgId,
        customer_id: customerId,
        so_id: soId,
        invoice_no: invoiceNo || invoiceId,
        invoice_date: new Date(),
        status: 'posted',
        total_amount: totalAmount,
        invoice_lines: {
          create: lines.map((line: any) => ({
            id: uuidv4(),
            so_line_id: line.soLineId,
            item_id: line.itemId,
            qty_billed: line.qty,
            unit_price: line.unitPrice,
            line_total: line.qty * line.unitPrice
          }))
        }
      },
      include: {
        invoice_lines: true
      }
    });
  }

  static async findById(id: string, orgId: string) {
    return await prisma.invoices.findFirst({
      where: { id, org_id: orgId, deleted_at: null },
      include: {
        invoice_lines: {
          include: { items: true, so_lines: true }
        },
        customers: true,
        sales_orders: true
      }
    });
  }

  static async findAll(orgId: string) {
    return await prisma.invoices.findMany({
      where: { org_id: orgId, deleted_at: null },
      include: { customers: true, sales_orders: true },
      orderBy: { created_at: 'desc' }
    });
  }
}
