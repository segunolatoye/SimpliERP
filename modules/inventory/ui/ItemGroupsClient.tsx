"use client";

import { useState } from 'react';
import { Package, Plus, X, Edit, Trash2 } from 'lucide-react';
import { Button } from '@/packages/ui-kit/components/ui/button';
import { Input } from '@/packages/ui-kit/components/ui/input';
import { toast } from 'sonner';
import { createGroupAction, updateGroupAction, deleteGroupAction } from '@/app/actions/inventory-groups';

export function ItemGroupsClient({ tenantSlug, groups, units }: { tenantSlug: string, groups: any[], units: any[] }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any | null>(null);

  const handleOpenNew = () => {
    setEditingItem(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: any) => {
    setEditingItem(item);
    setIsModalOpen(true);
  };

  const handleDelete = async (item: any) => {
    if (!confirm('Are you sure you want to delete this group?')) return;
    try {
      await deleteGroupAction(tenantSlug, item.id);
      toast.success('Group deleted successfully');
    } catch (e: any) {
      toast.error(e.message || 'Failed to delete group');
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 max-w-6xl mx-auto p-4 sm:p-6 lg:p-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-[#11151C] border border-slate-200 dark:border-white/10 p-6 rounded-2xl shadow-sm dark:shadow-none">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Package className="w-6 h-6 text-emerald-500" />
            Item Groups
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Manage groups of items with common attributes.</p>
        </div>
        <Button onClick={handleOpenNew} className="bg-emerald-500 hover:bg-emerald-600 text-white rounded-full px-6 shadow-lg shadow-emerald-500/20">
          <Plus className="w-4 h-4 mr-2" />
          Add Group
        </Button>
      </div>

      <div className="bg-white dark:bg-[#11151C] border border-slate-200 dark:border-white/5 rounded-2xl overflow-hidden shadow-sm dark:shadow-2xl">
        <table className="min-w-full">
          <thead className="bg-slate-50 dark:bg-white/[0.02] border-b border-slate-200 dark:border-white/5">
            <tr>
              <th className="px-6 py-4 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Group Name</th>
              <th className="px-6 py-4 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Default Unit</th>
              <th className="px-6 py-4 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Brand / Manufacturer</th>
              <th className="px-6 py-4 text-right text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-white/5">
            {groups.length > 0 ? groups.map(item => {
              const unit = units.find(u => u.id === item.unit_id);
              return (
                <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors group">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-slate-900 dark:text-slate-200">{item.name}</div>
                    {item.description && <div className="text-xs text-slate-500 truncate max-w-[250px]">{item.description}</div>}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 dark:text-slate-300">
                    {unit ? `${unit.name} (${unit.symbol})` : '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-slate-900 dark:text-slate-200">{item.brand || '-'}</div>
                    <div className="text-xs text-slate-500">{item.manufacturer || '-'}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-slate-900 dark:hover:text-white" onClick={() => handleOpenEdit(item)}>
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-rose-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10" onClick={() => handleDelete(item)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              );
            }) : (
              <tr>
                <td colSpan={4} className="px-6 py-8 text-center text-slate-500 text-sm">No item groups found. Start by creating one.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <GroupModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        tenantSlug={tenantSlug} 
        initialData={editingItem} 
        units={units}
      />
    </div>
  );
}

function GroupModal({ isOpen, onClose, tenantSlug, initialData, units }: { isOpen: boolean, onClose: () => void, tenantSlug: string, initialData: any, units: any[] }) {
  const [isPending, setIsPending] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsPending(true);
    try {
      const formData = new FormData(e.currentTarget);
      if (initialData) {
        await updateGroupAction(tenantSlug, initialData.id, formData);
        toast.success('Group updated');
      } else {
        await createGroupAction(tenantSlug, formData);
        toast.success('Group created');
      }
      onClose();
    } catch (err: any) {
      toast.error(err.message || 'An error occurred');
    } finally {
      setIsPending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 lg:items-stretch lg:justify-end lg:p-0">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white dark:bg-[#0B0E14] border border-slate-200 dark:border-white/10 rounded-2xl lg:rounded-none lg:border-l lg:border-y-0 lg:border-r-0 w-full max-w-xl shadow-2xl animate-in zoom-in-95 lg:slide-in-from-right-full lg:zoom-in-100 duration-200 flex flex-col h-auto lg:h-full max-h-[90vh] lg:max-h-none overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-white/10 shrink-0">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-2">
            {initialData ? 'Edit Group' : 'Add Group'}
          </h3>
          <button type="button" onClick={onClose} className="text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4 flex-1 overflow-y-auto">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Group Name *</label>
            <Input name="name" defaultValue={initialData?.name} required placeholder="e.g. T-Shirts" className="premium-input w-full" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Description</label>
            <Input name="description" defaultValue={initialData?.description} placeholder="Short description..." className="premium-input w-full" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Default Unit</label>
              <select 
                name="unit_id" 
                defaultValue={initialData?.unit_id || ''} 
                className="premium-input w-full bg-white dark:bg-[#0B0E14]"
              >
                <option value="">-- None --</option>
                {units.map(u => (
                  <option key={u.id} value={u.id}>{u.name} ({u.symbol})</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Tax Preference</label>
              <select 
                name="tax_preference" 
                defaultValue={initialData?.tax_preference || 'Taxable'} 
                className="premium-input w-full bg-white dark:bg-[#0B0E14]"
              >
                <option value="Taxable">Taxable</option>
                <option value="Non-Taxable">Non-Taxable</option>
                <option value="Exempt">Exempt</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Brand</label>
              <Input name="brand" defaultValue={initialData?.brand} placeholder="e.g. Nike" className="premium-input w-full" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Manufacturer</label>
              <Input name="manufacturer" defaultValue={initialData?.manufacturer} placeholder="e.g. Acme Corp" className="premium-input w-full" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">HSN/SAC Code</label>
            <Input name="hsn_sac_code" defaultValue={initialData?.hsn_sac_code} placeholder="Code..." className="premium-input w-full" />
          </div>

          <div className="pt-4 flex justify-end gap-3 border-t border-slate-200 dark:border-white/10 mt-6">
            <Button type="button" variant="ghost" onClick={onClose} className="text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white mt-4">Cancel</Button>
            <Button type="submit" disabled={isPending} className="bg-emerald-500 hover:bg-emerald-600 text-white mt-4">{isPending ? 'Saving...' : 'Save Group'}</Button>
          </div>
        </form>
      </div>
    </div>
  );
}
