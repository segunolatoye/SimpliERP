"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/packages/ui-kit/components/ui/button';
import { Input } from '@/packages/ui-kit/components/ui/input';
import { Loader2, Plus, Trash2, Check } from 'lucide-react';
import { toast } from 'sonner';
import { createSalesOrderAction } from '@/app/actions/sales';
import { formatMoney } from '@/lib/utils/money';

export function SalesOrderForm({ tenantSlug, customers, items }: { tenantSlug: string, customers: any[], items: any[] }) {
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);
  const [customerId, setCustomerId] = useState('');
  const [notes, setNotes] = useState('');
  
  const [lines, setLines] = useState([
    { id: '1', itemId: '', qtyOrdered: 1, unitPrice: 0, taxRate: 0 }
  ]);

  const addLine = () => {
    setLines([...lines, { id: Math.random().toString(), itemId: '', qtyOrdered: 1, unitPrice: 0, taxRate: 0 }]);
  };

  const removeLine = (id: string) => {
    if (lines.length > 1) {
      setLines(lines.filter(l => l.id !== id));
    }
  };

  const updateLine = (id: string, field: string, value: any) => {
    setLines(lines.map(l => {
      if (l.id !== id) return l;
      const newLine = { ...l, [field]: value };
      if (field === 'itemId') {
        const item = items.find(i => i.id === value);
        if (item) newLine.unitPrice = item.selling_price || 0;
      }
      return newLine;
    }));
  };

  const totalAmount = lines.reduce((sum, l) => sum + (l.qtyOrdered * l.unitPrice * (1 + l.taxRate / 100)), 0);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsPending(true);

    try {
      const validLines = lines.filter(l => l.itemId && l.qtyOrdered > 0);
      if (validLines.length === 0) throw new Error("Please add at least one item");

      await createSalesOrderAction(tenantSlug, {
        customerId,
        notes,
        lines: validLines
      });

      toast.success('Sales Order created successfully');
      router.push(`/${tenantSlug}/sales/orders`);
    } catch (err: any) {
      toast.error(err.message || 'Failed to create sales order');
    } finally {
      setIsPending(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-8 max-w-5xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="flex justify-between items-center bg-white dark:bg-[#11151C] border border-slate-200 dark:border-white/10 p-6 rounded-2xl shadow-sm dark:shadow-none">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">Create Sales Order</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Record a new customer order</p>
        </div>
        <div className="flex items-center gap-3">
          <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
          <Button type="submit" disabled={isPending || !customerId} className="bg-primary hover:opacity-90 text-primary-foreground min-w-[140px] shadow-lg shadow-primary/20">
            {isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Check className="w-4 h-4 mr-2" />}
            Confirm Order
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-[#11151C] border border-slate-200 dark:border-white/10 p-6 rounded-2xl">
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Customer *</label>
          <select 
            value={customerId}
            onChange={e => setCustomerId(e.target.value)}
            required 
            className="premium-input w-full bg-white dark:bg-[#0B0E14] focus:ring-primary"
          >
            <option value="">Select Customer...</option>
            {customers.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>

        <div className="bg-white dark:bg-[#11151C] border border-slate-200 dark:border-white/10 p-6 rounded-2xl">
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Notes / Terms</label>
          <Input 
            value={notes}
            onChange={e => setNotes(e.target.value)}
            className="premium-input w-full"
            placeholder="e.g. Net 30 days"
          />
        </div>
      </div>

      <div className="bg-white dark:bg-[#11151C] border border-slate-200 dark:border-white/10 p-6 rounded-2xl shadow-sm dark:shadow-none">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Order Lines</h3>
          <Button type="button" variant="outline" size="sm" onClick={addLine} className="h-8 text-xs border-primary text-primary hover:bg-primary/10">
            <Plus className="w-3 h-3 mr-1" /> Add Line
          </Button>
        </div>

        <div className="bg-slate-50 dark:bg-white/5 rounded-xl border border-slate-200 dark:border-white/10 overflow-hidden">
          <div className="grid grid-cols-12 gap-2 p-3 bg-slate-100 dark:bg-white/5 border-b border-slate-200 dark:border-white/10 text-xs font-semibold text-slate-500 uppercase tracking-wider">
            <div className="col-span-5">Item</div>
            <div className="col-span-2 text-right">Qty</div>
            <div className="col-span-2 text-right">Unit Price</div>
            <div className="col-span-2 text-right">Line Total</div>
            <div className="col-span-1"></div>
          </div>
          
          <div className="divide-y divide-slate-200 dark:divide-white/10">
            {lines.map((line) => {
              const lineTotal = line.qtyOrdered * line.unitPrice * (1 + line.taxRate / 100);
              return (
              <div key={line.id} className="grid grid-cols-12 gap-2 p-2 items-center">
                <div className="col-span-5">
                  <select 
                    value={line.itemId}
                    onChange={(e) => updateLine(line.id, 'itemId', e.target.value)}
                    required
                    className="w-full bg-transparent border-none text-sm focus:ring-0 text-slate-900 dark:text-white p-2"
                  >
                    <option value="">Select Item...</option>
                    {items.map(i => (
                      <option key={i.id} value={i.id}>{i.sku} - {i.name}</option>
                    ))}
                  </select>
                </div>
                <div className="col-span-2">
                  <input 
                    type="number" 
                    min="1"
                    value={line.qtyOrdered}
                    onChange={(e) => updateLine(line.id, 'qtyOrdered', e.target.value)}
                    className="w-full bg-transparent border-none text-sm text-right focus:ring-0 text-slate-900 dark:text-white p-2"
                  />
                </div>
                <div className="col-span-2">
                  <input 
                    type="number" 
                    step="0.01"
                    value={line.unitPrice}
                    onChange={(e) => updateLine(line.id, 'unitPrice', e.target.value)}
                    className="w-full bg-transparent border-none text-sm text-right focus:ring-0 text-slate-900 dark:text-white p-2"
                  />
                </div>
                <div className="col-span-2 text-right text-sm font-medium p-2 text-slate-900 dark:text-white">
                  {formatMoney(lineTotal, 'NGN')}
                </div>
                <div className="col-span-1 flex justify-center">
                  <Button 
                    type="button" 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => removeLine(line.id)}
                    className="h-8 w-8 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 shrink-0"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )})}
          </div>
          
          <div className="grid grid-cols-12 gap-2 p-4 bg-slate-100 dark:bg-white/5 border-t border-slate-200 dark:border-white/10 font-bold text-slate-900 dark:text-white text-lg">
            <div className="col-span-9 text-right text-slate-500">Total Amount:</div>
            <div className="col-span-2 text-right text-primary">{formatMoney(totalAmount, 'NGN')}</div>
            <div className="col-span-1"></div>
          </div>
        </div>
      </div>
    </form>
  );
}
