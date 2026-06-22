"use client";

import { useState } from 'react';
import { Shield, Plus, Edit, Trash2, Check, ArrowRight } from 'lucide-react';
import { Button } from '@/packages/ui-kit/components/ui/button';
import { DataTable } from '@/packages/ui-kit/components/ui/data-table';
import { ColumnDef } from '@tanstack/react-table';
import { toast } from 'sonner';
import { SlideOver } from '@/packages/ui-kit/components/ui/SlideOver';
import { WorkflowForm } from './WorkflowForm';
import { deleteWorkflowAction } from '@/app/actions/workflows';

export function WorkflowsClient({ tenantSlug, workflows, roles }: { tenantSlug: string, workflows: any[], roles: any[] }) {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingWorkflow, setEditingWorkflow] = useState<any>(null);

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this workflow?')) return;
    try {
      await deleteWorkflowAction(tenantSlug, id);
      toast.success('Workflow deleted successfully');
    } catch (e: any) {
      toast.error(e.message || 'Failed to delete workflow');
    }
  };

  const handleEdit = (workflow: any) => {
    setEditingWorkflow(workflow);
    setIsFormOpen(true);
  };

  const columns: ColumnDef<any>[] = [
    {
      accessorKey: "name",
      header: "Workflow Name",
      cell: ({ row }) => (
        <div className="flex flex-col">
          <span className="font-semibold text-slate-900 dark:text-slate-100">{row.original.name}</span>
          <span className="text-xs text-slate-500">Module: {row.original.document_module}</span>
        </div>
      )
    },
    {
      accessorKey: "steps",
      header: "Approval Chain",
      cell: ({ row }) => {
        const steps = row.original.steps || [];
        if (steps.length === 0) return <span className="text-slate-500 italic text-sm">No tiers configured</span>;
        
        return (
          <div className="flex items-center gap-2 flex-wrap">
            {steps.map((step: any, index: number) => (
              <div key={step.id} className="flex items-center gap-2">
                <div className="px-2.5 py-1 bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-full text-xs font-medium text-slate-700 dark:text-slate-300">
                  {index + 1}. {step.roles?.name || 'Any Role'}
                </div>
                {index < steps.length - 1 && <ArrowRight className="w-3 h-3 text-slate-400" />}
              </div>
            ))}
          </div>
        );
      }
    },
    {
      accessorKey: "is_active",
      header: "Status",
      cell: ({ row }) => (
        row.original.is_active 
          ? <span className="px-2 py-1 text-xs rounded bg-primary/10 text-primary border border-primary/20 font-medium">Active</span>
          : <span className="px-2 py-1 text-xs rounded bg-slate-500/10 text-slate-500 border border-slate-500/20 font-medium">Disabled</span>
      )
    },
    {
      id: "actions",
      cell: ({ row }) => (
        <div className="flex items-center justify-end gap-2">
          <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-primary dark:hover:text-primary hover:bg-primary/10" onClick={() => handleEdit(row.original)}>
            <Edit className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8 text-rose-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10" onClick={() => handleDelete(row.original.id)}>
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      )
    }
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-500 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-[#11151C] border border-slate-200 dark:border-white/10 p-6 rounded-2xl shadow-sm dark:shadow-none">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Shield className="w-5 h-5 text-primary" />
            Approval Workflows
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Configure multi-tier document routing and authorization policies.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button onClick={() => { setEditingWorkflow(null); setIsFormOpen(true); }} className="bg-primary hover:opacity-90 text-primary-foreground rounded-full px-6 shadow-lg shadow-primary/20 shrink-0">
            <Plus className="w-4 h-4 mr-2" />
            Create Workflow
          </Button>
        </div>
      </div>

      <div className="mt-8">
        <DataTable 
          columns={columns} 
          data={workflows} 
          searchKey="name" 
          searchPlaceholder="Search workflows..."
        />
      </div>

      <SlideOver 
        open={isFormOpen} 
        onOpenChange={(val: boolean) => setIsFormOpen(val)} 
        title={editingWorkflow ? "Edit Workflow" : "Create Workflow"}
      >
        <WorkflowForm 
          tenantSlug={tenantSlug} 
          initialData={editingWorkflow} 
          roles={roles} 
          onSuccess={() => setIsFormOpen(false)} 
        />
      </SlideOver>
    </div>
  );
}
