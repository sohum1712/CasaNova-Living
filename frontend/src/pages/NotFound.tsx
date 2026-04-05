import { Link, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import { ShieldCheck } from 'lucide-react';

const NotFound = () => {
  const location = useLocation();
  const { isAuthenticated } = useAuthStore();

  useEffect(() => {
    console.error('404: Route not found:', location.pathname);
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-[#0f172a] flex items-center justify-center p-6">
      <div className="text-center space-y-8">
        <div className="w-20 h-20 bg-[#ccff00] rounded-2xl flex items-center justify-center mx-auto shadow-[0_0_40px_rgba(204,255,0,0.3)]">
          <ShieldCheck size={40} strokeWidth={2.5} className="text-[#0f172a]" />
        </div>
        <div>
          <h1 className="text-8xl font-black text-white tracking-tighter">404</h1>
          <p className="text-white/50 font-bold mt-4 text-lg">This page doesn't exist.</p>
          <p className="text-white/30 text-sm mt-2 font-mono">{location.pathname}</p>
        </div>
        <Link
          to={isAuthenticated ? '/dashboard' : '/login'}
          className="inline-block bg-[#ccff00] text-[#0f172a] px-10 py-4 rounded-2xl font-black uppercase tracking-widest text-xs hover:scale-105 transition-all shadow-xl"
        >
          {isAuthenticated ? 'Back to Dashboard' : 'Go to Login'}
        </Link>
      </div>
    </div>
  );
};

export default NotFound;
