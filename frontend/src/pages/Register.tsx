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

// Dark-safe input: no white flash on focus, no browser autofill override
const inputClass =
  'w-full bg-white/[0.06] border border-white/10 text-white rounded-2xl py-4 pl-12 pr-4 outline-none focus:border-[#ccff00]/60 focus:ring-0 transition-colors placeholder:text-white/25 font-medium [color-scheme:dark]';

const selectClass =
  'w-full bg-[#1e293b] border border-white/10 text-white rounded-2xl py-4 pl-12 pr-10 outline-none focus:border-[#ccff00]/60 transition-colors font-medium appearance-none cursor-pointer [color-scheme:dark]';

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

  useEffect(() => {
    if (isAuthenticated) navigate('/dashboard', { replace: true });
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    apiClient.get('/auth/stores-public')
      .then(r => setStores(r.data))
      .catch(() => setStores([]));
  }, []);

  const set = (key: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm(f => ({ ...f, [key]: e.target.value }));

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
      await apiClient.post('/auth/register', {
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
      toast.success('Account created!', { description: 'You can now sign in.' });
      navigate('/login');
    } catch (err: any) {
      const status = err.response?.status;
      const detail = err.response?.data?.detail || '';
      let message = 'Something went wrong. Please try again.';
      if (err.code === 'ERR_NETWORK') {
        message = 'Unable to connect. Check your connection.';
      } else if (status === 400) {
        if (detail.toLowerCase().includes('username')) message = 'That username is already taken.';
        else if (detail.toLowerCase().includes('email')) message = 'An account with that email already exists.';
        else message = 'Please check your details and try again.';
      } else if (status === 422) {
        message = 'Please fill in all required fields correctly.';
      } else if (status && status >= 500) {
        message = 'Server error. Please try again in a moment.';
      }
      toast.error('Registration failed', { description: message });
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
        <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-[#ccff00]/8 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[400px] h-[400px] bg-blue-500/8 rounded-full blur-[120px]" />
      </div>

      <div className="w-full max-w-[520px] relative py-8">
        <div className="bg-[#0f1f35] border border-white/[0.08] rounded-[32px] p-10 shadow-2xl">

          {/* Header */}
          <div className="flex flex-col items-center mb-8">
            <div className="w-14 h-14 bg-[#ccff00] rounded-2xl flex items-center justify-center shadow-[0_0_24px_rgba(204,255,0,0.25)] mb-5">
              <ShieldCheck size={30} strokeWidth={2.5} className="text-[#0f172a]" />
            </div>
            <h1 className="text-2xl font-black text-white tracking-tight mb-1">Create Account</h1>
            <p className="text-white/40 text-sm font-medium">CasaNova Living — Staff Registration</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4" autoComplete="off">

            {/* Name row */}
            <div className="grid grid-cols-2 gap-3">
              <div className="relative group">
                <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-white/30 group-focus-within:text-[#ccff00] transition-colors">
                  <User size={16} />
                </div>
                <input
                  type="text"
                  placeholder="First name"
                  value={form.first_name}
                  onChange={set('first_name')}
                  required
                  autoComplete="given-name"
                  className={inputClass}
                />
              </div>
              <div className="relative group">
                <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-white/30 group-focus-within:text-[#ccff00] transition-colors">
                  <User size={16} />
                </div>
                <input
                  type="text"
                  placeholder="Last name"
                  value={form.last_name}
                  onChange={set('last_name')}
                  required
                  autoComplete="family-name"
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
                type="text"
                placeholder="Username / Staff ID"
                value={form.username}
                onChange={set('username')}
                required
                autoComplete="username"
                className={inputClass}
              />
            </div>

            {/* Email — explicitly typed, no extra autofill triggers */}
            <div className="relative group">
              <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-white/30 group-focus-within:text-[#ccff00] transition-colors">
                <Mail size={18} />
              </div>
              <input
                type="email"
                placeholder="Work email"
                value={form.email}
                onChange={set('email')}
                required
                autoComplete="email"
                className={inputClass}
              />
            </div>

            {/* Role + Store in a row */}
            <div className="grid grid-cols-2 gap-3">
              <div className="relative group">
                <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-white/30 z-10">
                  <Building2 size={16} />
                </div>
                <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none text-white/30">
                  <ChevronDown size={14} />
                </div>
                <select value={form.role} onChange={set('role')} className={selectClass}>
                  {ROLES.map(r => (
                    <option key={r.value} value={r.value} className="bg-[#1e293b] text-white">
                      {r.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="relative group">
                <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-white/30 z-10">
                  <MapPin size={16} />
                </div>
                <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none text-white/30">
                  <ChevronDown size={14} />
                </div>
                <select value={form.store_id} onChange={handleStoreChange} className={selectClass}>
                  <option value="" className="bg-[#1e293b] text-white/50">Store (optional)</option>
                  {stores.map(s => (
                    <option key={s.store_id} value={s.store_id} className="bg-[#1e293b] text-white">
                      {s.store_name}
                    </option>
                  ))}
                </select>
              </div>
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
                onClick={() => setShowPassword(s => !s)}
                className="absolute inset-y-0 right-3 flex items-center text-white/30 hover:text-[#ccff00] transition-colors z-10"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
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
                    ? 'border-rose-500/60'
                    : ''
                }`}
              />
              <button
                type="button"
                tabIndex={-1}
                onClick={() => setShowConfirm(s => !s)}
                className="absolute inset-y-0 right-3 flex items-center text-white/30 hover:text-[#ccff00] transition-colors z-10"
                aria-label={showConfirm ? 'Hide password' : 'Show password'}
              >
                {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
              {form.confirm_password && form.password !== form.confirm_password && (
                <p className="text-rose-400 text-[10px] font-semibold mt-1.5 pl-1">Passwords do not match</p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading || !isValid}
              className="w-full bg-[#ccff00] hover:bg-[#d4ff1a] text-[#0f172a] font-black py-4 rounded-2xl transition-all shadow-[0_0_20px_rgba(204,255,0,0.15)] active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed mt-1"
            >
              {loading ? (
                <Loader2 className="animate-spin" size={20} />
              ) : (
                <>
                  CREATE ACCOUNT
                  <ArrowRight size={18} strokeWidth={2.5} />
                </>
              )}
            </button>
          </form>

          <div className="mt-7 pt-7 border-t border-white/[0.06] text-center space-y-2.5">
            <p className="text-white/35 text-xs font-medium">
              Already have an account?{' '}
              <Link to="/login" className="text-[#ccff00] hover:text-white transition-colors font-bold">
                Sign in
              </Link>
            </p>
            <Link
              to="/"
              className="block text-white/25 hover:text-white/60 text-[10px] font-bold uppercase tracking-widest transition-colors"
            >
              Back to Home
            </Link>
          </div>
        </div>

        <p className="text-center text-white/15 text-[10px] font-black uppercase tracking-[0.2em] mt-6">
          CasaNova Living • Staff Portal
        </p>
      </div>
    </div>
  );
}
