import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ArrowRight, Plus, CheckCircle, XCircle, Clock, Warehouse } from 'lucide-react';
import { TransferService, StockTransfer } from '@/api/services/transferService';
import { apiClient } from '@/api/config/apiClient';
import { withDemoFallback, demoTransfers, demoStoresShort, demoPosProducts } from '@/data/demoData';
import { useDarkModeStore } from '@/store/useDarkModeStore';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

const STATUS_CONFIG: Record<string, { label: string; variant: any; icon: React.ReactNode }> = {
  pending: { label: 'Pending', variant: 'outline', icon: <Clock size={12} /> },
  approved: { label: 'Approved', variant: 'default', icon: <CheckCircle size={12} /> },
  shipped: { label: 'Shipped', variant: 'default', icon: <CheckCircle size={12} /> },
  cancelled: { label: 'Cancelled', variant: 'destructive', icon: <XCircle size={12} /> },
};

export default function StockTransferPage() {
  const { toast } = useToast();
  const qc = useQueryClient();

  const [statusFilter, setStatusFilter] = useState('all');
  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState({
    from_store_id: '',
    to_store_id: '',
    product_id: '',
    quantity: '',
    notes: '',
  });

  const { data: rawTransfers, isLoading: transfersLoading } = useQuery({
    queryKey: ['transfers', statusFilter],
    queryFn: async () => {
      try {
        return await TransferService.getTransfers(statusFilter !== 'all' ? statusFilter : undefined);
      } catch {
        return [];
      }
    },
  });

  const transfers = withDemoFallback(rawTransfers, demoTransfers);

  const { data: rawStores, isLoading: storesLoading } = useQuery({
    queryKey: ['stores'],
    queryFn: async () => {
      try {
        const r = await apiClient.get('/stores');
        return r.data;
      } catch {
        return [];
      }
    },
  });

  const stores = withDemoFallback(rawStores, demoStoresShort);

  const { data: rawProducts, isLoading: productsLoading } = useQuery({
    queryKey: ['products-all'],
    queryFn: async () => {
      try {
        const r = await apiClient.get('/products', { params: { limit: 200 } });
        return r.data;
      } catch {
        return [];
      }
    },
  });

  const products = withDemoFallback(rawProducts, demoPosProducts);

  const createMutation = useMutation({
    mutationFn: () => TransferService.createTransfer({
      from_store_id: Number(form.from_store_id),
      to_store_id: Number(form.to_store_id),
      product_id: Number(form.product_id),
      quantity: Number(form.quantity),
      notes: form.notes || undefined,
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['transfers'] });
      setCreateOpen(false);
      setForm({ from_store_id: '', to_store_id: '', product_id: '', quantity: '', notes: '' });
      toast({ title: 'Transfer created', description: 'Pending manager approval' });
    },
    onError: (e: any) => {
      const status = e.response?.status;
      let msg = 'Could not create transfer. Please try again.';
      if (status === 400) msg = 'Check the transfer details — insufficient stock or invalid stores.';
      else if (e.code === 'ERR_NETWORK') msg = 'Unable to connect. Check your connection.';
      toast({ title: 'Failed', description: msg, variant: 'destructive' });
    },
  });

  const approveMutation = useMutation({
    mutationFn: (id: number) => TransferService.approveTransfer(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['transfers'] });
      toast({ title: 'Transfer approved' });
    },
  });

  const cancelMutation = useMutation({
    mutationFn: (id: number) => TransferService.cancelTransfer(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['transfers'] });
      toast({ title: 'Transfer cancelled' });
    },
  });

  const cardClass = cn('bg-white rounded-[2rem] overflow-hidden border border-slate-100 soft-shadow');
  const tableHeader = 'text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 bg-slate-50 px-8 py-6';
  const tableCell = 'px-8 py-6 border-none text-sm font-black text-slate-800';

  const formValid = form.from_store_id && form.to_store_id && form.product_id &&
    Number(form.quantity) > 0 && form.from_store_id !== form.to_store_id;

  return (
    <AppLayout title="Transfers">
      {/* Header Actions Row */}
      <div className="flex items-center justify-between gap-6 mb-10">
        <div className="flex gap-4">
          {['all', 'pending', 'shipped', 'cancelled'].map(s => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={cn(
                'px-8 h-12 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all',
                statusFilter === s
                  ? 'bg-[#0f172a] text-white shadow-lg'
                  : 'bg-white border border-slate-100 text-slate-400 hover:text-slate-800 hover:border-slate-200'
              )}
            >
              {s}
            </button>
          ))}
        </div>
        <button className="h-14 px-10 bg-[#ccff00] text-[#0f172a] rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl hover:scale-105 transition-all" onClick={() => setCreateOpen(true)}>
          New Transfer
        </button>
      </div>

      {/* Transfers Registry */}
      <div className={cardClass}>
        {transfersLoading && transfers.length === 0 ? (
          <div className="py-24 text-center text-slate-400 font-black uppercase tracking-widest">Loading Transfers...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full font-body">
              <thead>
                <tr className="border-none">
                  <th className={tableHeader + ' text-left'}>From → To</th>
                  <th className={tableHeader + ' text-left'}>Product</th>
                  <th className={tableHeader + ' text-right'}>Quantity</th>
                  <th className={tableHeader + ' text-center'}>Status</th>
                  <th className={tableHeader + ' text-right'}>Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {transfers.map((t: StockTransfer) => {
                  const cfg = STATUS_CONFIG[t.status] || STATUS_CONFIG.pending;
                  const isPending = t.status === 'pending';
                  return (
                    <tr key={t.transfer_id} className="hover:bg-slate-50/50 transition-colors group">
                      <td className={tableCell}>
                        <div className="flex items-center gap-4">
                           <span className="text-slate-400 font-bold max-w-[120px] truncate">{t.from_store_name}</span>
                           <ArrowRight size={14} className="text-slate-200" />
                           <span className="text-[#0f172a] font-black max-w-[120px] truncate">{t.to_store_name}</span>
                        </div>
                      </td>
                      <td className={tableCell}>
                        <div className="flex flex-col">
                           <span className="tracking-tight text-slate-800">{t.product_name}</span>
                           <span className="text-[10px] text-slate-300 font-bold uppercase tracking-widest">{t.category}</span>
                        </div>
                      </td>
                      <td className={tableCell + ' text-right font-black text-xl tracking-tighter'}>{t.quantity}</td>
                      <td className={tableCell}>
                        <div className="flex justify-center">
                          <Badge className={cn('border-none text-[9px] font-black uppercase tracking-[0.2em] px-3 py-1 flex items-center gap-2 rounded-lg', 
                            t.status === 'pending' ? 'bg-slate-100 text-slate-400' : 
                            t.status === 'cancelled' ? 'bg-rose-50 text-rose-400' : 'bg-[#ccff00]/10 text-slate-800'
                          )}>
                            {cfg.icon} {cfg.label}
                          </Badge>
                        </div>
                      </td>
                      <td className={tableCell + ' text-right'}>
                        {isPending && (
                          <div className="flex gap-4 justify-end">
                            <button className="text-[10px] font-black uppercase tracking-widest text-[#0f172a] hover:scale-110 transition-transform" onClick={() => approveMutation.mutate(t.transfer_id)}>Approve</button>
                            <button className="text-[10px] font-black uppercase tracking-widest text-rose-500 hover:scale-110 transition-transform" onClick={() => cancelMutation.mutate(t.transfer_id)}>Reject</button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Execute Transfer Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-xl bg-white border-none text-[#0f172a] shadow-2xl rounded-[3rem] p-16">
          <DialogHeader className="mb-10">
            <DialogTitle className="text-4xl font-black tracking-tighter text-[#0f172a]">Stock Transfer</DialogTitle>
          </DialogHeader>
          <div className="space-y-8">
            <div className="grid grid-cols-2 gap-8">
              <div className="space-y-3">
                <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">From Store</Label>
                <Select value={form.from_store_id} onValueChange={v => setForm(f => ({ ...f, from_store_id: v }))}>
                  <SelectTrigger className="h-14 bg-slate-50 border-none font-black text-[#0f172a] rounded-2xl px-6"><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-white border-none text-[#0f172a] shadow-xl">
                    {stores.map((s: any) => <SelectItem key={s.store_id} value={String(s.store_id)}>{s.store_name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-3">
                <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">To Store</Label>
                <Select value={form.to_store_id} onValueChange={v => setForm(f => ({ ...f, to_store_id: v }))}>
                  <SelectTrigger className="h-14 bg-slate-50 border-none font-black text-[#0f172a] rounded-2xl px-6"><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-white border-none text-[#0f172a] shadow-xl">
                    {stores.map((s: any) => <SelectItem key={s.store_id} value={String(s.store_id)}>{s.store_name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-3">
              <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Product</Label>
              <Select value={form.product_id} onValueChange={v => setForm(f => ({ ...f, product_id: v }))}>
                <SelectTrigger className="h-14 bg-slate-50 border-none font-black text-[#0f172a] rounded-2xl px-6"><SelectValue /></SelectTrigger>
                <SelectContent className="bg-white border-none text-[#0f172a] shadow-xl">
                  {products.map((p: any) => <SelectItem key={p.product_id} value={String(p.product_id)}>{p.product_name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-3">
              <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Quantity</Label>
              <Input type="number" min={1} value={form.quantity} onChange={e => setForm(f => ({ ...f, quantity: e.target.value }))} className="h-14 bg-slate-50 border-none font-black text-[#0f172a] rounded-2xl px-6" />
            </div>
            <button className="editorial-gradient w-full text-cn-on-primary font-black uppercase tracking-widest text-xs h-16 shadow-xl rounded-3xl" disabled={!formValid} onClick={() => createMutation.mutate()}>
              Confirm Transfer
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
