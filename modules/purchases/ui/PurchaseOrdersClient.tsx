"use client";

import { useState } from 'react';
import { ShoppingCart, Plus } from 'lucide-react';
import { Button } from '@/packages/ui-kit/components/ui/button';
import { DataTable } from '@/packages/ui-kit/components/ui/data-table';
import { ColumnDef } from '@tanstack/react-table';
import { SlideOver } from '@/packages/ui-kit/components/ui/SlideOver';
import { PurchaseOrderForm } from './PurchaseOrderForm';
import { formatMoney } from '@/lib/utils/money';

export function PurchaseOrdersClient({ tenantSlug, orders, vendors, items }: { tenantSlug: string, orders: any[], vendors: any[], items: any[] }) {
  const [isFormOpen, setIsFormOpen] = useState(false);

  const columns: ColumnDef<any>[] = [
    {
      accessorKey: "id",
      header: "PO Number",
      cell: ({ row }) => <span className="font-bold text-primary">{row.original.id}</span>
    },
    {
      accessorKey: "created_at",
      header: "Date",
      cell: ({ row }) => new Date(row.original.created_at).toLocaleDateString()
    },
    {
      accessorKey: "vendors.name",
      header: "Vendor",
      cell: ({ row }) => <span className="font-medium text-slate-900 dark:text-slate-100">{row.original.vendors?.name || '-'}</span>
    },
    {
      accessorKey: "total_amount",
      header: "Total",
      cell: ({ row }) => <span className="font-semibold">{formatMoney(row.original.total_amount, row.original.currency)}</span>
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const statusColors: any = {
          'draft': 'bg-slate-100 text-slate-600 border-slate-200',
          'sent': 'bg-blue-100 text-blue-600 border-blue-200',
          'confirmed': 'bg-emerald-100 text-emerald-600 border-emerald-200',
          'done': 'bg-purple-100 text-purple-600 border-purple-200',
          'cancelled': 'bg-rose-100 text-rose-600 border-rose-200',
        };
        const color = statusColors[row.original.status] || statusColors['draft'];
        return (
          <span className={`px-2.5 py-1 text-xs rounded-full border font-medium capitalize ${color}`}>
            {row.original.status}
          </span>
        );
      }
    }
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-500 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-[#11151C] border border-slate-200 dark:border-white/10 p-6 rounded-2xl shadow-sm dark:shadow-none">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <ShoppingCart className="w-5 h-5 text-primary" />
            Purchase Orders
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Manage vendor procurement and track expected receipts.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button onClick={() => setIsFormOpen(true)} className="bg-primary hover:opacity-90 text-primary-foreground rounded-full px-6 shadow-lg shadow-primary/20 shrink-0">
            <Plus className="w-4 h-4 mr-2" />
            New PO
          </Button>
        </div>
      </div>

      <div className="mt-8">
        <DataTable 
          columns={columns} 
          data={orders} 
          searchKey="id" 
          searchPlaceholder="Search PO Number..."
        />
      </div>

      <SlideOver 
        open={isFormOpen} 
        onOpenChange={(val: boolean) => setIsFormOpen(val)} 
        title="Create Purchase Order"
      >
        <PurchaseOrderForm 
          tenantSlug={tenantSlug} 
          vendors={vendors}
          items={items}
          onSuccess={() => setIsFormOpen(false)} 
        />
      </SlideOver>
    </div>
  );
}
