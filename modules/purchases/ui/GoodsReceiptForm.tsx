"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "@/packages/ui-kit/components/ui/button";
import { Input } from "@/packages/ui-kit/components/ui/input";
import { receiveGoodsAction } from "@/app/actions/purchases";
import { toast } from "sonner";
import { Box, MapPin, CheckCircle2 } from "lucide-react";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white rounded-full">
      {pending ? "Processing Receipt..." : "Confirm Goods Receipt"}
    </Button>
  );
}

export function GoodsReceiptForm({ 
  tenantSlug, 
  po, 
  locations,
  onSuccess 
}: { 
  tenantSlug: string, 
  po: any,
  locations: any[],
  onSuccess: () => void 
}) {
  const [lines, setLines] = useState(
    po.po_lines.map((line: any) => ({
      ...line,
      qtyToReceive: Math.max(0, line.qty - line.qty_received)
    }))
  );

  const handleQtyChange = (lineId: string, value: string) => {
    const num = parseInt(value) || 0;
    setLines(lines.map((l: any) => l.id === lineId ? { ...l, qtyToReceive: num } : l));
  };

  const action = async (formData: FormData) => {
    try {
      const locationId = formData.get('location_id') as string;
      const receivedBy = formData.get('received_by') as string;
      const notes = formData.get('notes') as string;

      if (!locationId) throw new Error("Please select a receiving location");
      if (!receivedBy) throw new Error("Please specify who received the goods");

      const payload = {
        poId: po.id,
        locationId,
        receivedBy,
        notes,
        lines: lines.map((l: any) => ({
          poLineId: l.id,
          qtyReceived: l.qtyToReceive
        })).filter((l: any) => l.qtyReceived > 0)
      };

      if (payload.lines.length === 0) {
        throw new Error("No quantities specified to receive.");
      }

      await receiveGoodsAction(tenantSlug, payload);
      toast.success("Goods received successfully!");
      onSuccess();
    } catch (err: any) {
      toast.error(err.message || "Failed to receive goods");
    }
  };

  return (
    <form action={action} className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      <div className="bg-slate-50 dark:bg-white/5 p-4 rounded-2xl border border-slate-100 dark:border-white/10">
        <h3 className="text-sm font-semibold text-slate-500 dark:text-slate-400 mb-3 uppercase tracking-wider">Receipt Details</h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Receiving Location</label>
            <div className="relative">
              <MapPin className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <select 
                name="location_id" 
                required
                className="w-full pl-9 pr-3 py-2 bg-white dark:bg-[#0B0E14] border border-slate-200 dark:border-white/10 rounded-xl text-sm focus:ring-2 focus:ring-primary focus:outline-none"
              >
                <option value="">Select Warehouse/Location...</option>
                {locations.map(loc => (
                  <option key={loc.id} value={loc.id}>{loc.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Received By (Name)</label>
            <Input name="received_by" placeholder="e.g. John Doe" required className="rounded-xl" />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Delivery Notes (Optional)</label>
            <Input name="notes" placeholder="e.g. Delivered via FedEx, Box 1 of 2 slightly damaged" className="rounded-xl" />
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-sm font-semibold text-slate-500 dark:text-slate-400 mb-3 uppercase tracking-wider flex items-center gap-2">
          <Box className="w-4 h-4" />
          Items to Receive
        </h3>
        
        <div className="space-y-3">
          {lines.map((line: any) => {
            const remaining = line.qty - line.qty_received;
            const isFullyReceived = remaining <= 0;

            return (
              <div key={line.id} className={`p-4 rounded-2xl border ${isFullyReceived ? 'bg-emerald-50 border-emerald-100 dark:bg-emerald-950/20 dark:border-emerald-900/30' : 'bg-white dark:bg-[#0B0E14] border-slate-200 dark:border-white/10'}`}>
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <div className="font-medium text-slate-900 dark:text-slate-100">{line.items?.name || 'Unknown Item'}</div>
                    <div className="text-xs text-slate-500 mt-0.5">
                      Ordered: {line.qty} • Previously Received: {line.qty_received}
                    </div>
                  </div>
                  {isFullyReceived && (
                    <span className="flex items-center text-xs font-bold text-emerald-600 bg-emerald-100 px-2 py-1 rounded-full">
                      <CheckCircle2 className="w-3 h-3 mr-1" />
                      Fully Received
                    </span>
                  )}
                </div>

                {!isFullyReceived && (
                  <div className="flex items-center gap-3">
                    <div className="flex-1">
                      <label className="text-xs text-slate-500 mb-1 block">Receive Now</label>
                      <Input 
                        type="number" 
                        min="0" 
                        max={remaining}
                        value={line.qtyToReceive}
                        onChange={(e) => handleQtyChange(line.id, e.target.value)}
                        className="rounded-xl"
                      />
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="pt-4 border-t border-slate-200 dark:border-white/10">
        <SubmitButton />
      </div>
    </form>
  );
}
