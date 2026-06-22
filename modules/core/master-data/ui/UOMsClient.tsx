"use client";

import { useState } from 'react';
import { Package, Plus, X, Edit, Trash2 } from 'lucide-react';
import { Button } from '@/packages/ui-kit/components/ui/button';
import { Input } from '@/packages/ui-kit/components/ui/input';
import { toast } from 'sonner';
import { createUOMAction, updateUOMAction, deleteUOMAction } from '@/app/actions/master-data';

export function UOMsClient({ tenantSlug, uoms }: { tenantSlug: string, uoms: any[] }) {
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
    if (!confirm('Are you sure you want to delete this unit of measure?')) return;
    try {
      await deleteUOMAction(tenantSlug, id);
      toast.success('UOM deleted successfully');
    } catch (e: any) {
      toast.error(e.message || 'Failed to delete UOM');
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 p-6 rounded-2xl backdrop-blur-md shadow-sm dark:shadow-none">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Package className="w-5 h-5 text-emerald-500" />
            Units of Measure (UOM)
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Manage standard measuring units for your items and inventory.</p>
        </div>
        <Button onClick={handleOpenNew} className="bg-emerald-500 hover:bg-emerald-600 text-white rounded-full px-6 shadow-lg shadow-emerald-500/20">
          <Plus className="w-4 h-4 mr-2" />
          Add UOM
        </Button>
      </div>

      <div className="bg-white dark:bg-[#11151C] border border-slate-200 dark:border-white/5 rounded-2xl overflow-hidden shadow-sm dark:shadow-2xl">
        <table className="min-w-full divide-y divide-slate-200 dark:divide-white/5">
          <thead className="bg-slate-50 dark:bg-white/[0.02]">
            <tr>
              <th className="px-6 py-4 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Name</th>
              <th className="px-6 py-4 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Symbol / Abbreviation</th>
              <th className="px-6 py-4 text-right text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-white/5">
            {uoms.length > 0 ? uoms.map(item => (
              <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors group">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900 dark:text-slate-200">{item.name}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 dark:text-slate-300">
                  <span className="px-2 py-1 text-xs rounded bg-slate-100 border border-slate-200 dark:bg-white/10 dark:border-white/10">{item.symbol}</span>
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
                <td colSpan={3} className="px-6 py-8 text-center text-slate-500 text-sm">No Units of Measure found. Click Add UOM to create one.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <UOMModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        tenantSlug={tenantSlug} 
        initialData={editingItem} 
      />
    </div>
  );
}

function UOMModal({ isOpen, onClose, tenantSlug, initialData }: { isOpen: boolean, onClose: () => void, tenantSlug: string, initialData: any }) {
  const [isPending, setIsPending] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsPending(true);
    try {
      const formData = new FormData(e.currentTarget);
      if (initialData) {
        await updateUOMAction(tenantSlug, initialData.id, formData);
        toast.success('UOM updated');
      } else {
        await createUOMAction(tenantSlug, formData);
        toast.success('UOM created');
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
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">{initialData ? 'Edit UOM' : 'Add UOM'}</h3>
          <button type="button" onClick={onClose} className="text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4 flex-1 overflow-y-auto">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">UOM Name</label>
            <Input name="name" defaultValue={initialData?.name} required placeholder="Kilogram" className="premium-input w-full" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Symbol / Abbreviation</label>
            <Input name="symbol" defaultValue={initialData?.symbol} required placeholder="kg" className="premium-input w-full" />
          </div>
          <div className="pt-4 flex justify-end gap-3">
            <Button type="button" variant="ghost" onClick={onClose} className="text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white">Cancel</Button>
            <Button type="submit" disabled={isPending} className="bg-emerald-500 hover:bg-emerald-600 text-white">{isPending ? 'Saving...' : 'Save UOM'}</Button>
          </div>
        </form>
      </div>
    </div>
  );
}
