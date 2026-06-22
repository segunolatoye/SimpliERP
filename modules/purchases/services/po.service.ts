import { PurchaseOrderRepository } from '../repositories/po.repository';
import { purchaseOrderSchema } from '../schemas';
import { DocumentNumberingEngine } from '@/lib/modules/numbering';
import { EventBus } from '@/lib/events/bus';

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

    // 4. Persist to DB via Repository
    const po = await PurchaseOrderRepository.create(orgId, poNumber, data, data.lines, totalAmount);

    // 5. Emit event for other modules (e.g. Workflow to check if approval is needed)
    await EventBus.emit('purchases.po_created', { orgId, poId: poNumber });

    return po;
  }
}
