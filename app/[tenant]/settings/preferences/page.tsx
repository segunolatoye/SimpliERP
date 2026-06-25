import { prisma } from '@/lib/db';
import { requirePermission } from '@/lib/auth';
import { updatePreferencesAction } from '@/app/actions/settings';
import { Sliders, Save } from 'lucide-react';
import { Button } from '@/packages/ui-kit/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/packages/ui-kit/components/ui/select';

export default async function SettingsPreferencesPage({ params }: { params: Promise<{ tenant: string }> }) {
  const { tenant } = await params;
  await requirePermission(tenant, 'core.settings.manage');

  const pref = await prisma.general_preferences.findFirst({
    where: { organisations: { slug: tenant } }
  });

  return (
    <div className="space-y-6 pb-24 animate-in fade-in duration-500">
      <form action={updatePreferencesAction.bind(null, tenant)}>
        {/* Sticky Header */}
        <div className="sticky top-0 z-40 -mx-6 px-6 py-4 glass-header flex items-center justify-between mb-8">
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Sliders className="w-5 h-5 text-primary/80" />
              General Preferences
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-400">Manage accounting and operational settings.</p>
          </div>
          <Button
            type="submit"
            className="bg-primary hover:bg-primary/90 text-slate-900 dark:text-white shadow-lg shadow-primary/20"
          >
            <Save className="w-4 h-4 mr-2" />
            Save Preferences
          </Button>
        </div>

        {/* Operational Settings */}
        <div className="glass-card">
          <div className="flex items-center gap-3 mb-6 pb-4 border-b border-white/5">
            <div className="p-2 bg-white/5 rounded-lg border border-white/5">
              <Sliders className="w-4 h-4 text-slate-700 dark:text-slate-300" />
            </div>
            <h3 className="text-base font-semibold text-slate-900 dark:text-white">Operational Settings</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label htmlFor="stock_tracking_mode" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Stock Tracking Mode
              </label>
              <Select name="stock_tracking_mode" defaultValue={pref?.stock_tracking_mode || 'physical'}>
                <SelectTrigger className="premium-input w-full">
                  <SelectValue placeholder="Select mode" />
                </SelectTrigger>
                <SelectContent className="bg-premium-surface border-white/10 text-slate-200">
                  <SelectItem value="physical">Physical (Inventory Counts)</SelectItem>
                  <SelectItem value="accounting">Accounting Only</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label htmlFor="tax_inclusive_sales" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Tax Inclusive Sales
              </label>
              <Select name="tax_inclusive_sales" defaultValue={pref?.tax_inclusive_sales || 'exclusive'}>
                <SelectTrigger className="premium-input w-full">
                  <SelectValue placeholder="Select mode" />
                </SelectTrigger>
                <SelectContent className="bg-premium-surface border-white/10 text-slate-200">
                  <SelectItem value="exclusive">Exclusive (Tax added on top)</SelectItem>
                  <SelectItem value="inclusive">Inclusive (Prices include Tax)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="md:col-span-2 flex items-center gap-3 p-4 rounded-xl bg-white/[0.02] border border-white/10">
              <input
                type="checkbox"
                name="attach_invoice_pdf_to_email"
                id="attach_invoice_pdf"
                title="Attach Invoice PDF"
                defaultChecked={pref?.attach_invoice_pdf_to_email}
                className="h-4 w-4 rounded border-slate-600 bg-transparent text-primary focus:ring-primary focus:ring-offset-0"
              />
              <label htmlFor="attach_invoice_pdf" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Attach Invoice PDF to Email Automatically
              </label>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
