import { prisma } from '@/lib/db';
import { requirePermission } from '@/lib/auth';
import { updateBrandingAction } from '@/app/actions/settings';
import { redirect } from 'next/navigation';
import { Paintbrush, Save } from 'lucide-react';
import { Button } from '@/packages/ui-kit/components/ui/button';
import { ImageUploader } from '@/modules/core/ui/ImageUploader';

export default async function SettingsBrandingPage({ params }: { params: Promise<{ tenant: string }> }) {
  const { tenant } = await params;
  await requirePermission(tenant, 'core.settings.manage');

  const org = await prisma.organisations.findUnique({
    where: { slug: tenant }
  });

  if (!org) redirect('/onboarding');

  const accentColors = [
    { name: 'Indigo', value: '#4f46e5' },
    { name: 'Blue', value: '#2563eb' },
    { name: 'Emerald', value: '#059669' },
    { name: 'Rose', value: '#e11d48' },
    { name: 'Amber', value: '#d97706' },
    { name: 'Slate', value: '#475569' },
  ];

  return (
    <div className="space-y-6 pb-24 relative animate-in fade-in duration-500">
      <form action={updateBrandingAction.bind(null, tenant)}>
        {/* Sticky Header / Save Bar */}
        <div className="sticky top-0 z-40 -mx-6 px-6 py-4 glass-header flex items-center justify-between mb-8">
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Paintbrush className="w-5 h-5 text-primary/80" />
              Branding & Appearance
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-400">Customize how your organization looks to you and your customers.</p>
          </div>
          <Button 
            type="submit"
            className="bg-primary hover:bg-primary/90 text-slate-900 dark:text-white shadow-lg shadow-primary/20"
          >
            <Save className="w-4 h-4 mr-2" />
            Save Changes
          </Button>
        </div>

        <div className="glass-card mb-8">
          <div className="flex items-center gap-3 mb-6 pb-4 border-b border-white/5">
            <h3 className="text-base font-semibold text-slate-900 dark:text-white">Organization Logo</h3>
          </div>
          <div className="space-y-4">
            <p className="text-sm text-slate-700 dark:text-slate-300">Your organization's logo</p>
            <p className="text-xs text-slate-500 dark:text-slate-500">
              This logo will be displayed in transaction PDFs and email notifications.<br />
              Preferred Image Dimensions: 240 x 240 pixels @ 72 DPI<br />
              Supported Files: jpg, jpeg, png, gif, bmp<br />
              Maximum File Size: 1MB
            </p>
            <div className="pt-2">
              <ImageUploader 
                name="logo_url" 
                defaultValue={org.logo_url || ''} 
                directory={`organizations/${tenant}/logo`} 
              />
            </div>
          </div>
        </div>

        <div className="glass-card mb-8">
          <div className="flex items-center gap-3 mb-6 pb-4 border-b border-white/5">
            <h3 className="text-base font-semibold text-slate-900 dark:text-white">Appearance</h3>
          </div>

          <div className="space-y-8">
            {/* Theme Mode Selector */}
            <div className="space-y-4">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Theme Mode</label>
              <div className="flex gap-4">
                <label className="cursor-pointer group">
                  <input type="radio" name="theme_mode" value="Light" defaultChecked={org.theme_mode === 'Light'} className="peer hidden" />
                  <div className="w-32 h-24 rounded-lg border-2 border-white/10 bg-slate-100 flex items-center justify-center peer-checked:border-primary peer-checked:ring-2 peer-checked:ring-primary/20 transition-all">
                    <span className="text-slate-800 font-medium text-sm">Light Pane</span>
                  </div>
                </label>
                <label className="cursor-pointer group">
                  <input type="radio" name="theme_mode" value="Dark" defaultChecked={org.theme_mode === 'Dark'} className="peer hidden" />
                  <div className="w-32 h-24 rounded-lg border-2 border-white/10 bg-slate-900 flex items-center justify-center peer-checked:border-primary peer-checked:ring-2 peer-checked:ring-primary/20 transition-all">
                    <span className="text-slate-200 font-medium text-sm">Dark Pane</span>
                  </div>
                </label>
              </div>
            </div>

            {/* Accent Color Selector */}
            <div className="space-y-4">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Accent Color</label>
              <div className="flex flex-wrap gap-4">
                {accentColors.map(color => (
                  <label key={color.value} className="cursor-pointer group relative flex flex-col items-center gap-2">
                    <input type="radio" name="accent_color" value={color.value} defaultChecked={org.accent_color === color.value} className="peer hidden" />
                    <div 
                      className="w-10 h-10 rounded-full border-2 border-transparent peer-checked:border-white peer-checked:scale-110 transition-all shadow-lg"
                      style={{ backgroundColor: color.value }}
                    />
                    <span className="text-xs font-medium text-slate-600 dark:text-slate-400 peer-checked:text-primary">{color.name}</span>
                  </label>
                ))}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-500 mt-4">
                Note: These preferences will be applied across SimpliERP apps, including the customer and vendor portals.
              </p>
            </div>
          </div>
        </div>

        <div className="glass-card">
          <div className="flex items-center gap-3 mb-6 pb-4 border-b border-white/5">
            <h3 className="text-base font-semibold text-slate-900 dark:text-white">White-labeling</h3>
          </div>

          <div className="space-y-8">
            <div className="flex items-start justify-between gap-6">
              <div className="space-y-1 max-w-[80%]">
                <label htmlFor="keep_branding" className="text-sm font-medium text-slate-700 dark:text-slate-300 cursor-pointer">
                  I'd like to keep SimpliERP branding for this organization
                </label>
                <p className="text-xs text-slate-500 dark:text-slate-500 leading-relaxed">
                  Retain non-obtrusive SimpliERP Branding, which will be visible to your customers in places like transactional emails and PDFs.
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer shrink-0 mt-1">
                <input type="checkbox" id="keep_branding" name="keep_branding" defaultChecked={org.keep_branding} className="sr-only peer" />
                <div className="w-11 h-6 bg-white/10 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary/50 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary border border-white/10"></div>
              </label>
            </div>

            <div className="flex items-start justify-between gap-6">
              <div className="space-y-1 max-w-[80%]">
                <label htmlFor="recommend_platform" className="text-sm font-medium text-slate-700 dark:text-slate-300 cursor-pointer">
                  I'd like to recommend SimpliERP to my customers
                </label>
                <p className="text-xs text-slate-500 dark:text-slate-500 leading-relaxed">
                  Enabling this option will display a small, non-intrusive banner for SimpliERP at the bottom of the Customer Portal, vendor portal, and when an invoice is viewed from the invoice link that's been emailed or shared.
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer shrink-0 mt-1">
                <input type="checkbox" id="recommend_platform" name="recommend_platform" defaultChecked={org.recommend_platform} className="sr-only peer" />
                <div className="w-11 h-6 bg-white/10 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary/50 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary border border-white/10"></div>
              </label>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
