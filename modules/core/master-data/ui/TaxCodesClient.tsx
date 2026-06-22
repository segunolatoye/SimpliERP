"use client";

import { useState } from 'react';
import { FileText, Plus, X, Edit, Trash2 } from 'lucide-react';
import { Button } from '@/packages/ui-kit/components/ui/button';
import { Input } from '@/packages/ui-kit/components/ui/input';
import { toast } from 'sonner';
import { createTaxCodeAction, updateTaxCodeAction, deleteTaxCodeAction } from '@/app/actions/master-data';

export function TaxCodesClient({ tenantSlug, taxCodes }: { tenantSlug: string, taxCodes: any[] }) {
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

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this tax code?')) return;
    try {
      await deleteTaxCodeAction(tenantSlug, id);
      toast.success('Tax code deleted successfully');
    } catch (e: any) {
      toast.error(e.message || 'Failed to delete tax code');
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 p-6 rounded-2xl backdrop-blur-md shadow-sm dark:shadow-none">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <FileText className="w-5 h-5 text-emerald-500" />
            Tax Codes
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Manage tax rates applicable to your business transactions.</p>
        </div>
        <Button onClick={handleOpenNew} className="bg-emerald-500 hover:bg-emerald-600 text-white rounded-full px-6 shadow-lg shadow-emerald-500/20">
          <Plus className="w-4 h-4 mr-2" />
          Add Tax Code
        </Button>
      </div>

      <div className="bg-white dark:bg-[#11151C] border border-slate-200 dark:border-white/5 rounded-2xl overflow-hidden shadow-sm dark:shadow-2xl">
        <table className="min-w-full divide-y divide-slate-200 dark:divide-white/5">
          <thead className="bg-slate-50 dark:bg-white/[0.02]">
            <tr>
              <th className="px-6 py-4 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Name</th>
              <th className="px-6 py-4 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Rate (%)</th>
              <th className="px-6 py-4 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Type</th>
              <th className="px-6 py-4 text-right text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-white/5">
            {taxCodes.length > 0 ? taxCodes.map(item => (
              <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors group">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900 dark:text-slate-200">{item.name}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 dark:text-slate-300">{item.rate}%</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 dark:text-slate-300">
                  {item.is_compound ? (
                    <span className="px-2 py-1 text-xs rounded bg-purple-500/10 text-purple-400 border border-purple-500/20">Compound</span>
                  ) : (
                    <span className="px-2 py-1 text-xs rounded bg-slate-500/10 text-slate-400 border border-slate-500/20">Simple</span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-white" onClick={() => handleOpenEdit(item)}>
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-rose-400 hover:text-rose-300 hover:bg-rose-500/10" onClick={() => handleDelete(item.id)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </td>
              </tr>
            )) : (
              <tr>
                <td colSpan={4} className="px-6 py-8 text-center text-slate-500 text-sm">No tax codes found. Click Add Tax Code to create one.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <TaxCodeModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        tenantSlug={tenantSlug} 
        initialData={editingItem} 
      />
    </div>
  );
}

function TaxCodeModal({ isOpen, onClose, tenantSlug, initialData }: { isOpen: boolean, onClose: () => void, tenantSlug: string, initialData: any }) {
  const [isPending, setIsPending] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsPending(true);
    try {
      const formData = new FormData(e.currentTarget);
      if (initialData) {
        await updateTaxCodeAction(tenantSlug, initialData.id, formData);
        toast.success('Tax code updated');
      } else {
        await createTaxCodeAction(tenantSlug, formData);
        toast.success('Tax code created');
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
      <div className="relative bg-white dark:bg-[#0B0E14] border border-slate-200 dark:border-white/10 rounded-2xl lg:rounded-none lg:border-l lg:border-y-0 lg:border-r-0 w-full max-w-md shadow-2xl animate-in zoom-in-95 lg:slide-in-from-right-full lg:zoom-in-100 duration-200 flex flex-col h-auto lg:h-full max-h-[90vh] lg:max-h-none overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-white/10 shrink-0">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">{initialData ? 'Edit Tax Code' : 'Add Tax Code'}</h3>
          <button type="button" onClick={onClose} className="text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4 flex-1 overflow-y-auto">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Tax Name</label>
            <Input name="name" defaultValue={initialData?.name} required placeholder="VAT" className="premium-input w-full" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Rate (%)</label>
            <Input name="rate" type="number" step="0.01" defaultValue={initialData?.rate} required placeholder="10.0" className="premium-input w-full" />
          </div>
          <label className="flex items-center gap-3 p-3 rounded-lg border bg-slate-50 border-slate-200 dark:bg-white/5 dark:border-white/10 cursor-pointer">
            <input type="checkbox" name="is_compound" defaultChecked={initialData?.is_compound} className="rounded border-slate-300 dark:border-slate-600 bg-white dark:bg-white/5" />
            <div className="text-sm">
              <span className="text-slate-700 dark:text-slate-300 block">Is Compound Tax?</span>
              <span className="text-slate-500 text-xs">Compound tax applies on top of other taxes.</span>
            </div>
          </label>
          <div className="pt-4 flex justify-end gap-3">
            <Button type="button" variant="ghost" onClick={onClose} className="text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white">Cancel</Button>
            <Button type="submit" disabled={isPending} className="bg-emerald-500 hover:bg-emerald-600 text-white">{isPending ? 'Saving...' : 'Save Tax Code'}</Button>
          </div>
        </form>
      </div>
    </div>
  );
}
