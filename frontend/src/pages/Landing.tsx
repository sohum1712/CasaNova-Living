import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Store, Shield, Package, CheckCircle2, ShieldCheck } from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';

const Landing = () => {
  const { isAuthenticated } = useAuthStore();
  const navigate = useNavigate();

  const loginTarget = isAuthenticated ? '/dashboard' : '/login';
  const registerTarget = isAuthenticated ? '/dashboard' : '/register';

  return (
    <div className="min-h-screen bg-[#f8fafc] text-[#0f172a] font-body selection:bg-[#ccff00]/30 selection:text-[#0f172a]">
      {/* Navigation */}
      <header className="fixed w-full top-0 z-50 bg-[#f8fafc]/80 backdrop-blur-xl border-b border-slate-100">
        <nav className="flex justify-between items-center px-12 py-6 max-w-[1440px] mx-auto">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#0f172a] flex items-center justify-center shadow-lg">
              <ShieldCheck size={22} strokeWidth={2.5} className="text-[#ccff00]" />
            </div>
            <span className="text-2xl font-black tracking-tight font-headline">CasaNova</span>
          </div>
          <div className="hidden md:flex items-center gap-10">
            <a href="#features" className="text-sm font-black text-slate-400 hover:text-[#0f172a] transition-colors uppercase tracking-widest">Features</a>
            <a href="#how-it-works" className="text-sm font-black text-slate-400 hover:text-[#0f172a] transition-colors uppercase tracking-widest">How it works</a>
          </div>
          <div className="flex items-center gap-6">
            <Link
              to={loginTarget}
              className="text-xs font-black text-[#0f172a] uppercase tracking-widest hover:opacity-70 transition-opacity"
            >
              {isAuthenticated ? 'Dashboard' : 'Sign In'}
            </Link>
            <Link to={registerTarget}>
              <button className="bg-[#ccff00] text-[#0f172a] px-8 py-3.5 rounded-2xl font-black transition-all hover:scale-105 active:scale-95 shadow-xl uppercase tracking-widest text-[10px]">
                {isAuthenticated ? 'Dashboard' : 'Get Started'}
              </button>
            </Link>
          </div>
        </nav>
      </header>

      <main>
        {/* Hero Section */}
        <section className="pt-52 pb-40 px-12 max-w-[1440px] mx-auto text-center">
          <div className="animate-in fade-in slide-in-from-bottom-10 duration-1000">
            <div className="inline-flex items-center gap-2 px-6 py-2.5 rounded-2xl bg-white border border-slate-100 text-[#0f172a] text-[10px] font-black uppercase tracking-[0.2em] mb-12 shadow-sm">
              <span className="w-2 h-2 rounded-full bg-[#ccff00] animate-pulse" />
              Modern Inventory for Every Business
            </div>
            <h1 className="text-7xl md:text-[8rem] font-black tracking-tighter leading-[0.9] mb-12 text-[#0f172a]">
              Manage your inventory <br />
              <span className="text-slate-200">with absolute ease.</span>
            </h1>
            <p className="text-xl text-slate-400 max-w-2xl mx-auto mb-16 font-semibold leading-relaxed">
              Ditch the complex spreadsheets. CasaNova provides a clean, fast, and powerful interface to track products, manage transfers, and grow your retail business in real-time.
            </p>
            <div className="flex flex-col sm:flex-row justify-center items-center gap-8">
              <Link to={registerTarget}>
                <button className="bg-[#0f172a] text-white px-12 py-5 rounded-2xl font-black transition-all hover:scale-105 active:scale-95 shadow-2xl uppercase tracking-widest text-xs">
                  {isAuthenticated ? 'Go to Dashboard' : 'Create Free Account'}
                </button>
              </Link>
              {!isAuthenticated && (
                <Link to="/login">
                  <button className="flex items-center gap-4 bg-white text-[#0f172a] px-12 py-5 rounded-2xl font-black transition-all hover:bg-slate-50 border border-slate-100 uppercase tracking-widest text-xs shadow-sm">
                    Sign In
                  </button>
                </Link>
              )}
              <a href="#features">
                <button className="flex items-center gap-4 bg-white text-[#0f172a] px-12 py-5 rounded-2xl font-black transition-all hover:bg-slate-50 border border-slate-100 uppercase tracking-widest text-xs shadow-sm">
                  Learn More
                </button>
              </a>
            </div>
          </div>
        </section>

        {/* Feature Grid */}
        <section id="features" className="py-40 px-12 max-w-[1440px] mx-auto">
          <div className="mb-24 text-center max-w-2xl mx-auto">
            <h2 className="text-5xl font-black tracking-tighter text-[#0f172a] mb-6">Everything you need <br />to stay organized.</h2>
            <p className="text-slate-400 font-semibold leading-relaxed">We built CasaNova to be the simplest way to handle complex inventory logistics.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            {[
              {
                title: 'Live Tracking',
                desc: 'Monitor stock levels across all your stores in real-time. Never run out of your best-selling items again.',
                icon: <Package className="text-[#0f172a]" />,
              },
              {
                title: 'Store Clusters',
                desc: 'Manage multiple retail nodes from a single dashboard. Create groups for warehouses and urban shops.',
                icon: <Store className="text-[#0f172a]" />,
              },
              {
                title: 'Secure Transfers',
                desc: 'Move inventory between locations with automated approval workflows and detailed digital receipts.',
                icon: <Shield className="text-[#0f172a]" />,
              },
            ].map((f, i) => (
              <div key={i} className="p-12 rounded-[3rem] bg-white border border-slate-100 transition-all hover:shadow-2xl hover:-translate-y-2 group cursor-default">
                <div className="mb-10 w-20 h-20 rounded-3xl bg-slate-50 flex items-center justify-center group-hover:bg-[#ccff00] transition-colors duration-500">
                  {React.cloneElement(f.icon as React.ReactElement, { size: 32, strokeWidth: 2.5 })}
                </div>
                <h3 className="text-2xl font-black text-[#0f172a] mb-6 tracking-tight">{f.title}</h3>
                <p className="text-slate-400 font-semibold leading-relaxed text-sm">{f.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Showcase Section */}
        <section id="how-it-works" className="py-40 px-12 bg-white/50">
          <div className="max-w-[1440px] mx-auto">
            <div className="grid lg:grid-cols-2 gap-32 items-center">
              <div className="space-y-12">
                <div className="w-12 h-1 bg-[#ccff00] rounded-full" />
                <h2 className="text-6xl font-black text-[#0f172a] tracking-tighter leading-[0.95]">
                  Detailed insights <br /> for your growth.
                </h2>
                <div className="space-y-8">
                  {[
                    'Unified dashboard for all sales channels',
                    'Automated stock replenishment alerts',
                    'Detailed SKU movement history',
                    'Multiple user roles and permissions',
                  ].map((text, i) => (
                    <div key={i} className="flex items-center gap-4">
                      <div className="w-6 h-6 rounded-lg bg-slate-100 flex items-center justify-center text-[#0f172a]">
                        <CheckCircle2 size={16} strokeWidth={3} />
                      </div>
                      <span className="font-bold text-slate-500">{text}</span>
                    </div>
                  ))}
                </div>
                <Link to={registerTarget}>
                  <button className="bg-[#ccff00] text-[#0f172a] px-14 py-5 rounded-2xl font-black transition-all hover:scale-105 active:scale-95 shadow-xl uppercase tracking-widest text-xs">
                    {isAuthenticated ? 'Open Dashboard' : 'Get Started Free'}
                  </button>
                </Link>
              </div>
              <div className="relative group">
                <div className="absolute inset-0 bg-[#ccff00]/10 rounded-[4rem] blur-3xl group-hover:bg-[#ccff00]/20 transition-all duration-1000" />
                <div className="relative bg-white rounded-[4rem] border border-slate-100 p-2 shadow-2xl overflow-hidden aspect-[4/3] flex items-center justify-center">
                  <div className="absolute inset-0 bg-slate-50 flex items-end justify-around px-20 pb-40 opacity-20">
                    {[60, 80, 40, 90, 70].map((h, i) => (
                      <div key={i} className="w-4 bg-[#0f172a] rounded-full" style={{ height: `${h}%` }} />
                    ))}
                  </div>
                  <div className="relative w-full max-w-sm bg-white rounded-[3rem] shadow-[0_40px_100px_rgba(0,0,0,0.08)] border border-slate-100 p-12 transition-transform duration-700 hover:scale-105">
                    <div className="w-20 h-2.5 bg-slate-100 rounded-full mb-10" />
                    <div className="space-y-6">
                      <div className="h-10 bg-[#ccff00] rounded-full w-full shadow-[0_0_30px_rgba(204,255,0,0.4)]" />
                      <div className="h-4 bg-slate-50 rounded-full w-2/3" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Closing CTA */}
        <section className="py-60 px-12 text-center bg-[#0f172a] relative overflow-hidden">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1200px] h-[1200px] bg-[#ccff00]/5 rounded-full blur-[200px] pointer-events-none" />
          <div className="relative z-10 max-w-4xl mx-auto space-y-12">
            <h2 className="text-7xl md:text-9xl font-black text-white tracking-tighter leading-[0.85]">
              The retail stack <span className="text-[#ccff00]">you deserve.</span>
            </h2>
            <p className="text-xl text-slate-400 font-bold max-w-2xl mx-auto">
              Join thousands of retailers who scaled their business with CasaNova.
            </p>
            <div className="flex flex-col sm:flex-row justify-center items-center gap-8 pt-8">
              <Link to={registerTarget}>
                <button className="bg-[#ccff00] text-[#0f172a] px-16 py-6 rounded-2xl font-black transition-all hover:scale-110 active:scale-95 shadow-[0_20px_80px_rgba(204,255,0,0.2)] uppercase tracking-widest text-sm">
                  {isAuthenticated ? 'Open Dashboard' : 'Create Free Account'}
                </button>
              </Link>
              {!isAuthenticated && (
                <Link to="/login">
                  <button className="bg-white/10 text-white border border-white/10 px-16 py-6 rounded-2xl font-black transition-all hover:bg-white/20 uppercase tracking-widest text-sm">
                    Sign In
                  </button>
                </Link>
              )}
            </div>
          </div>
        </section>
      </main>

      <footer className="py-24 px-12 border-t border-slate-100">
        <div className="max-w-[1440px] mx-auto flex flex-col md:flex-row justify-between items-center gap-12">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center">
              <div className="w-3 h-3 bg-slate-400 rounded-sm" />
            </div>
            <span className="text-xl font-black tracking-tight font-headline">CasaNova</span>
          </div>
          <p className="text-xs font-black uppercase tracking-widest text-slate-300">© 2024 CasaNova Systems. Built for enterprise.</p>
          <div className="flex gap-10 text-[10px] font-black uppercase tracking-widest text-slate-400">
            <a href="#" className="hover:text-[#0f172a] transition-colors">Privacy</a>
            <a href="#" className="hover:text-[#0f172a] transition-colors">Terms</a>
            <a href="#" className="hover:text-[#0f172a] transition-colors">Contact</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
