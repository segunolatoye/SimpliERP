import { SalesOrderRepository } from '../repositories/so.repository';
import { prisma } from '@/lib/db';
import { EventBus } from '@/lib/events/bus';

export class SalesOrderService {
  static async createSO(orgId: string, payload: any, userId: string) {
    // 1. Fetch item definitions to resolve the "Frozen State" rule
    const itemIds = payload.lines.map((l: any) => l.itemId);
    const items = await prisma.item.findMany({
      where: { id: { in: itemIds }, org_id: orgId }
    });

    const itemMap = new Map(items.map(i => [i.id, i]));

    // 2. Fetch Organization Settings to see Stock Allocation strategy
    const org = await prisma.organisations.findUnique({ where: { id: orgId } });
    const settings = org?.settings as any || {};
    const stockAllocationStrategy = settings.sales_stock_allocation || 'on_delivery';

    // 3. Map lines to determine requires_delivery_match
    const processedLines = payload.lines.map((line: any) => {
      const item = itemMap.get(line.itemId);
      if (!item) throw new Error(`Item ${line.itemId} not found`);

      // If it's a physical good, it requires a delivery note to match against.
      // If it's a service, it doesn't need physical delivery.
      const requiresDeliveryMatch = item.requires_physical_receipt;

      return {
        ...line,
        requires_delivery_match: requiresDeliveryMatch
      };
    });

    const updatedPayload = { ...payload, lines: processedLines };

    // 4. Create the SO transactionally (with potential stock reservation)
    const result = await prisma.$transaction(async (tx) => {
      const so = await SalesOrderRepository.create(orgId, updatedPayload, userId);

      // If stock allocation is "on_so_creation", we must reserve the stock now.
      if (stockAllocationStrategy === 'on_so_creation') {
        // Find default warehouse to reserve from (simplification)
        const location = await tx.location.findFirst({
          where: { org_id: orgId, type: 'warehouse' }
        });

        if (location) {
          for (const line of so.so_lines) {
            if (line.requires_delivery_match) {
              // Create a stock ledger entry of type 'reserved' or similar
              // SimpliERP stock ledger model doesn't explicitly have 'reserved' yet, 
              // but we can issue an event or adjust available stock immediately
              await tx.stock_ledger.create({
                data: {
                  id: `SL-RES-${Math.random().toString(36).substr(2, 9)}`,
                  org_id: orgId,
                  item_id: line.item_id,
                  location_id: location.id,
                  transaction_type: 'issue', // Or a new 'reservation' type
                  qty: line.qty_ordered, // positive value, but means reduction
                  reference_type: 'sales_order',
                  reference_id: so.id
                }
              });
            }
          }
        }
      }

      return so;
    });

    return result;
  }
}
