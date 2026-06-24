"use client";

import { useState } from 'react';
import { Receipt, Plus, MoreHorizontal, FileText } from 'lucide-react';
import { Button } from '@/packages/ui-kit/components/ui/button';
import { DataTable } from '@/packages/ui-kit/components/ui/data-table';
import { ColumnDef } from '@tanstack/react-table';
import { SlideOver } from '@/packages/ui-kit/components/ui/SlideOver';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/packages/ui-kit/components/ui/dropdown-menu';
import { VendorBillForm } from './VendorBillForm';
import { formatMoney } from '@/lib/utils/money';

export function VendorBillsClient({ tenantSlug, bills, vendors, purchaseOrders, items }: { tenantSlug: string, bills: any[], vendors: any[], purchaseOrders: any[], items: any[] }) {
  const [isFormOpen, setIsFormOpen] = useState(false);

  const columns: ColumnDef<any>[] = [
    {
      accessorKey: "id",
      header: "Bill No.",
      cell: ({ row }) => <span className="font-bold text-primary">{row.original.id.substring(0,8).toUpperCase()}</span>
    },
    {
      accessorKey: "invoice_no",
      header: "Vendor Invoice",
    },
    {
      accessorKey: "vendors.name",
      header: "Vendor",
      cell: ({ row }) => <span className="font-medium">{row.original.vendors?.name || '-'}</span>
    },
    {
      accessorKey: "po_id",
      header: "Purchase Order",
      cell: ({ row }) => row.original.po_id || '-'
    },
    {
      accessorKey: "total_amount",
      header: "Total",
      cell: ({ row }) => <span className="font-semibold">{formatMoney(row.original.total_amount, 'NGN')}</span>
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const statusColors: any = {
          'draft': 'bg-slate-100 text-slate-600 border-slate-200',
          'posted': 'bg-emerald-100 text-emerald-600 border-emerald-200',
          'paid': 'bg-purple-100 text-purple-600 border-purple-200',
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
            <Receipt className="w-5 h-5 text-primary" />
            Vendor Bills
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Manage vendor invoices and post bills based on Purchase Orders and GRNs.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button onClick={() => setIsFormOpen(true)} className="bg-primary hover:opacity-90 text-primary-foreground rounded-full px-6 shadow-lg shadow-primary/20 shrink-0">
            <Plus className="w-4 h-4 mr-2" />
            New Bill
          </Button>
        </div>
      </div>

      <div className="mt-8">
        <DataTable 
          columns={columns} 
          data={bills} 
          searchKey="id" 
          searchPlaceholder="Search Bill ID..."
        />
      </div>

      <SlideOver 
        open={isFormOpen} 
        onOpenChange={(val: boolean) => setIsFormOpen(val)} 
        title="Create Vendor Bill"
      >
        <VendorBillForm 
          tenantSlug={tenantSlug} 
          vendors={vendors}
          purchaseOrders={purchaseOrders}
          items={items}
          onSuccess={() => setIsFormOpen(false)} 
        />
      </SlideOver>
    </div>
  );
}
