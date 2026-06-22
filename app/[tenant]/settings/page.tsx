import { prisma } from '@/lib/db';
import { requirePermission } from '@/lib/auth';
import { updateOrganizationAction } from '@/app/actions/settings';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Building2, Save, HelpCircle, ArrowRight } from 'lucide-react';
import { Input } from '@/packages/ui-kit/components/ui/input';
import { Button } from '@/packages/ui-kit/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/packages/ui-kit/components/ui/select';
import { AdditionalFieldsBuilder } from '@/modules/core/settings/ui/AdditionalFieldsBuilder';

export default async function SettingsGeneralPage({ params }: { params: Promise<{ tenant: string }> }) {
  const { tenant } = await params;
  await requirePermission(tenant, 'core.settings.manage');

  const org = await prisma.organisations.findUnique({
    where: { slug: tenant }
  });

  if (!org) redirect('/onboarding');

  const timezones = Intl.supportedValuesOf('timeZone').map(tz => {
    try {
      const formatter = new Intl.DateTimeFormat('en-US', {
        timeZone: tz,
        timeZoneName: 'shortOffset',
      });
      const parts = formatter.formatToParts(new Date());
      const offsetPart = parts.find((part) => part.type === 'timeZoneName');
      const offset = offsetPart ? offsetPart.value.replace('GMT', 'UTC') : 'UTC';
      return { value: tz, label: `(${offset}) ${tz.replace(/_/g, ' ')}` };
    } catch (e) {
      return { value: tz, label: tz };
    }
  });

  // Sort timezones by offset string length and then alphabetically, or just alphabetically by label
  timezones.sort((a, b) => a.label.localeCompare(b.label));

  const fullMonths = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const shortMonths = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const fiscalYearOptions = fullMonths.map((startMonth, index) => {
    const endIndex = (index + 11) % 12;
    const endMonth = fullMonths[endIndex];
    const value = `${shortMonths[index]}-${shortMonths[endIndex]}`;
    return { label: `${startMonth} - ${endMonth}`, value };
  });

  return (
    <div className="space-y-6 pb-24 relative animate-in fade-in duration-500">
      <form action={updateOrganizationAction.bind(null, tenant)}>
        {/* Sticky Header / Save Bar */}
        <div className="sticky top-0 z-40 -mx-6 px-6 py-4 glass-header flex items-center justify-between mb-8">
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Building2 className="w-5 h-5 text-primary/80" />
              General Profile
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-400">Manage your organization's core details and branding.</p>
          </div>
          <Button 
            type="submit"
            className="bg-primary hover:bg-primary/90 text-slate-900 dark:text-white shadow-lg shadow-primary/20"
          >
            <Save className="w-4 h-4 mr-2" />
            Save Changes
          </Button>
        </div>

        {/* Form Content */}
        <div className="glass-card">
          <div className="flex items-center gap-3 mb-6 pb-4 border-b border-white/5">
            <div className="p-2 bg-white/5 rounded-lg border border-white/5">
              <Building2 className="w-4 h-4 text-slate-700 dark:text-slate-300" />
            </div>
            <h3 className="text-base font-semibold text-slate-900 dark:text-white">Business Information</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label htmlFor="org_name" className="text-sm font-medium text-slate-700 dark:text-slate-300">Organization Name</label>
              <Input 
                id="org_name"
                name="name" 
                defaultValue={org.name}
                className="premium-input w-full"
                required
              />
            </div>
            
            <div className="space-y-2">
              <label htmlFor="org_slug" className="text-sm font-medium text-slate-700 dark:text-slate-300">Organization Slug</label>
              <div className="flex items-center premium-input overflow-hidden px-0">
                <span className="pl-3 pr-2 py-2 text-slate-500 dark:text-slate-500 bg-transparent whitespace-nowrap border-r border-white/10 text-sm">
                  {process.env.NEXT_PUBLIC_APP_URL || 'https://simpli-erp.com'}/
                </span>
                <Input 
                  id="org_slug"
                  name="slug" 
                  defaultValue={org.slug}
                  className="bg-transparent border-0 focus-visible:ring-0 focus-visible:ring-offset-0 text-slate-900 dark:text-white flex-1 h-full px-3 rounded-none"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="industry" className="text-sm font-medium text-slate-700 dark:text-slate-300">Industry</label>
              <Select name="industry" defaultValue={org.industry || ''}>
                <SelectTrigger className="premium-input w-full">
                  <SelectValue placeholder="Select industry" />
                </SelectTrigger>
                <SelectContent className="bg-premium-surface border-white/10 text-slate-200">
                  <SelectItem value="retail">Retail</SelectItem>
                  <SelectItem value="services">Services</SelectItem>
                  <SelectItem value="manufacturing">Manufacturing</SelectItem>
                  <SelectItem value="technology">Technology</SelectItem>
                  <SelectItem value="healthcare">Healthcare</SelectItem>
                  <SelectItem value="education">Education</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label htmlFor="location" className="text-sm font-medium text-slate-700 dark:text-slate-300">Organization Location</label>
              <Input 
                id="location"
                name="location" 
                defaultValue={org.location || ''}
                className="premium-input w-full"
                placeholder="City, Country"
              />
            </div>

            <div className="md:col-span-2 mt-2 mb-4">
              <h3 className="text-sm font-medium text-slate-900 dark:text-white mb-2">Organization Address</h3>
              <div className="bg-white/5 border border-primary/20 rounded-lg p-4 text-sm text-slate-700 dark:text-slate-300">
                <p>Since Locations has been enabled for your organization, you can add or edit specific addresses from the Locations section.</p>
                <Link href={`/${tenant}/settings/locations`} className="text-primary/80 hover:text-primary/70 mt-2 inline-flex items-center gap-1 font-medium transition-colors">
                  Go to Locations <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
            
            <div className="space-y-2">
              <label htmlFor="time_zone" className="text-sm font-medium text-slate-700 dark:text-slate-300">Timezone</label>
              <Select name="time_zone" defaultValue={org.time_zone || 'UTC'}>
                <SelectTrigger className="premium-input w-full">
                  <SelectValue placeholder="Select timezone" />
                </SelectTrigger>
                <SelectContent className="bg-premium-surface border-white/10 text-slate-200 max-h-[300px]">
                  {timezones.map(tz => (
                    <SelectItem key={tz.value} value={tz.value} className="hover:bg-white/5 focus:bg-white/5">
                      {tz.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center gap-1.5">
                <label htmlFor="base_currency" className="text-sm font-medium text-slate-700 dark:text-slate-300">Base Currency</label>
                <div className="group relative flex items-center">
                  <HelpCircle className="w-3.5 h-3.5 text-slate-600 dark:text-slate-400 hover:text-slate-700 dark:text-slate-300 transition-colors cursor-help" />
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden w-48 p-2 bg-slate-800 text-xs text-slate-900 dark:text-white text-center rounded-md shadow-lg group-hover:block z-10 before:absolute before:top-full before:left-1/2 before:-translate-x-1/2 before:border-4 before:border-transparent before:border-t-slate-800">
                    Base currency cannot be changed after your workspace is created.
                  </div>
                </div>
              </div>
              <Input 
                id="base_currency"
                name="base_currency" 
                defaultValue={org.base_currency || ''}
                className="premium-input w-full opacity-60"
                readOnly
              />
            </div>
            
            <div className="space-y-2">
              <label htmlFor="date_format" className="text-sm font-medium text-slate-700 dark:text-slate-300">Date Format</label>
              <Select name="date_format" defaultValue={org.date_format || 'DD/MM/YYYY'}>
                <SelectTrigger className="premium-input w-full">
                  <SelectValue placeholder="Select format" />
                </SelectTrigger>
                <SelectContent className="bg-premium-surface border-white/10 text-slate-200">
                  <SelectItem value="DD/MM/YYYY">DD/MM/YYYY (e.g. 31/12/2023)</SelectItem>
                  <SelectItem value="MM/DD/YYYY">MM/DD/YYYY (e.g. 12/31/2023)</SelectItem>
                  <SelectItem value="YYYY-MM-DD">YYYY-MM-DD (e.g. 2023-12-31)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label htmlFor="fiscal_year" className="text-sm font-medium text-slate-700 dark:text-slate-300">Fiscal Year</label>
              <Select name="fiscal_year" defaultValue={org.fiscal_year || 'Jan-Dec'}>
                <SelectTrigger className="premium-input w-full">
                  <SelectValue placeholder="Select fiscal year" />
                </SelectTrigger>
                <SelectContent className="bg-premium-surface border-white/10 text-slate-200 max-h-[250px]">
                  {fiscalYearOptions.map(option => (
                    <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>



            <div className="md:col-span-2 mt-4 pt-6 border-t border-white/5">
              <h3 className="text-base font-medium text-slate-900 dark:text-white mb-4">Company ID & Additional Fields</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                <div className="space-y-2">
                  <label htmlFor="company_id_type" className="text-xs text-slate-600 dark:text-slate-400 font-medium uppercase tracking-wider">Company ID Label</label>
                  <Input 
                    id="company_id_type"
                    name="company_id_type" 
                    defaultValue={org.company_id_type || ''}
                    className="premium-input w-full"
                    placeholder="e.g. Business Number"
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="company_id_value" className="text-xs text-slate-600 dark:text-slate-400 font-medium uppercase tracking-wider">Company ID Value</label>
                  <Input 
                    id="company_id_value"
                    name="company_id_value" 
                    defaultValue={org.company_id_value || ''}
                    className="premium-input w-full"
                    placeholder="e.g. 123456"
                  />
                </div>
              </div>

              <div className="mb-4">
                <h3 className="text-sm font-medium text-slate-900 dark:text-white">Custom Fields</h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
                  You can include the Company ID and additional fields in your organization address which will be displayed in your transaction PDFs. Configure this by selecting the required placeholders in your Organization Address Format.
                </p>
              </div>
              <AdditionalFieldsBuilder defaultValue={org.additional_fields} />
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
