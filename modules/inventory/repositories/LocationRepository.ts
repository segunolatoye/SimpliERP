import { prisma } from '../../../../lib/db';

export class LocationRepository {
  static async findById(orgId: string, id: string) {
    return prisma.location.findUnique({
      where: { 
        id
      }
    }).then(loc => loc?.org_id === orgId ? loc : null);
  }

  static async findMany(orgId: string) {
    return prisma.location.findMany({
      where: { org_id: orgId, deleted_at: null },
      orderBy: { name: 'asc' }
    });
  }
}
