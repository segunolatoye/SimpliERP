'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { adjustStockAction } from '@/app/actions/inventory';
import Link from 'next/link';

export default function StockAdjustmentPage({ params }: { params: { tenant: string } }) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const data = Object.fromEntries(formData.entries());

    // Basic transformations
    const payload = {
      ...data,
      qty_delta: Number(data.qty_delta),
      cost_price: data.cost_price ? Number(data.cost_price) : undefined,
    };

    const res = await adjustStockAction(params.tenant, payload);
    
    if (res.success) {
      router.push(`/${params.tenant}/inventory/stock`);
    } else {
      setError(res.error);
      setIsSubmitting(false);
    }
  }

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <div className="flex items-center space-x-4 mb-6">
        <Link href={`/${params.tenant}/inventory/stock`} className="text-gray-500 hover:text-gray-900">
          ← Back to Stock Ledger
        </Link>
        <h1 className="text-3xl font-bold tracking-tight">Post Stock Adjustment</h1>
      </div>

      {error && (
        <div className="p-4 bg-red-50 text-red-600 rounded-md border border-red-200">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white border rounded-lg shadow-sm p-6 space-y-6">
        <div className="space-y-4">
          
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Reason / Type</label>
            <select name="reason_code" required className="w-full border rounded-md p-2 focus:ring-2 focus:ring-indigo-500 bg-gray-50">
              <option value="">Select Reason...</option>
              <option value="OPENING_BALANCE">Opening Balance (Initial Stock Entry)</option>
              <option value="SHRINKAGE">Shrinkage / Loss</option>
              <option value="DAMAGE">Damage</option>
              <option value="FOUND">Stock Found</option>
            </select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Item ID (UUID for now)</label>
              <input name="item_id" required className="w-full border rounded-md p-2 focus:ring-2 focus:ring-indigo-500" placeholder="Item UUID" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Location ID (Warehouse UUID)</label>
              <input name="location_id" required className="w-full border rounded-md p-2 focus:ring-2 focus:ring-indigo-500" placeholder="Location UUID" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Quantity Delta</label>
              <p className="text-xs text-gray-500 mb-1">Use negative values for reductions.</p>
              <input type="number" name="qty_delta" required className="w-full border rounded-md p-2 focus:ring-2 focus:ring-indigo-500" placeholder="e.g. 50 or -5" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Unit Cost (Optional)</label>
              <p className="text-xs text-gray-500 mb-1">Override the cost for this specific entry (useful for Opening Balances).</p>
              <input type="number" step="0.01" name="cost_price" className="w-full border rounded-md p-2 focus:ring-2 focus:ring-indigo-500" placeholder="0.00" />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Notes / Reference</label>
            <textarea name="notes" rows={2} className="w-full border rounded-md p-2 focus:ring-2 focus:ring-indigo-500" placeholder="Details about this adjustment..." />
          </div>

        </div>

        <div className="pt-6 border-t flex justify-end space-x-4">
          <Link href={`/${params.tenant}/inventory/stock`} className="px-4 py-2 border rounded-md hover:bg-gray-50 font-medium">
            Cancel
          </Link>
          <button 
            type="submit" 
            disabled={isSubmitting}
            className="px-6 py-2 bg-indigo-600 text-white font-medium rounded-md hover:bg-indigo-700 disabled:opacity-50 transition-colors"
          >
            {isSubmitting ? 'Posting...' : 'Post Entry'}
          </button>
        </div>
      </form>
    </div>
  );
}
