import React, { useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { useQuery } from '@tanstack/react-query';
import { analyticsApi, aiApi } from '@/api/config/apiClient';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { TrendingUp, AlertTriangle, Lightbulb, MessageSquare, Package, ShoppingCart, Truck, Activity, Sparkles, ChevronRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

type SaleRow = { date?: string; revenue?: number; transactions?: number };
type HealthRow = { region?: string; healthy?: number; low?: number; critical?: number };

export default function Dashboard() {
  const [query, setQuery] = useState("");
  const [aiAnswer, setAiAnswer] = useState<Record<string, unknown> | null>(null);

  const { data: sales = [] } = useQuery({ queryKey: ['salesTrend'], queryFn: () => analyticsApi.getSalesTrend() });
  const { data: categories = [] } = useQuery({ queryKey: ['categories'], queryFn: () => analyticsApi.getCategoryPerformance() });
  const { data: health = [] } = useQuery({ queryKey: ['health'], queryFn: () => analyticsApi.getInventoryHealth() });
  const { data: recs = [] } = useQuery({ queryKey: ['aiRecs'], queryFn: () => aiApi.getRecommendations() });
  const { data: anomalies = [] } = useQuery({ queryKey: ['aiAnomalies'], queryFn: () => aiApi.getAnomalies() });

  const saleRows = sales as SaleRow[];
  const healthRows = health as HealthRow[];
  const totalRevenue = saleRows.reduce((acc, curr) => acc + (Number(curr.revenue) || 0), 0);
  const totalTrans = saleRows.reduce((acc, curr) => acc + (Number(curr.transactions) || 0), 0);
  const totalSkus = healthRows.reduce(
    (a, r) => a + (Number(r.healthy) || 0) + (Number(r.low) || 0) + (Number(r.critical) || 0),
    0
  );
  const totalHealthy = healthRows.reduce((a, r) => a + (Number(r.healthy) || 0), 0);
  const totalCritical = healthRows.reduce((a, r) => a + (Number(r.critical) || 0), 0);
  const healthPct = totalSkus > 0 ? Math.round((totalHealthy / totalSkus) * 1000) / 10 : 0;
  
  const COLORS = ['#ccff00', '#0f172a', '#8ca6b5', '#64748b'];

  const handleAiQuery = async () => {
    if (!query) return;
    const res = await aiApi.conversationalQuery(query);
    setAiAnswer(res);
  };

  const cardBase = "bg-white rounded-[2.5rem] p-8 soft-shadow border border-slate-100";

  return (
    <AppLayout title="Analytics">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: Metrics & Charts */}
        <div className="lg:col-span-8 space-y-8">
          
          {/* Top KPI Row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className={cardBase}>
              <div className="flex justify-between items-start mb-4">
                <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-[#0f172a]">
                  <TrendingUp size={24} />
                </div>
                <Badge className="bg-[#ccff00] text-[#0f172a] border-none font-black text-[9px] uppercase tracking-widest px-3">
                  {saleRows.length ? 'Live' : 'No data'}
                </Badge>
              </div>
              <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] mb-1">Mtd Revenue</p>
              <h2 className="text-3xl font-black tracking-tighter text-[#0f172a]">${totalRevenue.toLocaleString()}</h2>
            </div>

            <div className={cardBase}>
              <div className="flex justify-between items-start mb-4">
                <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-[#0f172a]">
                  <ShoppingCart size={24} />
                </div>
                <Badge className="bg-slate-100 text-slate-400 border-none font-black text-[9px] uppercase tracking-widest px-3">
                  {totalTrans > 0 ? 'POS' : '—'}
                </Badge>
              </div>
              <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] mb-1">Total Orders</p>
              <h2 className="text-3xl font-black tracking-tighter text-[#0f172a]">{totalTrans.toLocaleString()}</h2>
            </div>

            <div className={cardBase}>
              <div className="flex justify-between items-start mb-4">
                <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-[#0f172a]">
                  <Truck size={24} />
                </div>
                <Badge
                  className={cn(
                    'border-none font-black text-[9px] uppercase tracking-widest px-3',
                    totalCritical > 0 ? 'bg-rose-50 text-rose-500' : 'bg-slate-100 text-slate-400'
                  )}
                >
                  {totalSkus ? `${totalCritical} critical` : '—'}
                </Badge>
              </div>
              <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] mb-1">Stock Health</p>
              <h2 className="text-3xl font-black tracking-tighter text-[#0f172a]">
                {totalSkus ? `${healthPct}%` : '—'}
              </h2>
            </div>
          </div>

          {/* Sales Trend Chart */}
          <div className={cardBase + " h-[400px]"}>
            <div className="flex items-center justify-between mb-10">
              <h3 className="font-black text-xl tracking-tighter text-[#0f172a]">Sales Performance</h3>
              <div className="flex gap-2">
                <button className="px-5 py-2 rounded-full text-[10px] font-black uppercase tracking-widest bg-[#0f172a] text-white">30 Days</button>
                <button className="px-5 py-2 rounded-full text-[10px] font-black uppercase tracking-widest bg-slate-50 text-slate-400">90 Days</button>
              </div>
            </div>
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={saleRows}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis 
                    dataKey="date" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 10, fontWeight: 900, fill: '#cbd5e1' }}
                    tickFormatter={(val) => val.split('-').slice(1).join('/')}
                  />
                  <YAxis hide />
                  <Tooltip 
                    contentStyle={{ borderRadius: '1.5rem', border: 'none', boxShadow: '0 20px 50px rgba(0,0,0,0.1)', fontWeight: 900 }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="revenue" 
                    stroke="#ccff00" 
                    strokeWidth={4} 
                    dot={{ r: 6, fill: '#ccff00', strokeWidth: 3, stroke: '#fff' }}
                    activeDot={{ r: 8, strokeWidth: 0 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Category Performance & Health */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className={cardBase}>
              <h3 className="font-black text-lg tracking-tighter text-[#0f172a] mb-8">Department Mix</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categories}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="revenue"
                    >
                      {categories.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="grid grid-cols-2 gap-4 mt-4">
                {categories.map((c, i) => (
                  <div key={c.category} className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{c.category}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className={cardBase}>
              <h3 className="font-black text-lg tracking-tighter text-[#0f172a] mb-8">Regional Stock Status</h3>
              <div className="space-y-6">
                {healthRows.map((h) => {
                  const healthy = Number(h.healthy) || 0;
                  const low = Number(h.low) || 0;
                  const critical = Number(h.critical) || 0;
                  const total = healthy + low + critical;
                  const pctHealthy = total ? Math.round((healthy / total) * 100) : 0;
                  const wH = total ? (healthy / total) * 100 : 0;
                  const wL = total ? (low / total) * 100 : 0;
                  const wC = total ? (critical / total) * 100 : 0;
                  return (
                    <div key={String(h.region)} className="space-y-2">
                      <div className="flex justify-between text-[10px] font-black uppercase tracking-widest">
                        <span className="text-[#0f172a]">{h.region}</span>
                        <span className="text-slate-400">{pctHealthy}% healthy mix</span>
                      </div>
                      <div className="h-2 w-full bg-slate-50 rounded-full overflow-hidden flex">
                        <div className="h-full bg-[#ccff00] transition-all" style={{ width: `${wH}%` }} />
                        <div className="h-full bg-[#0f172a] transition-all" style={{ width: `${wL}%` }} />
                        <div className="h-full bg-rose-500 transition-all" style={{ width: `${wC}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: AI & Recommendations */}
        <div className="lg:col-span-4 space-y-8">
          
          {/* Agentic AI: Conversational Insight */}
          <div className="bg-[#0f172a] rounded-[2.5rem] p-10 text-white shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-10">
              <Sparkles size={120} />
            </div>
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-8">
                <div className="w-10 h-10 bg-[#ccff00] rounded-xl flex items-center justify-center text-[#0f172a]">
                  <Activity size={20} />
                </div>
                <h3 className="font-black text-xl tracking-tighter">AI Operational Copilot</h3>
              </div>
              
              <div className="space-y-6 mb-10">
                <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10">
                  <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-2">Live Response</p>
                  <p className="text-sm font-bold leading-relaxed">{aiAnswer?.answer || "Ask me about sales, stock levels, or anomalies across stores."}</p>
                </div>
                
                <div className="relative">
                  <input 
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Ask operational query..." 
                    className="w-full h-14 bg-white/10 border border-white/10 rounded-2xl px-6 text-sm font-bold placeholder:text-white/20 outline-none focus:bg-white/20 transition-all"
                  />
                  <button 
                    onClick={handleAiQuery}
                    className="absolute right-2 top-2 h-10 w-10 bg-[#ccff00] text-[#0f172a] rounded-xl flex items-center justify-center hover:scale-105 transition-all shadow-lg"
                  >
                    <MessageSquare size={18} strokeWidth={2.5} />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* AI: Anomaly Detection Feed */}
          <div className={cardBase + " bg-rose-50/30 border-rose-100"}>
            <div className="flex items-center gap-3 mb-8">
              <AlertTriangle className="text-rose-500" size={24} />
              <h3 className="font-black text-lg tracking-tighter text-[#0f172a]">Security Anomalies</h3>
            </div>
            <div className="space-y-4">
              {anomalies.map((a: any) => (
                <div key={a.id} className="bg-white p-6 rounded-2xl border border-rose-50 shadow-sm group hover:border-rose-200 transition-all">
                  <div className="flex justify-between mb-2">
                    <Badge className={cn(
                      "font-black text-[8px] uppercase px-2 py-0.5",
                      a.severity === 'High' ? "bg-rose-500 text-white" : "bg-orange-100 text-orange-600"
                    )}>{a.severity} Risk</Badge>
                    <span className="text-[10px] font-bold text-slate-300">{a.id}</span>
                  </div>
                  <p className="text-xs font-bold text-[#0f172a] leading-relaxed">{a.message}</p>
                </div>
              ))}
            </div>
          </div>

          {/* AI: Recommendations */}
          <div className={cardBase + " bg-[#ccff00]/5 border-[#ccff00]/20"}>
            <div className="flex items-center gap-3 mb-8">
              <Lightbulb className="text-[#0f172a]" size={24} />
              <h3 className="font-black text-lg tracking-tighter text-[#0f172a]">AI Growth Engine</h3>
            </div>
            <div className="space-y-4">
              {recs.map((r: any) => (
                <div key={r.product_id} className="bg-white p-6 rounded-2xl shadow-sm border border-[#ccff00]/10 flex items-center justify-between hover:scale-[1.02] transition-transform cursor-pointer">
                  <div>
                    <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">{r.category}</p>
                    <p className="text-sm font-black text-[#0f172a] line-clamp-1">{r.name}</p>
                    <p className="text-[9px] font-black text-[#ccff00] bg-[#0f172a] inline-block px-2 py-0.5 rounded mt-2 uppercase">{r.reason}</p>
                  </div>
                  <button className="w-10 h-10 bg-slate-50 text-[#0f172a] rounded-xl flex items-center justify-center">
                    <ChevronRight size={18} />
                  </button>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </AppLayout>
  );
}
