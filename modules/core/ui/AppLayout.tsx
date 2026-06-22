import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { FloatingChecklist } from './FloatingChecklist';

type AppLayoutProps = {
  children: React.ReactNode;
  userName?: string;
  userRole?: string;
  tenantSlug?: string;
  enabledModules?: string[];
};

export function AppLayout({ children, userName, userRole, tenantSlug, enabledModules = [] }: AppLayoutProps) {
  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar userName={userName} userRole={userRole} orgSlug={tenantSlug} />
      <div className="flex-1 flex flex-col min-w-0 relative">
        <Topbar tenantSlug={tenantSlug} enabledModules={enabledModules} />
        <main className="flex-1 overflow-y-auto bg-slate-50 dark:bg-[#0B0E14]">
          {children}
        </main>
        {tenantSlug && <FloatingChecklist tenantSlug={tenantSlug} />}
      </div>
    </div>
  );
}
