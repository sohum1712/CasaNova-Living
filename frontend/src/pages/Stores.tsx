import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Search, Warehouse, Store as StoreIcon } from 'lucide-react';
import { apiClient } from '@/api/config/apiClient';
import { withDemoFallback, demoStoresFull } from '@/data/demoData';
import { useAuthStore } from '@/store/useAuthStore';
import { useDarkModeStore } from '@/store/useDarkModeStore';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

const STORE_TYPES = ['Warehouse', 'Urban', 'Suburban', 'Tourist', 'Business', 'Entertainment', 'Shopping'];
const EMPTY_FORM = { store_name: '', store_code: '', address: '', city: '', state: '', zip_code: '', region: '', store_type: 'Urban' };

export default function StoresPage() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const { hasAnyRole } = useAuthStore();
  const canEditStores = hasAnyRole(['head_office_admin', 'area_manager']);

  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ ...EMPTY_FORM });

  const { data: rawStores, isLoading: storesLoading } = useQuery({
    queryKey: ['stores', search, typeFilter],
    queryFn: async () => {
      try {
        const r = await apiClient.get('/stores', {
          params: {
            search: search || undefined,
            store_type: typeFilter !== 'all' ? typeFilter : undefined,
          },
        });
        return r.data;
      } catch {
        return [];
      }
    },
  });

  const stores = withDemoFallback(rawStores, demoStoresFull);

  const createMutation = useMutation({
    mutationFn: () => apiClient.post('/stores', form),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['stores'] });
      setDialogOpen(false);
      setForm({ ...EMPTY_FORM });
      toast({ title: 'Store created successfully' });
    },
    onError: (e: any) => {
      toast({ title: 'Error', description: e.response?.data?.detail || e.message, variant: 'destructive' });
    },
  });

  const formValid = form.store_name && form.store_code && form.city && form.state && form.region;

  const cardClass = cn('bg-white rounded-[2.5rem] p-10 soft-shadow border border-slate-100 hover:border-slate-200 transition-all group relative overflow-hidden');
  const typeColor: Record<string, string> = {
    Warehouse: 'bg-slate-100 text-slate-800',
    Urban: 'bg-[#ccff00]/10 text-slate-800',
    Suburban: 'bg-blue-50/50 text-blue-500',
    Tourist: 'bg-emerald-50 text-emerald-500',
    Business: 'bg-purple-50 text-purple-500',
    Entertainment: 'bg-pink-50 text-pink-500',
    Shopping: 'bg-yellow-50 text-yellow-500',
  };

  return (
    <AppLayout title="Stores">
      {/* Filters */}
      <div className="flex items-center gap-6 mb-10">
        <div className="relative flex-1">
           <Search size={18} className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300" />
           <input 
             placeholder="Search store directory..." 
             value={search} 
             onChange={e => setSearch(e.target.value)} 
             className="w-full pl-16 pr-8 h-14 bg-white border border-slate-100 rounded-2xl shadow-sm text-sm font-bold placeholder:text-slate-300" 
           />
        </div>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-64 h-14 bg-white border border-slate-100 text-slate-800 font-bold rounded-2xl shadow-sm px-6 truncate uppercase text-[10px] tracking-widest"><SelectValue placeholder="All archetypes" /></SelectTrigger>
          <SelectContent className="bg-white border border-slate-100 text-slate-800 shadow-xl rounded-xl">
             <SelectItem value="all">All Types</SelectItem>
             {STORE_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
          </SelectContent>
        </Select>
        {canEditStores && (
          <button
            type="button"
            className="h-14 px-10 bg-[#ccff00] text-[#0f172a] rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl hover:scale-105 transition-all"
            onClick={() => setDialogOpen(true)}
          >
            Add Store
          </button>
        )}
      </div>

      {/* Grid */}
      {storesLoading && stores.length === 0 ? (
        <div className="py-24 text-center text-slate-400 font-black uppercase tracking-widest">Loading Stores...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {stores.map((s: any) => (
            <div key={s.store_id} className={cardClass}>
              <div className="flex items-start justify-between mb-10">
                <div className="flex items-center gap-5">
                  <div className={cn('w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-500 group-hover:scale-110 shadow-sm border border-slate-50', s.store_type === 'Warehouse' ? 'bg-[#0f172a] text-[#ccff00]' : 'bg-white text-slate-800')}>
                    {s.store_type === 'Warehouse' ? <Warehouse size={28} strokeWidth={2.5} /> : <StoreIcon size={28} strokeWidth={2.5} />}
                  </div>
                  <div>
                    <h3 className="font-black text-2xl text-[#0f172a] tracking-tighter leading-none mb-1.5">{s.store_name}</h3>
                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">{s.store_code}</p>
                  </div>
                </div>
                <Badge className={cn('border-none text-[9px] font-black uppercase tracking-[0.2em] px-3 py-1', typeColor[s.store_type] || 'bg-slate-50 text-slate-400')}>
                  {s.store_type}
                </Badge>
              </div>
              
              <div className="space-y-8">
                <div className="space-y-2">
                  <p className="text-base font-bold text-slate-600 leading-relaxed tracking-tight">{s.address}</p>
                  <p className="text-xs font-black text-slate-300 uppercase tracking-widest leading-none">{s.city}, {s.state} {s.zip_code}</p>
                </div>
                
                <div className="flex items-center justify-between pt-8 border-t border-slate-50">
                   <div className="flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full bg-slate-200" />
                      <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">{s.region} Sector</span>
                   </div>
                   {s.is_warehouse && (
                      <Badge className="bg-[#ccff00] text-[#0f172a] border-none text-[9px] font-black uppercase tracking-[0.2em] px-3 py-1 shadow-sm">Primary Hub</Badge>
                   )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-xl bg-white border-none text-[#0f172a] shadow-2xl rounded-[3rem] p-16">
          <DialogHeader className="mb-8">
            <DialogTitle className="text-4xl font-black tracking-tighter text-[#0f172a]">Add New Store</DialogTitle>
          </DialogHeader>
          <div className="space-y-8">
            <div className="grid grid-cols-2 gap-8">
              <div className="space-y-3">
                <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Store Name</Label>
                <Input value={form.store_name} onChange={e => setForm(f => ({ ...f, store_name: e.target.value }))} placeholder="Mumbai Retail" className="h-14 bg-slate-50 border-none font-bold text-[#0f172a] placeholder:text-slate-300 rounded-2xl px-6" />
              </div>
              <div className="space-y-3">
                <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Store Code</Label>
                <Input value={form.store_code} onChange={e => setForm(f => ({ ...f, store_code: e.target.value }))} placeholder="MUM-001" className="h-14 bg-slate-50 border-none font-bold text-[#0f172a] placeholder:text-slate-300 rounded-2xl px-6 uppercase" />
              </div>
            </div>
            <div className="space-y-3">
              <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Store Type</Label>
              <Select value={form.store_type} onValueChange={v => setForm(f => ({ ...f, store_type: v }))}>
                <SelectTrigger className="h-14 bg-slate-50 border-none font-bold text-[#0f172a] rounded-2xl px-6"><SelectValue /></SelectTrigger>
                <SelectContent className="bg-white border border-slate-50 text-slate-800 shadow-xl rounded-xl">
                  {STORE_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <button className="editorial-gradient w-full text-cn-on-primary font-black uppercase tracking-widest text-xs h-16 shadow-xl rounded-3xl" disabled={!formValid} onClick={() => createMutation.mutate()}>
              Create Store
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
