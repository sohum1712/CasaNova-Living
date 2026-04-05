import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Pencil, Search } from 'lucide-react';
import { apiClient } from '@/api/config/apiClient';
import { withDemoFallback, demoProducts, demoCategoryOptions } from '@/data/demoData';
import { useDarkModeStore } from '@/store/useDarkModeStore';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

const EMPTY_FORM = { product_name: '', brand: '', category: '', package_size: '', unit_price: '' };

export default function ProductsPage() {
  const { toast } = useToast();
  const qc = useQueryClient();

  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editProduct, setEditProduct] = useState<any>(null);
  const [form, setForm] = useState({ ...EMPTY_FORM });

  const { data: rawProducts, isLoading: productsLoading } = useQuery({
    queryKey: ['products', search, categoryFilter],
    queryFn: async () => {
      try {
        const r = await apiClient.get('/products', {
          params: {
            search: search || undefined,
            category: categoryFilter !== 'all' ? categoryFilter : undefined,
            limit: 200,
          },
        });
        return r.data;
      } catch {
        return [];
      }
    },
  });

  const products = withDemoFallback(rawProducts, demoProducts);

  const { data: rawCategories, isLoading: catsLoading } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      try {
        const r = await apiClient.get('/products/categories/list');
        return r.data;
      } catch {
        return [];
      }
    },
  });

  const categories = withDemoFallback(rawCategories, demoCategoryOptions);

  const saveMutation = useMutation({
    mutationFn: () => {
      const payload = { ...form, unit_price: Number(form.unit_price) };
      return editProduct
        ? apiClient.put(`/products/${editProduct.product_id}`, payload)
        : apiClient.post('/products', payload);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['products'] });
      qc.invalidateQueries({ queryKey: ['categories'] });
      setDialogOpen(false);
      toast({ title: editProduct ? 'Product updated' : 'Product created' });
    },
    onError: (e: any) => {
      toast({ title: 'Error', description: e.response?.data?.detail || e.message, variant: 'destructive' });
    },
  });

  const openCreate = () => { setEditProduct(null); setForm({ ...EMPTY_FORM }); setDialogOpen(true); };
  const openEdit = (p: any) => {
    setEditProduct(p);
    setForm({ product_name: p.product_name, brand: p.brand, category: p.category, package_size: p.package_size, unit_price: String(p.unit_price) });
    setDialogOpen(true);
  };

  const formValid = form.product_name && form.brand && form.category && form.package_size && Number(form.unit_price) > 0;

  const cardClass = cn('bg-white rounded-[2rem] overflow-hidden border border-slate-100 soft-shadow');
  const tableHeader = 'text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 bg-slate-50 px-8 py-6';
  const tableCell = 'px-8 py-6 border-none text-sm font-black text-slate-800';

  return (
    <AppLayout title="Products">
      {/* Filters Row */}
      <div className="flex items-center gap-6 mb-10">
        <div className="relative flex-1">
           <Search size={18} className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300" />
           <input 
             placeholder="Search product registry..." 
             value={search} 
             onChange={e => setSearch(e.target.value)} 
             className="w-full pl-16 pr-8 h-14 bg-white border border-slate-100 rounded-2xl shadow-sm text-sm font-bold placeholder:text-slate-300" 
           />
        </div>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-64 h-14 bg-white border border-slate-100 text-slate-800 font-bold rounded-2xl shadow-sm px-6 truncate uppercase text-[10px] tracking-widest"><SelectValue placeholder="All Categories" /></SelectTrigger>
          <SelectContent className="bg-white border border-slate-100 text-slate-800 shadow-xl rounded-xl">
            <SelectItem value="all">Global Categories</SelectItem>
            {categories.map((c: any) => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
          </SelectContent>
        </Select>
        <button className="h-14 px-10 bg-[#ccff00] text-[#0f172a] rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl hover:scale-105 transition-all" onClick={openCreate}>
          Add Product
        </button>
      </div>

      {/* Table Card */}
      <div className={cardClass}>
        {productsLoading && products.length === 0 ? (
          <div className="py-24 text-center text-slate-400 font-black uppercase tracking-widest">Loading Products...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full font-body">
              <thead>
                <tr className="border-none">
                  <th className={tableHeader + ' text-left'}>Product Name</th>
                  <th className={tableHeader + ' text-left'}>Brand</th>
                  <th className={tableHeader + ' text-left'}>Category</th>
                  <th className={tableHeader + ' text-left'}>Package Size</th>
                  <th className={tableHeader + ' text-right'}>Price</th>
                  <th className={tableHeader + ' text-right'}>Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {products.map((p: any) => (
                  <tr key={p.product_id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className={tableCell}>
                       <span className="tracking-tight">{p.product_name}</span>
                    </td>
                    <td className={tableCell + ' text-slate-400 font-bold'}>{p.brand}</td>
                    <td className={tableCell}>
                      <Badge className="bg-slate-100 text-slate-400 border-none text-[10px] font-black uppercase tracking-widest px-3 py-1">{p.category}</Badge>
                    </td>
                    <td className={tableCell + ' text-slate-400 font-bold uppercase text-[10px] tracking-wider'}>{p.package_size}</td>
                    <td className={tableCell + ' text-right font-black tracking-tighter text-xl'}>${p.unit_price.toFixed(2)}</td>
                    <td className={tableCell + ' text-right'}>
                      <button className="h-10 w-10 flex items-center justify-center text-slate-300 hover:text-[#0f172a] hover:bg-white rounded-lg group-hover:shadow-md transition-all ml-auto" onClick={() => openEdit(p)}>
                        <Pencil size={16} strokeWidth={3} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Dialog remains similar but with new styling */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md bg-white border-none text-[#0f172a] shadow-2xl rounded-[2.5rem] p-12">
          <DialogHeader>
            <DialogTitle className="text-3xl font-black tracking-tighter text-[#0f172a]">{editProduct ? 'Edit Product' : 'Add New Product'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-6 py-6">
            {[
              { key: 'product_name', label: 'Product name', placeholder: 'e.g. Fizzy Classic Cola' },
              { key: 'brand', label: 'Brand', placeholder: 'e.g. BubbleCorp' },
              { key: 'package_size', label: 'Package size', placeholder: 'e.g. 24x12oz cans' },
            ].map(({ key, label, placeholder }) => (
              <div key={key} className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">{label}</Label>
                <Input value={(form as any)[key]} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))} placeholder={placeholder} className="h-12 bg-slate-50 border-none font-bold text-slate-800 placeholder:text-slate-300 rounded-xl" />
              </div>
            ))}
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Category</Label>
              <Select value={form.category} onValueChange={v => setForm(f => ({ ...f, category: v }))}>
                <SelectTrigger className="h-12 bg-slate-50 border-none font-bold text-slate-800 rounded-xl"><SelectValue placeholder="Select category" /></SelectTrigger>
                <SelectContent className="bg-white border-none text-slate-800 shadow-xl">
                  {categories.map((c: any) => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Price ($)</Label>
              <Input type="number" min={0} step={0.01} value={form.unit_price} onChange={e => setForm(f => ({ ...f, unit_price: e.target.value }))} placeholder="18.99" className="h-12 bg-slate-50 border-none font-bold text-slate-800 rounded-xl" />
            </div>
          </div>
          <DialogFooter className="gap-4">
            <button className="editorial-gradient flex-1 text-cn-on-primary font-black uppercase tracking-widest text-[11px] h-14 shadow-xl rounded-2xl" disabled={!formValid || saveMutation.isPending} onClick={() => saveMutation.mutate()}>
              {saveMutation.isPending ? 'Syncing...' : editProduct ? 'Update Product' : 'Add Product'}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
