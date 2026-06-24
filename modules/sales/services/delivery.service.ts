import { DeliveryRepository } from '../repositories/delivery.repository';
import { prisma } from '@/lib/db';
import { EventBus } from '@/lib/events/bus';

export class DeliveryService {
  static async processDelivery(tenantSlug: string, orgId: string, userId: string, payload: any) {
    const { soId, locationId, lines } = payload; // lines: [{soLineId, qty}]
    
    // 1. Fetch SO and lines to validate against ordered qty
    const so = await prisma.sales_orders.findFirst({
      where: { id: soId, org_id: orgId },
      include: { so_lines: true }
    });

    if (!so) throw new Error("Sales Order not found");

    const soLinesMap = new Map(so.so_lines.map(l => [l.id, l]));

    // 2. Fetch Organization Settings for Stock Allocation strategy
    const org = await prisma.organisations.findUnique({ where: { id: orgId } });
    const settings = org?.settings as any || {};
    const stockAllocationStrategy = settings.sales_stock_allocation || 'on_delivery';

    // 3. Validation
    const validLines = [];
    for (const line of lines) {
      const soLine = soLinesMap.get(line.soLineId);
      if (!soLine) throw new Error(`Invalid SO Line ID: ${line.soLineId}`);

      if (!soLine.requires_delivery_match) {
        throw new Error(`Line ${line.soLineId} does not require delivery (e.g. Service or Dropship)`);
      }

      if (line.qty <= 0) continue;

      const remainingQty = soLine.qty_ordered - soLine.qty_delivered;
      if (line.qty > remainingQty) {
        throw new Error(`Cannot deliver ${line.qty} for item ${soLine.item_id}. Only ${remainingQty} remaining.`);
      }

      validLines.push({
        soLineId: line.soLineId,
        itemId: soLine.item_id,
        qty: line.qty
      });
    }

    if (validLines.length === 0) throw new Error("No valid lines to deliver");

    // 4. Transaction: Create Delivery Note, update SO line qty, update Stock Ledger (if needed)
    const result = await prisma.$transaction(async (tx) => {
      const delivery = await DeliveryRepository.create(orgId, soId, locationId, validLines);
      
      await DeliveryRepository.updateSOLinesDeliveryQty(orgId, validLines);

      // Only deduct stock if it wasn't already reserved at SO creation
      if (stockAllocationStrategy === 'on_delivery') {
        for (const line of validLines) {
          await tx.stock_ledger.create({
            data: {
              id: `SL-DEL-${Math.random().toString(36).substr(2, 9)}`,
              org_id: orgId,
              item_id: line.itemId,
              location_id: locationId,
              transaction_type: 'issue',
              qty: line.qty,
              reference_type: 'delivery_note',
              reference_id: delivery.id
            }
          });
        }
      }

      return delivery;
    });

    await EventBus.emit('sales.delivery_posted', {
      orgId,
      deliveryId: result.id
    });

    return result;
  }
}
