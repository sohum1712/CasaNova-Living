import React, { useMemo, useState } from 'react';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/useAuthStore';
import { cn } from '@/lib/utils';
import {
  User, Store, LogOut, Check,
  BarChart3, Package, ShoppingCart, Truck,
  ShieldCheck, ArrowLeft, ArrowRight, Users,
} from 'lucide-react';

const PEOPLE_ROLES = ['head_office_admin', 'area_manager', 'store_supervisor'] as const;

interface AppLayoutProps {
  children: React.ReactNode;
  title: string;
}

export const AppLayout: React.FC<AppLayoutProps> = ({ children, title }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout, hasAnyRole } = useAuthStore();
  const [showRoleMenu, setShowRoleMenu] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = useMemo(() => {
    const all = [
      { label: 'Metrics', path: '/dashboard', icon: BarChart3 },
      { label: 'Inventory', path: '/products', icon: Package },
      { label: 'Stores', path: '/stores', icon: Store },
      { label: 'Billing', path: '/pos', icon: ShoppingCart },
      { label: 'Transfers', path: '/transfers', icon: Truck },
      { label: 'People', path: '/users', icon: Users },
    ];
    const seePeople = hasAnyRole([...PEOPLE_ROLES]);
    return all.filter((item) => item.path !== '/users' || seePeople);
  }, [hasAnyRole, user?.role]);

  const NavButton = ({ label, path, icon: Icon }: any) => {
    const active = location.pathname === path;
    return (
      <Link 
        to={path}
        className={cn(
          "px-6 py-2.5 rounded-full text-[11px] font-black uppercase tracking-widest transition-all flex items-center gap-2",
          active 
            ? "bg-[#ccff00] text-[#0f172a] shadow-[0_10px_30px_rgba(204,255,0,0.3)]" 
            : "text-[#0f172a]/40 hover:text-[#0f172a] hover:bg-slate-50"
        )}
      >
        <Icon size={14} strokeWidth={3} />
        {label}
      </Link>
    );
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] text-[#0f172a] font-body selection:bg-[#ccff00]/30 selection:text-[#0f172a]">
      
      {/* Global Top Navbar */}
      <nav className="fixed top-0 inset-x-0 bg-white/80 backdrop-blur-2xl border-b border-slate-100 z-[100] h-24 flex items-center px-12 justify-between">
        <div className="flex items-center gap-12">
          {/* Logo */}
          <Link to="/dashboard" className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#0f172a] rounded-xl flex items-center justify-center shadow-xl">
              <ShieldCheck size={22} strokeWidth={2.5} className="text-[#ccff00]" />
            </div>
            <span className="text-xl font-black tracking-tighter">CasaNova</span>
          </Link>

          {/* History Navigation */}
          <div className="flex items-center gap-2 bg-slate-50 p-1.5 rounded-2xl border border-slate-100">
            <button
              type="button"
              title="Back"
              onClick={() => navigate(-1)}
              className="w-10 h-10 rounded-xl hover:bg-white hover:shadow-sm transition-all flex items-center justify-center text-slate-400 hover:text-[#0f172a]"
            >
              <ArrowLeft size={18} strokeWidth={2.5} />
            </button>
            <button
              type="button"
              title="Forward"
              onClick={() => navigate(1)}
              className="w-10 h-10 rounded-xl hover:bg-white hover:shadow-sm transition-all flex items-center justify-center text-slate-400 hover:text-[#0f172a]"
            >
              <ArrowRight size={18} strokeWidth={2.5} />
            </button>
          </div>

          {/* Main Navigation Pill */}
          <div className="flex items-center gap-1 bg-white border border-slate-100 p-1 rounded-full shadow-sm">
            {navItems.map(item => <NavButton key={item.label} {...item} />)}
          </div>
        </div>

        <div className="flex items-center gap-8">
          {/* User Profile */}
          <div className="relative">
            <button 
              onClick={() => setShowRoleMenu(!showRoleMenu)}
              className="flex items-center gap-4 group"
            >
              <div className="text-right hidden sm:block">
                <p className="text-[10px] font-black uppercase tracking-widest text-[#0f172a]">{user?.role?.replace(/_/g, ' ') || 'Floor Associate'}</p>
                <p className="text-[9px] font-bold text-slate-300">{user?.first_name ? `${user.first_name} ${user.last_name || ''}`.trim() : user?.username || 'Guest'}</p>
              </div>
              <div className="w-12 h-12 bg-white border border-slate-100 rounded-2xl flex items-center justify-center shadow-sm group-hover:shadow-md transition-all">
                <User size={20} strokeWidth={2.5} className="text-[#0f172a]" />
              </div>
            </button>

            {showRoleMenu && (
              <div className="absolute top-full right-0 mt-4 w-64 bg-white rounded-[2.5rem] shadow-2xl border border-slate-50 p-6 z-[110] animate-in fade-in slide-in-from-top-4 duration-300">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-300 px-2 mb-4">Account Reference</p>
                <div className="space-y-1">
                  <div className="w-full flex items-center justify-between px-4 py-3 rounded-xl text-xs font-bold bg-[#ccff00]/10 text-[#0f172a]">
                    Active Session
                    <Check size={14} strokeWidth={3} />
                  </div>
                </div>
                <div className="mt-6 pt-6 border-t border-slate-50">
                  <button 
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-[11px] font-black text-rose-500 hover:bg-rose-50 transition-all uppercase tracking-widest"
                  >
                    <LogOut size={16} strokeWidth={2.5} />
                    System Sign Out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* Main Content Area */}
      <div className="pt-32 p-12 max-w-[1600px] mx-auto">
        <div className="mb-12">
          <h2 className="text-4xl font-black tracking-tighter text-[#0f172a]">{title}</h2>
        </div>
        <main>{children}</main>
      </div>
    </div>
  );
};
