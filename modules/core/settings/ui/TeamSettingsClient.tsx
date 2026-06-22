"use client";

import { useState } from 'react';
import { X, UserPlus, Shield, Check, Mail, MoreVertical } from 'lucide-react';
import { Button } from '@/packages/ui-kit/components/ui/button';
import { Input } from '@/packages/ui-kit/components/ui/input';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { updateMemberRoleAction, removeMemberAction } from '@/app/actions/settings';

type Member = {
  id: string;
  user_id: string;
  role: string;
  permissions: any;
  users: {
    id: string;
    email: string;
    phone_number: string | null;
  };
};

type Props = {
  tenantSlug: string;
  members: Member[];
};

export function TeamSettingsClient({ tenantSlug, members }: Props) {
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<Member | null>(null);

  const handleRemove = async (userId: string) => {
    if (!confirm('Are you sure you want to remove this member?')) return;
    try {
      const formData = new FormData();
      await removeMemberAction(tenantSlug, userId, formData);
      toast.success('Member removed successfully');
    } catch (e: any) {
      toast.error(e.message || 'Failed to remove member');
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 p-6 rounded-2xl backdrop-blur-md shadow-sm dark:shadow-none">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Shield className="w-5 h-5 text-emerald-500" />
            Team & Roles
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Manage workspace members and their fine-grained permissions.</p>
        </div>
        <Button onClick={() => setIsInviteOpen(true)} className="bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-500/20 rounded-full px-6">
          <UserPlus className="w-4 h-4 mr-2" />
          Invite Member
        </Button>
      </div>

      <div className="bg-white dark:bg-[#11151C] border border-slate-200 dark:border-white/5 rounded-2xl overflow-hidden shadow-sm dark:shadow-2xl">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 dark:divide-white/5">
            <thead className="bg-slate-50 dark:bg-white/[0.02]">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">User</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Role</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Permissions</th>
                <th className="px-6 py-4 text-right text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-white/5">
              {members.map(member => (
                <tr key={member.id} className="hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors group">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-medium text-sm shadow-inner">
                        {member.users.email.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="text-sm font-medium text-slate-900 dark:text-slate-200">{member.users.email}</div>
                        {member.users.phone_number && <div className="text-xs text-slate-500">{member.users.phone_number}</div>}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={cn(
                      "px-2.5 py-1 inline-flex text-xs leading-5 font-semibold rounded-full border",
                      member.role.toLowerCase() === 'owner' 
                        ? "bg-purple-500/10 text-purple-400 border-purple-500/20" 
                        : "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                    )}>
                      {member.role.charAt(0).toUpperCase() + member.role.slice(1)}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-wrap gap-1 w-64">
                      {member.role.toLowerCase() === 'owner' || (Array.isArray(member.permissions) && member.permissions.includes('*')) ? (
                        <span className="text-xs px-2 py-0.5 rounded bg-slate-100 dark:bg-white/5 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-white/5">All Access (*)</span>
                      ) : Array.isArray(member.permissions) && member.permissions.length > 0 ? (
                        member.permissions.map((p, i) => (
                          <span key={i} className="text-xs px-2 py-0.5 rounded bg-slate-100 dark:bg-white/5 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-white/5 truncate max-w-[120px]">{p}</span>
                        ))
                      ) : (
                        <span className="text-xs text-slate-500 dark:text-slate-600 italic">No explicit permissions</span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10"
                        onClick={() => setEditingMember(member)}
                      >
                        Edit Role
                      </Button>
                      {member.role.toLowerCase() !== 'owner' && (
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="text-rose-400 hover:text-rose-300 hover:bg-rose-500/10"
                          onClick={() => handleRemove(member.user_id)}
                        >
                          Remove
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Slide-over Modals */}
      <SlideOver isOpen={isInviteOpen} onClose={() => setIsInviteOpen(false)} title="Invite Team Member">
        <InviteMemberForm tenantSlug={tenantSlug} onClose={() => setIsInviteOpen(false)} />
      </SlideOver>

      <SlideOver isOpen={!!editingMember} onClose={() => setEditingMember(null)} title="Edit Role & Permissions">
        {editingMember && (
          <EditRoleForm 
            tenantSlug={tenantSlug} 
            member={editingMember} 
            onClose={() => setEditingMember(null)} 
          />
        )}
      </SlideOver>
    </div>
  );
}

// --- Internal UI Components ---

function SlideOver({ isOpen, onClose, title, children }: { isOpen: boolean, onClose: () => void, title: string, children: React.ReactNode }) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 lg:items-stretch lg:justify-end lg:p-0">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity" onClick={onClose} />
      <div className="relative bg-white dark:bg-[#0B0E14] border border-slate-200 dark:border-white/10 rounded-2xl lg:rounded-none lg:border-l lg:border-y-0 lg:border-r-0 w-full max-w-md shadow-2xl animate-in zoom-in-95 lg:slide-in-from-right-full lg:zoom-in-100 duration-200 flex flex-col h-auto lg:h-full max-h-[90vh] lg:max-h-none overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-200 dark:border-white/10 flex items-center justify-between shrink-0">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">{title}</h2>
          <button type="button" onClick={onClose} className="p-2 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-full hover:bg-slate-100 dark:hover:bg-white/10 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
          {children}
        </div>
      </div>
    </div>
  );
}

const AVAILABLE_PERMISSIONS = [
  { id: 'core.settings.view', label: 'View Settings' },
  { id: 'core.settings.manage', label: 'Manage Settings' },
  { id: 'core.users.manage', label: 'Manage Users' },
  { id: 'core.modules.manage', label: 'Manage Modules' },
  { id: 'finance.invoices.view', label: 'View Invoices' },
  { id: 'finance.invoices.manage', label: 'Manage Invoices' },
];

function EditRoleForm({ tenantSlug, member, onClose }: { tenantSlug: string, member: Member, onClose: () => void }) {
  const [role, setRole] = useState(member.role);
  const [permissions, setPermissions] = useState<string[]>(Array.isArray(member.permissions) ? member.permissions : []);
  const [isPending, setIsPending] = useState(false);

  const isOwner = member.role.toLowerCase() === 'owner';

  const togglePermission = (id: string) => {
    if (permissions.includes('*')) return; // Can't toggle if wildcard
    setPermissions(prev => prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isOwner) return onClose();
    
    setIsPending(true);
    try {
      const formData = new FormData();
      await updateMemberRoleAction(tenantSlug, member.user_id, role, permissions, formData);
      toast.success('Role updated successfully');
      onClose();
    } catch (err: any) {
      toast.error(err.message || 'Failed to update role');
    } finally {
      setIsPending(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 flex flex-col h-full">
      <div className="flex-1 space-y-6">
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Member</label>
          <div className="p-3 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-indigo-50 dark:bg-indigo-500/20 flex items-center justify-center text-indigo-500 dark:text-indigo-400">
              <Mail className="w-5 h-5" />
            </div>
            <div>
              <div className="text-sm text-slate-900 dark:text-white font-medium">{member.users.email}</div>
              <div className="text-xs text-slate-500">ID: {member.user_id.slice(0, 8)}...</div>
            </div>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Role Name</label>
          <Input 
            value={role} 
            onChange={e => setRole(e.target.value)} 
            disabled={isOwner}
            className="premium-input w-full"
          />
          {isOwner && <p className="text-xs text-amber-500 mt-2">The owner role cannot be modified.</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Granular Permissions</label>
          <div className="space-y-2">
            {AVAILABLE_PERMISSIONS.map(p => {
              const hasPerm = isOwner || permissions.includes('*') || permissions.includes(p.id);
              return (
                <label key={p.id} className={cn(
                  "flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors",
                  hasPerm ? "bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/20" : "bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/5 hover:border-slate-300 dark:hover:border-white/20",
                  (isOwner || permissions.includes('*')) && "opacity-60 cursor-not-allowed"
                )}>
                  <div className={cn(
                    "w-5 h-5 rounded flex items-center justify-center border",
                    hasPerm ? "bg-emerald-500 border-emerald-500 text-white" : "border-slate-300 dark:border-slate-600 text-transparent"
                  )}>
                    <Check className="w-3.5 h-3.5" />
                  </div>
                  <input 
                    type="checkbox" 
                    className="sr-only" 
                    checked={hasPerm}
                    onChange={() => togglePermission(p.id)}
                    disabled={isOwner || permissions.includes('*')}
                  />
                  <span className={cn("text-sm", hasPerm ? "text-emerald-700 dark:text-emerald-100" : "text-slate-700 dark:text-slate-300")}>{p.label}</span>
                </label>
              )
            })}
          </div>
        </div>
      </div>

      <div className="pt-6 mt-6 border-t border-slate-200 dark:border-white/10 flex gap-3 shrink-0">
        <Button type="button" variant="ghost" onClick={onClose} className="flex-1 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10">
          Cancel
        </Button>
        <Button type="submit" disabled={isPending || isOwner} className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-500/20">
          {isPending ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>
    </form>
  );
}

function InviteMemberForm({ tenantSlug, onClose }: { tenantSlug: string, onClose: () => void }) {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('member');
  const [isPending, setIsPending] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsPending(true);
    // Simulate invitation logic for now (Option B)
    setTimeout(() => {
      toast.success(`Invitation sent to ${email}`);
      setIsPending(false);
      onClose();
    }, 1000);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 flex flex-col h-full">
      <div className="flex-1 space-y-6">
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Email Address</label>
          <Input 
            type="email"
            required
            placeholder="colleague@example.com"
            value={email} 
            onChange={e => setEmail(e.target.value)} 
            className="premium-input w-full"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Initial Role</label>
          <div className="grid grid-cols-2 gap-3">
            {[
              { id: 'admin', label: 'Admin', desc: 'Full access to settings' },
              { id: 'member', label: 'Member', desc: 'Standard access' }
            ].map(r => (
              <button
                key={r.id}
                type="button"
                onClick={() => setRole(r.id)}
                className={cn(
                  "p-4 rounded-xl text-left border transition-all",
                  role === r.id 
                    ? "bg-emerald-50 dark:bg-emerald-500/10 border-emerald-500 dark:border-emerald-500/50 ring-1 ring-emerald-500" 
                    : "bg-white dark:bg-white/5 border-slate-200 dark:border-white/10 hover:border-slate-300 dark:hover:border-white/20"
                )}
              >
                <div className={cn("text-sm font-medium", role === r.id ? "text-emerald-600 dark:text-emerald-400" : "text-slate-700 dark:text-slate-200")}>{r.label}</div>
                <div className="text-xs text-slate-500 mt-1">{r.desc}</div>
              </button>
            ))}
          </div>
        </div>
        
        <div className="p-4 bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-100 dark:border-indigo-500/20 rounded-xl">
          <h4 className="text-sm font-medium text-indigo-700 dark:text-indigo-300 flex items-center gap-2">
            <Mail className="w-4 h-4" />
            Invitation Flow
          </h4>
          <p className="text-xs text-indigo-600/80 dark:text-indigo-200/70 mt-2 leading-relaxed">
            An email with a secure signup link will be sent. Once they create an account, they will automatically be added to this workspace with the selected role.
          </p>
        </div>
      </div>

      <div className="pt-6 border-t border-slate-200 dark:border-white/10 flex gap-3 mt-auto shrink-0">
        <Button type="button" variant="ghost" onClick={onClose} className="flex-1 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10">
          Cancel
        </Button>
        <Button type="submit" disabled={isPending || !email} className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-500/20">
          {isPending ? 'Sending...' : 'Send Invite'}
        </Button>
      </div>
    </form>
  );
}
