import { prisma } from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';

export class DeliveryRepository {
  static async create(orgId: string, soId: string, locationId: string, lines: any[]) {
    const deliveryId = `DN-${Math.floor(Math.random() * 1000000)}`;

    return await prisma.delivery_notes.create({
      data: {
        id: deliveryId,
        org_id: orgId,
        so_id: soId,
        location_id: locationId,
        status: 'shipped',
        shipped_at: new Date(),
        delivery_note_lines: {
          create: lines.map((line: any) => ({
            id: uuidv4(),
            so_line_id: line.soLineId,
            item_id: line.itemId,
            qty_delivered: line.qty
          }))
        }
      },
      include: {
        delivery_note_lines: true
      }
    });
  }

  static async updateSOLinesDeliveryQty(orgId: string, lines: any[]) {
    // Update qty_delivered on the SO lines
    for (const line of lines) {
      await prisma.so_lines.update({
        where: { id: line.soLineId },
        data: {
          qty_delivered: { increment: line.qty }
        }
      });
    }
  }

  static async findById(id: string, orgId: string) {
    return await prisma.delivery_notes.findFirst({
      where: { id, org_id: orgId, deleted_at: null },
      include: {
        delivery_note_lines: {
          include: { items: true, so_lines: true }
        },
        sales_orders: true,
        locations: true
      }
    });
  }

  static async findAll(orgId: string) {
    return await prisma.delivery_notes.findMany({
      where: { org_id: orgId, deleted_at: null },
      include: { sales_orders: true, locations: true },
      orderBy: { created_at: 'desc' }
    });
  }
}
