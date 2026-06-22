"use client";

import { useState } from 'react';
import { Package, Plus, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { Button } from '@/packages/ui-kit/components/ui/button';
import { DataTable } from '@/packages/ui-kit/components/ui/data-table';
import { ColumnDef } from '@tanstack/react-table';
import { SlideOver } from '@/packages/ui-kit/components/ui/SlideOver';
import { StockAdjustmentForm } from './StockAdjustmentForm';

export function StockAdjustmentsClient({ tenantSlug, history, locations, items }: { tenantSlug: string, history: any[], locations: any[], items: any[] }) {
  const [isFormOpen, setIsFormOpen] = useState(false);

  const columns: ColumnDef<any>[] = [
    {
      accessorKey: "created_at",
      header: "Date",
      cell: ({ row }) => new Date(row.original.created_at).toLocaleDateString()
    },
    {
      accessorKey: "items",
      header: "Item",
      cell: ({ row }) => (
        <div className="flex flex-col">
          <span className="font-semibold text-slate-900 dark:text-slate-100">{row.original.items.name}</span>
          <span className="text-xs text-slate-500">{row.original.items.sku}</span>
        </div>
      )
    },
    {
      accessorKey: "locations",
      header: "Location",
      cell: ({ row }) => <span className="text-sm">{row.original.locations.name}</span>
    },
    {
      accessorKey: "qty_delta",
      header: "Adjustment",
      cell: ({ row }) => {
        const qty = row.original.qty_delta;
        const isPositive = qty > 0;
        return (
          <div className={`flex items-center gap-1.5 font-medium ${isPositive ? 'text-emerald-500' : 'text-rose-500'}`}>
            {isPositive ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
            {isPositive ? '+' : ''}{qty}
          </div>
        );
      }
    },
    {
      accessorKey: "reference_id",
      header: "Reference / Note",
      cell: ({ row }) => <span className="text-sm text-slate-600 dark:text-slate-400">{row.original.reference_id || '-'}</span>
    }
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-500 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-[#11151C] border border-slate-200 dark:border-white/10 p-6 rounded-2xl shadow-sm dark:shadow-none">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Package className="w-5 h-5 text-primary" />
            Stock Adjustments
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Manually adjust inventory quantities and view stock ledger history.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button onClick={() => setIsFormOpen(true)} className="bg-primary hover:opacity-90 text-primary-foreground rounded-full px-6 shadow-lg shadow-primary/20 shrink-0">
            <Plus className="w-4 h-4 mr-2" />
            New Adjustment
          </Button>
        </div>
      </div>

      <div className="mt-8">
        <DataTable 
          columns={columns} 
          data={history} 
          searchKey="reference_id" 
          searchPlaceholder="Search by reference..."
        />
      </div>

      <SlideOver 
        open={isFormOpen} 
        onOpenChange={(val: boolean) => setIsFormOpen(val)} 
        title="Post Stock Adjustment"
      >
        <StockAdjustmentForm 
          tenantSlug={tenantSlug} 
          locations={locations}
          items={items}
          onSuccess={() => setIsFormOpen(false)} 
        />
      </SlideOver>
    </div>
  );
}
