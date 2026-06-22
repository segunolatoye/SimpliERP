"use client";

import { useState } from 'react';
import { Button } from '@/packages/ui-kit/components/ui/button';
import { Input } from '@/packages/ui-kit/components/ui/input';
import { Loader2, Plus, Trash2, Check } from 'lucide-react';
import { toast } from 'sonner';
import { createPurchaseOrderAction } from '@/app/actions/purchases';
import { formatMoney } from '@/lib/utils/money';

export function PurchaseOrderForm({ 
  tenantSlug, 
  vendors,
  items,
  onSuccess 
}: { 
  tenantSlug: string, 
  vendors: any[],
  items: any[],
  onSuccess: () => void 
}) {
  const [isPending, setIsPending] = useState(false);
  const [vendorId, setVendorId] = useState('');
  const [currency, setCurrency] = useState('NGN');
  const [lines, setLines] = useState([
    { id: '1', item_id: '', qty_ordered: 1, unit_price: 0, tax_rate: 0 }
  ]);

  const addLine = () => {
    setLines([...lines, { id: Math.random().toString(), item_id: '', qty_ordered: 1, unit_price: 0, tax_rate: 0 }]);
  };

  const removeLine = (id: string) => {
    setLines(lines.filter(l => l.id !== id));
  };

  const updateLine = (id: string, field: string, value: any) => {
    setLines(lines.map(l => {
      if (l.id !== id) return l;
      const newLine = { ...l, [field]: value };
      
      // Auto-fill price if item is selected
      if (field === 'item_id') {
        const selectedItem = items.find(i => i.id === value);
        if (selectedItem) newLine.unit_price = selectedItem.cost_price || 0;
      }
      return newLine;
    }));
  };

  const totalAmount = lines.reduce((sum, l) => sum + (l.qty_ordered * l.unit_price * (1 + l.tax_rate / 100)), 0);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const validLines = lines.filter(l => l.item_id && l.qty_ordered > 0);
    if (validLines.length === 0) {
      toast.error("Please provide at least one valid line item.");
      return;
    }

    setIsPending(true);

    try {
      await createPurchaseOrderAction(tenantSlug, {
        vendor_id: vendorId,
        currency,
        lines: validLines.map(l => ({
          item_id: l.item_id,
          qty_ordered: Number(l.qty_ordered),
          unit_price: Number(l.unit_price),
          tax_rate: Number(l.tax_rate)
        }))
      });
      
      toast.success('Purchase Order created successfully');
      onSuccess();
    } catch (err: any) {
      toast.error(err.message || 'Failed to create PO');
    } finally {
      setIsPending(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-6 flex flex-col h-[calc(100vh-80px)]">
      <div className="flex-1 overflow-y-auto space-y-6 custom-scrollbar pb-10">
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Vendor *</label>
            <select 
              value={vendorId}
              onChange={e => setVendorId(e.target.value)}
              required 
              className="premium-input w-full bg-white dark:bg-[#0B0E14] focus:ring-primary"
            >
              <option value="">Select Vendor...</option>
              {vendors.map(v => (
                <option key={v.id} value={v.id}>{v.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Currency</label>
            <select 
              value={currency}
              onChange={e => setCurrency(e.target.value)}
              className="premium-input w-full bg-white dark:bg-[#0B0E14] focus:ring-primary"
            >
              <option value="NGN">NGN - Nigerian Naira</option>
              <option value="USD">USD - US Dollar</option>
              <option value="EUR">EUR - Euro</option>
              <option value="GBP">GBP - British Pound</option>
            </select>
          </div>
        </div>

        <hr className="border-slate-200 dark:border-white/10" />

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Order Lines</h3>
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
                const lineTotal = line.qty_ordered * line.unit_price * (1 + line.tax_rate / 100);
                return (
                <div key={line.id} className="grid grid-cols-12 gap-2 p-2 items-center">
                  <div className="col-span-5">
                    <select 
                      value={line.item_id}
                      onChange={(e) => updateLine(line.id, 'item_id', e.target.value)}
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
                      value={line.qty_ordered}
                      onChange={(e) => updateLine(line.id, 'qty_ordered', e.target.value)}
                      className="w-full bg-transparent border-none text-sm text-right focus:ring-0 text-slate-900 dark:text-white p-2"
                    />
                  </div>
                  <div className="col-span-2">
                    <input 
                      type="number" 
                      step="0.01"
                      value={line.unit_price}
                      onChange={(e) => updateLine(line.id, 'unit_price', e.target.value)}
                      className="w-full bg-transparent border-none text-sm text-right focus:ring-0 text-slate-900 dark:text-white p-2"
                    />
                  </div>
                  <div className="col-span-2 text-right text-sm font-medium p-2 text-slate-900 dark:text-white">
                    {formatMoney(lineTotal, currency)}
                  </div>
                  <div className="col-span-1 flex justify-center">
                    <Button 
                      type="button" 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => removeLine(line.id)}
                      disabled={lines.length <= 1}
                      className="h-8 w-8 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 shrink-0"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )})}
            </div>
            
            <div className="grid grid-cols-12 gap-2 p-3 bg-slate-100 dark:bg-white/5 border-t border-slate-200 dark:border-white/10 font-bold text-slate-900 dark:text-white text-base">
              <div className="col-span-9 text-right text-slate-500">Total Order Amount:</div>
              <div className="col-span-2 text-right text-primary">{formatMoney(totalAmount, currency)}</div>
              <div className="col-span-1"></div>
            </div>
          </div>
        </div>
      </div>

      <div className="pt-4 border-t border-slate-200 dark:border-white/10 flex justify-end gap-3 mt-auto bg-white dark:bg-[#11151C]">
        <Button type="button" variant="ghost" onClick={onSuccess}>Cancel</Button>
        <Button 
          type="submit" 
          disabled={isPending || !vendorId} 
          className="bg-primary hover:opacity-90 text-primary-foreground min-w-[120px] shadow-lg shadow-primary/20"
        >
          {isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Check className="w-4 h-4 mr-2" />}
          Confirm Order
        </Button>
      </div>
    </form>
  );
}
