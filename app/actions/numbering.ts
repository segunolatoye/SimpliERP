'use server';

import { requirePermission } from '@/lib/auth';
import { runActionSafe } from '@/lib/errors/handler';
import { prisma } from '@/lib/db';
import { revalidatePath } from 'next/cache';
import { v4 as uuidv4 } from 'uuid';

export async function upsertNumberingGroupAction(orgSlugOrId: string, groupId: string | null, payload: { name: string, is_default: boolean, locations: string[] }) {
  await runActionSafe(async () => {
    const { user, orgMember } = await requirePermission(orgSlugOrId, 'core.settings.manage');
    
    // If setting as default, unset others
    if (payload.is_default) {
      await prisma.transaction_series_groups.updateMany({
        where: { org_id: orgMember.org_id, is_default: true },
        data: { is_default: false }
      });
    }

    if (groupId) {
      await prisma.transaction_series_groups.update({
        where: { id: groupId },
        data: {
          name: payload.name,
          is_default: payload.is_default,
          locations: payload.locations,
          updated_at: new Date()
        }
      });
    } else {
      await prisma.transaction_series_groups.create({
        data: {
          id: uuidv4(),
          org_id: orgMember.org_id,
          name: payload.name,
          is_default: payload.is_default,
          locations: payload.locations,
          updated_at: new Date()
        }
      });
    }
    
    revalidatePath(`/${orgSlugOrId}/settings/document-numbering`);
    return { success: true };
  });
}

export async function deleteNumberingGroupAction(orgSlugOrId: string, groupId: string) {
  await runActionSafe(async () => {
    const { orgMember } = await requirePermission(orgSlugOrId, 'core.settings.manage');
    
    await prisma.transaction_series_groups.update({
      where: { id: groupId, org_id: orgMember.org_id },
      data: { deleted_at: new Date(), updated_at: new Date() }
    });
    
    revalidatePath(`/${orgSlugOrId}/settings/document-numbering`);
    return { success: true };
  });
}

export async function upsertNumberingItemAction(
  orgSlugOrId: string, 
  groupId: string, 
  documentModule: string, 
  payload: { prefix: string, starting_number: number, suffix: string, restart_numbering: string }
) {
  await runActionSafe(async () => {
    await requirePermission(orgSlugOrId, 'core.settings.manage');
    
    await prisma.transaction_series_items.upsert({
      where: {
        group_id_document_module: {
          group_id: groupId,
          document_module: documentModule
        }
      },
      update: {
        prefix: payload.prefix,
        starting_number: payload.starting_number,
        suffix: payload.suffix,
        restart_numbering: payload.restart_numbering
      },
      create: {
        id: uuidv4(),
        group_id: groupId,
        document_module: documentModule,
        prefix: payload.prefix,
        starting_number: payload.starting_number,
        suffix: payload.suffix,
        restart_numbering: payload.restart_numbering
      }
    });

    revalidatePath(`/${orgSlugOrId}/settings/document-numbering`);
    return { success: true };
  });
}

export async function deleteNumberingItemAction(orgSlugOrId: string, itemId: string) {
  await runActionSafe(async () => {
    await requirePermission(orgSlugOrId, 'core.settings.manage');
    
    await prisma.transaction_series_items.delete({
      where: { id: itemId }
    });
    
    revalidatePath(`/${orgSlugOrId}/settings/document-numbering`);
    return { success: true };
  });
}
