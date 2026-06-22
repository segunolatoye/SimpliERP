"use client";

import { useState } from 'react';
import { CalendarDays, Plus, X, Edit, Trash2, Calendar, Loader2 } from 'lucide-react';
import { Button } from '@/packages/ui-kit/components/ui/button';
import { Input } from '@/packages/ui-kit/components/ui/input';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { 
  createAccountingPeriodAction, 
  updateAccountingPeriodAction, 
  deleteAccountingPeriodAction,
  generateYearlyPeriodsAction 
} from '@/app/actions/settings-accounting';

export function AccountingPeriodsClient({ tenantSlug, periods }: { tenantSlug: string, periods: any[] }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  
  const currentYear = new Date().getFullYear();
  const [generateYear, setGenerateYear] = useState(currentYear);

  const handleOpenNew = () => {
    setEditingItem(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: any) => {
    setEditingItem(item);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this accounting period? Financial transactions might be affected.')) return;
    try {
      await deleteAccountingPeriodAction(tenantSlug, id);
      toast.success('Accounting period deleted successfully');
    } catch (e: any) {
      toast.error(e.message || 'Failed to delete period');
    }
  };

  const handleGeneratePeriods = async () => {
    if (!confirm(`Generate 12 monthly periods for the year ${generateYear}?`)) return;
    setIsGenerating(true);
    try {
      await generateYearlyPeriodsAction(tenantSlug, generateYear);
      toast.success(`Periods for ${generateYear} generated successfully`);
    } catch (e: any) {
      toast.error(e.message || 'Failed to generate periods');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 p-6 rounded-2xl backdrop-blur-md shadow-sm dark:shadow-none">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <CalendarDays className="w-5 h-5 text-emerald-500" />
            Accounting Periods
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Manage fiscal periods for financial transactions and reporting.</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex items-center gap-2 bg-slate-50 dark:bg-white/5 p-1 rounded-full border border-slate-200 dark:border-white/10">
            <Input 
              type="number" 
              value={generateYear} 
              onChange={(e) => setGenerateYear(Number(e.target.value))}
              className="w-24 h-8 text-sm bg-transparent border-none focus-visible:ring-0 text-center"
            />
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleGeneratePeriods} 
              disabled={isGenerating}
              className="rounded-full text-slate-600 dark:text-slate-300 hover:text-emerald-500"
            >
              {isGenerating ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Calendar className="w-4 h-4 mr-1" />}
              Generate
            </Button>
          </div>
          <Button onClick={handleOpenNew} className="bg-emerald-500 hover:bg-emerald-600 text-white rounded-full px-6 shadow-lg shadow-emerald-500/20">
            <Plus className="w-4 h-4 mr-2" />
            Add Period
          </Button>
        </div>
      </div>

      <div className="bg-white dark:bg-[#11151C] border border-slate-200 dark:border-white/5 rounded-2xl overflow-hidden shadow-sm dark:shadow-2xl">
        <table className="min-w-full divide-y divide-slate-200 dark:divide-white/5">
          <thead className="bg-slate-50 dark:bg-white/[0.02]">
            <tr>
              <th className="px-6 py-4 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Name</th>
              <th className="px-6 py-4 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Start Date</th>
              <th className="px-6 py-4 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">End Date</th>
              <th className="px-6 py-4 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Status</th>
              <th className="px-6 py-4 text-right text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-white/5">
            {periods.length > 0 ? periods.map(item => (
              <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors group">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900 dark:text-slate-200">{item.name}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 dark:text-slate-300">
                  {format(new Date(item.start_date), 'MMM dd, yyyy')}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 dark:text-slate-300">
                  {format(new Date(item.end_date), 'MMM dd, yyyy')}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 dark:text-slate-300">
                  {item.status.toLowerCase() === 'open' ? (
                    <span className="px-2 py-1 text-xs rounded bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">Open</span>
                  ) : (
                    <span className="px-2 py-1 text-xs rounded bg-rose-500/10 text-rose-500 border border-rose-500/20">Closed</span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-slate-900 dark:hover:text-white" onClick={() => handleOpenEdit(item)}>
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-rose-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10" onClick={() => handleDelete(item.id)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </td>
              </tr>
            )) : (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-slate-500 text-sm">No accounting periods found. Generate or add one.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <PeriodModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        tenantSlug={tenantSlug} 
        initialData={editingItem} 
      />
    </div>
  );
}

function PeriodModal({ isOpen, onClose, tenantSlug, initialData }: { isOpen: boolean, onClose: () => void, tenantSlug: string, initialData: any }) {
  const [isPending, setIsPending] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsPending(true);
    try {
      const formData = new FormData(e.currentTarget);
      if (initialData) {
        await updateAccountingPeriodAction(tenantSlug, initialData.id, formData);
        toast.success('Period updated');
      } else {
        await createAccountingPeriodAction(tenantSlug, formData);
        toast.success('Period created');
      }
      onClose();
    } catch (err: any) {
      toast.error(err.message || 'An error occurred');
    } finally {
      setIsPending(false);
    }
  };

  const defaultStart = initialData ? new Date(initialData.start_date).toISOString().split('T')[0] : '';
  const defaultEnd = initialData ? new Date(initialData.end_date).toISOString().split('T')[0] : '';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 lg:items-stretch lg:justify-end lg:p-0">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white dark:bg-[#0B0E14] border border-slate-200 dark:border-white/10 rounded-2xl lg:rounded-none lg:border-l lg:border-y-0 lg:border-r-0 w-full max-w-md shadow-2xl animate-in zoom-in-95 lg:slide-in-from-right-full lg:zoom-in-100 duration-200 flex flex-col h-auto lg:h-full max-h-[90vh] lg:max-h-none overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-white/10 shrink-0">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">{initialData ? 'Edit Period' : 'Add Period'}</h3>
          <button type="button" onClick={onClose} className="text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4 flex-1 overflow-y-auto">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Period Name</label>
            <Input name="name" defaultValue={initialData?.name} required placeholder="Jan 2026" className="premium-input w-full" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Start Date</label>
              <Input type="date" name="start_date" defaultValue={defaultStart} required className="premium-input w-full" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">End Date</label>
              <Input type="date" name="end_date" defaultValue={defaultEnd} required className="premium-input w-full" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Status</label>
            <select 
              name="status" 
              defaultValue={initialData?.status || 'open'} 
              className="premium-input w-full"
            >
              <option value="open">Open</option>
              <option value="closed">Closed</option>
            </select>
          </div>
          <div className="pt-4 flex justify-end gap-3">
            <Button type="button" variant="ghost" onClick={onClose} className="text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white">Cancel</Button>
            <Button type="submit" disabled={isPending} className="bg-emerald-500 hover:bg-emerald-600 text-white">{isPending ? 'Saving...' : 'Save Period'}</Button>
          </div>
        </form>
      </div>
    </div>
  );
}
