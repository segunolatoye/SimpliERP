import { prisma } from '../../../../lib/db';
import { Prisma } from '@prisma/client';

export class StockLedgerRepository {
  static async addEntry(orgId: string, data: any) {
    return prisma.stock_ledger.create({
      data: {
        ...data,
        org_id: orgId
      }
    });
  }

  static async getBalance(orgId: string, itemId: string, locationId?: string) {
    const where: Prisma.stock_ledgerWhereInput = {
      org_id: orgId,
      item_id: itemId,
    };
    if (locationId) {
      where.location_id = locationId;
    }

    const aggregations = await prisma.stock_ledger.aggregate({
      _sum: {
        qty_delta: true
      },
      where
    });

    return aggregations._sum.qty_delta || 0;
  }
}
