'use server';

import { requireAuth, requirePermission } from '@/lib/auth';
import { runActionSafe } from '@/lib/errors/handler';
import { settingsService } from '@/modules/core/settings/services/settings.service';
import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/db';

export async function updateOrganizationAction(orgSlugOrId: string, formData: FormData) {
  await runActionSafe(async () => {
    const { user, orgMember } = await requirePermission(orgSlugOrId, 'core.settings.manage');
    const payload = Object.fromEntries(formData);
    await settingsService.updateOrganization(orgMember.org_id, payload, user.id);
    revalidatePath(`/${orgSlugOrId}/dashboard/settings`);
    return { success: true };
  });
}

export async function updateBrandingAction(orgSlugOrId: string, formData: FormData) {
  await runActionSafe(async () => {
    const { user, orgMember } = await requirePermission(orgSlugOrId, 'core.settings.manage');
    const payload = {
      ...Object.fromEntries(formData),
      keep_branding: formData.get('keep_branding') === 'on',
      recommend_platform: formData.get('recommend_platform') === 'on',
    };
    await settingsService.updateBranding(orgMember.org_id, payload, user.id);
    revalidatePath(`/${orgSlugOrId}/settings/branding`);
    return { success: true };
  });
}

export async function updatePreferencesAction(orgSlugOrId: string, formData: FormData) {
  await runActionSafe(async () => {
    const { user, orgMember } = await requirePermission(orgSlugOrId, 'core.settings.manage');
    const payload = {
      ...Object.fromEntries(formData),
      attach_invoice_pdf_to_email: formData.get('attach_invoice_pdf_to_email') === 'on'
    };
    await settingsService.updatePreferences(orgMember.org_id, payload, user.id);
    revalidatePath(`/${orgSlugOrId}/dashboard/settings/preferences`);
    return { success: true };
  });
}

export async function toggleModuleAction(orgSlugOrId: string, formData: FormData) {
  await runActionSafe(async () => {
    const { user, orgMember } = await requirePermission(orgSlugOrId, 'core.modules.manage');
    const payload = {
      module_name: formData.get('module_name'),
      enabled: formData.get('enabled') === 'true'
    };
    await settingsService.toggleModule(orgMember.org_id, payload, user.id);
    revalidatePath(`/${orgSlugOrId}/dashboard/settings/modules`);
    return { success: true };
  });
}

export async function updateMemberRoleAction(orgSlugOrId: string, targetUserId: string, newRole: string, permissions: string[], formData: FormData) {
  await runActionSafe(async () => {
    const { user, orgMember } = await requirePermission(orgSlugOrId, 'core.users.manage');
    await settingsService.updateMemberRole(orgMember.org_id, targetUserId, newRole, permissions, user.id);
    revalidatePath(`/${orgSlugOrId}/settings/team`);
    return { success: true };
  });
}

export async function removeMemberAction(orgSlugOrId: string, targetUserId: string, formData: FormData) {
  await runActionSafe(async () => {
    const { user, orgMember } = await requirePermission(orgSlugOrId, 'core.users.manage');
    await settingsService.removeMember(orgMember.org_id, targetUserId, user.id);
    revalidatePath(`/${orgSlugOrId}/settings/team`);
    return { success: true };
  });
}

export async function updateModuleSettingsAction(orgSlugOrId: string, moduleName: string, settingsPayload: any) {
  await runActionSafe(async () => {
    // Requires manage permission for the specific module (or core modules manage)
    const { orgMember } = await requirePermission(orgSlugOrId, 'core.modules.manage');
    
    await prisma.org_modules.update({
      where: { org_id_module_name: { org_id: orgMember.org_id, module_name: moduleName } },
      data: { settings: settingsPayload }
    });
    
    revalidatePath(`/${orgSlugOrId}/settings/${moduleName}`);
    return { success: true };
  });
}
