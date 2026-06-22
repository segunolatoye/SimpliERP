import { prisma } from '@/lib/db';
import { AppError } from '@/lib/errors/appError';

export type DocumentModule = 
  | 'INVOICE' 
  | 'PURCHASE_ORDER' 
  | 'GOODS_RECEIPT' 
  | 'DELIVERY_NOTE' 
  | 'STOCK_ADJUSTMENT'
  | 'JOURNAL_ENTRY'
  | 'CUSTOMER_PAYMENT'
  | 'VENDOR_PAYMENT'
  | 'CREDIT_NOTE'
  | 'SALES_ORDER';

/**
 * Generates the next sequential document number for a given module and organization.
 * This operation is atomic.
 * 
 * @param orgId The organization ID
 * @param module The document module (e.g., INVOICE)
 * @param locationId Optional location ID if series is location-specific
 * @returns The formatted document number string (e.g., "INV-00101-26")
 */
export async function getNextDocumentNumber(orgId: string, module: DocumentModule, locationId?: string): Promise<string> {
  // 1. Find the appropriate series group
  let group = null;
  
  // First, try to find a group specific to this location
  if (locationId) {
    const groups = await prisma.transaction_series_groups.findMany({
      where: { org_id: orgId, deleted_at: null }
    });
    
    // Check if location matches in JSON array
    group = groups.find((g: any) => {
      const locations = g.locations as string[];
      return Array.isArray(locations) && locations.includes(locationId);
    });
  }

  // Fallback to default group if no location match or no location provided
  if (!group) {
    group = await prisma.transaction_series_groups.findFirst({
      where: { org_id: orgId, is_default: true, deleted_at: null }
    });
  }

  if (!group) {
    throw new AppError('No transaction series group found. Please configure document numbering in settings.', 'NOT_FOUND', 404);
  }

  // 2. Atomically increment the starting_number for the specific module
  // Prisma's atomic update handles concurrency natively via database locks
  try {
    const updatedSeriesItem = await prisma.transaction_series_items.update({
      where: {
        group_id_document_module: {
          group_id: group.id,
          document_module: module
        }
      },
      data: {
        starting_number: {
          increment: 1
        }
      }
    });

    // The consumed number is (starting_number - 1) because we already incremented it for the next call.
    // E.g., if it was 100, it's now 101. The consumed number is 100.
    const consumedNumber = updatedSeriesItem.starting_number - 1;

    // 3. Format the final document number
    // You could expand this to pad numbers with zeros (e.g., INV-000100)
    // We'll assume a 6-digit zero padding by default, configurable later if needed.
    const paddedNumber = consumedNumber.toString().padStart(6, '0');
    
    const prefix = updatedSeriesItem.prefix ? `${updatedSeriesItem.prefix}-` : '';
    const suffix = updatedSeriesItem.suffix ? `-${updatedSeriesItem.suffix}` : '';

    return `${prefix}${paddedNumber}${suffix}`;
  } catch (error: any) {
    // If the item doesn't exist, it means the module hasn't been configured for this group
    if (error.code === 'P2025') {
      throw new AppError(`No numbering sequence configured for ${module}. Please update your transaction series settings.`, 'NOT_FOUND', 404);
    }
    throw error;
  }
}

export const DocumentNumberingEngine = {
  generateNextNumber: getNextDocumentNumber
};
