import { VendorBillRepository } from "../repositories/vendor-bill.repository";
import { EventBus } from "@/lib/events/bus";
import { prisma } from "@/lib/db";

export class VendorBillService {
  /**
   * Validates and posts a new Vendor Bill according to the Flexible 3-Way Match rules.
   */
  static async postBill(orgId: string, payload: any, userId: string) {
    const po = await prisma.purchase_orders.findUnique({
      where: { id: payload.poId },
      include: { po_lines: true }
    });

    if (!po || po.org_id !== orgId) throw new Error("Purchase order not found");

    // Fetch GR lines linked to the po_lines
    const poLineIds = po.po_lines.map(l => l.id);
    const grLines = await prisma.gr_lines.findMany({
      where: { po_line_id: { in: poLineIds } }
    });

    // We also need to fetch previously billed lines to prevent over-billing.
    const billedLines = await prisma.vendor_bill_lines.findMany({
      where: { po_line_id: { in: poLineIds } }
    });

    let totalAmount = 0;

    for (const line of payload.lines) {
      const poLine = po.po_lines.find(pl => pl.id === line.poLineId);
      if (!poLine) throw new Error(`PO Line ${line.poLineId} not found in this PO.`);

      const previouslyBilled = billedLines.filter(bl => bl.po_line_id === line.poLineId).reduce((sum, bl) => sum + bl.qty, 0);

      if (poLine.requires_grn_match) {
        // 3-way match
        const receivedQty = grLines.filter(gl => gl.po_line_id === line.poLineId).reduce((sum, gl) => sum + gl.qty_received, 0);
        const maxBillable = receivedQty - previouslyBilled;

        if (line.qty > maxBillable) {
          throw new Error(`3-Way Match Failed for item ${poLine.item_id}: Cannot bill for more than received. Received: ${receivedQty}, Previously Billed: ${previouslyBilled}, Attempting: ${line.qty}`);
        }
      } else {
        // 2-way match
        const maxBillable = poLine.qty_ordered - previouslyBilled;
        
        if (line.qty > maxBillable) {
          throw new Error(`2-Way Match Failed for item ${poLine.item_id}: Cannot bill for more than ordered. Ordered: ${poLine.qty_ordered}, Previously Billed: ${previouslyBilled}, Attempting: ${line.qty}`);
        }
      }
      
      // Calculate total amount if not explicitly passed
      totalAmount += (line.qty * line.unitPrice);
    }
    
    payload.totalAmount = payload.totalAmount || totalAmount;

    const bill = await VendorBillRepository.create(orgId, payload, payload.lines);

    // Emit audits for 2-way matches
    for (const line of payload.lines) {
      const poLine = po.po_lines.find(pl => pl.id === line.poLineId);
      if (poLine && !poLine.requires_grn_match) {
        await EventBus.emit('invoice_posted_without_grn', {
          invoiceId: bill?.id,
          poLineId: poLine.id,
          itemId: poLine.item_id,
          grnSkipReason: poLine.grn_skip_reason
        });
      }
    }

    return bill;
  }
}
