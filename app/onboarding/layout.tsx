import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/db";

export default async function OnboardingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // If user already belongs to an organization, they have completed onboarding
  const existingMembership = await prisma.org_members.findFirst({
    where: { user_id: user.id },
    include: { organisations: true }
  });

  if (existingMembership && existingMembership.organisations?.slug) {
    redirect(`/${existingMembership.organisations.slug}/dashboard`);
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#05070A] p-4 text-slate-300">
      <div className="w-full max-w-xl">
        {children}
      </div>
    </div>
  )
}
