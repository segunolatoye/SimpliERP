"use client";

import { Box, Plus, Edit, Trash2 } from 'lucide-react';
import { Button } from '@/packages/ui-kit/components/ui/button';
import { DataTable } from '@/packages/ui-kit/components/ui/data-table';
import { ColumnDef } from '@tanstack/react-table';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { deleteItemAction, bulkImportItemsAction } from '@/app/actions/inventory-items';
import { useRef, useState } from 'react';

export function ItemsClient({ tenantSlug, items }: { tenantSlug: string, items: any[] }) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isImporting, setIsImporting] = useState(false);

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this item?')) return;
    try {
      await deleteItemAction(tenantSlug, id);
      toast.success('Item deleted successfully');
    } catch (e: any) {
      toast.error(e.message || 'Failed to delete item');
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    try {
      const text = await file.text();
      const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
      if (lines.length <= 1) throw new Error("CSV is empty or missing data rows");

      const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
      const skuIdx = headers.indexOf('sku');
      const nameIdx = headers.indexOf('name');
      const typeIdx = headers.indexOf('type');
      const priceIdx = headers.indexOf('selling price');

      if (skuIdx === -1 || nameIdx === -1) {
        throw new Error("CSV must contain 'SKU' and 'Name' columns");
      }

      const newItems = lines.slice(1).map(line => {
        // Simple CSV parse handling quotes naively (not robust for commas inside quotes, but fine for basic demo)
        const parts = line.split(',');
        return {
          sku: parts[skuIdx]?.replace(/['"]/g, '').trim(),
          name: parts[nameIdx]?.replace(/['"]/g, '').trim(),
          type: typeIdx > -1 ? parts[typeIdx]?.replace(/['"]/g, '').trim() : 'Goods',
          selling_price: priceIdx > -1 ? parts[priceIdx]?.replace(/['"]/g, '').trim() : 0,
        };
      });

      await bulkImportItemsAction(tenantSlug, newItems);
      toast.success(`Successfully imported ${newItems.length} items`);
    } catch (err: any) {
      toast.error(err.message || 'Failed to import CSV');
    } finally {
      setIsImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleExport = (selectedRows: any[]) => {
    // Generate CSV from selected rows
    const dataToExport = selectedRows.length > 0 ? selectedRows : items;
    
    const headers = ['SKU', 'Name', 'Category', 'Type', 'Selling Price', 'Status'];
    const csvContent = [
      headers.join(','),
      ...dataToExport.map(item => [
        `"${item.sku}"`,
        `"${item.name}"`,
        `"${item.item_categories?.name || ''}"`,
        `"${item.type}"`,
        item.selling_price,
        `"${item.status}"`
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.setAttribute("download", "items_export.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const columns: ColumnDef<any>[] = [
    {
      id: "select",
      header: ({ table }) => (
        <input
          type="checkbox"
          className="w-4 h-4 rounded text-primary bg-slate-100 border-slate-300 dark:bg-[#0B0E14] dark:border-slate-700 focus:ring-primary"
          checked={table.getIsAllPageRowsSelected()}
          onChange={table.getToggleAllPageRowsSelectedHandler()}
        />
      ),
      cell: ({ row }) => (
        <input
          type="checkbox"
          className="w-4 h-4 rounded text-primary bg-slate-100 border-slate-300 dark:bg-[#0B0E14] dark:border-slate-700 focus:ring-primary"
          checked={row.getIsSelected()}
          onChange={row.getToggleSelectedHandler()}
        />
      ),
      enableSorting: false,
      enableHiding: false,
    },
    {
      accessorKey: "name",
      header: "Item Details",
      cell: ({ row }) => {
        const item = row.original;
        return (
          <div className="flex flex-col cursor-pointer hover:text-primary transition-colors" onClick={() => router.push(`/${tenantSlug}/inventory/items/${item.id}`)}>
            <span className="font-medium text-slate-900 dark:text-slate-200 hover:text-primary">{item.name}</span>
            <span className="text-xs text-slate-500">SKU: {item.sku}</span>
          </div>
        );
      },
    },
    {
      accessorKey: "item_categories.name",
      header: "Category",
      cell: ({ row }) => {
        const item = row.original;
        return <span className="text-slate-600 dark:text-slate-300">{item.item_categories?.name || '-'}</span>;
      },
    },
    {
      accessorKey: "type",
      header: "Type",
    },
    {
      accessorKey: "selling_price",
      header: "Selling Price",
      cell: ({ row }) => {
        const price = parseFloat(row.getValue("selling_price"));
        return <div className="font-medium text-slate-900 dark:text-white">{price > 0 ? price.toLocaleString() : '-'}</div>;
      },
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const status = row.getValue("status") as string;
        if (status === 'Active') {
          return <span className="px-2 py-1 text-xs rounded bg-primary/10 text-primary border border-primary/20 font-medium">Active</span>;
        }
        return <span className="px-2 py-1 text-xs rounded bg-slate-500/10 text-slate-500 border border-slate-500/20 font-medium">{status}</span>;
      },
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const item = row.original;
        return (
          <div className="flex items-center justify-end gap-2">
            <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-primary dark:hover:text-primary hover:bg-primary/10" onClick={() => router.push(`/${tenantSlug}/inventory/items/${item.id}`)}>
              <Edit className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-rose-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10" onClick={() => handleDelete(item.id)}>
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        );
      },
    },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-500 max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-[#11151C] border border-slate-200 dark:border-white/10 p-6 rounded-2xl shadow-sm dark:shadow-none">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Box className="w-6 h-6 text-primary" />
            Items Catalog
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Manage your products, services, and inventory items.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button onClick={() => router.push(`/${tenantSlug}/inventory/items/new`)} className="bg-primary hover:opacity-90 text-primary-foreground rounded-full px-6 shadow-lg shadow-primary/20 shrink-0">
            <Plus className="w-4 h-4 mr-2" />
            Add Item
          </Button>
        </div>
      </div>

      <div className="mt-8">
        <DataTable 
          columns={columns} 
          data={items} 
          searchKey="name" 
          searchPlaceholder="Search products by name..."
          onExport={handleExport}
          onImport={() => fileInputRef.current?.click()}
        />
        <input 
          type="file" 
          accept=".csv" 
          className="hidden" 
          ref={fileInputRef} 
          onChange={handleFileUpload} 
        />
      </div>
    </div>
  );
}
