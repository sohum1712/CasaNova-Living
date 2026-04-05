import React, { useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  User, Mail, Shield, Star, MoreHorizontal, UserPlus,
  Search, Store, Trash2, X, ChevronDown, Loader2,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { apiClient } from '@/api/config/apiClient';
import { useAuthStore } from '@/store/useAuthStore';
import { toast } from 'sonner';

const PEOPLE_VIEW_ROLES = ['head_office_admin', 'area_manager', 'store_supervisor'] as const;

const ROLES = [
  { value: 'floor_associate', label: 'Floor Associate' },
  { value: 'store_supervisor', label: 'Store Supervisor' },
  { value: 'area_manager', label: 'Area Manager' },
  { value: 'head_office_admin', label: 'Head Office Admin' },
];

const ROLE_COLORS: Record<string, string> = {
  head_office_admin: 'bg-[#ccff00] text-[#0f172a]',
  area_manager: 'bg-blue-50 text-blue-600',
  store_supervisor: 'bg-purple-50 text-purple-600',
  floor_associate: 'bg-slate-100 text-slate-500',
};

const EMPTY_FORM = {
  first_name: '', last_name: '', username: '', email: '',
  password: '', role: 'floor_associate', store_id: '', region: '',
};

export default function UsersPage() {
  const qc = useQueryClient();
  const { hasAnyRole } = useAuthStore();
  const canViewPeople = hasAnyRole([...PEOPLE_VIEW_ROLES]);
  const canManageUsers = hasAnyRole(['head_office_admin']);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [form, setForm] = useState({ ...EMPTY_FORM });

  // Fetch users from real API
  const { data: users = [], isLoading } = useQuery({
    queryKey: ['users', search, roleFilter],
    queryFn: () =>
      apiClient.get('/users', {
        params: {
          search: search || undefined,
          role: roleFilter !== 'all' ? roleFilter : undefined,
          limit: 200,
        },
      }).then(r => r.data),
  });

  // Fetch stores for the dropdown
  const { data: stores = [] } = useQuery({
    queryKey: ['stores-simple'],
    queryFn: () => apiClient.get('/stores').then(r => r.data),
  });

  const set = (key: string) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setForm(f => ({ ...f, [key]: e.target.value }));

  const handleStoreChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = e.target.value;
    const store = stores.find((s: any) => String(s.store_id) === id);
    setForm(f => ({ ...f, store_id: id, region: store?.region || f.region }));
  };

  const createMutation = useMutation({
    mutationFn: () =>
      apiClient.post('/users', {
        ...form,
        store_id: form.store_id ? Number(form.store_id) : null,
        region: form.region || null,
        avatar_url: null,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['users'] });
      setDialogOpen(false);
      setForm({ ...EMPTY_FORM });
      toast.success('Member added successfully');
    },
    onError: (e: any) => {
      toast.error('Failed to create user', {
        description: e.response?.data?.detail || e.message,
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiClient.delete(`/users/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['users'] });
      setDeleteId(null);
      toast.success('Member removed');
    },
    onError: (e: any) => {
      toast.error('Failed to delete user', { description: e.response?.data?.detail || e.message });
    },
  });

  const formValid =
    form.first_name && form.last_name && form.username &&
    form.email && form.password.length >= 6;

  if (!canViewPeople) {
    return (
      <AppLayout title="People">
        <div className="py-24 text-center space-y-4 max-w-md mx-auto">
          <p className="text-slate-800 font-black text-lg tracking-tight">Access restricted</p>
          <p className="text-slate-500 text-sm font-medium">
            Your role does not include the team directory. Ask a head office admin if you need access.
          </p>
        </div>
      </AppLayout>
    );
  }

  const inputClass =
    'w-full h-12 bg-slate-50 border-none rounded-xl px-4 font-bold text-[#0f172a] placeholder:text-slate-300 outline-none focus:ring-2 focus:ring-[#ccff00]/40 transition-all';

  const selectClass =
    'w-full h-12 bg-slate-50 border-none rounded-xl px-4 font-bold text-[#0f172a] outline-none focus:ring-2 focus:ring-[#ccff00]/40 transition-all appearance-none cursor-pointer';

  const cardBase =
    'bg-white rounded-[2.5rem] p-8 border border-slate-100 hover:border-[#ccff00]/30 transition-all group shadow-sm hover:shadow-xl';

  return (
    <AppLayout title="People">
      <div className="space-y-10">
        {/* Actions Bar */}
        <div className="flex flex-col sm:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-4 flex-1">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
              <input
                placeholder="Search by name, username or email..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full h-14 pl-14 pr-6 bg-white border border-slate-100 rounded-2xl text-sm font-bold shadow-sm outline-none focus:border-[#ccff00] transition-all"
              />
            </div>
            {/* Role filter pills */}
            <div className="hidden md:flex gap-2">
              {['all', ...ROLES.map(r => r.value)].map(r => (
                <button
                  key={r}
                  onClick={() => setRoleFilter(r)}
                  className={cn(
                    'px-5 h-10 rounded-full text-[9px] font-black uppercase tracking-widest transition-all whitespace-nowrap',
                    roleFilter === r
                      ? 'bg-[#0f172a] text-white'
                      : 'bg-white border border-slate-100 text-slate-400 hover:text-slate-700',
                  )}
                >
                  {r === 'all' ? 'All' : ROLES.find(x => x.value === r)?.label}
                </button>
              ))}
            </div>
          </div>
          {canManageUsers && (
            <button
              type="button"
              onClick={() => setDialogOpen(true)}
              className="h-14 px-10 bg-[#0f172a] text-white rounded-2xl flex items-center gap-3 font-black text-[10px] uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-xl"
            >
              <UserPlus size={18} strokeWidth={2.5} className="text-[#ccff00]" />
              Add Member
            </button>
          )}
        </div>

        {/* Grid */}
        {isLoading ? (
          <div className="py-24 text-center text-slate-400 font-black uppercase tracking-widest">
            Loading team...
          </div>
        ) : users.length === 0 ? (
          <div className="py-24 text-center space-y-4">
            <p className="text-slate-300 font-black uppercase tracking-widest text-sm">No members found</p>
            {canManageUsers && (
              <button
                type="button"
                onClick={() => setDialogOpen(true)}
                className="inline-flex items-center gap-2 px-8 py-3 bg-[#ccff00] text-[#0f172a] rounded-2xl font-black text-xs uppercase tracking-widest hover:scale-105 transition-all"
              >
                <UserPlus size={16} /> Add First Member
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {users.map((person: any) => (
              <div key={person.user_id} className={cardBase}>
                <div className="flex justify-between items-start mb-8">
                  <div className="w-20 h-20 bg-slate-50 rounded-3xl overflow-hidden shadow-inner border-2 border-white group-hover:scale-105 transition-transform duration-500">
                    <img
                      src={person.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${person.username}`}
                      alt={person.username}
                    />
                  </div>
                  {canManageUsers && (
                    <button
                      type="button"
                      onClick={() => setDeleteId(person.user_id)}
                      className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-300 hover:text-rose-500 hover:bg-rose-50 transition-all"
                    >
                      <MoreHorizontal size={20} />
                    </button>
                  )}
                </div>

                <div className="space-y-1 mb-8">
                  <h3 className="text-xl font-black text-[#0f172a] tracking-tight">
                    {person.first_name} {person.last_name}
                  </h3>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    @{person.username}
                  </p>
                  <span className={cn(
                    'text-[9px] font-black uppercase tracking-widest inline-block px-3 py-1 rounded-lg mt-1',
                    ROLE_COLORS[person.role] || 'bg-slate-100 text-slate-500',
                  )}>
                    {ROLES.find(r => r.value === person.role)?.label || person.role}
                  </span>
                </div>

                <div className="space-y-3 pt-6 border-t border-slate-50">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400">
                      <Mail size={13} />
                    </div>
                    <span className="text-xs font-bold text-slate-500 truncate">{person.email}</span>
                  </div>
                  {person.store_id && (
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400">
                        <Store size={13} />
                      </div>
                      <span className="text-xs font-bold text-slate-500">
                        Store #{person.store_id}
                        {person.region ? ` · ${person.region}` : ''}
                      </span>
                    </div>
                  )}
                  {person.region && !person.store_id && (
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400">
                        <Shield size={13} />
                      </div>
                      <span className="text-xs font-bold text-slate-500">{person.region} Region</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Member Dialog */}
      <Dialog
        open={canManageUsers && dialogOpen}
        onOpenChange={(open) => {
          if (canManageUsers) setDialogOpen(open);
        }}
      >
        <DialogContent className="max-w-lg bg-white border-none text-[#0f172a] shadow-2xl rounded-[2.5rem] p-10">
          <DialogHeader className="mb-6">
            <DialogTitle className="text-3xl font-black tracking-tighter">Add Team Member</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">First Name</Label>
                <input placeholder="Jane" value={form.first_name} onChange={set('first_name')} className={inputClass} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Last Name</Label>
                <input placeholder="Doe" value={form.last_name} onChange={set('last_name')} className={inputClass} />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Username</Label>
              <input placeholder="jane.doe" value={form.username} onChange={set('username')} className={inputClass} />
            </div>

            <div className="space-y-1.5">
              <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Email</Label>
              <input type="email" placeholder="jane@casanova.com" value={form.email} onChange={set('email')} className={inputClass} />
            </div>

            <div className="space-y-1.5">
              <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Password</Label>
              <input type="password" placeholder="Min 6 characters" value={form.password} onChange={set('password')} className={inputClass} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Role</Label>
                <div className="relative">
                  <select value={form.role} onChange={set('role')} className={selectClass}>
                    {ROLES.map(r => (
                      <option key={r.value} value={r.value}>{r.label}</option>
                    ))}
                  </select>
                  <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Store</Label>
                <div className="relative">
                  <select value={form.store_id} onChange={handleStoreChange} className={selectClass}>
                    <option value="">None</option>
                    {stores.map((s: any) => (
                      <option key={s.store_id} value={s.store_id}>{s.store_name}</option>
                    ))}
                  </select>
                  <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                </div>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Region</Label>
              <input placeholder="e.g. North, South" value={form.region} onChange={set('region')} className={inputClass} />
            </div>

            <button
              disabled={!formValid || createMutation.isPending}
              onClick={() => createMutation.mutate()}
              className="w-full h-14 bg-[#ccff00] text-[#0f172a] rounded-2xl font-black uppercase tracking-widest text-xs hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-2"
            >
              {createMutation.isPending ? <Loader2 size={18} className="animate-spin" /> : 'Create Member'}
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm Dialog */}
      <Dialog open={deleteId !== null} onOpenChange={() => setDeleteId(null)}>
        <DialogContent className="max-w-sm bg-white border-none shadow-2xl rounded-[2rem] p-10 text-center">
          <div className="w-16 h-16 bg-rose-50 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Trash2 size={28} className="text-rose-500" />
          </div>
          <h3 className="text-2xl font-black text-[#0f172a] tracking-tight mb-2">Remove Member?</h3>
          <p className="text-slate-400 text-sm font-bold mb-8">This action cannot be undone.</p>
          <div className="flex gap-4">
            <button
              onClick={() => setDeleteId(null)}
              className="flex-1 h-12 bg-slate-50 text-slate-600 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-slate-100 transition-all"
            >
              Cancel
            </button>
            <button
              onClick={() => deleteId && deleteMutation.mutate(deleteId)}
              disabled={deleteMutation.isPending}
              className="flex-1 h-12 bg-rose-500 text-white rounded-xl font-black text-xs uppercase tracking-widest hover:bg-rose-600 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {deleteMutation.isPending ? <Loader2 size={14} className="animate-spin" /> : 'Remove'}
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
