import { DocumentNumberingEngine } from "@/lib/modules/numbering";
import { GRNRepository, CreateGRNParams } from "../repositories/grn.repository";
import { EventBus } from "@/lib/events/bus";
import { prisma } from "@/lib/db";
import { POStatus } from "@prisma/client";

export class GRNService {
  /**
   * Process a new Goods Receipt Note (GRN)
   */
  static async processReceipt(
    tenantSlug: string,
    orgId: string,
    userId: string,
    data: Omit<CreateGRNParams, "orgId">
  ) {
    // 1. Validate PO exists and is confirmed
    const po = await prisma.purchase_orders.findUnique({
      where: { id: data.poId },
      include: { po_lines: true }
    });

    if (!po || po.org_id !== orgId) {
      throw new Error("Purchase Order not found.");
    }

    if (po.status !== POStatus.confirmed && po.status !== POStatus.received) {
      throw new Error(`Cannot receive goods for PO in '${po.status}' status. Must be confirmed.`);
    }

    // 2. Validate receipt quantities
    for (const line of data.lines) {
      const poLine = po.po_lines.find(pl => pl.id === line.poLineId);
      if (!poLine) throw new Error(`PO Line ${line.poLineId} not found.`);

      if (!poLine.requires_grn_match) {
        throw new Error(`PO Line ${line.poLineId} does not require a Goods Receipt Note.`);
      }

      const remainingQty = poLine.qty_ordered - poLine.qty_received;
      if (line.qtyReceived > remainingQty) {
        throw new Error(`Cannot receive more than ordered for item ${poLine.item_id}. Remaining: ${remainingQty}, Attempted: ${line.qtyReceived}`);
      }
      
      // Inject cost price from PO for stock valuation
      line.costPrice = poLine.unit_price;
      line.itemId = poLine.item_id;
    }

    // 3. Generate GRN ID
    const grnNumber = await DocumentNumberingEngine.generateNextNumber(
      orgId,
      'GOODS_RECEIPT'
    );

    // 4. Save to Repository (handles transactions & stock ledger)
    const grn = await GRNRepository.create(grnNumber, {
      ...data,
      orgId
    });

    // 5. Emit Event
    await EventBus.emit('purchases.grn_completed', {
      orgId,
      grnId: grnNumber
    });

    return grn;
  }
}
