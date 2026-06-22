"use client";

import { useState } from 'react';
import { Save, ShoppingCart, Tag, Users, FileText, Truck, Receipt, Link as LinkIcon } from 'lucide-react';
import { Button } from '@/packages/ui-kit/components/ui/button';
import { Switch } from '@/packages/ui-kit/components/ui/switch';
import { Input } from '@/packages/ui-kit/components/ui/input';
import { Select } from '@/packages/ui-kit/components/ui/select';
import { toast } from 'sonner';
import { updateModuleSettingsAction } from '@/app/actions/settings';

export type SalesSettings = {
  variants: boolean;
  variantGridEntry: boolean;
  uomPackaging: boolean;
  discounts: boolean;
  promotions: boolean;
  pricelists: boolean;
  margins: boolean;
  customerAccountPolicy: 'invitation' | 'free_signup';
  onlineSignature: boolean;
  quotationTemplates: boolean;
  onlinePayment: boolean;
  defaultQuotationValidityDays: number;
  saleWarnings: boolean;
  pdfQuoteBuilder: boolean;
  displayProductImages: boolean;
  lockConfirmedSales: boolean;
  proFormaInvoice: boolean;
  deliveryMethods: boolean;
  invoicingPolicy: 'ordered' | 'delivered';
  commissions: boolean;
  servicesMaterials: boolean;
  amazonSync: boolean;
};

const defaultSettings: SalesSettings = {
  variants: false,
  variantGridEntry: false,
  uomPackaging: false,
  discounts: false,
  promotions: false,
  pricelists: false,
  margins: false,
  customerAccountPolicy: 'invitation',
  onlineSignature: false,
  quotationTemplates: false,
  onlinePayment: false,
  defaultQuotationValidityDays: 30,
  saleWarnings: false,
  pdfQuoteBuilder: false,
  displayProductImages: false,
  lockConfirmedSales: false,
  proFormaInvoice: false,
  deliveryMethods: false,
  invoicingPolicy: 'ordered',
  commissions: false,
  servicesMaterials: false,
  amazonSync: false,
};

type Props = {
  tenantSlug: string;
  initialSettings: any;
};

