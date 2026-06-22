"use client";

import { useState } from 'react';
import { Button } from '@/packages/ui-kit/components/ui/button';
import { Input } from '@/packages/ui-kit/components/ui/input';
import { Loader2, Plus, Trash2, GripVertical, Check } from 'lucide-react';
import { toast } from 'sonner';
import { saveWorkflowAction } from '@/app/actions/workflows';
import { cn } from '@/lib/utils';

export function WorkflowForm({ 
  tenantSlug, 
  initialData, 
  roles,
  onSuccess 
}: { 
  tenantSlug: string, 
  initialData?: any,
  roles: any[],
  onSuccess: () => void 
}) {
  const [isPending, setIsPending] = useState(false);
  
  // Transform initial steps to local state
  const [steps, setSteps] = useState(
    initialData?.steps 
      ? initialData.steps.map((s: any) => ({ id: Math.random().toString(), role_id: s.role_id || '' }))
      : [{ id: Math.random().toString(), role_id: '' }]
  );

  const addStep = () => {
    setSteps([...steps, { id: Math.random().toString(), role_id: '' }]);
  };

  const removeStep = (id: string) => {
    setSteps(steps.filter((s: any) => s.id !== id));
  };

  const updateStepRole = (id: string, role_id: string) => {
    setSteps(steps.map((s: any) => s.id === id ? { ...s, role_id } : s));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsPending(true);

    try {
      const formData = new FormData(e.currentTarget);
      
      const payload = {
        name: formData.get('name'),
        document_module: formData.get('document_module'),
        is_active: formData.get('is_active') === 'on',
        steps: steps.map((s: any) => ({ role_id: s.role_id || null }))
      };

      await saveWorkflowAction(tenantSlug, initialData?.id || null, payload);
      
      toast.success(initialData ? 'Workflow updated successfully' : 'Workflow created successfully');
      onSuccess();
    } catch (err: any) {
      toast.error(err.message || 'Failed to save workflow');
    } finally {
      setIsPending(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-6 flex flex-col h-[calc(100vh-80px)]">
      <div className="flex-1 overflow-y-auto space-y-6 custom-scrollbar pb-10">
        
        {/* Basic Info */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Workflow Name *</label>
            <Input name="name" defaultValue={initialData?.name} required placeholder="e.g. Standard Purchase Approval" className="premium-input w-full focus:ring-primary" />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Document Module *</label>
            <select name="document_module" defaultValue={initialData?.document_module || ''} required className="premium-input w-full bg-white dark:bg-[#0B0E14] focus:ring-primary">
              <option value="">Select Document Type...</option>
              <option value="PURCHASE_ORDER">Purchase Order</option>
              <option value="SALES_ORDER">Sales Order</option>
              <option value="INVENTORY_ADJUSTMENT">Inventory Adjustment</option>
              <option value="JOURNAL_ENTRY">Journal Entry</option>
            </select>
          </div>

          <label className="flex items-center gap-3 p-4 rounded-xl border bg-slate-50 border-slate-200 dark:bg-white/5 dark:border-white/10 cursor-pointer hover:border-primary/50 transition-colors">
            <input type="checkbox" name="is_active" defaultChecked={initialData ? initialData.is_active : true} className="w-5 h-5 rounded text-primary border-slate-300 dark:border-slate-600 focus:ring-primary" />
            <div className="text-sm">
              <span className="text-slate-900 dark:text-white font-semibold block">Active Workflow</span>
              <span className="text-slate-500 text-xs">Enable this workflow to route documents automatically.</span>
            </div>
          </label>
        </div>

        <hr className="border-slate-200 dark:border-white/10" />

        {/* Approval Tiers Builder */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Approval Tiers</h3>
              <p className="text-xs text-slate-500">Documents will require approval sequentially from top to bottom.</p>
            </div>
            <Button type="button" variant="outline" size="sm" onClick={addStep} className="h-8 text-xs border-primary text-primary hover:bg-primary/10">
              <Plus className="w-3 h-3 mr-1" /> Add Tier
            </Button>
          </div>

          <div className="space-y-3">
            {steps.map((step: any, index: number) => (
              <div key={step.id} className="flex items-center gap-3 p-3 bg-white dark:bg-[#0B0E14] border border-slate-200 dark:border-white/10 rounded-xl group relative">
                <div className="flex items-center justify-center w-6 h-6 rounded-full bg-slate-100 dark:bg-white/10 text-xs font-bold text-slate-500 shrink-0">
                  {index + 1}
                </div>
                
                <div className="flex-1">
                  <select 
                    value={step.role_id}
                    onChange={(e) => updateStepRole(step.id, e.target.value)}
                    className="w-full bg-transparent border-none text-sm focus:ring-0 text-slate-900 dark:text-white p-0"
                  >
                    <option value="">Any Role (Auto-approve or general access)</option>
                    {roles.map(r => (
                      <option key={r.id} value={r.id}>{r.name} Role</option>
                    ))}
                  </select>
                </div>

                <Button 
                  type="button" 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => removeStep(step.id)}
                  disabled={steps.length === 1}
                  className="h-8 w-8 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>

      </div>

      <div className="pt-4 border-t border-slate-200 dark:border-white/10 flex justify-end gap-3 mt-auto bg-white dark:bg-[#11151C]">
        <Button type="button" variant="ghost" onClick={onSuccess}>Cancel</Button>
        <Button type="submit" disabled={isPending} className="bg-primary hover:opacity-90 text-primary-foreground min-w-[120px] shadow-lg shadow-primary/20">
          {isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Check className="w-4 h-4 mr-2" />}
          {initialData ? 'Save Changes' : 'Create Workflow'}
        </Button>
      </div>
    </form>
  );
}
