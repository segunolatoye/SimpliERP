"use client";

import { useState } from 'react';
import { Button } from '@/packages/ui-kit/components/ui/button';
import { Input } from '@/packages/ui-kit/components/ui/input';
import { Loader2, Plus, Trash2, Check } from 'lucide-react';
import { toast } from 'sonner';
import { postJournalEntryAction } from '@/app/actions/finance-journal';
import { formatMoney } from '@/lib/utils/money';

export function JournalEntryForm({ 
  tenantSlug, 
  accounts,
  onSuccess 
}: { 
  tenantSlug: string, 
  accounts: any[],
  onSuccess: () => void 
}) {
  const [isPending, setIsPending] = useState(false);
  
  const [description, setDescription] = useState('');
  const [reference, setReference] = useState('');
  const [lines, setLines] = useState([
    { id: '1', accountId: '', debit: '', credit: '' },
    { id: '2', accountId: '', debit: '', credit: '' }
  ]);

  const addLine = () => {
    setLines([...lines, { id: Math.random().toString(), accountId: '', debit: '', credit: '' }]);
  };

  const removeLine = (id: string) => {
    setLines(lines.filter(l => l.id !== id));
  };

  const updateLine = (id: string, field: 'accountId' | 'debit' | 'credit', value: string) => {
    setLines(lines.map(l => {
      if (l.id !== id) return l;
      
      const newLine = { ...l, [field]: value };
      // If setting debit, clear credit. If setting credit, clear debit.
      if (field === 'debit' && value !== '') newLine.credit = '';
      if (field === 'credit' && value !== '') newLine.debit = '';
      
      return newLine;
    }));
  };

  const totalDebit = lines.reduce((sum, l) => sum + (parseFloat(l.debit) || 0), 0);
  const totalCredit = lines.reduce((sum, l) => sum + (parseFloat(l.credit) || 0), 0);
  const isBalanced = Math.abs(totalDebit - totalCredit) < 0.01;

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!isBalanced) {
      toast.error("Debits and Credits must balance.");
      return;
    }

    const validLines = lines.filter(l => l.accountId && (l.debit || l.credit));
    if (validLines.length < 2) {
      toast.error("Please provide at least two valid lines.");
      return;
    }

    setIsPending(true);

    try {
      await postJournalEntryAction(tenantSlug, {
        description,
        reference,
        lines: validLines
      });
      
      toast.success('Journal Entry posted successfully');
      onSuccess();
    } catch (err: any) {
      toast.error(err.message || 'Failed to post Journal Entry');
    } finally {
      setIsPending(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-6 flex flex-col h-[calc(100vh-80px)]">
      <div className="flex-1 overflow-y-auto space-y-6 custom-scrollbar pb-10">
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Description / Memo *</label>
            <Input 
              value={description}
              onChange={e => setDescription(e.target.value)}
              required 
              placeholder="e.g. Monthly rent accrual" 
              className="premium-input w-full focus:ring-primary" 
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Reference No. (Optional)</label>
            <Input 
              value={reference}
              onChange={e => setReference(e.target.value)}
              placeholder="e.g. INV-2023-001" 
              className="premium-input w-full focus:ring-primary" 
            />
          </div>
        </div>

        <hr className="border-slate-200 dark:border-white/10" />

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Journal Lines</h3>
            <Button type="button" variant="outline" size="sm" onClick={addLine} className="h-8 text-xs border-primary text-primary hover:bg-primary/10">
              <Plus className="w-3 h-3 mr-1" /> Add Line
            </Button>
          </div>

          <div className="bg-slate-50 dark:bg-white/5 rounded-xl border border-slate-200 dark:border-white/10 overflow-hidden">
            <div className="grid grid-cols-12 gap-2 p-3 bg-slate-100 dark:bg-white/5 border-b border-slate-200 dark:border-white/10 text-xs font-semibold text-slate-500 uppercase tracking-wider">
              <div className="col-span-6">Account</div>
              <div className="col-span-3 text-right">Debit</div>
              <div className="col-span-2 text-right">Credit</div>
              <div className="col-span-1"></div>
            </div>
            
            <div className="divide-y divide-slate-200 dark:divide-white/10">
              {lines.map((line, index) => (
                <div key={line.id} className="grid grid-cols-12 gap-2 p-2 items-center">
                  <div className="col-span-6">
                    <select 
                      value={line.accountId}
                      onChange={(e) => updateLine(line.id, 'accountId', e.target.value)}
                      required
                      className="w-full bg-transparent border-none text-sm focus:ring-0 text-slate-900 dark:text-white p-2"
                    >
                      <option value="">Select Account...</option>
                      {accounts.map(a => (
                        <option key={a.id} value={a.id}>{a.code} - {a.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="col-span-3">
                    <input 
                      type="number" 
                      step="0.01"
                      placeholder="0.00"
                      value={line.debit}
                      onChange={(e) => updateLine(line.id, 'debit', e.target.value)}
                      className="w-full bg-transparent border-none text-sm text-right focus:ring-0 text-slate-900 dark:text-white p-2 placeholder:text-slate-400"
                    />
                  </div>
                  <div className="col-span-2">
                    <input 
                      type="number" 
                      step="0.01"
                      placeholder="0.00"
                      value={line.credit}
                      onChange={(e) => updateLine(line.id, 'credit', e.target.value)}
                      className="w-full bg-transparent border-none text-sm text-right focus:ring-0 text-slate-900 dark:text-white p-2 placeholder:text-slate-400"
                    />
                  </div>
                  <div className="col-span-1 flex justify-center">
                    <Button 
                      type="button" 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => removeLine(line.id)}
                      disabled={lines.length <= 2}
                      className="h-8 w-8 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 shrink-0"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
            
            {/* Totals */}
            <div className="grid grid-cols-12 gap-2 p-3 bg-slate-100 dark:bg-white/5 border-t border-slate-200 dark:border-white/10 font-semibold text-slate-900 dark:text-white text-sm">
              <div className="col-span-6 text-right text-slate-500">Totals:</div>
              <div className="col-span-3 text-right">{formatMoney(totalDebit, 'USD')}</div>
              <span className="font-semibold">{formatMoney(totalCredit, 'USD')}</span>
              <div className="col-span-1"></div>
            </div>
          </div>
          
          {!isBalanced && (
            <p className="text-sm text-rose-500 font-medium mt-2">
              Out of balance by {formatMoney(Math.abs(totalDebit - totalCredit), 'USD')}
            </p>
          )}

        </div>
      </div>

      <div className="pt-4 border-t border-slate-200 dark:border-white/10 flex justify-end gap-3 mt-auto bg-white dark:bg-[#11151C]">
        <Button type="button" variant="ghost" onClick={onSuccess}>Cancel</Button>
        <Button 
          type="submit" 
          disabled={isPending || !isBalanced || totalDebit === 0} 
          className="bg-primary hover:opacity-90 text-primary-foreground min-w-[120px] shadow-lg shadow-primary/20"
        >
          {isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Check className="w-4 h-4 mr-2" />}
          Post Journal
        </Button>
      </div>
    </form>
  );
}
