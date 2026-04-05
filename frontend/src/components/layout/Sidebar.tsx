import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, ShoppingCart, ArrowLeftRight, Package, Store, Moon, Sun, X, ChevronRight } from 'lucide-react';
import { useDarkModeStore } from '@/store/useDarkModeStore';
import { cn } from '@/lib/utils';

const NAV = [
  { to: '/dashboard', label: 'Management', icon: LayoutDashboard, exact: true, desc: 'KPIs & analytics' },
  { to: '/pos', label: 'POS Billing', icon: ShoppingCart, desc: 'Quick checkout' },
  { to: '/transfers', label: 'Stock Transfer', icon: ArrowLeftRight, desc: 'Move inventory' },
  { to: '/products', label: 'Products', icon: Package, desc: 'Catalog management' },
  { to: '/stores', label: 'Stores', icon: Store, desc: 'Multi-store ops' },
];

interface SidebarProps { open: boolean; onClose: () => void; }

export const Sidebar: React.FC<SidebarProps> = ({ open, onClose }) => {
  const { isDarkMode, toggleDarkMode } = useDarkModeStore();

  return (
    <>
      {open && <div className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-md md:hidden" onClick={onClose} />}
      <aside className={cn(
        'fixed top-0 left-0 h-full z-[70] flex flex-col w-64 transition-transform duration-500 bg-cn-surface-container-lowest',
        open ? 'translate-x-0' : '-translate-x-full md:translate-x-0',
      )}>
        {/* Logo */}
        <div className="flex items-center gap-4 px-8 py-10">
          <NavLink to="/" className="flex items-center gap-4 group">
            <div className="w-10 h-10 rounded-lg bg-cn-primary/10 flex items-center justify-center shrink-0 transition-transform duration-500 group-hover:rotate-12">
              <span className="text-cn-primary font-black text-xl tracking-tighter">C</span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-cn-on-surface font-black text-2xl tracking-tighter font-headline leading-none">CasaNova</div>
              <div className="text-cn-primary/40 text-[9px] uppercase tracking-[0.3em] font-bold mt-1.5 opacity-80">Inventory Hub</div>
            </div>
          </NavLink>
          <button className="md:hidden text-cn-on-surface-variant hover:text-cn-on-surface" onClick={onClose}><X size={20} /></button>
        </div>

        {/* Nav */}
        <nav className="flex-1 py-4 space-y-1 overflow-y-auto">
          <p className="text-cn-on-surface-variant/20 text-[10px] font-bold uppercase tracking-[0.25em] px-8 mb-6">Operations Center</p>
          {NAV.map(({ to, label, icon: Icon, exact, desc }) => (
            <NavLink key={to} to={to} end={exact} onClick={onClose}
              className={({ isActive }) => cn(
                'group flex items-center gap-4 px-8 py-4 transition-all text-sm font-medium relative',
                isActive
                  ? 'bg-cn-primary-container/10 text-cn-on-surface'
                  : 'text-cn-on-surface-variant hover:bg-cn-surface-container-low hover:text-cn-on-surface',
              )}
            >
              {({ isActive }) => (
                <>
                  {/* Teal Pillar */}
                  {isActive && <div className="absolute left-0 top-0 bottom-0 w-1 bg-cn-primary shadow-[0_0_12px_rgba(107,216,203,0.6)]" />}
                  
                  <div className={cn('transition-all duration-300', isActive ? 'text-cn-primary scale-110' : 'group-hover:text-cn-primary')}>
                    <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-bold tracking-tight">{label}</div>
                    <div className="text-[10px] text-cn-on-surface-variant/60 font-medium group-hover:text-cn-on-surface-variant transition-colors mt-0.5">{desc}</div>
                  </div>
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Footer */}
        <div className="px-6 py-8 space-y-4">
          <button onClick={toggleDarkMode}
            className="w-full flex items-center gap-4 px-4 py-3 rounded-lg text-cn-on-surface-variant hover:bg-cn-surface-container-low hover:text-cn-on-surface transition-all text-sm font-medium"
          >
            <div className="p-2 rounded-lg bg-cn-surface-container-high transition-colors group-hover:bg-cn-surface-container-highest">
              {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
            </div>
            <span className="font-bold tracking-tight">Focus Mode</span>
          </button>
          <div className="px-4 py-2 flex items-center justify-between opacity-30">
            <div className="text-cn-on-surface-variant text-[9px] font-bold tracking-[0.2em] uppercase">Enterprise Build 4.2</div>
            <div className="w-1.5 h-1.5 rounded-full bg-cn-primary"></div>
          </div>
        </div>
      </aside>
    </>
  );
};

export const SidebarToggle: React.FC<{ onClick: () => void }> = ({ onClick }) => (
  <button onClick={onClick}
    className="md:hidden fixed top-6 left-6 z-[80] p-3 rounded-xl glass-dark text-white border border-white/10 shadow-2xl hover:bg-white/10 transition-all hover:scale-110 active:scale-95"
  >
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
      <line x1="4" y1="7" x2="20" y2="7" /><line x1="4" y1="12" x2="20" y2="12" /><line x1="4" y1="17" x2="20" y2="17" />
    </svg>
  </button>
);
