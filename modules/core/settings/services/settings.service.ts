import { settingsRepository } from '../repositories/settings.repository';
import { ForbiddenError, NotFoundError } from '@/lib/errors/appError';
import { prisma } from '@/lib/db';
import { updateOrgSchema, updatePreferencesSchema, toggleModuleSchema, updateRoleSchema, updateBrandingSchema } from '../validations/settingsSchema';

export class SettingsService {
  async updateOrganization(orgId: string, payload: unknown, actorId: string) {
    const data = updateOrgSchema.parse(payload);
    return settingsRepository.updateOrganization(orgId, data);
  }

  async updateBranding(orgId: string, payload: unknown, actorId: string) {
    const data = updateBrandingSchema.parse(payload);
    return settingsRepository.updateOrganization(orgId, data);
  }

  async updatePreferences(orgId: string, payload: unknown, actorId: string) {
    const data = updatePreferencesSchema.parse(payload);
    return settingsRepository.updatePreferences(orgId, data);
  }

  async toggleModule(orgId: string, payload: unknown, actorId: string) {
    const data = toggleModuleSchema.parse(payload);
    return settingsRepository.toggleModule(orgId, data.module_name, data.enabled);
  }

  async updateMemberRole(orgId: string, targetUserId: string, newRole: string, newPermissions: string[], actorId: string) {
    // Owner protection logic
    const targetMember = await prisma.org_members.findUnique({
      where: { org_id_user_id: { org_id: orgId, user_id: targetUserId } }
    });

    if (!targetMember) throw new NotFoundError('Member not found');

    if (targetMember.role === 'owner') {
      throw new ForbiddenError('The organization owner role cannot be modified.');
    }

    return prisma.org_members.update({
      where: { org_id_user_id: { org_id: orgId, user_id: targetUserId } },
      data: {
        role: newRole,
        permissions: newPermissions
      }
    });
  }

  async removeMember(orgId: string, targetUserId: string, actorId: string) {
    const targetMember = await prisma.org_members.findUnique({
      where: { org_id_user_id: { org_id: orgId, user_id: targetUserId } }
    });

    if (!targetMember) throw new NotFoundError('Member not found');

    if (targetMember.role === 'owner') {
      throw new ForbiddenError('The organization owner cannot be removed.');
    }

    return prisma.org_members.delete({
      where: { org_id_user_id: { org_id: orgId, user_id: targetUserId } }
    });
  }
}

export const settingsService = new SettingsService();
