/* eslint-disable jsx-a11y/aria-proptypes */
import { prisma } from '@/lib/db';
import { requirePermission } from '@/lib/auth';
import { toggleModuleAction } from '@/app/actions/settings';
import { Puzzle, Link2 } from 'lucide-react';

const AVAILABLE_MODULES = [
  { id: 'inventory', name: 'Inventory Management', description: 'Track stock levels, variants, batches, and warehouse locations.' },
  { id: 'purchases', name: 'Purchases', description: 'Manage vendors, purchase orders, and goods receipts.' },
  { id: 'sales', name: 'Sales', description: 'Quotations, sales orders, delivery notes, and invoices.' },
  { id: 'crm', name: 'CRM', description: 'Manage leads, customer pipelines, and activities.' },
  { id: 'finance', name: 'Finance & Accounting', description: 'Chart of accounts, journal entries, and automated bookkeeping.' },
  { id: 'reports', name: 'Advanced Reports', description: 'Dashboard builder and custom report exports.' },
];

export default async function SettingsModulesPage({ params }: { params: Promise<{ tenant: string }> }) {
  const { tenant } = await params;
  await requirePermission(tenant, 'core.settings.manage');

  const enabledModules = await prisma.org_modules.findMany({
    where: { organisations: { slug: tenant } }
  });

  const enabledMap = new Set(enabledModules.filter(m => m.enabled).map(m => m.module_name));

  return (
    <div className="space-y-6 pb-24 animate-in fade-in duration-500">
      {/* Header */}
      <div className="sticky top-0 z-40 -mx-6 px-6 py-4 glass-header flex items-center justify-between mb-2">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Puzzle className="w-5 h-5 text-primary/80" />
            Modules &amp; Extensions
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-400">Enable or disable modules for your organization.</p>
        </div>
      </div>

      {/* Module Cards */}
      <div className="glass-card">
        <div className="flex items-center gap-3 mb-6 pb-4 border-b border-white/5">
          <div className="p-2 bg-white/5 rounded-lg border border-white/5">
            <Puzzle className="w-4 h-4 text-slate-700 dark:text-slate-300" />
          </div>
          <h3 className="text-base font-semibold text-slate-900 dark:text-white">Core Modules</h3>
        </div>

        <div className="space-y-3">
          {AVAILABLE_MODULES.map(mod => {
            const isEnabled = enabledMap.has(mod.id);
            return (
              <div
                key={mod.id}
                className={`flex items-center justify-between p-4 rounded-xl border transition-all duration-200 ${
                  isEnabled
                    ? 'bg-primary/5 border-primary/20'
                    : 'bg-white/[0.02] border-white/10 hover:border-white/20'
                }`}
              >
                <div>
                  <h4 className="text-sm font-semibold text-slate-900 dark:text-white">{mod.name}</h4>
                  <p className="text-xs text-slate-500 mt-0.5">{mod.description}</p>
                </div>
                <form action={toggleModuleAction.bind(null, tenant)}>
                  <input type="hidden" name="module_name" value={mod.id} />
                  <input type="hidden" name="enabled" value={isEnabled ? "false" : "true"} />
                  <button
                    type="submit"
                    title={`Toggle ${mod.name}`}
                    aria-label={`Toggle ${mod.name}`}
                    className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-slate-900 ${
                      isEnabled ? 'bg-primary' : 'bg-slate-600'
                    }`}
                    role="switch"
                    aria-checked={isEnabled}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                        isEnabled ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </form>
              </div>
            );
          })}
        </div>
      </div>

      {/* Third-party Integrations */}
      <div className="glass-card">
        <div className="flex items-center gap-3 mb-6 pb-4 border-b border-white/5">
          <div className="p-2 bg-white/5 rounded-lg border border-white/5">
            <Link2 className="w-4 h-4 text-slate-700 dark:text-slate-300" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-slate-900 dark:text-white">Third-party Integrations</h3>
            <p className="text-xs text-slate-500">Connect SimpliERP with your favorite tools.</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {['Google Sheets', 'n8n', 'Uber', 'Bolt'].map(tool => (
            <div
              key={tool}
              className="p-4 rounded-xl border border-white/10 bg-white/[0.02] opacity-60 flex items-center justify-between"
            >
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{tool}</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 text-slate-500 border border-white/5 font-medium">
                Coming Soon
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
