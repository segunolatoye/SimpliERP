/* eslint-disable jsx-a11y/aria-proptypes */
import { prisma } from '@/lib/db';
import { requirePermission } from '@/lib/auth';
import { toggleModuleAction } from '@/app/actions/settings';

const AVAILABLE_MODULES = [
  { id: 'inventory', name: 'Inventory Management', description: 'Track stock, variants, and batches.' },
  { id: 'purchases', name: 'Purchases', description: 'Manage vendors, POs, and goods receipts.' },
  { id: 'sales', name: 'Sales', description: 'Quotations, sales orders, and invoices.' },
  { id: 'crm', name: 'CRM', description: 'Manage leads, pipelines, and activities.' },
  { id: 'reports', name: 'Advanced Reports', description: 'Dashboard builder and custom reports.' },
];

export default async function SettingsModulesPage({ params }: { params: Promise<{ tenant: string }> }) {
  const { tenant } = await params;
  await requirePermission(tenant, 'core.settings.manage');

  const enabledModules = await prisma.org_modules.findMany({
    where: { organisations: { slug: tenant } }
  });

  const enabledMap = new Set(enabledModules.filter(m => m.enabled).map(m => m.module_name));

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-semibold mb-4 text-gray-900">Modules & Extensions</h2>
      <p className="text-sm text-gray-500 mb-6">Enable or disable modules for your organization.</p>

      <div className="space-y-4">
        {AVAILABLE_MODULES.map(mod => {
          const isEnabled = enabledMap.has(mod.id);
          return (
            <div key={mod.id} className="flex items-center justify-between p-4 border rounded-lg border-gray-200">
              <div>
                <h3 className="text-md font-medium text-gray-900">{mod.name}</h3>
                <p className="text-sm text-gray-500">{mod.description}</p>
              </div>
              <form action={toggleModuleAction.bind(null, tenant)}>
                <input type="hidden" name="module_name" value={mod.id} />
                <input type="hidden" name="enabled" value={isEnabled ? "false" : "true"} />
                <button 
                  type="submit"
                  title={`Toggle ${mod.name}`}
                  aria-label={`Toggle ${mod.name}`}
                  className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:ring-offset-2 ${isEnabled ? 'bg-indigo-600' : 'bg-gray-200'}`}
                  role="switch"
                  aria-checked={isEnabled}
                >
                  <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${isEnabled ? 'translate-x-5' : 'translate-x-0'}`} />
                </button>
              </form>
            </div>
          );
        })}
      </div>
      
      <div className="mt-8 border-t pt-6">
        <h3 className="text-lg font-medium text-gray-900 mb-2">Third-party Integrations</h3>
        <p className="text-sm text-gray-500 mb-4">Connect SimpliERP with your favorite tools.</p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {['Google Sheets', 'n8n', 'Uber', 'Bolt'].map(tool => (
            <div key={tool} className="p-4 border rounded border-gray-200 opacity-60 flex items-center justify-between">
              <span className="font-medium text-gray-700">{tool}</span>
              <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">Coming Soon</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
