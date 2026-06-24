"use client";

import { useState } from 'react';
import { Package, Plus } from 'lucide-react';
import { Button } from '@/packages/ui-kit/components/ui/button';
import { DataTable } from '@/packages/ui-kit/components/ui/data-table';
import { ColumnDef } from '@tanstack/react-table';
import { SlideOver } from '@/packages/ui-kit/components/ui/SlideOver';
import { DeliveryNoteForm } from './DeliveryNoteForm';

export function DeliveryNotesClient({ tenantSlug, deliveries, salesOrders, locations, items }: { tenantSlug: string, deliveries: any[], salesOrders: any[], locations: any[], items: any[] }) {
  const [isFormOpen, setIsFormOpen] = useState(false);

  const columns: ColumnDef<any>[] = [
    {
      accessorKey: "id",
      header: "DN No.",
      cell: ({ row }) => <span className="font-bold text-primary">{row.original.id.substring(0,8).toUpperCase()}</span>
    },
    {
      accessorKey: "so_id",
      header: "Sales Order",
    },
    {
      accessorKey: "locations.name",
      header: "Warehouse",
      cell: ({ row }) => <span className="font-medium">{row.original.locations?.name || '-'}</span>
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const color = row.original.status === 'shipped' ? 'bg-emerald-100 text-emerald-600 border-emerald-200' : 'bg-slate-100 text-slate-600 border-slate-200';
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
            <Package className="w-5 h-5 text-primary" />
            Delivery Notes
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Manage outbound shipments against Sales Orders.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button onClick={() => setIsFormOpen(true)} className="bg-primary hover:opacity-90 text-primary-foreground rounded-full px-6 shadow-lg shadow-primary/20 shrink-0">
            <Plus className="w-4 h-4 mr-2" />
            New Delivery
          </Button>
        </div>
      </div>

      <div className="mt-8">
        <DataTable 
          columns={columns} 
          data={deliveries} 
          searchKey="id" 
          searchPlaceholder="Search DN No..."
        />
      </div>

      <SlideOver 
        open={isFormOpen} 
        onOpenChange={(val: boolean) => setIsFormOpen(val)} 
        title="Create Delivery Note"
      >
        <DeliveryNoteForm 
          tenantSlug={tenantSlug} 
          salesOrders={salesOrders}
          locations={locations}
          items={items}
          onSuccess={() => setIsFormOpen(false)} 
        />
      </SlideOver>
    </div>
  );
}
