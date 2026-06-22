"use client";

import { useState } from 'react';
import { MapPin, Plus, X, Edit, Trash2, Building2, Store, Factory } from 'lucide-react';
import { Button } from '@/packages/ui-kit/components/ui/button';
import { Input } from '@/packages/ui-kit/components/ui/input';
import { toast } from 'sonner';
import { createLocationAction, updateLocationAction, deleteLocationAction } from '@/app/actions/settings-locations';

export function LocationsClient({ tenantSlug, locations, members }: { tenantSlug: string, locations: any[], members: any[] }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any | null>(null);

  const handleOpenNew = () => {
    setEditingItem(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: any) => {
    setEditingItem(item);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this location?')) return;
    try {
      await deleteLocationAction(tenantSlug, id);
      toast.success('Location deleted successfully');
    } catch (e: any) {
      toast.error(e.message || 'Failed to delete location');
    }
  };

  // Helper to render tree visually or flatly
  // Since we want to support both, we can group them by parent
  const rootLocations = locations.filter(l => !l.parent_id);
  
  const LocationRow = ({ location, level = 0 }: { location: any, level?: number }) => {
    const children = locations.filter(l => l.parent_id === location.id);
    
    const icon = location.is_headquarters ? <Building2 className="w-4 h-4 text-emerald-500" /> 
                 : location.location_type === 'warehouse' ? <Factory className="w-4 h-4 text-amber-500" />
                 : <Store className="w-4 h-4 text-blue-500" />;

    return (
      <>
        <tr className="hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors group border-b border-slate-100 dark:border-white/5">
          <td className="px-6 py-4 whitespace-nowrap">
            <div className="flex items-center gap-3" style={{ paddingLeft: `${level * 24}px` }}>
              {level > 0 && <span className="text-slate-300 dark:text-slate-600">└</span>}
              <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-white/5 flex items-center justify-center">
                {icon}
              </div>
              <div>
                <div className="text-sm font-medium text-slate-900 dark:text-slate-200">
                  {location.name}
                  {location.is_headquarters && <span className="ml-2 px-2 py-0.5 text-[10px] rounded bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 uppercase">HQ</span>}
                </div>
                {location.address && <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate max-w-[200px]">{location.address}</div>}
              </div>
            </div>
          </td>
          <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 dark:text-slate-300 capitalize">
            {location.location_type}
          </td>
          <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 dark:text-slate-300">
            {location.users?.email || '-'}
          </td>
          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
            <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-slate-900 dark:hover:text-white" onClick={() => handleOpenEdit(location)}>
                <Edit className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-rose-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10" onClick={() => handleDelete(location.id)}>
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </td>
        </tr>
        {children.map(child => (
          <LocationRow key={child.id} location={child} level={level + 1} />
        ))}
      </>
    );
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 p-6 rounded-2xl backdrop-blur-md shadow-sm dark:shadow-none">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <MapPin className="w-5 h-5 text-emerald-500" />
            Locations & Warehouses
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Manage hierarchical stores, warehouses, and branches.</p>
        </div>
        <Button onClick={handleOpenNew} className="bg-emerald-500 hover:bg-emerald-600 text-white rounded-full px-6 shadow-lg shadow-emerald-500/20">
          <Plus className="w-4 h-4 mr-2" />
          Add Location
        </Button>
      </div>

      <div className="bg-white dark:bg-[#11151C] border border-slate-200 dark:border-white/5 rounded-2xl overflow-hidden shadow-sm dark:shadow-2xl">
        <table className="min-w-full">
          <thead className="bg-slate-50 dark:bg-white/[0.02] border-b border-slate-200 dark:border-white/5">
            <tr>
              <th className="px-6 py-4 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Location</th>
              <th className="px-6 py-4 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Type</th>
              <th className="px-6 py-4 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Primary Contact</th>
              <th className="px-6 py-4 text-right text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rootLocations.length > 0 ? rootLocations.map(location => (
              <LocationRow key={location.id} location={location} />
            )) : (
              <tr>
                <td colSpan={4} className="px-6 py-8 text-center text-slate-500 text-sm">No locations found. Add your first headquarters or warehouse.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <LocationModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        tenantSlug={tenantSlug} 
        initialData={editingItem}
        locations={locations}
        members={members}
      />
    </div>
  );
}

function LocationModal({ isOpen, onClose, tenantSlug, initialData, locations, members }: { isOpen: boolean, onClose: () => void, tenantSlug: string, initialData: any, locations: any[], members: any[] }) {
  const [isPending, setIsPending] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsPending(true);
    try {
      const formData = new FormData(e.currentTarget);
      if (initialData) {
        await updateLocationAction(tenantSlug, initialData.id, formData);
        toast.success('Location updated');
      } else {
        await createLocationAction(tenantSlug, formData);
        toast.success('Location created');
      }
      onClose();
    } catch (err: any) {
      toast.error(err.message || 'An error occurred');
    } finally {
      setIsPending(false);
    }
  };

  // Prevent a location from selecting itself or its children as parent
  // For simplicity here, we just prevent selecting itself.
  const validParents = locations.filter(l => l.id !== initialData?.id);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 lg:items-stretch lg:justify-end lg:p-0">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white dark:bg-[#0B0E14] border border-slate-200 dark:border-white/10 rounded-2xl lg:rounded-none lg:border-l lg:border-y-0 lg:border-r-0 w-full max-w-lg shadow-2xl animate-in zoom-in-95 lg:slide-in-from-right-full lg:zoom-in-100 duration-200 overflow-hidden flex flex-col max-h-[90vh] lg:h-full lg:max-h-none">
        <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-white/10 shrink-0">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">{initialData ? 'Edit Location' : 'Add Location'}</h3>
          <button type="button" onClick={onClose} className="text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="overflow-y-auto p-6">
          <form id="location-form" onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Location Name</label>
              <Input name="name" defaultValue={initialData?.name} required placeholder="Main Warehouse" className="premium-input w-full" />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Parent Location (Optional Tree Hierarchy)</label>
              <select name="parent_id" defaultValue={initialData?.parent_id || ""} className="premium-input w-full bg-white dark:bg-[#0B0E14]">
                <option value="">None (Top Level)</option>
                {validParents.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Type</label>
                <select name="location_type" defaultValue={initialData?.location_type || "business"} className="premium-input w-full bg-white dark:bg-[#0B0E14]">
                  <option value="business">Business / Office</option>
                  <option value="warehouse">Warehouse</option>
                  <option value="store">Store / Retail</option>
                  <option value="bin">Bin / Shelf</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Primary Contact</label>
                <select name="primary_contact_id" defaultValue={initialData?.primary_contact_id || ""} className="premium-input w-full bg-white dark:bg-[#0B0E14]">
                  <option value="">None</option>
                  {members.map(m => (
                    <option key={m.user_id} value={m.user_id}>{m.users.email}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Address</label>
              <Input name="address" defaultValue={initialData?.address} placeholder="123 Storage Lane" className="premium-input w-full" />
            </div>

            <label className="flex items-center gap-3 p-3 rounded-lg border bg-slate-50 border-slate-200 dark:bg-white/5 dark:border-white/10 cursor-pointer mt-2">
              <input type="checkbox" name="is_headquarters" defaultChecked={initialData?.is_headquarters} className="rounded border-slate-300 dark:border-slate-600 bg-white dark:bg-white/5" />
              <div className="text-sm">
                <span className="text-slate-700 dark:text-slate-300 block">Is Headquarters?</span>
                <span className="text-slate-500 text-xs">Mark this location as the primary HQ.</span>
              </div>
            </label>
          </form>
        </div>
        <div className="p-6 border-t border-slate-200 dark:border-white/10 shrink-0 flex justify-end gap-3">
          <Button type="button" variant="ghost" onClick={onClose} className="text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white">Cancel</Button>
          <Button type="submit" form="location-form" disabled={isPending} className="bg-emerald-500 hover:bg-emerald-600 text-white">{isPending ? 'Saving...' : 'Save Location'}</Button>
        </div>
      </div>
    </div>
  );
}
