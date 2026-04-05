import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '@/store/useAuthStore';
import { apiClient } from '@/api/config/apiClient';
import {
  ShieldCheck, ArrowRight, Loader2, Lock, User, Mail,
  Building2, MapPin, ChevronDown, Eye, EyeOff,
} from 'lucide-react';
import { toast } from 'sonner';

const ROLES = [
  { value: 'floor_associate', label: 'Floor Associate' },
  { value: 'store_supervisor', label: 'Store Supervisor' },
  { value: 'area_manager', label: 'Area Manager' },
  { value: 'head_office_admin', label: 'Head Office Admin' },
];

interface StoreOption {
  store_id: number;
  store_name: string;
  store_code: string;
  region: string;
}

const inputClass =
  'w-full bg-white/[0.05] border border-white/10 text-white rounded-2xl py-4 pl-12 pr-4 outline-none focus:border-[#ccff00]/50 focus:bg-white/[0.08] transition-all placeholder:text-white/20 font-medium';

const selectClass =
  'w-full bg-white/[0.05] border border-white/10 text-white rounded-2xl py-4 pl-12 pr-10 outline-none focus:border-[#ccff00]/50 focus:bg-white/[0.08] transition-all font-medium appearance-none cursor-pointer';

export default function Register() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();

  const [stores, setStores] = useState<StoreOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [form, setForm] = useState({
    first_name: '',
    last_name: '',
    username: '',
    email: '',
    password: '',
    confirm_password: '',
    role: 'floor_associate',
    store_id: '',
    region: '',
  });

  // Redirect if already logged in
  useEffect(() => {
    if (isAuthenticated) navigate('/dashboard', { replace: true });
  }, [isAuthenticated, navigate]);

  // Load stores for dropdown (public endpoint)
  useEffect(() => {
    apiClient.get('/auth/stores-public')
      .then(r => setStores(r.data))
      .catch(() => setStores([]));
  }, []);

  const set = (key: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm(f => ({ ...f, [key]: e.target.value }));

  // Auto-fill region when store is selected
  const handleStoreChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = e.target.value;
    const store = stores.find(s => String(s.store_id) === id);
    setForm(f => ({ ...f, store_id: id, region: store?.region || f.region }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.password !== form.confirm_password) {
      toast.error('Passwords do not match');
      return;
    }
    if (form.password.length < 6) {
      toast.error('Password too short', { description: 'Minimum 6 characters required.' });
      return;
    }
    setLoading(true);
    try {
      const res = await apiClient.post('/auth/register', {
        username:   form.username.trim(),
        email:      form.email.trim().toLowerCase(),
        password:   form.password,
        first_name: form.first_name.trim(),
        last_name:  form.last_name.trim(),
        role:       form.role,
        store_id:   form.store_id ? Number(form.store_id) : null,
        region:     form.region.trim() || null,
        avatar_url: null,
      });
      toast.success('Account created!', {
        description: 'You can now sign in with your credentials.',
      });
      navigate('/login', { replace: false });
    } catch (err: any) {
      // Show the real backend error, not a generic message
      const detail =
        err.response?.data?.detail ||
        err.response?.data?.message ||
        (err.code === 'ERR_NETWORK' ? 'Cannot reach server. Is the backend running?' : null) ||
        err.message ||
        'Registration failed. Please try again.';
      toast.error('Registration failed', { description: detail });
    } finally {
      setLoading(false);
    }
  };

  const isValid =
    form.first_name && form.last_name && form.username &&
    form.email && form.password && form.confirm_password &&
    form.password === form.confirm_password;

  return (
    <div className="min-h-screen bg-[#0f172a] flex items-center justify-center p-6 selection:bg-[#ccff00]/30">
      {/* Background glows */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-[#ccff00]/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[400px] h-[400px] bg-blue-500/10 rounded-full blur-[120px]" />
      </div>

      <div className="w-full max-w-[520px] relative py-8">
        <div className="bg-white/[0.03] backdrop-blur-3xl border border-white/10 rounded-[32px] p-10 shadow-2xl">
          {/* Header */}
          <div className="flex flex-col items-center mb-10">
            <div className="w-16 h-16 bg-[#ccff00] rounded-2xl flex items-center justify-center shadow-[0_0_25px_rgba(204,255,0,0.3)] mb-6 animate-in zoom-in duration-700">
              <ShieldCheck size={36} strokeWidth={2.5} className="text-[#0f172a]" />
            </div>
            <h1 className="text-3xl font-black text-white tracking-tight mb-2">Create Account</h1>
            <p className="text-white/50 text-sm font-medium">CasaNova Living — Staff Registration</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Name row */}
            <div className="grid grid-cols-2 gap-4">
              <div className="relative group">
                <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-white/30 group-focus-within:text-[#ccff00] transition-colors">
                  <User size={16} />
                </div>
                <input
                  type="text" placeholder="First name" value={form.first_name}
                  onChange={set('first_name')} required
                  className={inputClass}
                />
              </div>
              <div className="relative group">
                <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-white/30 group-focus-within:text-[#ccff00] transition-colors">
                  <User size={16} />
                </div>
                <input
                  type="text" placeholder="Last name" value={form.last_name}
                  onChange={set('last_name')} required
                  className={inputClass}
                />
              </div>
            </div>

            {/* Username */}
            <div className="relative group">
              <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-white/30 group-focus-within:text-[#ccff00] transition-colors">
                <User size={18} />
              </div>
              <input
                type="text" placeholder="Username / Staff ID" value={form.username}
                onChange={set('username')} required autoComplete="username"
                className={inputClass}
              />
            </div>

            {/* Email */}
            <div className="relative group">
              <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-white/30 group-focus-within:text-[#ccff00] transition-colors">
                <Mail size={18} />
              </div>
              <input
                type="email" placeholder="Email address" value={form.email}
                onChange={set('email')} required autoComplete="email"
                className={inputClass}
              />
            </div>

            {/* Role */}
            <div className="relative group">
              <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-white/30 group-focus-within:text-[#ccff00] transition-colors z-10">
                <Building2 size={18} />
              </div>
              <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none text-white/30">
                <ChevronDown size={16} />
              </div>
              <select value={form.role} onChange={set('role')} className={selectClass}>
                {ROLES.map(r => (
                  <option key={r.value} value={r.value} className="bg-[#0f172a] text-white">
                    {r.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Store */}
            <div className="relative group">
              <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-white/30 group-focus-within:text-[#ccff00] transition-colors z-10">
                <MapPin size={18} />
              </div>
              <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none text-white/30">
                <ChevronDown size={16} />
              </div>
              <select value={form.store_id} onChange={handleStoreChange} className={selectClass}>
                <option value="" className="bg-[#0f172a] text-white/50">Assign to store (optional)</option>
                {stores.map(s => (
                  <option key={s.store_id} value={s.store_id} className="bg-[#0f172a] text-white">
                    {s.store_name} — {s.region}
                  </option>
                ))}
              </select>
            </div>

            {/* Region (auto-filled or manual) */}
            <div className="relative group">
              <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-white/30 group-focus-within:text-[#ccff00] transition-colors">
                <MapPin size={18} />
              </div>
              <input
                type="text" placeholder="Region (e.g. North, South)" value={form.region}
                onChange={set('region')}
                className={inputClass}
              />
            </div>

            {/* Password */}
            <div className="relative group">
              <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-white/30 group-focus-within:text-[#ccff00] transition-colors z-10">
                <Lock size={18} />
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Password (min 6 chars)"
                value={form.password}
                onChange={set('password')}
                required
                autoComplete="new-password"
                className={`${inputClass} pr-14`}
              />
              <button
                type="button"
                tabIndex={-1}
                onClick={() => setShowPassword((s) => !s)}
                className="absolute inset-y-0 right-3 flex items-center text-white/40 hover:text-[#ccff00] z-10"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>

            {/* Confirm password */}
            <div className="relative group">
              <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-white/30 group-focus-within:text-[#ccff00] transition-colors z-10">
                <Lock size={18} />
              </div>
              <input
                type={showConfirm ? 'text' : 'password'}
                placeholder="Confirm password"
                value={form.confirm_password}
                onChange={set('confirm_password')}
                required
                autoComplete="new-password"
                className={`${inputClass} pr-14 ${
                  form.confirm_password && form.password !== form.confirm_password
                    ? 'border-rose-500/50'
                    : ''
                }`}
              />
              <button
                type="button"
                tabIndex={-1}
                onClick={() => setShowConfirm((s) => !s)}
                className="absolute inset-y-0 right-3 flex items-center text-white/40 hover:text-[#ccff00] z-10"
                aria-label={showConfirm ? 'Hide confirm password' : 'Show confirm password'}
              >
                {showConfirm ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
              {form.confirm_password && form.password !== form.confirm_password && (
                <p className="text-rose-400 text-[10px] font-bold mt-1 pl-2">Passwords do not match</p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading || !isValid}
              className="w-full bg-[#ccff00] hover:bg-[#d9ff33] text-[#0f172a] font-black py-4 rounded-2xl transition-all shadow-[0_0_20px_rgba(204,255,0,0.2)] active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed mt-2"
            >
              {loading ? (
                <Loader2 className="animate-spin" size={20} />
              ) : (
                <>
                  CREATE ACCOUNT
                  <ArrowRight size={20} strokeWidth={2.5} />
                </>
              )}
            </button>
          </form>

          <div className="mt-8 pt-8 border-t border-white/5 text-center space-y-3">
            <p className="text-white/40 text-xs font-bold">
              <Link to="/forgot-password" className="text-[#ccff00]/80 hover:text-[#ccff00] transition-colors mr-3">
                Forgot password?
              </Link>
            </p>
            <p className="text-white/40 text-xs font-bold">
              Already have an account?{' '}
              <Link to="/login" className="text-[#ccff00] hover:text-white transition-colors">
                Sign in
              </Link>
            </p>
            <Link to="/" className="block text-white/30 hover:text-white text-[10px] font-bold uppercase tracking-widest transition-colors">
              Back to Home
            </Link>
          </div>
        </div>

        <p className="text-center text-white/20 text-[10px] font-black uppercase tracking-[0.2em] mt-8">
          CasaNova Living • Staff Portal
        </p>
      </div>
    </div>
  );
}
