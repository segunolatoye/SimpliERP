import { prisma } from "@/lib/db";
import { POStatus } from "@prisma/client";
import { v4 as uuidv4 } from "uuid";
import { StockLedgerEngine } from "@/lib/modules/inventory/stock-ledger";

export interface CreateGRNParams {
  orgId: string;
  poId: string;
  locationId: string;
  receivedBy: string;
  notes?: string;
  lines: Array<{
    poLineId: string;
    itemId: string;
    qtyReceived: number;
    batchNo?: string;
    expiryDate?: Date;
    costPrice?: number;
  }>;
}

export class GRNRepository {
  static async create(grnId: string, params: CreateGRNParams) {
    return await prisma.$transaction(async (tx) => {
      // 1. Create the GRN Header
      const grn = await tx.goods_receipts.create({
        data: {
          id: grnId,
          org_id: params.orgId,
          po_id: params.poId,
          location_id: params.locationId,
          received_by: params.receivedBy,
          notes: params.notes,
        }
      });

      // 2. Create the GRN Lines and update PO Lines
      const grLinesData = [];
      for (const line of params.lines) {
        if (line.qtyReceived <= 0) continue;

        const lineId = uuidv4();
        grLinesData.push({
          id: lineId,
          org_id: params.orgId,
          gr_id: grnId,
          po_line_id: line.poLineId,
          qty_received: line.qtyReceived,
          batch_no: line.batchNo,
          expiry_date: line.expiryDate,
        });

        // Increment the qty_received on the PO Line
        await tx.po_lines.update({
          where: { id: line.poLineId },
          data: {
            qty_received: {
              increment: line.qtyReceived
            }
          }
        });
      }

      if (grLinesData.length > 0) {
        await tx.gr_lines.createMany({
          data: grLinesData
        });
      }

      // 3. Post to the Stock Ledger
      await StockLedgerEngine.receiveGoods({
        orgId: params.orgId,
        grnId: grnId,
        locationId: params.locationId,
        lines: params.lines.filter(l => l.qtyReceived > 0)
      }, tx);

      // 4. Check if the PO is fully received
      const poLines = await tx.po_lines.findMany({
        where: { po_id: params.poId }
      });

      const isFullyReceived = poLines.every(pl => pl.qty_received >= pl.qty_ordered);
      
      if (isFullyReceived) {
        await tx.purchase_orders.update({
          where: { id: params.poId },
          data: { status: POStatus.received }
        });
      }

      return grn;
    });
  }
}
