import { PurchaseOrderRepository } from '../repositories/po.repository';
import { purchaseOrderSchema } from '../schemas';
import { DocumentNumberingEngine } from '@/lib/modules/numbering';
import { EventBus } from '@/lib/events/bus';
import { prisma } from '@/lib/db';

export class PurchaseOrderService {
  /**
   * Orchestrates the creation of a new Purchase Order
   */
  static async createPO(orgId: string, payload: any, userId: string) {
    // 1. Validate payload
    const data = purchaseOrderSchema.parse(payload);

    // 2. Generate sequential PO number
    const poNumber = await DocumentNumberingEngine.generateNextNumber(orgId, 'PURCHASE_ORDER');

    // 3. Calculate total amount
    const totalAmount = data.lines.reduce((sum, line) => {
      return sum + (line.qty_ordered * line.unit_price * (1 + line.tax_rate / 100));
    }, 0);

    // 4. Fetch Items to resolve requires_grn_match and skip reasons
    const itemIds = data.lines.map(l => l.item_id);
    const items = await prisma.item.findMany({
      where: { id: { in: itemIds }, org_id: orgId }
    });
    const itemMap = new Map(items.map(i => [i.id, i]));

    const processedLines = data.lines.map(line => {
      const item = itemMap.get(line.item_id);
      if (!item) throw new Error(`Item not found: ${line.item_id}`);
      
      const fulfillmentMethod = line.fulfillment_method || "standard";
      const requiresGrnMatch = item.requires_physical_receipt && fulfillmentMethod !== "dropship";
      let grnSkipReason = null;
      
      if (!requiresGrnMatch) {
        if (fulfillmentMethod === "dropship") {
          grnSkipReason = "dropship_flagged";
        } else if (!item.requires_physical_receipt) {
          grnSkipReason = item.type === "Service" ? "service_item" : "non_physical_item";
        }
      }

      return {
        ...line,
        fulfillment_method: fulfillmentMethod,
        requires_grn_match: requiresGrnMatch,
        grn_skip_reason: grnSkipReason
      };
    });

    // 5. Persist to DB via Repository
    const po = await PurchaseOrderRepository.create(orgId, poNumber, data, processedLines, totalAmount);

    // 6. Emit Audit Event for dropships
    for (const line of po.po_lines) {
      if (line.fulfillment_method === "dropship") {
        await EventBus.emit('po_line_flagged_dropship', {
          poId: po.id,
          poLineId: line.id,
          itemId: line.item_id,
          approvedBy: userId,
          approvalTier: "standard" // TODO: Fetch tier dynamically if configured
        });
      }
    }

    // 7. Emit event for other modules
    await EventBus.emit('purchases.po_created', { orgId, poId: poNumber });

    return po;
  }
}
