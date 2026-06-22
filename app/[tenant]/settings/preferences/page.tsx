import { prisma } from '@/lib/db';
import { requirePermission } from '@/lib/auth';
import { updatePreferencesAction } from '@/app/actions/settings';

export default async function SettingsPreferencesPage({ params }: { params: Promise<{ tenant: string }> }) {
  const { tenant } = await params;
  await requirePermission(tenant, 'core.settings.manage');

  const pref = await prisma.general_preferences.findFirst({
    where: { organisations: { slug: tenant } }
  });

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-semibold mb-4 text-gray-900">General Preferences</h2>
      <p className="text-sm text-gray-500 mb-6">Manage accounting and operational settings.</p>

      <form action={updatePreferencesAction.bind(null, tenant)} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="stock_tracking_mode" className="block text-sm font-medium text-gray-700">Stock Tracking Mode</label>
            <select 
              id="stock_tracking_mode"
              name="stock_tracking_mode" 
              title="Stock Tracking Mode"
              defaultValue={pref?.stock_tracking_mode || 'physical'}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            >
              <option value="physical">Physical (Inventory Counts)</option>
              <option value="accounting">Accounting Only</option>
            </select>
          </div>
          <div>
            <label htmlFor="tax_inclusive_sales" className="block text-sm font-medium text-gray-700">Tax Inclusive Sales</label>
            <select 
              id="tax_inclusive_sales"
              name="tax_inclusive_sales" 
              title="Tax Inclusive Sales"
              defaultValue={pref?.tax_inclusive_sales || 'exclusive'}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            >
              <option value="exclusive">Exclusive (Tax added on top)</option>
              <option value="inclusive">Inclusive (Prices include Tax)</option>
            </select>
          </div>
          <div className="flex items-center space-x-3 mt-4 md:col-span-2">
            <input 
              type="checkbox" 
              name="attach_invoice_pdf_to_email" 
              id="attach_invoice_pdf"
              title="Attach Invoice PDF"
              defaultChecked={pref?.attach_invoice_pdf_to_email}
              className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
            />
            <label htmlFor="attach_invoice_pdf" className="text-sm font-medium text-gray-700">Attach Invoice PDF to Email Automatically</label>
          </div>
        </div>
        <div className="pt-4 flex justify-end">
          <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition">
            Save Preferences
          </button>
        </div>
      </form>
    </div>
  );
}
