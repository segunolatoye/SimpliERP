import { SalesInvoiceRepository } from '../repositories/sales-invoice.repository';
import { prisma } from '@/lib/db';
import { EventBus } from '@/lib/events/bus';

export class SalesInvoiceService {
  static async postInvoice(orgId: string, payload: any, userId: string) {
    const { soId, lines } = payload; // lines: [{soLineId, qty, unitPrice}]

    // 1. Fetch the Purchase Order to validate rules
    const so = await prisma.sales_orders.findFirst({
      where: { id: soId, org_id: orgId },
      include: { 
        so_lines: true,
        invoices: {
          include: { invoice_lines: true }
        }
      }
    });

    if (!so) throw new Error("Sales Order not found");

    const soLinesMap = new Map(so.so_lines.map(l => [l.id, l]));

    // Calculate how much has already been billed for each SO line
    const previouslyBilledMap = new Map<string, number>();
    for (const inv of so.invoices) {
      if (inv.status !== 'cancelled') {
        for (const iline of inv.invoice_lines) {
          if (iline.so_line_id) {
            const current = previouslyBilledMap.get(iline.so_line_id) || 0;
            previouslyBilledMap.set(iline.so_line_id, current + iline.qty_billed);
          }
        }
      }
    }

    // 2. Validate Matching Rules (2-Way vs 3-Way)
    const validLines = [];
    for (const line of lines) {
      const soLine = soLinesMap.get(line.soLineId);
      if (!soLine) throw new Error(`Invalid SO Line ID: ${line.soLineId}`);

      if (line.qty <= 0) continue;

      const prevBilled = previouslyBilledMap.get(line.soLineId) || 0;

      if (soLine.requires_delivery_match) {
        // 3-Way Match: Can only bill up to what was physically delivered
        const maxBillable = soLine.qty_delivered - prevBilled;
        if (line.qty > maxBillable) {
          throw new Error(`3-Way Match Failed: Cannot bill ${line.qty} for item ${soLine.item_id}. Only ${maxBillable} delivered and unbilled.`);
        }
      } else {
        // 2-Way Match: Bypasses delivery checking (e.g. Services, Dropship)
        const maxBillable = soLine.qty_ordered - prevBilled;
        if (line.qty > maxBillable) {
          throw new Error(`2-Way Match Failed: Cannot bill ${line.qty} for item ${soLine.item_id}. Only ${maxBillable} ordered and unbilled.`);
        }
        
        // Audit log for bypassing the delivery requirement
        EventBus.emit('customer_invoice_without_delivery', {
          orgId,
          userId,
          soId: so.id,
          soLineId: soLine.id,
          itemId: soLine.item_id,
          qtyBilled: line.qty,
          timestamp: new Date()
        });
      }

      validLines.push({
        ...line,
        itemId: soLine.item_id
      });
    }

    if (validLines.length === 0) throw new Error("No valid lines to bill");

    // 3. Post Invoice Transactionally
    const result = await prisma.$transaction(async (tx) => {
      const invoice = await SalesInvoiceRepository.create(orgId, {
        ...payload,
        lines: validLines
      });

      // Add accounting GL entries here in the future
      
      return invoice;
    });

    await EventBus.emit('sales.invoice_posted', {
      orgId,
      invoiceId: result.id
    });

    return result;
  }
}
