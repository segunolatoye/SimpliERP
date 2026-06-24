import { AppLayout } from "@/modules/core/ui/AppLayout";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/db";

export default async function ProtectedLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ tenant: string }>;
}) {
  const { tenant } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const fullName = user?.user_metadata?.full_name || user?.user_metadata?.name || user?.email || 'User';

  // Get the user's role from their org membership
  let role = 'Member';
  let enabledModules: string[] = [];

  if (user) {
    const membership = await prisma.org_members.findFirst({
      where: { user_id: user.id },
      select: { role: true },
    });
    if (membership?.role) {
      role = membership.role.charAt(0).toUpperCase() + membership.role.slice(1);
    }
  }

  const org = await prisma.organisations.findFirst({
    where: { slug: tenant },
    select: { id: true }
  });
  
  if (org) {
    const { getTenantLimits } = await import("@/lib/billing/quota");
    const limits = await getTenantLimits(org.id);
    enabledModules = limits.modules as string[];
  }

  return (
    <AppLayout
      userName={fullName}
      userRole={role}
      tenantSlug={tenant}
      enabledModules={enabledModules}
    >
      {children}
    </AppLayout>
  );
}
