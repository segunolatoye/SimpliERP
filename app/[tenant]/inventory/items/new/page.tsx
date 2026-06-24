'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createItemAction } from '@/app/actions/inventory';
import Link from 'next/link';

export default function NewItemPage({ params }: { params: { tenant: string } }) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const data = Object.fromEntries(formData.entries());

    // Basic transformations for numbers/booleans
    const payload = {
      ...data,
      cost_price: Number(data.cost_price) || 0,
      selling_price: Number(data.selling_price) || 0,
      reorder_point: Number(data.reorder_point) || 0,
      lead_time_days: Number(data.lead_time_days) || 0,
      is_purchasable: formData.get('is_purchasable') === 'on',
      is_sellable: formData.get('is_sellable') === 'on',
      track_inventory: formData.get('track_inventory') === 'on',
    };

    const res = await createItemAction(params.tenant, payload);
    
    if (res.success) {
      router.push(`/${params.tenant}/inventory/items`);
    } else {
      setError(res.error);
      setIsSubmitting(false);
    }
  }

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center space-x-4 mb-6">
        <Link href={`/${params.tenant}/inventory/items`} className="text-gray-500 hover:text-gray-900">
          ← Back
        </Link>
        <h1 className="text-3xl font-bold tracking-tight">Create New Item</h1>
      </div>

      {error && (
        <div className="p-4 bg-red-50 text-red-600 rounded-md border border-red-200">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white border rounded-lg shadow-sm p-6 space-y-8">
        {/* Basic Info */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-gray-900 border-b pb-2">Basic Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">SKU</label>
              <input name="sku" required className="w-full border rounded-md p-2 focus:ring-2 focus:ring-indigo-500" placeholder="e.g., ITEM-001" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Name</label>
              <input name="name" required className="w-full border rounded-md p-2 focus:ring-2 focus:ring-indigo-500" placeholder="Product Name" />
            </div>
            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-medium text-gray-700">Description</label>
              <textarea name="description" rows={3} className="w-full border rounded-md p-2 focus:ring-2 focus:ring-indigo-500" placeholder="Optional description..." />
            </div>
          </div>
        </div>

        {/* Pricing */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-gray-900 border-b pb-2">Pricing & Costing</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Cost Price</label>
              <input type="number" step="0.01" name="cost_price" defaultValue="0" className="w-full border rounded-md p-2 focus:ring-2 focus:ring-indigo-500" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Selling Price</label>
              <input type="number" step="0.01" name="selling_price" defaultValue="0" className="w-full border rounded-md p-2 focus:ring-2 focus:ring-indigo-500" />
            </div>
            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-medium text-gray-700">Costing Method</label>
              <select name="cost_method" className="w-full border rounded-md p-2 focus:ring-2 focus:ring-indigo-500">
                <option value="fifo">FIFO (First In, First Out)</option>
                <option value="average">Weighted Average Cost (WAC)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Inventory Tracking */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-gray-900 border-b pb-2">Inventory Tracking</h2>
          
          <div className="flex items-center space-x-3 bg-gray-50 p-4 rounded-md border">
            <input type="checkbox" name="track_inventory" id="track_inventory" defaultChecked className="h-5 w-5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" />
            <label htmlFor="track_inventory" className="text-sm font-medium text-gray-900">
              Track Inventory for this item
            </label>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Reorder Point</label>
              <input type="number" name="reorder_point" defaultValue="0" className="w-full border rounded-md p-2 focus:ring-2 focus:ring-indigo-500" />
            </div>
          </div>
        </div>

        <div className="pt-6 border-t flex justify-end space-x-4">
          <Link href={`/${params.tenant}/inventory/items`} className="px-4 py-2 border rounded-md hover:bg-gray-50 font-medium">
            Cancel
          </Link>
          <button 
            type="submit" 
            disabled={isSubmitting}
            className="px-6 py-2 bg-indigo-600 text-white font-medium rounded-md hover:bg-indigo-700 disabled:opacity-50 transition-colors"
          >
            {isSubmitting ? 'Saving...' : 'Save Item'}
          </button>
        </div>
      </form>
    </div>
  );
}
