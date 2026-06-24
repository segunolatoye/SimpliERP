"use client";

import { useState } from 'react';
import { Button } from '@/packages/ui-kit/components/ui/button';
import { Loader2, Check } from 'lucide-react';
import { toast } from 'sonner';
import { processDeliveryAction } from '@/app/actions/sales';

export function DeliveryNoteForm({ 
  tenantSlug, 
  salesOrders,
  locations,
  items,
  onSuccess 
}: { 
  tenantSlug: string, 
  salesOrders: any[],
  locations: any[],
  items: any[],
  onSuccess: () => void 
}) {
  const [isPending, setIsPending] = useState(false);
  const [soId, setSoId] = useState('');
  const [locationId, setLocationId] = useState('');
  
  const [lines, setLines] = useState<{ soLineId: string, itemId: string, qty: number, maxQty: number }[]>([]);

  const handleSOChange = (selectedSoId: string) => {
    setSoId(selectedSoId);
    const so = salesOrders.find(o => o.id === selectedSoId);
    if (so && so.so_lines) {
      // Auto-populate lines with remaining quantities
      const initialLines = so.so_lines
        .filter((l: any) => l.requires_delivery_match && l.qty_delivered < l.qty_ordered)
        .map((l: any) => ({
          soLineId: l.id,
          itemId: l.item_id,
          maxQty: l.qty_ordered - l.qty_delivered,
          qty: l.qty_ordered - l.qty_delivered
        }));
      setLines(initialLines);
    } else {
      setLines([]);
    }
  };

  const updateLineQty = (soLineId: string, newQty: number) => {
    setLines(lines.map(l => l.soLineId === soLineId ? { ...l, qty: newQty } : l));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const validLines = lines.filter(l => l.qty > 0);
    if (validLines.length === 0) {
      toast.error("Please provide a quantity greater than zero for at least one item.");
      return;
    }

    for (const l of validLines) {
      if (l.qty > l.maxQty) {
        toast.error(`Quantity cannot exceed ${l.maxQty} for line ${l.soLineId}`);
        return;
      }
    }

    setIsPending(true);

    try {
      await processDeliveryAction(tenantSlug, {
        soId,
        locationId,
        lines: validLines
      });
      
      toast.success('Delivery Note posted successfully');
      onSuccess();
    } catch (err: any) {
      toast.error(err.message || 'Failed to post delivery');
    } finally {
      setIsPending(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-6 flex flex-col h-[calc(100vh-80px)]">
      <div className="flex-1 overflow-y-auto space-y-6 custom-scrollbar pb-10">
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Sales Order *</label>
            <select 
              value={soId}
              onChange={e => handleSOChange(e.target.value)}
              required 
              className="premium-input w-full bg-white dark:bg-[#0B0E14] focus:ring-primary"
            >
              <option value="">Select Sales Order...</option>
              {salesOrders.map(so => (
                <option key={so.id} value={so.id}>{so.id} - {so.customers?.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Shipping Warehouse *</label>
            <select 
              value={locationId}
              onChange={e => setLocationId(e.target.value)}
              required 
              className="premium-input w-full bg-white dark:bg-[#0B0E14] focus:ring-primary"
            >
              <option value="">Select Warehouse...</option>
              {locations.map(loc => (
                <option key={loc.id} value={loc.id}>{loc.name}</option>
              ))}
            </select>
          </div>
        </div>

        {soId && lines.length === 0 && (
          <div className="p-4 bg-amber-50 text-amber-600 rounded-lg text-sm border border-amber-200">
            This Sales Order is either fully delivered or does not contain any physical goods requiring delivery.
          </div>
        )}

        {lines.length > 0 && (
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Items to Ship</h3>
            <div className="bg-slate-50 dark:bg-white/5 rounded-xl border border-slate-200 dark:border-white/10 overflow-hidden">
              <div className="grid grid-cols-12 gap-2 p-3 bg-slate-100 dark:bg-white/5 border-b border-slate-200 dark:border-white/10 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                <div className="col-span-6">Item</div>
                <div className="col-span-3 text-right">To Ship</div>
                <div className="col-span-3 text-right">Max Allowed</div>
              </div>
              
              <div className="divide-y divide-slate-200 dark:divide-white/10">
                {lines.map((line) => {
                  const item = items.find(i => i.id === line.itemId);
                  return (
                  <div key={line.soLineId} className="grid grid-cols-12 gap-2 p-2 items-center">
                    <div className="col-span-6 px-2 text-sm font-medium text-slate-900 dark:text-white">
                      {item?.name || line.itemId}
                    </div>
                    <div className="col-span-3">
                      <input 
                        type="number" 
                        min="0"
                        max={line.maxQty}
                        value={line.qty}
                        onChange={(e) => updateLineQty(line.soLineId, Number(e.target.value))}
                        className="w-full bg-transparent border-none text-sm text-right focus:ring-0 text-slate-900 dark:text-white p-2 bg-white dark:bg-[#0B0E14] rounded-md border-slate-200"
                      />
                    </div>
                    <div className="col-span-3 text-right text-sm text-slate-500 p-2">
                      {line.maxQty}
                    </div>
                  </div>
                )})}
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="pt-4 border-t border-slate-200 dark:border-white/10 flex justify-end gap-3 mt-auto bg-white dark:bg-[#11151C]">
        <Button type="button" variant="ghost" onClick={onSuccess}>Cancel</Button>
        <Button 
          type="submit" 
          disabled={isPending || !soId || !locationId || lines.length === 0} 
          className="bg-primary hover:opacity-90 text-primary-foreground min-w-[120px] shadow-lg shadow-primary/20"
        >
          {isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Check className="w-4 h-4 mr-2" />}
          Post Delivery
        </Button>
      </div>
    </form>
  );
}
