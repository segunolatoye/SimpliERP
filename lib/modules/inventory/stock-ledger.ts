import { prisma } from "@/lib/db";
import { MovementType } from "@prisma/client";
import { v4 as uuidv4 } from 'uuid';

export class StockLedgerEngine {
  
  /**
   * Post a stock adjustment to the ledger.
   * This handles simple adjustments where we directly state how much stock is added or removed.
   */
  static async postAdjustment(params: {
    orgId: string;
    itemId: string;
    locationId: string;
    qtyDelta: number; // positive for addition, negative for subtraction
    costPrice?: number;
    referenceId?: string;
    referenceType?: string;
  }) {
    if (params.qtyDelta === 0) {
      throw new Error("Quantity delta cannot be zero for an adjustment.");
    }

    // Ensure the location exists and belongs to the org
    const location = await prisma.location.findFirst({
      where: { id: params.locationId, org_id: params.orgId }
    });
    if (!location) throw new Error("Location not found or does not belong to this organization.");

    // Ensure item exists
    const item = await prisma.item.findFirst({
      where: { id: params.itemId, org_id: params.orgId }
    });
    if (!item) throw new Error("Item not found or does not belong to this organization.");

    // Write to the stock ledger
    const entry = await prisma.stock_ledger.create({
      data: {
        id: uuidv4(),
        org_id: params.orgId,
        item_id: params.itemId,
        location_id: params.locationId,
        qty_delta: params.qtyDelta,
        movement_type: MovementType.adjustment,
        cost_price: params.costPrice || item.cost_price || 0,
        reference_id: params.referenceId,
        reference_type: params.referenceType || 'MANUAL_ADJUSTMENT'
      }
    });

    return entry;
  }

  /**
   * Post a goods receipt to the ledger.
   * Typically called within a transaction when a GRN is created.
   */
  static async receiveGoods(
    params: {
      orgId: string;
      grnId: string;
      locationId: string;
      lines: Array<{
        itemId: string;
        qtyReceived: number;
        costPrice?: number;
      }>;
    },
    tx: any = prisma
  ) {
    const entries = params.lines.map(line => ({
      id: uuidv4(),
      org_id: params.orgId,
      item_id: line.itemId,
      location_id: params.locationId,
      qty_delta: line.qtyReceived,
      movement_type: MovementType.receipt,
      cost_price: line.costPrice || 0,
      reference_id: params.grnId,
      reference_type: 'GOODS_RECEIPT'
    }));

    if (entries.length > 0) {
      await tx.stock_ledger.createMany({
        data: entries
      });
    }
  }

  /**
   * Retrieves current stock level for an item across all locations or a specific location.
   */
  static async getStockLevel(orgId: string, itemId: string, locationId?: string) {
    const whereClause: any = { org_id: orgId, item_id: itemId };
    if (locationId) {
      whereClause.location_id = locationId;
    }

    const result = await prisma.stock_ledger.aggregate({
      where: whereClause,
      _sum: { qty_delta: true }
    });

    return result._sum.qty_delta || 0;
  }
}
