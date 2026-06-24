import { prisma } from "@/lib/db";
import { v4 as uuidv4 } from "uuid";

export class VendorBillRepository {
  static async create(orgId: string, payload: any, lines: any[]) {
    return prisma.$transaction(async (tx) => {
      const billId = uuidv4();
      
      const bill = await tx.vendor_bills.create({
        data: {
          id: billId,
          org_id: orgId,
          vendor_id: payload.vendorId,
          po_id: payload.poId,
          invoice_no: payload.invoiceNo,
          invoice_date: payload.invoiceDate ? new Date(payload.invoiceDate) : undefined,
          due_date: payload.dueDate ? new Date(payload.dueDate) : undefined,
          status: 'draft',
          total_amount: payload.totalAmount || 0,
          updated_at: new Date()
        }
      });

      const dbLines = lines.map(line => ({
        id: uuidv4(),
        org_id: orgId,
        vendor_bill_id: billId,
        po_line_id: line.poLineId,
        item_id: line.itemId,
        qty: line.qty,
        unit_price: line.unitPrice,
        line_total: line.qty * line.unitPrice,
      }));

      if (dbLines.length > 0) {
        await tx.vendor_bill_lines.createMany({
          data: dbLines
        });
      }

      return tx.vendor_bills.findUnique({
        where: { id: billId },
        include: { vendor_bill_lines: true }
      });
    });
  }
}
