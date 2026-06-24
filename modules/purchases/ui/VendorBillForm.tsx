"use client";

import { useState } from 'react';
import { Button } from '@/packages/ui-kit/components/ui/button';
import { Loader2, Check, Trash2, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { postVendorBillAction } from '@/app/actions/purchases';
import { formatMoney } from '@/lib/utils/money';

export function VendorBillForm({ 
  tenantSlug, 
  vendors,
  purchaseOrders,
  items,
  onSuccess 
}: { 
  tenantSlug: string, 
  vendors: any[],
  purchaseOrders: any[],
  items: any[],
  onSuccess: () => void 
}) {
  const [isPending, setIsPending] = useState(false);
  const [vendorId, setVendorId] = useState('');
  const [poId, setPoId] = useState('');
  const [invoiceNo, setInvoiceNo] = useState('');
  
  const [lines, setLines] = useState<{ id: string, poLineId: string, itemId: string, qty: number, unitPrice: number }[]>([]);

  const filteredPOs = poId ? purchaseOrders : purchaseOrders.filter(po => po.vendor_id === vendorId);
  const selectedPO = purchaseOrders.find(po => po.id === poId);

  const addLine = () => {
    setLines([...lines, { id: Math.random().toString(), poLineId: '', itemId: '', qty: 1, unitPrice: 0 }]);
  };

  const removeLine = (id: string) => {
    setLines(lines.filter(l => l.id !== id));
  };

  const updateLine = (id: string, field: string, value: any) => {
    setLines(lines.map(l => {
      if (l.id !== id) return l;
      const newLine = { ...l, [field]: value };
      if (field === 'poLineId') {
        const poLine = selectedPO?.po_lines?.find((pl: any) => pl.id === value);
        if (poLine) {
          newLine.itemId = poLine.item_id;
          newLine.unitPrice = poLine.unit_price;
          // default qty to ordered qty or something
          newLine.qty = poLine.qty_ordered;
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
      await postVendorBillAction(tenantSlug, {
        vendorId,
        poId,
        invoiceNo,
        lines: validLines
      });
      
      toast.success('Vendor Bill posted successfully');
      onSuccess();
    } catch (err: any) {
      toast.error(err.message || 'Failed to post bill');
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
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Purchase Order *</label>
            <select 
              value={poId}
              onChange={e => setPoId(e.target.value)}
              required 
              disabled={!vendorId}
              className="premium-input w-full bg-white dark:bg-[#0B0E14] focus:ring-primary"
            >
              <option value="">Select Purchase Order...</option>
              {filteredPOs.map(po => (
                <option key={po.id} value={po.id}>{po.id}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Vendor Invoice No.</label>
            <Input 
              value={invoiceNo}
              onChange={e => setInvoiceNo(e.target.value)}
              className="premium-input w-full"
              placeholder="e.g. INV-12345"
            />
          </div>
        </div>

        <hr className="border-slate-200 dark:border-white/10" />

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Bill Lines</h3>
            <Button type="button" variant="outline" size="sm" onClick={addLine} disabled={!poId} className="h-8 text-xs border-primary text-primary hover:bg-primary/10">
              <Plus className="w-3 h-3 mr-1" /> Add Line
            </Button>
          </div>

          <div className="bg-slate-50 dark:bg-white/5 rounded-xl border border-slate-200 dark:border-white/10 overflow-hidden">
            <div className="grid grid-cols-12 gap-2 p-3 bg-slate-100 dark:bg-white/5 border-b border-slate-200 dark:border-white/10 text-xs font-semibold text-slate-500 uppercase tracking-wider">
              <div className="col-span-5">PO Line / Item</div>
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
                      value={line.poLineId}
                      onChange={(e) => updateLine(line.id, 'poLineId', e.target.value)}
                      required
                      className="w-full bg-transparent border-none text-sm focus:ring-0 text-slate-900 dark:text-white p-2"
                    >
                      <option value="">Select PO Line...</option>
                      {selectedPO?.po_lines?.map((pl: any) => {
                        const item = items.find(i => i.id === pl.item_id);
                        return <option key={pl.id} value={pl.id}>{item?.name || pl.item_id}</option>
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
              <div className="col-span-9 text-right text-slate-500">Total Bill Amount:</div>
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
          disabled={isPending || !poId || lines.length === 0} 
          className="bg-primary hover:opacity-90 text-primary-foreground min-w-[120px] shadow-lg shadow-primary/20"
        >
          {isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Check className="w-4 h-4 mr-2" />}
          Post Bill
        </Button>
      </div>
    </form>
  );
}
