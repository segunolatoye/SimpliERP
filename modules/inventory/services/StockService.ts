import { StockLedgerRepository } from '../repositories/StockLedgerRepository';
import { LocationRepository } from '../repositories/LocationRepository';
import { ItemRepository } from '../repositories/ItemRepository';
import { StockAdjustmentInputSchema } from '../validations/stock.schema';

export class StockService {
  static async adjustStock(orgId: string, data: any, userId: string) {
    const parsedData = StockAdjustmentInputSchema.parse(data);

    // Validate Item and Location exist
    const [item, location] = await Promise.all([
      ItemRepository.findById(orgId, parsedData.item_id),
      LocationRepository.findById(orgId, parsedData.location_id)
    ]);

    if (!item) throw new Error("Item not found");
    if (!location) throw new Error("Location not found");

    // No-Negative-Inventory Rule Check
    if (parsedData.qty_delta < 0) {
      const currentBalance = await StockLedgerRepository.getBalance(orgId, parsedData.item_id, parsedData.location_id);
      if (currentBalance + parsedData.qty_delta < 0) {
        throw new Error(`Insufficient stock. Current balance: ${currentBalance}, Attempted reduction: ${Math.abs(parsedData.qty_delta)}`);
      }
    }

    // Determine Movement Type
    const isOpeningBalance = parsedData.reason_code === 'OPENING_BALANCE';
    const movementType = parsedData.qty_delta > 0 ? (isOpeningBalance ? 'receipt' : 'adjustment') : 'adjustment';

    // Insert Ledger Entry
    const ledgerEntry = await StockLedgerRepository.addEntry(orgId, {
      item_id: parsedData.item_id,
      location_id: parsedData.location_id,
      variant_id: parsedData.variant_id,
      qty_delta: parsedData.qty_delta,
      movement_type: movementType,
      reference_type: isOpeningBalance ? 'opening_balance' : 'manual_adjustment',
      batch_no: parsedData.batch_no,
      serial_no: parsedData.serial_no,
      expiry_date: parsedData.expiry_date,
      cost_price: parsedData.cost_price || item.cost_price, // Use provided cost or fallback to item's default cost
      // In a full implementation, we would also update the item's moving average cost here if WAC is used.
    });

    return ledgerEntry;
  }

  static async getStockBalance(orgId: string, itemId: string, locationId?: string) {
    return StockLedgerRepository.getBalance(orgId, itemId, locationId);
  }
}
