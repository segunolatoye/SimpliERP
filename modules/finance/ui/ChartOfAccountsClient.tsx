"use client";

import { useState } from 'react';
import { CreditCard, Plus, X, Edit, Trash2, Lock } from 'lucide-react';
import { Button } from '@/packages/ui-kit/components/ui/button';
import { Input } from '@/packages/ui-kit/components/ui/input';
import { toast } from 'sonner';
import { createAccountAction, updateAccountAction, deleteAccountAction } from '@/app/actions/finance-accounts';

export function ChartOfAccountsClient({ tenantSlug, accounts }: { tenantSlug: string, accounts: any[] }) {
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
    if (item.is_system) {
      toast.error('System accounts cannot be deleted');
      return;
    }
    if (!confirm('Are you sure you want to delete this account?')) return;
    try {
      await deleteAccountAction(tenantSlug, item.id);
      toast.success('Account deleted successfully');
    } catch (e: any) {
      toast.error(e.message || 'Failed to delete account');
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 max-w-6xl mx-auto p-4 sm:p-6 lg:p-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-[#11151C] border border-slate-200 dark:border-white/10 p-6 rounded-2xl shadow-sm dark:shadow-none">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <CreditCard className="w-6 h-6 text-emerald-500" />
            Chart of Accounts
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Manage the ledger accounts used for tracking financial transactions.</p>
        </div>
        <Button onClick={handleOpenNew} className="bg-emerald-500 hover:bg-emerald-600 text-white rounded-full px-6 shadow-lg shadow-emerald-500/20">
          <Plus className="w-4 h-4 mr-2" />
          Add Account
        </Button>
      </div>

      <div className="bg-white dark:bg-[#11151C] border border-slate-200 dark:border-white/5 rounded-2xl overflow-hidden shadow-sm dark:shadow-2xl">
        <table className="min-w-full">
          <thead className="bg-slate-50 dark:bg-white/[0.02] border-b border-slate-200 dark:border-white/5">
            <tr>
              <th className="px-6 py-4 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Account Code</th>
              <th className="px-6 py-4 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Name</th>
              <th className="px-6 py-4 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Type</th>
              <th className="px-6 py-4 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Status</th>
              <th className="px-6 py-4 text-right text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-white/5">
            {accounts.length > 0 ? accounts.map(item => (
              <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors group">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900 dark:text-slate-200">
                  {item.code || '-'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-slate-900 dark:text-slate-200 flex items-center gap-2">
                    {item.name}
                    {item.is_system && <Lock className="w-3 h-3 text-slate-400" aria-label="System Account" />}
                  </div>
                  {item.description && <div className="text-xs text-slate-500 truncate max-w-[250px]">{item.description}</div>}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 dark:text-slate-300 capitalize">
                  {item.type}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  {item.is_active ? (
                    <span className="px-2 py-1 text-xs rounded bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">Active</span>
                  ) : (
                    <span className="px-2 py-1 text-xs rounded bg-slate-500/10 text-slate-500 border border-slate-500/20">Inactive</span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-slate-900 dark:hover:text-white" onClick={() => handleOpenEdit(item)}>
                      <Edit className="w-4 h-4" />
                    </Button>
                    {!item.is_system && (
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-rose-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10" onClick={() => handleDelete(item)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </td>
              </tr>
            )) : (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-slate-500 text-sm">No accounts found. Start by creating one.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <AccountModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        tenantSlug={tenantSlug} 
        initialData={editingItem} 
      />
    </div>
  );
}

function AccountModal({ isOpen, onClose, tenantSlug, initialData }: { isOpen: boolean, onClose: () => void, tenantSlug: string, initialData: any }) {
  const [isPending, setIsPending] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsPending(true);
    try {
      const formData = new FormData(e.currentTarget);
      if (initialData) {
        await updateAccountAction(tenantSlug, initialData.id, formData);
        toast.success('Account updated');
      } else {
        await createAccountAction(tenantSlug, formData);
        toast.success('Account created');
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
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-2">
            {initialData ? 'Edit Account' : 'Add Account'}
            {initialData?.is_system && <span className="px-2 py-0.5 text-xs rounded bg-slate-500/10 text-slate-500 border border-slate-500/20">System</span>}
          </h3>
          <button type="button" onClick={onClose} className="text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4 flex-1 overflow-y-auto">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Account Code</label>
            <Input name="code" defaultValue={initialData?.code} placeholder="e.g. 1010" className="premium-input w-full" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Account Name *</label>
            <Input name="name" defaultValue={initialData?.name} required placeholder="Cash in Bank" className="premium-input w-full" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Account Type *</label>
            <select 
              name="type" 
              defaultValue={initialData?.type || 'asset'} 
              className="premium-input w-full bg-white dark:bg-[#0B0E14]"
              disabled={initialData?.is_system}
            >
              <option value="asset">Asset</option>
              <option value="liability">Liability</option>
              <option value="equity">Equity</option>
              <option value="revenue">Revenue</option>
              <option value="expense">Expense</option>
            </select>
            {initialData?.is_system && (
              <p className="text-xs text-slate-500 mt-1">System account types cannot be changed.</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Description</label>
            <Input name="description" defaultValue={initialData?.description} placeholder="Short description..." className="premium-input w-full" />
          </div>
          
          <label className="flex items-center gap-3 p-3 rounded-lg border bg-slate-50 border-slate-200 dark:bg-white/5 dark:border-white/10 cursor-pointer mt-2">
            <input type="checkbox" name="is_active" defaultChecked={initialData ? initialData.is_active : true} className="rounded border-slate-300 dark:border-slate-600 bg-white dark:bg-white/5" />
            <div className="text-sm">
              <span className="text-slate-700 dark:text-slate-300 block">Active Status</span>
              <span className="text-slate-500 text-xs">Allow transactions to be posted to this account.</span>
            </div>
          </label>

          <div className="pt-4 flex justify-end gap-3">
            <Button type="button" variant="ghost" onClick={onClose} className="text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white">Cancel</Button>
            <Button type="submit" disabled={isPending} className="bg-emerald-500 hover:bg-emerald-600 text-white">{isPending ? 'Saving...' : 'Save Account'}</Button>
          </div>
        </form>
      </div>
    </div>
  );
}
