import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/store/useAuthStore';
import { apiClient } from '@/api/config/apiClient';
import { ShieldCheck, ArrowRight, Loader2, Lock, Store, Mail, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';

const Login = () => {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isAuthenticated } = useAuthStore();
  const redirectTo =
    (location.state as { from?: { pathname?: string } } | null)?.from?.pathname || '/dashboard';
  const sessionToastShown = useRef(false);

  useEffect(() => {
    if (
      (location.state as { sessionExpired?: boolean } | null)?.sessionExpired &&
      !sessionToastShown.current
    ) {
      sessionToastShown.current = true;
      toast.message('Session ended', { description: 'Please sign in again to continue.' });
    }
  }, [location.state]);

  useEffect(() => {
    if (isAuthenticated) {
      navigate(redirectTo, { replace: true });
    }
  }, [isAuthenticated, navigate, redirectTo]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier.trim() || !password.trim()) {
      toast.error('Missing credentials', {
        description: 'Enter your username or email and password.',
      });
      return;
    }
    setLoading(true);
    try {
      const response = await apiClient.post('/auth/login', {
        username: identifier.trim(),
        password,
      });
      const { access_token, user_id, role, username: resolvedUsername } = response.data;

      login(access_token, {
        user_id,
        username: resolvedUsername ?? identifier.trim(),
        role,
      });

      try {
        const profileRes = await apiClient.get('/auth/me');
        login(access_token, profileRes.data);
      } catch {
        // non-fatal
      }

      const displayName = resolvedUsername ?? identifier.trim();
      toast.success('Access granted', {
        description: `Welcome back, ${displayName}.`,
      });
      navigate(redirectTo, { replace: true });
    } catch (error: unknown) {
      const err = error as { response?: { data?: { detail?: string } }; code?: string; message?: string };
      const detail =
        err.response?.data?.detail ||
        (err.code === 'ERR_NETWORK' ? 'Cannot reach server. Is the backend running on port 8000?' : null) ||
        err.message ||
        'Invalid email/username or password.';
      toast.error('Sign-in failed', { description: detail });
    } finally {
      setLoading(false);
    }
  };

  const inputPadRight = 'pr-14';

  return (
    <div className="min-h-screen bg-[#0f172a] flex items-center justify-center p-6 selection:bg-[#ccff00]/30 selection:text-[#0f172a]">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-[#ccff00]/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[400px] h-[400px] bg-blue-500/10 rounded-full blur-[120px]" />
      </div>

      <div className="w-full max-w-[440px] relative">
        <div className="bg-white/[0.03] backdrop-blur-3xl border border-white/10 rounded-[32px] p-10 shadow-2xl relative overflow-hidden">
          <div className="flex flex-col items-center mb-10">
            <div className="w-16 h-16 bg-[#ccff00] rounded-2xl flex items-center justify-center shadow-[0_0_25px_rgba(204,255,0,0.3)] mb-6 animate-in zoom-in duration-700">
              <ShieldCheck size={36} strokeWidth={2.5} className="text-[#0f172a]" />
            </div>
            <h1 className="text-3xl font-black text-white tracking-tight mb-2">Command Center</h1>
            <p className="text-white/50 text-sm font-medium">CasaNova Living — Sign in</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <div className="relative group">
                <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-white/30 group-focus-within:text-[#ccff00] transition-colors">
                  <Mail size={18} />
                </div>
                <input
                  type="text"
                  placeholder="Username or work email"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  autoComplete="username"
                  className={`w-full bg-white/[0.05] border border-white/10 text-white rounded-2xl py-4 pl-12 pr-4 outline-none focus:border-[#ccff00]/50 focus:bg-white/[0.08] transition-all placeholder:text-white/20 font-medium`}
                  required
                />
              </div>

              <div className="relative group">
                <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-white/30 group-focus-within:text-[#ccff00] transition-colors">
                  <Lock size={18} />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  className={`w-full bg-white/[0.05] border border-white/10 text-white rounded-2xl py-4 pl-12 ${inputPadRight} outline-none focus:border-[#ccff00]/50 focus:bg-white/[0.08] transition-all placeholder:text-white/20 font-medium`}
                  required
                />
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={() => setShowPassword((s) => !s)}
                  className="absolute inset-y-0 right-3 flex items-center text-white/40 hover:text-[#ccff00] transition-colors p-1"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            <div className="flex justify-end -mt-2">
              <Link
                to="/forgot-password"
                className="text-[11px] font-bold text-[#ccff00]/80 hover:text-[#ccff00] transition-colors"
              >
                Forgot password?
              </Link>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#ccff00] hover:bg-[#d9ff33] text-[#0f172a] font-black py-4 rounded-2xl transition-all shadow-[0_0_20px_rgba(204,255,0,0.2)] active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? (
                <Loader2 className="animate-spin" size={20} />
              ) : (
                <>
                  SIGN IN
                  <ArrowRight size={20} strokeWidth={2.5} />
                </>
              )}
            </button>
          </form>

          <div className="mt-8 pt-8 border-t border-white/5 flex flex-col items-center gap-4">
            <p className="text-white/40 text-xs font-bold">
              No account?{' '}
              <Link to="/register" className="text-[#ccff00] hover:text-white transition-colors">
                Create one
              </Link>
            </p>
            <Link
              to="/"
              className="text-white/30 hover:text-white text-[10px] font-bold uppercase tracking-widest transition-colors"
            >
              Back to Home
            </Link>
            <div className="flex items-center gap-2 px-3 py-1.5 bg-white/[0.05] rounded-full border border-white/5">
              <Store size={12} className="text-[#ccff00]" />
              <span className="text-[10px] font-black text-white/50 uppercase tracking-widest">
                Authorized Personnel Only
              </span>
            </div>
          </div>
        </div>

        <p className="text-center text-white/20 text-[10px] font-black uppercase tracking-[0.2em] mt-8">
          CasaNova Living • Secure Access Portal
        </p>
      </div>
    </div>
  );
};

export default Login;
