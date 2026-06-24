"use client";

import { useState } from 'react';
import { Button } from '@/packages/ui-kit/components/ui/button';
import { Loader2, Check, Trash2, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { postCustomerInvoiceAction } from '@/app/actions/sales';
import { formatMoney } from '@/lib/utils/money';

export function CustomerInvoiceForm({ 
  tenantSlug, 
  customers,
  salesOrders,
  items,
  onSuccess 
}: { 
  tenantSlug: string, 
  customers: any[],
  salesOrders: any[],
  items: any[],
  onSuccess: () => void 
}) {
  const [isPending, setIsPending] = useState(false);
  const [customerId, setCustomerId] = useState('');
  const [soId, setSoId] = useState('');
  
  const [lines, setLines] = useState<{ id: string, soLineId: string, itemId: string, qty: number, unitPrice: number }[]>([]);

  const filteredSOs = customerId ? salesOrders.filter(so => so.customer_id === customerId) : salesOrders;
  const selectedSO = salesOrders.find(so => so.id === soId);

  const addLine = () => {
    setLines([...lines, { id: Math.random().toString(), soLineId: '', itemId: '', qty: 1, unitPrice: 0 }]);
  };

  const removeLine = (id: string) => {
    setLines(lines.filter(l => l.id !== id));
  };

  const updateLine = (id: string, field: string, value: any) => {
    setLines(lines.map(l => {
      if (l.id !== id) return l;
      const newLine = { ...l, [field]: value };
      if (field === 'soLineId') {
        const soLine = selectedSO?.so_lines?.find((pl: any) => pl.id === value);
        if (soLine) {
          newLine.itemId = soLine.item_id;
          newLine.unitPrice = soLine.unit_price;
          // default to whatever was delivered (if required) or ordered
          newLine.qty = soLine.requires_delivery_match ? soLine.qty_delivered : soLine.qty_ordered;
        }
      }
      return newLine;
    }));
  };

  const totalAmount = lines.reduce((sum, l) => sum + (l.qty * l.unitPrice), 0);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const validLines = lines.filter(l => l.itemId && l.qty > 0);
    if (validLines.length === 0) {
      toast.error("Please provide at least one valid line item.");
      return;
    }

    setIsPending(true);

    try {
      await postCustomerInvoiceAction(tenantSlug, {
        customerId,
        soId,
        lines: validLines
      });
      
      toast.success('Customer Invoice posted successfully');
      onSuccess();
    } catch (err: any) {
      toast.error(err.message || 'Failed to post invoice');
    } finally {
      setIsPending(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-6 flex flex-col h-[calc(100vh-80px)]">
      <div className="flex-1 overflow-y-auto space-y-6 custom-scrollbar pb-10">
        
        <div className="space-y-4">
          <div>
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

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Sales Order *</label>
            <select 
              value={soId}
              onChange={e => setSoId(e.target.value)}
              required 
              disabled={!customerId}
              className="premium-input w-full bg-white dark:bg-[#0B0E14] focus:ring-primary"
            >
              <option value="">Select Sales Order...</option>
              {filteredSOs.map(so => (
                <option key={so.id} value={so.id}>{so.id}</option>
              ))}
            </select>
          </div>
        </div>

        <hr className="border-slate-200 dark:border-white/10" />

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Invoice Lines</h3>
            <Button type="button" variant="outline" size="sm" onClick={addLine} disabled={!soId} className="h-8 text-xs border-primary text-primary hover:bg-primary/10">
              <Plus className="w-3 h-3 mr-1" /> Add Line
            </Button>
          </div>

          <div className="bg-slate-50 dark:bg-white/5 rounded-xl border border-slate-200 dark:border-white/10 overflow-hidden">
            <div className="grid grid-cols-12 gap-2 p-3 bg-slate-100 dark:bg-white/5 border-b border-slate-200 dark:border-white/10 text-xs font-semibold text-slate-500 uppercase tracking-wider">
              <div className="col-span-5">SO Line / Item</div>
              <div className="col-span-2 text-right">Qty Billed</div>
              <div className="col-span-2 text-right">Unit Price</div>
              <div className="col-span-2 text-right">Line Total</div>
              <div className="col-span-1"></div>
            </div>
            
            <div className="divide-y divide-slate-200 dark:divide-white/10">
              {lines.map((line) => {
                const lineTotal = line.qty * line.unitPrice;
                return (
                <div key={line.id} className="grid grid-cols-12 gap-2 p-2 items-center">
                  <div className="col-span-5">
                    <select 
                      value={line.soLineId}
                      onChange={(e) => updateLine(line.id, 'soLineId', e.target.value)}
                      required
                      className="w-full bg-transparent border-none text-sm focus:ring-0 text-slate-900 dark:text-white p-2"
                    >
                      <option value="">Select SO Line...</option>
                      {selectedSO?.so_lines?.map((sl: any) => {
                        const item = items.find(i => i.id === sl.item_id);
                        return <option key={sl.id} value={sl.id}>{item?.name || sl.item_id}</option>
                      })}
                    </select>
                  </div>
                  <div className="col-span-2">
                    <input 
                      type="number" 
                      min="1"
                      value={line.qty}
                      onChange={(e) => updateLine(line.id, 'qty', e.target.value)}
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
            
            <div className="grid grid-cols-12 gap-2 p-3 bg-slate-100 dark:bg-white/5 border-t border-slate-200 dark:border-white/10 font-bold text-slate-900 dark:text-white text-base">
              <div className="col-span-9 text-right text-slate-500">Total Invoice Amount:</div>
              <div className="col-span-2 text-right text-primary">{formatMoney(totalAmount, 'NGN')}</div>
              <div className="col-span-1"></div>
            </div>
          </div>
        </div>
      </div>

      <div className="pt-4 border-t border-slate-200 dark:border-white/10 flex justify-end gap-3 mt-auto bg-white dark:bg-[#11151C]">
        <Button type="button" variant="ghost" onClick={onSuccess}>Cancel</Button>
        <Button 
          type="submit" 
          disabled={isPending || !soId || lines.length === 0} 
          className="bg-primary hover:opacity-90 text-primary-foreground min-w-[120px] shadow-lg shadow-primary/20"
        >
          {isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Check className="w-4 h-4 mr-2" />}
          Post Invoice
        </Button>
      </div>
    </form>
  );
}
