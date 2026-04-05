import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { apiClient } from '@/api/config/apiClient';
import { ShieldCheck, Loader2, Lock, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [token, setToken] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const t = searchParams.get('token');
    if (t) setToken(t);
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
      toast.error('Password too short', { description: 'Use at least 6 characters.' });
      return;
    }
    if (password !== confirm) {
      toast.error('Passwords do not match');
      return;
    }
    if (!token.trim()) {
      toast.error('Missing token', { description: 'Open the reset link from your email (or dev hint).' });
      return;
    }
    setLoading(true);
    try {
      await apiClient.post('/auth/reset-password', { token: token.trim(), password });
      toast.success('Password updated', { description: 'You can sign in with your new password.' });
      navigate('/login', { replace: false });
    } catch (err: unknown) {
      const e = err as { response?: { data?: { detail?: string } } };
      toast.error('Reset failed', { description: e.response?.data?.detail || 'Link may be expired.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0f172a] flex items-center justify-center p-6 selection:bg-[#ccff00]/30">
      <div className="w-full max-w-[440px] relative">
        <div className="bg-white/[0.03] backdrop-blur-3xl border border-white/10 rounded-[32px] p-10 shadow-2xl space-y-6">
          <div className="flex flex-col items-center">
            <div className="w-14 h-14 bg-[#ccff00] rounded-2xl flex items-center justify-center mb-5">
              <ShieldCheck size={30} strokeWidth={2.5} className="text-[#0f172a]" />
            </div>
            <h1 className="text-2xl font-black text-white tracking-tight">New password</h1>
            <p className="text-white/50 text-sm mt-1 text-center">Choose a strong password for your account.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-white/40 block mb-2">
                Reset token
              </label>
              <input
                type="text"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                placeholder="Paste token if not in URL"
                className="w-full bg-white/[0.05] border border-white/10 text-white rounded-2xl py-3 px-4 text-sm font-mono outline-none focus:border-[#ccff00]/50"
              />
            </div>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" size={18} />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="New password (min 6)"
                className="w-full bg-white/[0.05] border border-white/10 text-white rounded-2xl py-4 pl-12 pr-12 outline-none focus:border-[#ccff00]/50"
              />
              <button
                type="button"
                onClick={() => setShowPassword((s) => !s)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-[#ccff00]"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" size={18} />
              <input
                type={showPassword ? 'text' : 'password'}
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder="Confirm password"
                className="w-full bg-white/[0.05] border border-white/10 text-white rounded-2xl py-4 pl-12 pr-4 outline-none focus:border-[#ccff00]/50"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#ccff00] text-[#0f172a] font-black py-4 rounded-2xl disabled:opacity-60 flex justify-center"
            >
              {loading ? <Loader2 className="animate-spin" size={20} /> : 'Update password'}
            </button>
          </form>

          <Link to="/login" className="block text-center text-[11px] font-bold text-[#ccff00]/80 hover:text-[#ccff00]">
            Back to sign in
          </Link>
        </div>
      </div>
    </div>
  );
}
