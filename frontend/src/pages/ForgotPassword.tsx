import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { apiClient } from '@/api/config/apiClient';
import { ShieldCheck, ArrowLeft, Loader2, Mail } from 'lucide-react';
import { toast } from 'sonner';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [devHint, setDevHint] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      toast.error('Enter your email');
      return;
    }
    setLoading(true);
    setDevHint(null);
    try {
      const res = await apiClient.post('/auth/forgot-password', { email: email.trim().toLowerCase() });
      const data = res.data?.data as { reset_token?: string; reset_url_path?: string } | undefined;
      toast.success('Check your instructions', {
        description: res.data?.message || 'If an account exists for that email, you can reset your password.',
      });
      if (data?.reset_token) {
        const hint = data.reset_url_path
          ? `Dev: open ${data.reset_url_path} or use token below.`
          : `Dev token: ${data.reset_token}`;
        setDevHint(hint);
      }
    } catch (err: unknown) {
      toast.error('Request failed', { description: 'Something went wrong. Please try again later.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0f172a] flex items-center justify-center p-6 selection:bg-[#ccff00]/30">
      <div className="w-full max-w-[440px] relative">
        <div className="bg-white/[0.03] backdrop-blur-3xl border border-white/10 rounded-[32px] p-10 shadow-2xl">
          <div className="flex flex-col items-center mb-8">
            <div className="w-14 h-14 bg-[#ccff00] rounded-2xl flex items-center justify-center mb-5">
              <ShieldCheck size={30} strokeWidth={2.5} className="text-[#0f172a]" />
            </div>
            <h1 className="text-2xl font-black text-white tracking-tight mb-2">Reset password</h1>
            <p className="text-white/50 text-sm text-center">
              Enter the email on your account. We&apos;ll send reset steps when mail is configured.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" size={18} />
              <input
                type="email"
                required
                placeholder="Work email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-white/[0.05] border border-white/10 text-white rounded-2xl py-4 pl-12 pr-4 outline-none focus:border-[#ccff00]/50 font-medium placeholder:text-white/25"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#ccff00] hover:bg-[#d9ff33] text-[#0f172a] font-black py-4 rounded-2xl flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {loading ? <Loader2 className="animate-spin" size={20} /> : 'Send reset link'}
            </button>
          </form>

          {devHint && (
            <p className="mt-4 text-[10px] font-mono text-[#ccff00]/90 break-all bg-black/30 rounded-xl p-3 border border-white/10">
              {devHint}
            </p>
          )}

          <div className="mt-8 pt-6 border-t border-white/10 flex flex-col gap-3 text-center">
            <Link
              to="/login"
              className="inline-flex items-center justify-center gap-2 text-[11px] font-bold text-white/50 hover:text-[#ccff00]"
            >
              <ArrowLeft size={14} /> Back to sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
