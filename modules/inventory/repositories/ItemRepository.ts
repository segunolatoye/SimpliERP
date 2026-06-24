import { prisma } from '../../../../lib/db';
import { Prisma } from '@prisma/client';

export class ItemRepository {
  static async create(orgId: string, data: any) {
    return prisma.item.create({
      data: {
        ...data,
        org_id: orgId
      }
    });
  }

  static async findById(orgId: string, id: string) {
    return prisma.item.findUnique({
      where: {
        id,
      }
    }).then(item => item?.org_id === orgId ? item : null);
  }

  static async findBySku(orgId: string, sku: string) {
    return prisma.item.findUnique({
      where: {
        org_id_sku: {
          org_id: orgId,
          sku
        }
      }
    });
  }

  static async update(orgId: string, id: string, data: any) {
    // Make sure the item belongs to the org
    const item = await this.findById(orgId, id);
    if (!item) throw new Error("Item not found or access denied");

    return prisma.item.update({
      where: {
        id,
      },
      data
    });
  }

  static async findMany(orgId: string, params: { skip?: number, take?: number, search?: string }) {
    const { skip = 0, take = 50, search } = params;
    const where: Prisma.ItemWhereInput = { org_id: orgId, deleted_at: null };
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { sku: { contains: search, mode: 'insensitive' } }
      ];
    }
    const [items, total] = await Promise.all([
      prisma.item.findMany({
        where,
        skip,
        take,
        orderBy: { created_at: 'desc' }
      }),
      prisma.item.count({ where })
    ]);
    return { items, total };
  }

  static async archiveItem(orgId: string, id: string) {
    const item = await this.findById(orgId, id);
    if (!item) throw new Error("Item not found or access denied");

    return prisma.item.update({
      where: { id },
      data: { deleted_at: new Date() }
    });
  }
}
