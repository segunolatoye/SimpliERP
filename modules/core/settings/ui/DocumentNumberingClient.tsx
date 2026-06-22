"use client";

import { useState } from 'react';
import { Settings2, Plus, X, Edit, Trash2, Hash } from 'lucide-react';
import { Button } from '@/packages/ui-kit/components/ui/button';
import { Input } from '@/packages/ui-kit/components/ui/input';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { upsertNumberingGroupAction, deleteNumberingGroupAction, upsertNumberingItemAction, deleteNumberingItemAction } from '@/app/actions/numbering';

const MODULES = [
  'INVOICE', 'PURCHASE_ORDER', 'GOODS_RECEIPT', 'DELIVERY_NOTE', 
  'STOCK_ADJUSTMENT', 'JOURNAL_ENTRY', 'CUSTOMER_PAYMENT', 
  'VENDOR_PAYMENT', 'CREDIT_NOTE', 'SALES_ORDER'
];

export function DocumentNumberingClient({ tenantSlug, groups, locations }: { tenantSlug: string, groups: any[], locations: any[] }) {
  const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<any | null>(null);

  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any | null>(null);
  const [activeGroupId, setActiveGroupId] = useState<string | null>(null);

  const handleOpenNewGroup = () => {
    setEditingGroup(null);
    setIsGroupModalOpen(true);
  };

  const handleOpenEditGroup = (group: any) => {
    setEditingGroup(group);
    setIsGroupModalOpen(true);
  };

  const handleOpenNewItem = (groupId: string) => {
    setActiveGroupId(groupId);
    setEditingItem(null);
    setIsItemModalOpen(true);
  };

  const handleOpenEditItem = (groupId: string, item: any) => {
    setActiveGroupId(groupId);
    setEditingItem(item);
    setIsItemModalOpen(true);
  };

  const handleDeleteGroup = async (id: string) => {
    if (!confirm('Are you sure you want to delete this numbering group? All sequences inside it will be lost.')) return;
    try {
      await deleteNumberingGroupAction(tenantSlug, id);
      toast.success('Group deleted successfully');
    } catch (e: any) {
      toast.error(e.message || 'Failed to delete group');
    }
  };

  const handleDeleteItem = async (id: string) => {
    if (!confirm('Are you sure you want to delete this sequence?')) return;
    try {
      await deleteNumberingItemAction(tenantSlug, id);
      toast.success('Sequence deleted successfully');
    } catch (e: any) {
      toast.error(e.message || 'Failed to delete sequence');
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-[#0B0E14] border border-slate-200 dark:border-white/10 p-6 rounded-2xl shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Hash className="w-5 h-5 text-indigo-500" />
            Document Numbering
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Manage transactional prefixes, suffixes, and sequences for all modules.</p>
        </div>
        <Button onClick={handleOpenNewGroup} className="bg-indigo-500 hover:bg-indigo-600 text-white rounded-full px-6 shadow-lg shadow-indigo-500/20">
          <Plus className="w-4 h-4 mr-2" />
          New Group
        </Button>
      </div>

      <div className="space-y-6">
        {groups.map(group => (
          <div key={group.id} className="bg-white dark:bg-[#11151C] border border-slate-200 dark:border-white/5 rounded-2xl overflow-hidden shadow-sm">
            <div className="px-6 py-4 border-b border-slate-200 dark:border-white/5 bg-slate-50 dark:bg-white/[0.02] flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                  {group.name}
                  {group.is_default && <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-full border border-emerald-500/20">Default</span>}
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Locations: {(group.locations as string[])?.length > 0 ? (group.locations as string[]).map(lId => locations.find(l => l.id === lId)?.name || 'Unknown').join(', ') : 'All/None'}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" onClick={() => handleOpenNewItem(group.id)} className="text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-500/10">
                  <Plus className="w-3.5 h-3.5 mr-1" /> Add Sequence
                </Button>
                <Button variant="ghost" size="sm" onClick={() => handleOpenEditGroup(group)} className="text-slate-500 hover:text-slate-900 dark:hover:text-white">
                  <Edit className="w-4 h-4" />
                </Button>
                {!group.is_default && (
                  <Button variant="ghost" size="sm" onClick={() => handleDeleteGroup(group.id)} className="text-rose-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/10">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200 dark:divide-white/5">
                <thead className="bg-slate-50 dark:bg-white/[0.02]">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Module</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Prefix</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Next Number</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Suffix</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Format Preview</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-white/5">
                  {group.transaction_series_items.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-8 text-center text-sm text-slate-500 italic">No sequences configured for this group.</td>
                    </tr>
                  ) : (
                    group.transaction_series_items.map((item: any) => {
                      const paddedNum = item.starting_number.toString().padStart(6, '0');
                      const preview = `${item.prefix ? item.prefix + '-' : ''}${paddedNum}${item.suffix ? '-' + item.suffix : ''}`;
                      return (
                        <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors group/row">
                          <td className="px-6 py-3 whitespace-nowrap text-sm font-medium text-slate-900 dark:text-slate-200">{item.document_module.replace('_', ' ')}</td>
                          <td className="px-6 py-3 whitespace-nowrap text-sm text-slate-500">{item.prefix || '-'}</td>
                          <td className="px-6 py-3 whitespace-nowrap text-sm text-slate-500 font-mono">{item.starting_number}</td>
                          <td className="px-6 py-3 whitespace-nowrap text-sm text-slate-500">{item.suffix || '-'}</td>
                          <td className="px-6 py-3 whitespace-nowrap text-sm text-indigo-600 dark:text-indigo-400 font-mono bg-indigo-50/50 dark:bg-indigo-500/5">{preview}</td>
                          <td className="px-6 py-3 whitespace-nowrap text-right text-sm font-medium">
                            <div className="flex items-center justify-end gap-2 opacity-0 group-hover/row:opacity-100 transition-opacity">
                              <Button variant="ghost" size="sm" onClick={() => handleOpenEditItem(group.id, item)} className="text-slate-500 hover:text-slate-900 dark:hover:text-white">
                                Edit
                              </Button>
                              <Button variant="ghost" size="sm" onClick={() => handleDeleteItem(item.id)} className="text-rose-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/10">
                                Remove
                              </Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        ))}
      </div>

      {isGroupModalOpen && (
        <GroupModal 
          tenantSlug={tenantSlug} 
          initialData={editingGroup} 
          locations={locations}
          onClose={() => setIsGroupModalOpen(false)} 
        />
      )}

      {isItemModalOpen && activeGroupId && (
        <ItemModal 
          tenantSlug={tenantSlug} 
          groupId={activeGroupId}
          initialData={editingItem} 
          onClose={() => setIsItemModalOpen(false)} 
        />
      )}
    </div>
  );
}

function GroupModal({ tenantSlug, initialData, locations, onClose }: { tenantSlug: string, initialData: any, locations: any[], onClose: () => void }) {
  const [isPending, setIsPending] = useState(false);
  const [selectedLocations, setSelectedLocations] = useState<string[]>(initialData?.locations || []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsPending(true);
    try {
      const formData = new FormData(e.currentTarget);
      await upsertNumberingGroupAction(tenantSlug, initialData?.id || null, {
        name: formData.get('name') as string,
        is_default: formData.get('is_default') === 'on',
        locations: selectedLocations
      });
      toast.success(initialData ? 'Group updated' : 'Group created');
      onClose();
    } catch (err: any) {
      toast.error(err.message || 'Failed to save group');
    } finally {
      setIsPending(false);
    }
  };

  const toggleLocation = (locId: string) => {
    setSelectedLocations(prev => prev.includes(locId) ? prev.filter(id => id !== locId) : [...prev, locId]);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 lg:items-stretch lg:justify-end lg:p-0">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity" onClick={onClose} />
      <div className="relative bg-white dark:bg-[#0B0E14] border border-slate-200 dark:border-white/10 rounded-2xl lg:rounded-none lg:border-l lg:border-y-0 lg:border-r-0 w-full max-w-md shadow-2xl animate-in zoom-in-95 lg:slide-in-from-right-full lg:zoom-in-100 duration-200 flex flex-col h-auto lg:h-full max-h-[90vh] lg:max-h-none overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-white/10 shrink-0">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
            {initialData ? 'Edit Numbering Group' : 'New Numbering Group'}
          </h2>
          <button type="button" onClick={onClose} className="p-2 text-slate-500 hover:text-slate-900 dark:hover:text-white rounded-full hover:bg-slate-100 dark:hover:bg-white/10 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6 flex-1 overflow-y-auto custom-scrollbar">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Group Name</label>
            <Input name="name" defaultValue={initialData?.name} required placeholder="e.g. Standard Sequence" className="premium-input w-full" />
          </div>

          <div>
            <label className="flex items-center gap-3 p-4 rounded-xl border border-slate-200 dark:border-white/10 cursor-pointer hover:bg-slate-50 dark:hover:bg-white/[0.02]">
              <input type="checkbox" name="is_default" defaultChecked={initialData?.is_default} className="w-4 h-4 rounded text-indigo-500 bg-slate-100 border-slate-300 dark:bg-[#0B0E14] dark:border-slate-700 focus:ring-indigo-500 focus:ring-offset-slate-900" />
              <div>
                <span className="block text-sm font-medium text-slate-900 dark:text-white">Set as Default Group</span>
                <span className="block text-xs text-slate-500">Will be used for any location without a specific group mapping.</span>
              </div>
            </label>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Mapped Locations</label>
            <div className="space-y-2 max-h-48 overflow-y-auto pr-2 custom-scrollbar border border-slate-200 dark:border-white/10 p-2 rounded-xl">
              {locations.length === 0 && <p className="text-xs text-slate-500 p-2 italic">No locations available.</p>}
              {locations.map(loc => (
                <label key={loc.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-white/5 cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={selectedLocations.includes(loc.id)}
                    onChange={() => toggleLocation(loc.id)}
                    className="w-4 h-4 rounded text-indigo-500 bg-slate-100 border-slate-300 dark:bg-[#0B0E14] dark:border-slate-700" 
                  />
                  <span className="text-sm text-slate-700 dark:text-slate-300">{loc.name}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="pt-4 flex justify-end gap-3 shrink-0">
            <Button type="button" variant="ghost" onClick={onClose} className="text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10">Cancel</Button>
            <Button type="submit" disabled={isPending} className="bg-indigo-500 hover:bg-indigo-600 text-white shadow-lg shadow-indigo-500/20">{isPending ? 'Saving...' : 'Save Group'}</Button>
          </div>
        </form>
      </div>
    </div>
  );
}

function ItemModal({ tenantSlug, groupId, initialData, onClose }: { tenantSlug: string, groupId: string, initialData: any, onClose: () => void }) {
  const [isPending, setIsPending] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsPending(true);
    try {
      const formData = new FormData(e.currentTarget);
      await upsertNumberingItemAction(tenantSlug, groupId, formData.get('document_module') as string, {
        prefix: formData.get('prefix') as string,
        starting_number: parseInt(formData.get('starting_number') as string) || 1,
        suffix: formData.get('suffix') as string,
        restart_numbering: formData.get('restart_numbering') as string
      });
      toast.success('Sequence saved successfully');
      onClose();
    } catch (err: any) {
      toast.error(err.message || 'Failed to save sequence');
    } finally {
      setIsPending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 lg:items-stretch lg:justify-end lg:p-0">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity" onClick={onClose} />
      <div className="relative bg-white dark:bg-[#0B0E14] border border-slate-200 dark:border-white/10 rounded-2xl lg:rounded-none lg:border-l lg:border-y-0 lg:border-r-0 w-full max-w-md shadow-2xl animate-in zoom-in-95 lg:slide-in-from-right-full lg:zoom-in-100 duration-200 flex flex-col h-auto lg:h-full max-h-[90vh] lg:max-h-none overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-white/10 shrink-0">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
            {initialData ? 'Edit Sequence' : 'Add Sequence'}
          </h2>
          <button type="button" onClick={onClose} className="p-2 text-slate-500 hover:text-slate-900 dark:hover:text-white rounded-full hover:bg-slate-100 dark:hover:bg-white/10 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 flex-1 overflow-y-auto custom-scrollbar">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Document Module</label>
            <select 
              name="document_module" 
              defaultValue={initialData?.document_module || MODULES[0]}
              disabled={!!initialData}
              className="w-full bg-white dark:bg-[#0B0E14] border border-slate-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500/50 outline-none transition-all disabled:opacity-50"
            >
              {MODULES.map(m => (
                <option key={m} value={m}>{m.replace('_', ' ')}</option>
              ))}
            </select>
            {!!initialData && <p className="text-xs text-amber-500 mt-1">Module cannot be changed once created.</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Prefix</label>
              <Input name="prefix" defaultValue={initialData?.prefix} placeholder="e.g. INV" className="premium-input w-full" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Suffix</label>
              <Input name="suffix" defaultValue={initialData?.suffix} placeholder="e.g. 2026" className="premium-input w-full" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Next Sequence Number</label>
            <Input name="starting_number" type="number" min="1" defaultValue={initialData?.starting_number || 1} required className="premium-input w-full font-mono" />
            <p className="text-xs text-slate-500 mt-1">The number that will be assigned to the next document.</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Restart Sequence</label>
            <select 
              name="restart_numbering" 
              defaultValue={initialData?.restart_numbering || 'Never'}
              className="w-full bg-white dark:bg-[#0B0E14] border border-slate-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500/50 outline-none transition-all"
            >
              {['Never', 'Yearly', 'Monthly'].map(m => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>

          <div className="pt-4 flex justify-end gap-3 shrink-0">
            <Button type="button" variant="ghost" onClick={onClose} className="text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10">Cancel</Button>
            <Button type="submit" disabled={isPending} className="bg-indigo-500 hover:bg-indigo-600 text-white shadow-lg shadow-indigo-500/20">{isPending ? 'Saving...' : 'Save Sequence'}</Button>
          </div>
        </form>
      </div>
    </div>
  );
}
