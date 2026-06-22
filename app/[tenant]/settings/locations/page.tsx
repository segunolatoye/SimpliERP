import { prisma } from '@/lib/db';
import { requirePermission } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { LocationsClient } from '@/modules/core/settings/ui/LocationsClient';

export default async function LocationsPage({ params }: { params: Promise<{ tenant: string }> }) {
  const resolvedParams = await params;
  const tenantSlug = resolvedParams.tenant;

  await requirePermission(tenantSlug, 'core.settings.manage');

  const org = await prisma.organisations.findUnique({
    where: { slug: tenantSlug },
    select: { id: true, name: true }
  });

  if (!org) redirect('/onboarding');

  const locations = await prisma.location.findMany({
    where: { org_id: org.id },
    orderBy: { name: 'asc' },
    include: {
      parent_location: { select: { name: true } },
      users: { select: { email: true } }
    }
  });

  const members = await prisma.org_members.findMany({
    where: { org_id: org.id },
    select: { user_id: true, users: { select: { email: true } } }
  });

  return <LocationsClient tenantSlug={tenantSlug} locations={locations} members={members} />;
}
