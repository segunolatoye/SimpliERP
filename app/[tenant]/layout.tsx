import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/db";
import { TenantThemeProvider } from "@/modules/core/ui/TenantThemeProvider";

export default async function TenantLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ tenant: string }>;
}) {
  const { tenant } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Validate that the slug exists and the user belongs to it
  const org = await prisma.organisations.findFirst({
    where: {
      slug: tenant,
      org_members: {
        some: { user_id: user.id }
      }
    },
    select: { id: true, theme_mode: true, accent_color: true },
  });

  if (!org) {
    // User does not belong to this org, or the slug is invalid
    redirect("/login");
  }

  return (
    <TenantThemeProvider accentColor={org.accent_color || undefined}>
      {children}
    </TenantThemeProvider>
  );
}
