"use client";

import { useState } from 'react';
import { DataTable } from '@/packages/ui-kit/components/ui/data-table';
import { ColumnDef } from '@tanstack/react-table';
import { toast } from 'sonner';
import { actionApprovalStepAction } from '@/app/actions/approvals';
import { Button } from '@/packages/ui-kit/components/ui/button';
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { SlideOver } from '@/packages/ui-kit/components/ui/SlideOver';

export function ApprovalsClient({ tenantSlug, initialRequests }: { tenantSlug: string, initialRequests: any[] }) {
  const [requests, setRequests] = useState(initialRequests);
  const [actioningStep, setActioningStep] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [actionType, setActionType] = useState<'APPROVED' | 'REJECTED' | null>(null);
  const [comments, setComments] = useState('');

  const openActionModal = (request: any, type: 'APPROVED' | 'REJECTED') => {
    setSelectedRequest(request);
    setActionType(type);
    setComments('');
    setIsModalOpen(true);
  };

  const handleAction = async () => {
    if (!selectedRequest || !actionType) return;
    
    // Find the active pending step for this user
    const activeStep = selectedRequest.steps.find((s: any) => s.status === 'PENDING');
    if (!activeStep) return;

    setActioningStep(selectedRequest.id);
    try {
      await actionApprovalStepAction(tenantSlug, selectedRequest.id, activeStep.id, actionType, comments);
      toast.success(`Document ${actionType.toLowerCase()} successfully`);
      
      // Optimistically remove from inbox
      setRequests(requests.filter(r => r.id !== selectedRequest.id));
      setIsModalOpen(false);
    } catch (err: any) {
      toast.error(err.message || 'Failed to process approval action');
    } finally {
      setActioningStep(null);
    }
  };

  const columns: ColumnDef<any>[] = [
    {
      accessorKey: "document_module",
      header: "Document Type",
      cell: ({ row }) => (
        <span className="font-semibold text-slate-900 dark:text-slate-100 uppercase text-xs tracking-wider">
          {row.original.document_module.replace('_', ' ')}
        </span>
      )
    },
    {
      accessorKey: "document_id",
      header: "Reference ID",
      cell: ({ row }) => (
        <span className="text-primary font-medium">{row.original.document_id}</span>
      )
    },
    {
      accessorKey: "workflows",
      header: "Workflow Rule",
      cell: ({ row }) => (
        <span className="text-slate-600 dark:text-slate-400 text-sm">{row.original.workflows.name}</span>
      )
    },
    {
      accessorKey: "users",
      header: "Requested By",
      cell: ({ row }) => {
        const u = row.original.users;
        return <span className="text-sm">{u.first_name} {u.last_name} ({u.email})</span>;
      }
    },
    {
      id: "actions",
      header: "Action",
      cell: ({ row }) => {
        const isProcessing = actioningStep === row.original.id;
        return (
          <div className="flex items-center gap-2 justify-end">
            <Button 
              size="sm" 
              onClick={() => openActionModal(row.original, 'APPROVED')}
              disabled={isProcessing}
              className="bg-emerald-500 hover:bg-emerald-600 text-white shadow-emerald-500/20 shadow-lg px-4"
            >
              {isProcessing && actionType === 'APPROVED' ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <CheckCircle2 className="w-4 h-4 mr-1" />}
              Approve
            </Button>
            <Button 
              size="sm" 
              onClick={() => openActionModal(row.original, 'REJECTED')}
              disabled={isProcessing}
              variant="outline"
              className="border-rose-200 text-rose-600 hover:bg-rose-50 dark:border-rose-500/30 dark:hover:bg-rose-500/10"
            >
              {isProcessing && actionType === 'REJECTED' ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <XCircle className="w-4 h-4 mr-1" />}
              Reject
            </Button>
          </div>
        )
      }
    }
  ];

  if (requests.length === 0) {
    return (
      <div className="p-12 text-center bg-white dark:bg-[#11151C] border border-slate-200 dark:border-white/10 rounded-2xl">
        <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-4 opacity-50" />
        <h3 className="text-lg font-bold text-slate-900 dark:text-white">All caught up!</h3>
        <p className="text-slate-500 mt-2">You have no pending documents requiring your approval.</p>
      </div>
    );
  }

  return (
    <>
      <div className="bg-white dark:bg-[#11151C] border border-slate-200 dark:border-white/10 rounded-2xl overflow-hidden shadow-sm dark:shadow-none">
        <DataTable 
          columns={columns} 
          data={requests} 
          searchKey="document_id" 
          searchPlaceholder="Search by Reference ID..."
        />
      </div>

      <SlideOver 
        open={isModalOpen} 
        onOpenChange={(val: boolean) => setIsModalOpen(val)} 
        title={actionType === 'APPROVED' ? "Approve Document" : "Reject Document"}
      >
        <div className="p-6 flex flex-col h-[calc(100vh-80px)]">
          <div className="flex-1 space-y-6">
            <div className="bg-slate-50 dark:bg-white/5 p-4 rounded-xl border border-slate-200 dark:border-white/10">
              <p className="text-sm text-slate-500">Document Type</p>
              <p className="font-semibold text-slate-900 dark:text-white">{selectedRequest?.document_module}</p>
              <p className="text-sm text-slate-500 mt-3">Reference ID</p>
              <p className="font-semibold text-primary">{selectedRequest?.document_id}</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Optional Comments</label>
              <textarea 
                value={comments}
                onChange={(e) => setComments(e.target.value)}
                rows={4}
                placeholder="Leave a note..."
                className="w-full premium-input focus:ring-primary rounded-xl"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-slate-200 dark:border-white/10 flex justify-end gap-3 mt-auto">
            <Button variant="ghost" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button 
              onClick={handleAction} 
              disabled={!!actioningStep} 
              className={actionType === 'APPROVED' ? "bg-emerald-500 hover:bg-emerald-600 text-white" : "bg-rose-500 hover:bg-rose-600 text-white"}
            >
              {actioningStep ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Confirm {actionType === 'APPROVED' ? "Approval" : "Rejection"}
            </Button>
          </div>
        </div>
      </SlideOver>
    </>
  );
}
