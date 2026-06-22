import { prisma } from '@/lib/db';
import { requirePermission } from '@/lib/auth';
import { TeamSettingsClient } from '@/modules/core/settings/ui/TeamSettingsClient';

export default async function SettingsTeamPage({ params }: { params: Promise<{ tenant: string }> }) {
  const { tenant } = await params;
  await requirePermission(tenant, 'core.settings.manage');

  const members = await prisma.org_members.findMany({
    where: { organisations: { slug: tenant } },
    include: {
      users: { select: { id: true, email: true, phone_number: true } }
    }
  });

  return (
    <div className="max-w-6xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <TeamSettingsClient tenantSlug={tenant} members={members} />
    </div>
  );
}
