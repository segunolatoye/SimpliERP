"use client";

import { useState } from 'react';
import { Button } from '@/packages/ui-kit/components/ui/button';
import { Input } from '@/packages/ui-kit/components/ui/input';
import { Loader2, Check } from 'lucide-react';
import { toast } from 'sonner';
import { postStockAdjustmentAction } from '@/app/actions/inventory-stock';

export function StockAdjustmentForm({ 
  tenantSlug, 
  locations,
  items,
  onSuccess 
}: { 
  tenantSlug: string, 
  locations: any[],
  items: any[],
  onSuccess: () => void 
}) {
  const [isPending, setIsPending] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsPending(true);

    try {
      const formData = new FormData(e.currentTarget);
      const payload = Object.fromEntries(formData);
      
      await postStockAdjustmentAction(tenantSlug, payload);
      
      toast.success('Stock adjustment posted successfully');
      onSuccess();
    } catch (err: any) {
      toast.error(err.message || 'Failed to post adjustment');
    } finally {
      setIsPending(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-6 flex flex-col h-[calc(100vh-80px)]">
      <div className="flex-1 overflow-y-auto space-y-6 custom-scrollbar pb-10">
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Item *</label>
            <select name="itemId" required className="premium-input w-full bg-white dark:bg-[#0B0E14] focus:ring-primary">
              <option value="">Select Item...</option>
              {items.map(i => (
                <option key={i.id} value={i.id}>{i.sku} - {i.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Location *</label>
            <select name="locationId" required className="premium-input w-full bg-white dark:bg-[#0B0E14] focus:ring-primary">
              <option value="">Select Location...</option>
              {locations.map(l => (
                <option key={l.id} value={l.id}>{l.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Quantity Delta *</label>
            <Input name="qtyDelta" type="number" required placeholder="e.g. 10 to add, -5 to subtract" className="premium-input w-full focus:ring-primary" />
            <p className="text-xs text-slate-500 mt-1">Use negative numbers to reduce stock, positive to increase.</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Reference ID / Note</label>
            <Input name="referenceId" placeholder="e.g. Found in warehouse" className="premium-input w-full focus:ring-primary" />
          </div>
        </div>

      </div>

      <div className="pt-4 border-t border-slate-200 dark:border-white/10 flex justify-end gap-3 mt-auto bg-white dark:bg-[#11151C]">
        <Button type="button" variant="ghost" onClick={onSuccess}>Cancel</Button>
        <Button type="submit" disabled={isPending} className="bg-primary hover:opacity-90 text-primary-foreground min-w-[120px] shadow-lg shadow-primary/20">
          {isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Check className="w-4 h-4 mr-2" />}
          Post Adjustment
        </Button>
      </div>
    </form>
  );
}
