'use client';

import React, { useState, ReactNode } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useDispatch, useSelector } from '../store/hooks';
import { signupUser } from '../store/auth/authSlice';

const inputBase =
  'w-full rounded-2xl border border-slate-200 bg-slate-50/70 py-2.5 pl-10 text-sm text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition';

// ---------- Field wrapper: label + left icon ----------
interface FieldProps {
  id: string;
  label: string;
  hint?: string;
  icon: ReactNode;
  children: ReactNode;
}

function Field({ id, label, hint, icon, children }: FieldProps) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <label htmlFor={id} className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
          {label}
        </label>
        {hint && <span className="text-[11px] text-slate-400">{hint}</span>}
      </div>
      <div className="relative flex items-center">
        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
          {icon}
        </div>
        {children}
      </div>
    </div>
  );
}

// ---------- Icons ----------
const iconProps = {
  className: 'h-4 w-4',
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
};

const UserIcon = () => (
  <svg {...iconProps}>
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

const MailIcon = () => (
  <svg {...iconProps}>
    <rect width="20" height="16" x="2" y="4" rx="2" />
    <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
  </svg>
);

const LockIcon = () => (
  <svg {...iconProps}>
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </svg>
);

const BuildingIcon = () => (
  <svg {...iconProps}>
    <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
    <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
  </svg>
);

const EyeIcon = () => (
  <svg {...iconProps}>
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

const EyeOffIcon = () => (
  <svg {...iconProps}>
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
    <line x1="1" y1="1" x2="23" y2="23" />
  </svg>
);

// ---------- Page ----------
export default function SignupPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const dispatch = useDispatch();
  const loading = useSelector((state) => state.auth.signupLoading);
  const signupError = useSelector((state) => state.auth.signupError);
  const inviteToken = searchParams.get('token');
  const isInviteSignup = Boolean(inviteToken);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    workspace_name: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [error, setError] = useState('');

  // Illustration: /signup.png -> /loginlogo.png -> emoji
  const [illustrationSrc, setIllustrationSrc] = useState<string | null>('/signup.png');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');

    const payload = {
      name: formData.name.trim(),
      email: formData.email.trim(),
      password: formData.password,
      workspace_name: isInviteSignup
        ? undefined
        : formData.workspace_name.trim(),
      invite_token: isInviteSignup ? inviteToken ?? undefined : undefined,
    };

    if (!payload.name || !payload.email || !payload.password) {
      setError('Please fill in all required fields.');
      return;
    }
    if (!isInviteSignup && !payload.workspace_name) {
      setError('Please enter a workspace name.');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(payload.email)) {
      setError('Please enter a valid email address.');
      return;
    }
    if (payload.password.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }
    if (!agreedToTerms) {
      setError('Please agree to the Terms of Service and Privacy Policy.');
      return;
    }

    const result = await dispatch(signupUser(payload));
    if (result.success) {
      router.push('/dashboard');
    } else {
      setError(result.message);
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#e8efe6] flex items-center justify-center p-4 sm:p-6 lg:p-8 font-sans">
      {/* Outer card */}
      <div className="w-full max-w-5xl rounded-[28px] bg-white shadow-xl ring-1 ring-slate-900/5 overflow-hidden grid grid-cols-1 lg:grid-cols-12">
        {/* ================= Left: form (7 columns) ================= */}
        <div className="lg:col-span-7 p-6 sm:p-10 lg:p-12 flex flex-col justify-between">
          <div className="space-y-6">
            {/* Badge & title */}
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200/60 text-emerald-800 text-[11px] font-semibold tracking-wide uppercase mb-3">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Welcome to NANDGATE
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                Create your account
              </h1>
              <p className="text-sm text-slate-500 mt-1.5">
                Get started with your intelligent engineering workspace in seconds.
              </p>
            </div>

            {/* Error message */}
            {(error || signupError) && (
              <div
                role="alert"
                className="rounded-xl bg-rose-50 border border-rose-200/80 px-4 py-3 text-xs text-rose-700 flex items-center gap-2.5"
              >
                <svg className="h-4 w-4 flex-shrink-0 text-rose-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                <span>{error || signupError}</span>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
              {/* 1. Full name */}
              <Field id="name" label="Full Name" icon={<UserIcon />}>
                <input
                  id="name"
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="e.g. Shalika Perera"
                  autoComplete="name"
                  className={`${inputBase} pr-4`}
                />
              </Field>

              {/* 2. Work email */}
              <Field id="email" label="Work Email" icon={<MailIcon />}>
                <input
                  id="email"
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="name@company.com"
                  autoComplete="email"
                  className={`${inputBase} pr-4`}
                />
              </Field>

              {/* 3. Password */}
              <Field id="password" label="Password" hint="Minimum 8 characters" icon={<LockIcon />}>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Create a secure password"
                  autoComplete="new-password"
                  className={`${inputBase} pr-10`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-slate-400 hover:text-slate-600 focus:outline-none focus-visible:text-emerald-700"
                >
                  {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                </button>
              </Field>

              {!isInviteSignup && (
                <Field id="workspace_name" label="Workspace Name" icon={<BuildingIcon />}>
                  <input
                    id="workspace_name"
                    type="text"
                    name="workspace_name"
                    value={formData.workspace_name}
                    onChange={handleChange}
                    placeholder="e.g. Acme Labs or DevSquad"
                    autoComplete="organization"
                    className={`${inputBase} pr-28`}
                  />
                  <span className="pointer-events-none absolute right-3.5 text-xs text-slate-400 select-none">
                    .nandgate.dev
                  </span>
                </Field>
              )}

              {isInviteSignup && (
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs text-emerald-800">
                  You will join the workspace invitation attached to this link.
                </div>
              )}

              {/* Terms checkbox */}
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="terms"
                  checked={agreedToTerms}
                  onChange={(e) => setAgreedToTerms(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 accent-emerald-600 cursor-pointer"
                />
                <label htmlFor="terms" className="text-xs text-slate-600">
                  I agree to the{' '}
                  <a href="#terms" className="font-semibold text-slate-800 underline hover:text-emerald-700">
                    Terms of Service
                  </a>{' '}
                  and{' '}
                  <a href="#privacy" className="font-semibold text-slate-800 underline hover:text-emerald-700">
                    Privacy Policy
                  </a>
                </label>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 rounded-2xl bg-slate-900 py-3 text-sm font-bold text-white shadow-md hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900/20 disabled:opacity-60 transition"
              >
                {loading && (
                  <svg className="h-4 w-4 animate-spin text-white" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 0 1 8-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                )}
                <span>{loading ? 'Creating account...' : 'Create Workspace & Account →'}</span>
              </button>
            </form>

            {/* Divider */}
            <div className="relative flex items-center justify-center">
              <div className="w-full border-t border-slate-200" />
              <span className="absolute bg-white px-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                Or continue with
              </span>
            </div>

            {/* Google button */}
            <button
              type="button"
              className="w-full flex items-center justify-center gap-2.5 rounded-2xl border border-slate-200 bg-slate-50/60 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-100 hover:border-slate-300 transition"
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24" aria-hidden="true">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
              </svg>
              <span>Continue with Google</span>
            </button>
          </div>

          {/* Bottom login link */}
          <p className="text-center text-xs text-slate-500 mt-6 pt-4 border-t border-slate-100">
            Already have an account?{' '}
            <Link
              href={isInviteSignup ? `/login?token=${encodeURIComponent(inviteToken || '')}` : '/login'}
              className="font-bold text-slate-800 hover:text-emerald-700 underline"
            >
              Log in
            </Link>
          </p>
        </div>

        {/* ================= Right: illustration panel (5 columns) ================= */}
        <div className="lg:col-span-5 bg-gradient-to-br from-emerald-100/50 via-teal-50/70 to-emerald-200/40 p-8 sm:p-10 flex flex-col justify-center items-center border-t lg:border-t-0 lg:border-l border-emerald-100/70 text-center">
          {/* Top pill & headline */}
          <div className="mb-4">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/90 backdrop-blur-sm border border-emerald-200/80 text-[11px] font-bold text-emerald-800 shadow-sm mb-3">
              <span className="text-amber-500">✦</span> Developer First WorkOS
            </div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 leading-tight">
              Everything your engineering team needs—spaces, tasks, and bug tracking unified.
            </h2>
          </div>

          {/* Character illustration (centered and constrained) */}
          <div className="relative my-auto py-2 flex items-center justify-center w-full max-w-[280px] aspect-square">
            <span className="absolute inset-0 flex items-center justify-center text-7xl" aria-hidden="true">
              👨‍💻
            </span>
            {illustrationSrc && (
              <img
                src={illustrationSrc}
                alt="NANDGATE developer assistant"
                className="relative w-full h-full object-contain drop-shadow-md select-none pointer-events-none"
                onError={() =>
                  setIllustrationSrc((prev) => (prev === '/signup.png' ? '/loginlogo.png' : null))
                }
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}