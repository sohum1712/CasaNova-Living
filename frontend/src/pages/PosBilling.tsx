import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Trash2, Plus, Minus, ShoppingCart, CheckCircle, Search } from 'lucide-react';
import { POSService, CartItem } from '@/api/services/posService';
import { apiClient } from '@/api/config/apiClient';
import { withDemoFallback, demoStoresShort, demoPosProducts } from '@/data/demoData';
import { useDarkModeStore } from '@/store/useDarkModeStore';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

export default function PosBilling() {
  const { toast } = useToast();
  const qc = useQueryClient();

  const [storeId, setStoreId] = useState<string>('');
  const [search, setSearch] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [receiptOpen, setReceiptOpen] = useState(false);
  const [lastSession, setLastSession] = useState<any>(null);

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
    queryKey: ['products', search],
    queryFn: async () => {
      try {
        const r = await apiClient.get('/products', { params: { search, limit: 30 } });
        return r.data;
      } catch {
        return [];
      }
    },
    enabled: search.length > 0 || true,
  });

  const products = withDemoFallback(rawProducts, demoPosProducts);

  const checkoutMutation = useMutation({
    mutationFn: async () => {
      const session = await POSService.createSession({
        store_id: Number(storeId),
        cart,
        total: cartTotal,
      });
      await POSService.checkout(session.session_id);
      return session;
    },
    onSuccess: (session) => {
      setLastSession(session);
      setReceiptOpen(true);
      setCart([]);
      toast({ title: 'Checkout complete' });
    },
  });

  const addToCart = (product: any) => {
    setCart(prev => {
      const existing = prev.find(i => i.product_id === product.product_id);
      if (existing) {
        return prev.map(i =>
          i.product_id === product.product_id ? { ...i, qty: i.qty + 1 } : i,
        );
      }
      return [...prev, {
        product_id: product.product_id,
        product_name: product.product_name,
        qty: 1,
        unit_price: product.unit_price,
      }];
    });
  };

  const updateQty = (product_id: number, delta: number) => {
    setCart(prev =>
      prev
        .map(i => i.product_id === product_id ? { ...i, qty: i.qty + delta } : i)
        .filter(i => i.qty > 0),
    );
  };

  const cartTotal = cart.reduce((sum, i) => sum + i.qty * i.unit_price, 0);

  const cardClass = cn('bg-white rounded-[2rem] border border-slate-100 soft-shadow');
  const cartLabel = 'text-[10px] font-black uppercase tracking-[0.2em] text-slate-400';

  const filteredProducts = products.filter((p: any) =>
    !search || p.product_name.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <AppLayout title="Billing">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-10">
        {/* Left: Product search */}
        <div className="lg:col-span-3 space-y-8">
          <div className={cn(cardClass, 'p-10')}>
            <div className="flex gap-6 mb-10 items-center">
              <Select value={storeId} onValueChange={setStoreId}>
                <SelectTrigger className="w-72 h-14 bg-white border border-slate-100 text-slate-800 font-bold rounded-2xl shadow-sm px-6 truncate uppercase text-[10px] tracking-widest">
                  <SelectValue placeholder="Select Store" />
                </SelectTrigger>
                <SelectContent className="bg-white border border-slate-100 text-slate-800 shadow-xl rounded-xl">
                  {stores.map((s: any) => <SelectItem key={s.store_id} value={String(s.store_id)}>{s.store_name}</SelectItem>)}
                </SelectContent>
              </Select>
              <div className="relative flex-1">
                <Search size={20} className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300" />
                <input
                  placeholder="Search products..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="w-full pl-16 pr-8 h-14 bg-white border border-slate-100 rounded-2xl shadow-sm text-sm font-bold placeholder:text-slate-300"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-8 max-h-[700px] overflow-y-auto pr-2 custom-scrollbar">
              {filteredProducts.map((p: any) => (
                <button
                  key={p.product_id}
                  onClick={() => addToCart(p)}
                  className="text-left p-8 rounded-[2rem] bg-slate-50 border border-transparent hover:bg-white hover:border-slate-100 hover:shadow-xl transition-all group active:scale-95"
                >
                  <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest mb-4 line-clamp-1">{p.category}</p>
                  <h4 className="text-base font-black text-[#0f172a] tracking-tight mb-6 line-clamp-2 min-h-[44px] leading-snug">{p.product_name}</h4>
                  <div className="flex items-center justify-between pt-6 border-t border-slate-100 group-hover:border-transparent">
                    <span className="text-xl font-black text-[#0f172a] tracking-tighter">${p.unit_price.toFixed(2)}</span>
                    <div className="w-10 h-10 rounded-2xl bg-[#ccff00] flex items-center justify-center text-[#0f172a] shadow-sm transform translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all">
                      <Plus size={20} strokeWidth={3} />
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Cart */}
        <div className={cn(cardClass, 'flex flex-col min-h-[800px]')}>
          <div className="p-10 border-b border-slate-50 flex items-center justify-between">
            <div className="flex items-center gap-4">
               <div className="w-10 h-10 bg-slate-50 text-[#0f172a] flex items-center justify-center rounded-xl shadow-sm">
                 <ShoppingCart size={20} strokeWidth={2.5} />
               </div>
               <span className="font-black text-xl tracking-tighter text-[#0f172a]">Checkout</span>
            </div>
            {cart.length > 0 && <span className="bg-[#ccff00] text-[#0f172a] font-black text-[10px] uppercase tracking-widest px-3 py-1.5 rounded-xl shadow-sm">{cart.length} SKUs</span>}
          </div>

          <div className="flex-1 overflow-y-auto p-10 space-y-8 custom-scrollbar">
            {cart.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-slate-200 py-20 text-center">
                <ShoppingCart size={64} strokeWidth={1} className="mb-6 opacity-30" />
                <p className="text-[10px] font-black uppercase tracking-[0.4em] opacity-50">Cart is empty</p>
              </div>
            ) : (
              cart.map(item => (
                <div key={item.product_id} className="group space-y-4">
                  <div className="flex justify-between items-start">
                    <h5 className="text-sm font-black text-[#0f172a] tracking-tight leading-snug flex-1 pr-4">{item.product_name}</h5>
                    <button onClick={() => updateQty(item.product_id, -item.qty)} className="text-slate-200 hover:text-rose-500 transition-colors">
                      <Trash2 size={16} />
                    </button>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center bg-slate-50 rounded-2xl p-1 px-2 border border-slate-100">
                      <button onClick={() => updateQty(item.product_id, -1)} className="w-8 h-8 rounded-xl flex items-center justify-center hover:bg-white text-slate-400 transition-all"><Minus size={14} strokeWidth={3} /></button>
                      <span className="text-sm font-black w-8 text-center text-[#0f172a]">{item.qty}</span>
                      <button onClick={() => updateQty(item.product_id, 1)} className="w-8 h-8 rounded-xl flex items-center justify-center hover:bg-white text-slate-400 transition-all"><Plus size={14} strokeWidth={3} /></button>
                    </div>
                    <span className="text-lg font-black text-[#0f172a] tracking-tighter">${(item.qty * item.unit_price).toFixed(2)}</span>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="p-10 bg-slate-50/50 backdrop-blur-xl space-y-8">
            <div className="flex justify-between items-end border-b border-slate-100 pb-8">
              <span className={cartLabel}>Total Amount</span>
              <span className="text-5xl font-black text-[#0f172a] tracking-tighter leading-none">${cartTotal.toFixed(2)}</span>
            </div>
            <button
              className="w-full h-20 bg-[#ccff00] text-[#0f172a] font-black uppercase tracking-[0.2em] text-sm shadow-xl hover:scale-105 active:scale-95 transition-all rounded-[1.5rem]"
              disabled={cart.length === 0 || !storeId || checkoutMutation.isPending}
              onClick={() => checkoutMutation.mutate()}
            >
              {checkoutMutation.isPending ? 'Processing...' : 'Checkout'}
            </button>
            {!storeId && <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest text-center">Please select a store</p>}
          </div>
        </div>
      </div>

      <Dialog open={receiptOpen} onOpenChange={setReceiptOpen}>
        <DialogContent className="max-w-md bg-white border-none text-[#0f172a] shadow-2xl rounded-[3rem] p-16">
          <div className="text-center space-y-8">
            <div className="w-24 h-24 rounded-3xl bg-[#ccff00] flex items-center justify-center mx-auto shadow-xl">
              <CheckCircle size={48} className="text-[#0f172a]" strokeWidth={2.5} />
            </div>
            <div>
              <h2 className="text-4xl font-black tracking-tighter text-[#0f172a] mb-2">Success</h2>
              <p className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-300">Transaction Complete</p>
            </div>
            
            <div className="py-8 border-y border-slate-50 space-y-10">
              <div className="flex justify-between items-end">
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-300">Paid Amount</span>
                <span className="text-5xl font-black text-[#0f172a] tracking-tighter">${lastSession?.total?.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-slate-300">
                <span>Ref ID: <span className="text-[#0f172a] font-mono">#{lastSession?.session_id.toString(16).toUpperCase()}</span></span>
                <span>Node: <span className="text-[#0f172a]">{lastSession?.store_name}</span></span>
              </div>
            </div>

            <button className="w-full h-16 bg-[#0f172a] text-white rounded-2xl font-black uppercase tracking-widest text-xs hover:scale-105 transition-all shadow-xl" onClick={() => setReceiptOpen(false)}>
              Done
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