export function SalesSettingsForm({ tenantSlug, initialSettings }: Props) {
  // Merge initial settings with defaults in case of new fields
  const [settings, setSettings] = useState<SalesSettings>({
    ...defaultSettings,
    ...(initialSettings || {})
  });
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  const updateSetting = <K extends keyof SalesSettings>(key: K, value: SalesSettings[K]) => {
    setSettings(prev => ({ ...prev, [key]: value }));
    setHasChanges(true);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await updateModuleSettingsAction(tenantSlug, 'sales', settings);
      toast.success('Sales settings saved successfully');
      setHasChanges(false);
    } catch (err: any) {
      toast.error(err.message || 'Failed to save settings');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 pb-24 relative">
      {/* Sticky Header / Save Bar */}
      <div className="sticky top-0 z-40 -mx-6 px-6 py-4 glass-header flex items-center justify-between mb-8">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <ShoppingCart className="w-5 h-5 text-indigo-400" />
            Sales & Invoicing Settings
          </h2>
          <p className="text-sm text-slate-400">Configure catalog, pricing, quoting, and invoicing rules.</p>
        </div>
        <Button 
          onClick={handleSave} 
          disabled={!hasChanges || isSaving}
          className="bg-indigo-500 hover:bg-indigo-600 text-white shadow-lg shadow-indigo-500/20"
        >
          <Save className="w-4 h-4 mr-2" />
          {isSaving ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Product Catalog */}
        <SettingsCard icon={Tag} title="Product Catalog">
          <ToggleRow 
            title="Variants" 
            desc="Sell variants of a product using attributes (size, color, etc.)"
            checked={settings.variants} onChange={(v) => updateSetting('variants', v)} 
          />
          <ToggleRow 
            title="Variant Grid Entry" 
            desc="Add several variants to an order from a grid view"
            checked={settings.variantGridEntry} onChange={(v) => updateSetting('variantGridEntry', v)} 
          />
          <ToggleRow 
            title="Units of Measure & Packagings" 
            desc="Sell and purchase products in different units or packages"
            checked={settings.uomPackaging} onChange={(v) => updateSetting('uomPackaging', v)} 
          />
        </SettingsCard>

        {/* Pricing */}
        <SettingsCard icon={Receipt} title="Pricing & Margins">
          <ToggleRow 
            title="Discounts" 
            desc="Grant discounts on specific sales order lines"
            checked={settings.discounts} onChange={(v) => updateSetting('discounts', v)} 
          />
          <ToggleRow 
            title="Promotions, Loyalty & Gift Cards" 
            desc="Manage coupons, loyalty programs, and eWallets"
            checked={settings.promotions} onChange={(v) => updateSetting('promotions', v)} 
          />
          <ToggleRow 
            title="Pricelists" 
            desc="Set multiple prices per product and automated discounts"
            checked={settings.pricelists} onChange={(v) => updateSetting('pricelists', v)} 
          />
          <ToggleRow 
            title="Margins" 
            desc="Show gross margins on sales orders internally"
            checked={settings.margins} onChange={(v) => updateSetting('margins', v)} 
          />
        </SettingsCard>

        {/* Customer Account */}
        <SettingsCard icon={Users} title="Customer Account Portal">
          <div className="space-y-3">
            <label className="text-sm font-medium text-slate-300">Account Creation Policy</label>
            <p className="text-xs text-slate-500 mb-2">Determine how customers gain access to view their documents online.</p>
            <div className="relative">
              <select 
                value={settings.customerAccountPolicy}
                onChange={(e) => updateSetting('customerAccountPolicy', e.target.value as any)}
                className="w-full bg-[#11151C] border border-white/10 text-white text-sm rounded-md focus:ring-indigo-500 focus:border-indigo-500 block p-2.5 appearance-none"
              >
                <option value="invitation">On Invitation Only (Secure)</option>
                <option value="free_signup">Free Sign Up (Public)</option>
              </select>
            </div>
          </div>
        </SettingsCard>

        {/* Invoicing */}
        <SettingsCard icon={FileText} title="Invoicing Rules">
          <div className="space-y-3 mb-6 pb-6 border-b border-white/5">
            <label className="text-sm font-medium text-slate-300">Invoicing Policy</label>
            <p className="text-xs text-slate-500 mb-2">Determine the quantities to invoice from sales orders.</p>
            <div className="grid grid-cols-2 gap-3">
              <button 
                onClick={() => updateSetting('invoicingPolicy', 'ordered')}
                className={`p-3 text-sm text-left rounded-lg border transition-all ${settings.invoicingPolicy === 'ordered' ? 'bg-indigo-500/10 border-indigo-500/50 text-indigo-400' : 'bg-white/5 border-white/10 text-slate-400 hover:border-white/20'}`}
              >
                Invoice what is ordered
              </button>
              <button 
                onClick={() => updateSetting('invoicingPolicy', 'delivered')}
                className={`p-3 text-sm text-left rounded-lg border transition-all ${settings.invoicingPolicy === 'delivered' ? 'bg-indigo-500/10 border-indigo-500/50 text-indigo-400' : 'bg-white/5 border-white/10 text-slate-400 hover:border-white/20'}`}
              >
                Invoice what is delivered
              </button>
            </div>
          </div>
          
          <ToggleRow 
            title="Sales Commissions" 
            desc="Manage sales targets and commissions for your team"
            checked={settings.commissions} onChange={(v) => updateSetting('commissions', v)} 
          />
          <ToggleRow 
            title="Services & Materials" 
            desc="Use fixed-price and cost-based materials for re-invoicing"
            checked={settings.servicesMaterials} onChange={(v) => updateSetting('servicesMaterials', v)} 
          />
        </SettingsCard>

        {/* Quotations & Orders (Takes full width due to size) */}
        <div className="md:col-span-2">
          <SettingsCard icon={FileText} title="Quotations & Orders">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-0">
              <div>
                <ToggleRow 
                  title="Online Signature" 
                  desc="Request customers to sign quotations to validate orders"
                  checked={settings.onlineSignature} onChange={(v) => updateSetting('onlineSignature', v)} 
                />
                <ToggleRow 
                  title="Quotation Templates" 
                  desc="Create standardized offers with default products"
                  checked={settings.quotationTemplates} onChange={(v) => updateSetting('quotationTemplates', v)} 
                />
                <ToggleRow 
                  title="Online Payment" 
                  desc="Request a payment to confirm orders (full or partial)"
                  checked={settings.onlinePayment} onChange={(v) => updateSetting('onlinePayment', v)} 
                />
                <ToggleRow 
                  title="Lock Confirmed Sales" 
                  desc="No longer edit orders once they are confirmed"
                  checked={settings.lockConfirmedSales} onChange={(v) => updateSetting('lockConfirmedSales', v)} 
                />
              </div>
              <div>
                <ToggleRow 
                  title="PDF Quote Builder" 
                  desc="Add header pages, descriptions and footer pages to quotes"
                  checked={settings.pdfQuoteBuilder} onChange={(v) => updateSetting('pdfQuoteBuilder', v)} 
                />
                <ToggleRow 
                  title="Display Product Images" 
                  desc="Show product images on your PDF and online quotes"
                  checked={settings.displayProductImages} onChange={(v) => updateSetting('displayProductImages', v)} 
                />
                <ToggleRow 
                  title="Pro Forma Invoice" 
                  desc="Allows you to send Pro Forma Invoices to customers"
                  checked={settings.proFormaInvoice} onChange={(v) => updateSetting('proFormaInvoice', v)} 
                />
                <ToggleRow 
                  title="Sale Warnings" 
                  desc="Get warnings in orders for specific products or customers"
                  checked={settings.saleWarnings} onChange={(v) => updateSetting('saleWarnings', v)} 
                />
              </div>
            </div>
            
            <div className="mt-4 pt-4 border-t border-white/5 max-w-sm">
              <label className="text-sm font-medium text-slate-300 block mb-1">Default Quotation Validity (Days)</label>
              <p className="text-xs text-slate-500 mb-3">Period during which the quote is valid and can still be accepted.</p>
              <Input 
                type="number" 
                min={1}
                value={settings.defaultQuotationValidityDays}
                onChange={(e) => updateSetting('defaultQuotationValidityDays', parseInt(e.target.value) || 0)}
                className="bg-[#11151C] border-white/10 text-white"
              />
            </div>
          </SettingsCard>
        </div>

        {/* Shipping & Connectors */}
        <SettingsCard icon={Truck} title="Shipping & Connectors">
          <ToggleRow 
            title="Delivery Methods" 
            desc="Configure delivery methods or work with delivery providers"
            checked={settings.deliveryMethods} onChange={(v) => updateSetting('deliveryMethods', v)} 
          />
          <ToggleRow 
            title="Amazon Sync" 
            desc="Import Amazon orders and synchronize deliveries automatically"
            checked={settings.amazonSync} onChange={(v) => updateSetting('amazonSync', v)} 
          />
        </SettingsCard>

      </div>
    </div>
  );
}

// Internal Helper Components

function SettingsCard({ icon: Icon, title, children }: { icon: any, title: string, children: React.ReactNode }) {
  return (
    <div className="glass-card">
      <div className="flex items-center gap-3 mb-6 pb-4 border-b border-white/5">
        <div className="p-2 bg-white/5 rounded-lg border border-white/5">
          <Icon className="w-4 h-4 text-slate-300" />
        </div>
        <h3 className="text-base font-semibold text-white">{title}</h3>
      </div>
      <div className="space-y-0">
        {children}
      </div>
    </div>
  );
}

function ToggleRow({ title, desc, checked, onChange }: { title: string, desc: string, checked: boolean, onChange: (c: boolean) => void }) {
  return (
    <div className="flex items-start justify-between py-4 border-b border-white/5 last:border-0 last:pb-0">
      <div className="pr-8">
        <div className="text-sm font-medium text-slate-200">{title}</div>
        <div className="text-xs text-slate-500 mt-1 leading-relaxed">{desc}</div>
      </div>
      <div className="pt-1">
        <Switch checked={checked} onCheckedChange={onChange} />
      </div>
    </div>
  );
}
