"use client";

import { useState } from 'react';
import { FileEdit, Plus } from 'lucide-react';
import { Button } from '@/packages/ui-kit/components/ui/button';
import { DataTable } from '@/packages/ui-kit/components/ui/data-table';
import { ColumnDef } from '@tanstack/react-table';
import { SlideOver } from '@/packages/ui-kit/components/ui/SlideOver';
import { JournalEntryForm } from './JournalEntryForm';
import { formatMoney } from '@/lib/utils/money';

export function JournalEntriesClient({ tenantSlug, entries, accounts }: { tenantSlug: string, entries: any[], accounts: any[] }) {
  const [isFormOpen, setIsFormOpen] = useState(false);

  const columns: ColumnDef<any>[] = [
    {
      accessorKey: "date",
      header: "Date",
      cell: ({ row }) => new Date(row.original.date).toLocaleDateString()
    },
    {
      accessorKey: "reference",
      header: "Reference",
      cell: ({ row }) => <span className="font-medium text-slate-900 dark:text-slate-100">{row.original.reference || '-'}</span>
    },
    {
      accessorKey: "description",
      header: "Description",
      cell: ({ row }) => <span className="text-slate-600 dark:text-slate-400">{row.original.description}</span>
    },
    {
      accessorKey: "journal_lines",
      header: "Total Amount",
      cell: ({ row }) => {
        const lines = row.original.journal_lines || [];
        const totalDebit = lines.reduce((sum: number, l: any) => sum + (l.debit || 0), 0);
        return <span className="font-semibold text-slate-900 dark:text-white">{formatMoney(totalDebit, 'USD')}</span>;
      }
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => (
        <span className="px-2 py-1 text-xs rounded bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 font-medium capitalize">
          {row.original.status}
        </span>
      )
    }
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-500 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-[#11151C] border border-slate-200 dark:border-white/10 p-6 rounded-2xl shadow-sm dark:shadow-none">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <FileEdit className="w-5 h-5 text-primary" />
            Journal Entries
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Directly post double-entry transactions to the General Ledger.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button onClick={() => setIsFormOpen(true)} className="bg-primary hover:opacity-90 text-primary-foreground rounded-full px-6 shadow-lg shadow-primary/20 shrink-0">
            <Plus className="w-4 h-4 mr-2" />
            Post Journal
          </Button>
        </div>
      </div>

      <div className="mt-8">
        <DataTable 
          columns={columns} 
          data={entries} 
          searchKey="description" 
          searchPlaceholder="Search by description..."
        />
      </div>

      <SlideOver 
        open={isFormOpen} 
        onOpenChange={(val: boolean) => setIsFormOpen(val)} 
        title="Post Journal Entry"
      >
        <JournalEntryForm 
          tenantSlug={tenantSlug} 
          accounts={accounts}
          onSuccess={() => setIsFormOpen(false)} 
        />
      </SlideOver>
    </div>
  );
}
