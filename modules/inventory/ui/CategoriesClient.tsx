"use client";

import { useState } from 'react';
import { Layers, Plus, X, Edit, Trash2, ChevronRight, ChevronDown } from 'lucide-react';
import { Button } from '@/packages/ui-kit/components/ui/button';
import { Input } from '@/packages/ui-kit/components/ui/input';
import { toast } from 'sonner';
import { createCategoryAction, updateCategoryAction, deleteCategoryAction } from '@/app/actions/inventory-categories';

export function CategoriesClient({ tenantSlug, categories }: { tenantSlug: string, categories: any[] }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any | null>(null);

  // Build tree
  const categoryMap = new Map();
  categories.forEach(c => categoryMap.set(c.id, { ...c, children: [] }));
  
  const rootCategories: any[] = [];
  categories.forEach(c => {
    if (c.parent_id && categoryMap.has(c.parent_id)) {
      categoryMap.get(c.parent_id).children.push(categoryMap.get(c.id));
    } else {
      rootCategories.push(categoryMap.get(c.id));
    }
  });

  const handleOpenNew = () => {
    setEditingItem(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: any) => {
    setEditingItem(item);
    setIsModalOpen(true);
  };

  const handleDelete = async (item: any) => {
    if (item.children?.length > 0) {
      toast.error('Cannot delete category with sub-categories');
      return;
    }
    if (!confirm('Are you sure you want to delete this category?')) return;
    try {
      await deleteCategoryAction(tenantSlug, item.id);
      toast.success('Category deleted successfully');
    } catch (e: any) {
      toast.error(e.message || 'Failed to delete category');
    }
  };

  const renderCategoryNode = (node: any, level = 0) => {
    return (
      <div key={node.id} className="flex flex-col">
        <div 
          className="flex items-center justify-between py-3 px-4 hover:bg-slate-50 dark:hover:bg-white/[0.02] border-b border-slate-100 dark:border-white/5 transition-colors group"
          style={{ paddingLeft: `${(level * 2) + 1}rem` }}
        >
          <div className="flex items-center gap-3">
            {node.children.length > 0 ? (
               <ChevronDown className="w-4 h-4 text-slate-400" />
            ) : (
               <div className="w-4" />
            )}
            <span className="text-sm font-medium text-slate-900 dark:text-slate-200">{node.name}</span>
          </div>
          
          <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-slate-900 dark:hover:text-white" onClick={() => handleOpenEdit(node)}>
              <Edit className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-rose-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10" onClick={() => handleDelete(node)}>
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
        {node.children.length > 0 && (
          <div className="flex flex-col">
            {node.children.map((child: any) => renderCategoryNode(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 max-w-5xl mx-auto p-4 sm:p-6 lg:p-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-[#11151C] border border-slate-200 dark:border-white/10 p-6 rounded-2xl shadow-sm dark:shadow-none">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Layers className="w-6 h-6 text-emerald-500" />
            Item Categories
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Organize your items into a hierarchy for reporting and filtering.</p>
        </div>
        <Button onClick={handleOpenNew} className="bg-emerald-500 hover:bg-emerald-600 text-white rounded-full px-6 shadow-lg shadow-emerald-500/20">
          <Plus className="w-4 h-4 mr-2" />
          Add Category
        </Button>
      </div>

      <div className="bg-white dark:bg-[#11151C] border border-slate-200 dark:border-white/5 rounded-2xl overflow-hidden shadow-sm dark:shadow-2xl">
        <div className="bg-slate-50 dark:bg-white/[0.02] border-b border-slate-200 dark:border-white/5 px-6 py-4">
          <h3 className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Category Hierarchy</h3>
        </div>
        <div className="flex flex-col">
          {rootCategories.length > 0 ? (
            rootCategories.map(root => renderCategoryNode(root, 0))
          ) : (
            <div className="px-6 py-8 text-center text-slate-500 text-sm">No categories found. Start by creating one.</div>
          )}
        </div>
      </div>

      <CategoryModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        tenantSlug={tenantSlug} 
        initialData={editingItem} 
        categories={categories}
      />
    </div>
  );
}

function CategoryModal({ isOpen, onClose, tenantSlug, initialData, categories }: { isOpen: boolean, onClose: () => void, tenantSlug: string, initialData: any, categories: any[] }) {
  const [isPending, setIsPending] = useState(false);

  if (!isOpen) return null;

  // Filter out self and descendants to prevent circular loops in parent assignment
  const isDescendant = (catId: string, potentialParentId: string): boolean => {
    if (catId === potentialParentId) return true;
    const parent = categories.find(c => c.id === potentialParentId);
    if (!parent || !parent.parent_id) return false;
    return isDescendant(catId, parent.parent_id);
  };

  const validParents = categories.filter(c => {
    if (!initialData) return true;
    return !isDescendant(initialData.id, c.id);
  });

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsPending(true);
    try {
      const formData = new FormData(e.currentTarget);
      if (initialData) {
        await updateCategoryAction(tenantSlug, initialData.id, formData);
        toast.success('Category updated');
      } else {
        await createCategoryAction(tenantSlug, formData);
        toast.success('Category created');
      }
      onClose();
    } catch (err: any) {
      toast.error(err.message || 'An error occurred');
    } finally {
      setIsPending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 lg:items-stretch lg:justify-end lg:p-0">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white dark:bg-[#0B0E14] border border-slate-200 dark:border-white/10 rounded-2xl lg:rounded-none lg:border-l lg:border-y-0 lg:border-r-0 w-full max-w-md shadow-2xl animate-in zoom-in-95 lg:slide-in-from-right-full lg:zoom-in-100 duration-200 flex flex-col h-auto lg:h-full max-h-[90vh] lg:max-h-none overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-white/10 shrink-0">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-2">
            {initialData ? 'Edit Category' : 'Add Category'}
          </h3>
          <button type="button" onClick={onClose} className="text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4 flex-1 overflow-y-auto">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Name *</label>
            <Input name="name" defaultValue={initialData?.name} required placeholder="e.g. Electronics" className="premium-input w-full" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Parent Category</label>
            <select 
              name="parent_id" 
              defaultValue={initialData?.parent_id || ''} 
              className="premium-input w-full bg-white dark:bg-[#0B0E14]"
            >
              <option value="">-- None (Top Level) --</option>
              {validParents.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>

          <div className="pt-4 flex justify-end gap-3">
            <Button type="button" variant="ghost" onClick={onClose} className="text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white">Cancel</Button>
            <Button type="submit" disabled={isPending} className="bg-emerald-500 hover:bg-emerald-600 text-white">{isPending ? 'Saving...' : 'Save Category'}</Button>
          </div>
        </form>
      </div>
    </div>
  );
}
