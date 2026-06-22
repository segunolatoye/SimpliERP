import { prisma } from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';

export class VendorRepository {
  static async create(orgId: string, data: any) {
    return prisma.vendors.create({
      data: {
        id: uuidv4(),
        org_id: orgId,
        name: data.name,
        email: data.email,
        phone: data.phone,
        address: data.address,
        payment_terms_days: data.payment_terms_days,
        tax_id: data.tax_id,
        currency: data.currency,
        notes: data.notes,
        updated_at: new Date()
      }
    });
  }

  static async findAll(orgId: string) {
    return prisma.vendors.findMany({
      where: { org_id: orgId, deleted_at: null },
      orderBy: { name: 'asc' }
    });
  }

  static async findById(orgId: string, id: string) {
    return prisma.vendors.findFirst({
      where: { id, org_id: orgId, deleted_at: null }
    });
  }
}
