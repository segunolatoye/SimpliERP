"use client";

import { useState } from 'react';
import { ArrowLeft, Save, Loader2, Package, Tag, Layers, FileText } from 'lucide-react';
import { Button } from '@/packages/ui-kit/components/ui/button';
import { Input } from '@/packages/ui-kit/components/ui/input';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { createItemAction, updateItemAction } from '@/app/actions/inventory-items';
import { cn } from '@/lib/utils';

const TABS = [
  { id: 'general', label: 'General Info', icon: Package },
  { id: 'sales_purchasing', label: 'Sales & Purchasing', icon: Tag },
  { id: 'inventory', label: 'Inventory Rules', icon: Layers },
  { id: 'accounting', label: 'Accounting', icon: FileText }
];

export function ItemForm({ 
  tenantSlug, 
  initialData, 
  categories, 
  groups, 
  units, 
  accounts,
  vendors
}: { 
  tenantSlug: string, 
  initialData?: any, 
  categories: any[], 
  groups: any[], 
  units: any[], 
  accounts: any[],
  vendors: any[]
}) {
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);
  const [activeTab, setActiveTab] = useState('general');

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsPending(true);
    try {
      const formData = new FormData(e.currentTarget);
      if (initialData) {
        await updateItemAction(tenantSlug, initialData.id, formData);
        toast.success('Item updated successfully');
      } else {
        await createItemAction(tenantSlug, formData);
        toast.success('Item created successfully');
      }
      router.push(`/${tenantSlug}/inventory/items`);
    } catch (err: any) {
      toast.error(err.message || 'An error occurred');
      setIsPending(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col h-full animate-in fade-in duration-500 bg-slate-50 dark:bg-black">
      {/* Header */}
      <div className="flex flex-col border-b border-slate-200 dark:border-white/10 bg-white dark:bg-[#11151C] sticky top-0 z-20 shadow-sm">
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-4">
            <Button type="button" variant="ghost" size="icon" onClick={() => router.back()} className="text-slate-500 hover:text-slate-900 dark:hover:text-white">
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-xl font-bold text-slate-900 dark:text-white">
                {initialData ? `Edit Item: ${initialData.name}` : 'New Inventory Item'}
              </h1>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button type="button" variant="ghost" onClick={() => router.back()}>Cancel</Button>
            <Button type="submit" disabled={isPending} className="bg-primary hover:opacity-90 text-primary-foreground min-w-[120px] shadow-lg shadow-primary/20">
              {isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
              {initialData ? 'Save Changes' : 'Create Item'}
            </Button>
          </div>
        </div>

        {/* Horizontal Tabs */}
        <div className="px-6 flex overflow-x-auto custom-scrollbar gap-6 border-t border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-[#0B0E14]/50">
          {TABS.map(tab => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "flex items-center gap-2 py-3 border-b-2 text-sm font-medium transition-colors whitespace-nowrap outline-none",
                  isActive 
                    ? "border-primary text-primary" 
                    : "border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-300 hover:border-slate-300 dark:hover:border-slate-700"
                )}
              >
                <tab.icon className={cn("w-4 h-4", isActive ? "text-primary" : "text-slate-400")} />
                {tab.label}
              </button>
            )
          })}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto relative custom-scrollbar">
        <div className="max-w-5xl mx-auto p-6 md:p-8 pb-20">
          
          {/* Tab 1: General Info */}
          <div className={cn("transition-opacity duration-300", activeTab === 'general' ? "block animate-in fade-in" : "hidden")}>
            <div className="bg-white dark:bg-[#11151C] border border-slate-200 dark:border-white/10 rounded-2xl p-8 shadow-sm">
              <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-6">General Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">SKU *</label>
                  <Input name="sku" defaultValue={initialData?.sku} required placeholder="e.g. ITEM-001" className="premium-input w-full focus:ring-primary" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Item Name *</label>
                  <Input name="name" defaultValue={initialData?.name} required placeholder="Product Name" className="premium-input w-full focus:ring-primary" />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Description</label>
                  <textarea 
                    name="description" 
                    defaultValue={initialData?.description} 
                    placeholder="Product details..." 
                    className="premium-input w-full min-h-[100px] resize-y p-3 focus:ring-primary" 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Type</label>
                  <select name="type" defaultValue={initialData?.type || 'Goods'} className="premium-input w-full bg-white dark:bg-[#0B0E14] focus:ring-primary">
                    <option value="Goods">Goods</option>
                    <option value="Service">Service</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Status</label>
                  <select name="status" defaultValue={initialData?.status || 'Active'} className="premium-input w-full bg-white dark:bg-[#0B0E14] focus:ring-primary">
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Category</label>
                  <select name="category_id" defaultValue={initialData?.category_id || ''} className="premium-input w-full bg-white dark:bg-[#0B0E14] focus:ring-primary">
                    <option value="">-- Select Category --</option>
                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Item Group</label>
                  <select name="item_group_id" defaultValue={initialData?.item_group_id || ''} className="premium-input w-full bg-white dark:bg-[#0B0E14] focus:ring-primary">
                    <option value="">-- Select Group --</option>
                    {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Brand</label>
                  <Input name="brand" defaultValue={initialData?.brand} placeholder="e.g. Nike" className="premium-input w-full focus:ring-primary" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Manufacturer</label>
                  <Input name="manufacturer" defaultValue={initialData?.manufacturer} placeholder="e.g. Acme Corp" className="premium-input w-full focus:ring-primary" />
                </div>
              </div>
            </div>
          </div>

          {/* Tab 2: Sales & Purchasing */}
          <div className={cn("transition-opacity duration-300", activeTab === 'sales_purchasing' ? "block animate-in fade-in" : "hidden")}>
            <div className="bg-white dark:bg-[#11151C] border border-slate-200 dark:border-white/10 rounded-2xl p-8 shadow-sm space-y-8">
              
              {/* Using primary accent colors uniformly to match organization branding */}
              <div className="p-6 rounded-2xl border border-primary/20 bg-primary/5">
                <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-4">Sales Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <label className="flex items-center gap-3 p-4 rounded-xl border bg-white border-slate-200 dark:bg-[#0B0E14] dark:border-white/10 cursor-pointer md:col-span-2 hover:border-primary/50 transition-colors">
                    <input type="checkbox" name="is_sellable" defaultChecked={initialData ? initialData.is_sellable : true} className="w-5 h-5 rounded text-primary border-slate-300 dark:border-slate-600 focus:ring-primary" />
                    <div className="text-sm">
                      <span className="text-slate-900 dark:text-white font-semibold block">Is Sellable</span>
                      <span className="text-slate-500 text-xs">Allow this item to be added to Sales Orders and Invoices.</span>
                    </div>
                  </label>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Selling Price</label>
                    <Input name="selling_price" type="number" step="0.01" defaultValue={initialData?.selling_price || 0} className="premium-input w-full font-mono text-lg focus:ring-primary" />
                  </div>
                </div>
              </div>
              
              <div className="p-6 rounded-2xl border border-primary/20 bg-primary/5">
                <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-4">Purchasing Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <label className="flex items-center gap-3 p-4 rounded-xl border bg-white border-slate-200 dark:bg-[#0B0E14] dark:border-white/10 cursor-pointer md:col-span-2 hover:border-primary/50 transition-colors">
                    <input type="checkbox" name="is_purchasable" defaultChecked={initialData ? initialData.is_purchasable : true} className="w-5 h-5 rounded text-primary border-slate-300 dark:border-slate-600 focus:ring-primary" />
                    <div className="text-sm">
                      <span className="text-slate-900 dark:text-white font-semibold block">Is Purchasable</span>
                      <span className="text-slate-500 text-xs">Allow this item to be added to Purchase Orders and Bills.</span>
                    </div>
                  </label>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Cost Price</label>
                    <Input name="cost_price" type="number" step="0.01" defaultValue={initialData?.cost_price || 0} className="premium-input w-full font-mono text-lg focus:ring-primary" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Preferred Vendor</label>
                    <select name="preferred_vendor_id" defaultValue={initialData?.preferred_vendor_id || ''} className="premium-input w-full bg-white dark:bg-[#0B0E14] focus:ring-primary">
                      <option value="">-- Select Vendor --</option>
                      {vendors.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
                    </select>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Tab 3: Inventory */}
          <div className={cn("transition-opacity duration-300", activeTab === 'inventory' ? "block animate-in fade-in" : "hidden")}>
            <div className="bg-white dark:bg-[#11151C] border border-slate-200 dark:border-white/10 rounded-2xl p-8 shadow-sm space-y-8">
              <div>
                <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-4">Stock Tracking Flags</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <label className="flex items-center gap-3 p-4 rounded-xl border bg-slate-50 border-slate-200 dark:bg-white/5 dark:border-white/10 cursor-pointer md:col-span-2 hover:border-primary/50 transition-colors">
                    <input type="checkbox" name="track_inventory" defaultChecked={initialData ? initialData.track_inventory : true} className="w-5 h-5 rounded text-primary border-slate-300 dark:border-slate-600 focus:ring-primary" />
                    <div className="text-sm">
                      <span className="text-slate-900 dark:text-white font-semibold block">Track Inventory</span>
                      <span className="text-slate-500 text-xs">Maintain stock counts and calculate moving average costs.</span>
                    </div>
                  </label>
                  <label className="flex items-center gap-3 p-3 rounded-xl border bg-slate-50 border-slate-200 dark:bg-white/5 dark:border-white/10 cursor-pointer">
                    <input type="checkbox" name="track_bin" defaultChecked={initialData?.track_bin} className="w-4 h-4 rounded text-primary border-slate-300 dark:border-slate-600 focus:ring-primary" />
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Track Bin Locations</span>
                  </label>
                  <label className="flex items-center gap-3 p-3 rounded-xl border bg-slate-50 border-slate-200 dark:bg-white/5 dark:border-white/10 cursor-pointer">
                    <input type="checkbox" name="track_lot" defaultChecked={initialData?.track_lot} className="w-4 h-4 rounded text-primary border-slate-300 dark:border-slate-600 focus:ring-primary" />
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Track Batch / Lot Numbers</span>
                  </label>
                  <label className="flex items-center gap-3 p-3 rounded-xl border bg-slate-50 border-slate-200 dark:bg-white/5 dark:border-white/10 cursor-pointer">
                    <input type="checkbox" name="track_serial" defaultChecked={initialData?.track_serial} className="w-4 h-4 rounded text-primary border-slate-300 dark:border-slate-600 focus:ring-primary" />
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Track Serial Numbers</span>
                  </label>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-slate-200 dark:border-white/10">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Reorder Point</label>
                  <Input name="reorder_point" type="number" defaultValue={initialData?.reorder_point || 0} className="premium-input w-full focus:ring-primary" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Lead Time (Days)</label>
                  <Input name="lead_time_days" type="number" defaultValue={initialData?.lead_time_days || 0} className="premium-input w-full focus:ring-primary" />
                </div>
              </div>

              <hr className="border-slate-200 dark:border-white/10" />

              <div>
                <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-4">Physical Dimensions</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Base Unit</label>
                    <select name="unit_id" defaultValue={initialData?.unit_id || ''} className="premium-input w-full bg-white dark:bg-[#0B0E14] focus:ring-primary">
                      <option value="">-- Select Unit --</option>
                      {units.map(u => <option key={u.id} value={u.id}>{u.name} ({u.symbol})</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Weight (kg)</label>
                    <Input name="weight" type="number" step="0.01" defaultValue={initialData?.weight || ''} className="premium-input w-full focus:ring-primary" />
                  </div>
                  <div className="grid grid-cols-3 gap-3 md:col-span-2">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Length (cm)</label>
                      <Input name="length" type="number" step="0.01" defaultValue={initialData?.length || ''} className="premium-input w-full focus:ring-primary" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Width (cm)</label>
                      <Input name="width" type="number" step="0.01" defaultValue={initialData?.width || ''} className="premium-input w-full focus:ring-primary" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Height (cm)</label>
                      <Input name="height" type="number" step="0.01" defaultValue={initialData?.height || ''} className="premium-input w-full focus:ring-primary" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Tab 4: Accounting */}
          <div className={cn("transition-opacity duration-300", activeTab === 'accounting' ? "block animate-in fade-in" : "hidden")}>
            <div className="bg-white dark:bg-[#11151C] border border-slate-200 dark:border-white/10 rounded-2xl p-8 shadow-sm space-y-8">
              <div>
                <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-4">Chart of Accounts Mapping</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50 dark:bg-white/[0.02] p-6 rounded-xl border border-slate-200 dark:border-white/10">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Sales (Revenue) Account</label>
                    <select name="sales_account_id" defaultValue={initialData?.sales_account_id || ''} className="premium-input w-full bg-white dark:bg-[#0B0E14] focus:ring-primary">
                      <option value="">-- Select Revenue Account --</option>
                      {accounts.filter(a => a.type === 'revenue').map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                    </select>
                    <p className="text-xs text-slate-500 mt-1">Credited when this item is sold.</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Purchase (Expense) Account</label>
                    <select name="purchase_account_id" defaultValue={initialData?.purchase_account_id || ''} className="premium-input w-full bg-white dark:bg-[#0B0E14] focus:ring-primary">
                      <option value="">-- Select Expense Account --</option>
                      {accounts.filter(a => a.type === 'expense' || a.type === 'asset').map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                    </select>
                    <p className="text-xs text-slate-500 mt-1">Debited when this item is purchased.</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Inventory Asset Account</label>
                    <select name="inventory_account_id" defaultValue={initialData?.inventory_account_id || ''} className="premium-input w-full bg-white dark:bg-[#0B0E14] focus:ring-primary">
                      <option value="">-- Select Asset Account --</option>
                      {accounts.filter(a => a.type === 'asset').map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                    </select>
                    <p className="text-xs text-slate-500 mt-1">Tracks stock value on the balance sheet.</p>
                  </div>
                </div>
              </div>

              <hr className="border-slate-200 dark:border-white/10" />

              <div>
                <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-4">Taxation Settings</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Tax Preference</label>
                    <select name="tax_preference" defaultValue={initialData?.tax_preference || 'Taxable'} className="premium-input w-full bg-white dark:bg-[#0B0E14] focus:ring-primary">
                      <option value="Taxable">Taxable</option>
                      <option value="Non-Taxable">Non-Taxable</option>
                      <option value="Exempt">Exempt</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Default Tax Rate (%)</label>
                    <Input name="gst_rate" type="number" step="0.01" defaultValue={initialData?.gst_rate || ''} className="premium-input w-full focus:ring-primary" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">HSN/SAC Code</label>
                    <Input name="hsn_sac_code" defaultValue={initialData?.hsn_sac_code || ''} className="premium-input w-full focus:ring-primary" />
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </form>
  );
}
