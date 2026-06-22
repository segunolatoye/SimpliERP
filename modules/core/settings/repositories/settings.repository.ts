import { prisma } from '@/lib/db';

export class SettingsRepository {
  async getOrganization(orgId: string) {
    return prisma.organisations.findUnique({
      where: { id: orgId },
      include: {
        general_preferences: true,
      }
    });
  }

  async updateOrganization(orgId: string, data: any) {
    return prisma.organisations.update({
      where: { id: orgId },
      data,
    });
  }

  async updatePreferences(orgId: string, data: any) {
    return prisma.general_preferences.upsert({
      where: { org_id: orgId },
      update: data,
      create: {
        org_id: orgId,
        id: crypto.randomUUID(),
        ...data,
      }
    });
  }

  async getModules(orgId: string) {
    return prisma.org_modules.findMany({
      where: { org_id: orgId }
    });
  }

  async toggleModule(orgId: string, moduleName: string, enabled: boolean) {
    return prisma.org_modules.upsert({
      where: { org_id_module_name: { org_id: orgId, module_name: moduleName } },
      update: { enabled },
      create: {
        id: crypto.randomUUID(),
        org_id: orgId,
        module_name: moduleName,
        enabled,
        updated_at: new Date()
      }
    });
  }

  async getTeamMembers(orgId: string) {
    return prisma.org_members.findMany({
      where: { org_id: orgId },
      include: {
        users: {
          select: { id: true, email: true, phone_number: true }
        }
      }
    });
  }
}

export const settingsRepository = new SettingsRepository();
