'use client';

import React, { useState, useEffect, FormEvent } from 'react';
import Link from 'next/link';
import { useDispatch, useSelector } from 'react-redux';
import type { AppDispatch, RootState } from '../store/store';
import { changePassword } from '../store/auth/authSlice'; // adjust to where your auth slice file lives

const IST = 'Asia/Kolkata';

type TabId = 'general' | 'password' | 'sessions' | '2fa';

const tabs: { id: TabId; label: string; icon?: string; dot?: boolean }[] = [
  { id: 'general', label: 'General' },
  { id: 'password', label: 'Password & Security', icon: '🔒' },
  { id: 'sessions', label: 'Sessions & Devices' },
  { id: '2fa', label: 'Two-Factor Auth', dot: true },
];

const workItems: { icon: string; label: string; badge?: string }[] = [
  { icon: '👤', label: 'Assigned to Me' },
  { icon: '🚩', label: 'Flagged' },
  { icon: '📁', label: 'Spaces' },
  { icon: '🗂️', label: 'Folders' },
  { icon: '📋', label: 'Lists' },
  { icon: '✓', label: 'Tasks', badge: '24' },
];

// ---------- Live clock (Indian Standard Time) ----------
function LiveClock() {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setNow(new Date());
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const dateText = now
    ? new Intl.DateTimeFormat('en-IN', { timeZone: IST, weekday: 'short', day: '2-digit', month: 'short' }).format(now)
    : '--';
  const timeText = now
    ? new Intl.DateTimeFormat('en-IN', { timeZone: IST, hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).format(now)
    : '--:--';

  return (
    <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 rounded-xl border border-slate-200/60 text-xs font-medium text-slate-600">
      <span>🕒</span> {dateText} <span className="text-slate-300">|</span>
      <span className="font-mono font-bold">{timeText}</span>
      <span className="text-[10px] text-slate-400">IST</span>
    </div>
  );
}

// ---------- Password input with eye toggle ----------
interface PasswordInputProps {
  id: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  autoComplete: string;
  leftIcon: string;
}

function PasswordInput({ id, value, onChange, placeholder, autoComplete, leftIcon }: PasswordInputProps) {
  const [show, setShow] = useState(false);

  return (
    <div className="relative flex items-center">
      <span className="absolute left-3.5 text-slate-400 text-sm" aria-hidden="true">
        {leftIcon}
      </span>
      <input
        id={id}
        type={show ? 'text' : 'password'}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoComplete={autoComplete}
        className="w-full pl-10 pr-10 py-3 bg-slate-50/70 hover:bg-slate-50 focus:bg-white rounded-xl border border-slate-200/80 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 text-xs font-mono text-slate-900 transition-all outline-none"
      />
      <button
        type="button"
        onClick={() => setShow((prev) => !prev)}
        aria-label={show ? 'Hide password' : 'Show password'}
        className="absolute right-3.5 text-slate-400 hover:text-slate-600 focus:outline-none focus-visible:text-emerald-700 p-0.5"
      >
        {show ? (
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.75} stroke="currentColor" className="w-5 h-5">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88"
            />
          </svg>
        ) : (
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.75} stroke="currentColor" className="w-5 h-5">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z"
            />
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        )}
      </button>
    </div>
  );
}

// ---------- Page ----------
export default function ChangePasswordPage() {
  const dispatch = useDispatch<AppDispatch>();
  // Loading flag comes from your slice (changePasswordStart / Success / Failure)
  const loading = useSelector((state: RootState) => state.auth.passwordChanging);

  // --- Form states ---
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  // UI only for now: your change-password API does not accept this option
  const [terminateSessions, setTerminateSessions] = useState(false);
  const [activeTab, setActiveTab] = useState<TabId>('password');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Illustration: /security-dev.png -> /loginlogo.png -> emoji
  const [illustrationSrc, setIllustrationSrc] = useState<string | null>('/changepassword.png');

  // --- Password validation rules ---
  const hasLength = newPassword.length >= 8;
  const hasUppercase = /[A-Z]/.test(newPassword);
  const hasNumber = /[0-9]/.test(newPassword);
  const hasSymbol = /[^A-Za-z0-9]/.test(newPassword);

  const criteriaCount = [hasLength, hasUppercase, hasNumber, hasSymbol].filter(Boolean).length;
  const allRulesPass = criteriaCount === 4;
  const passwordsMatch = newPassword.length > 0 && newPassword === confirmPassword;

  const strength = (() => {
    if (newPassword.length === 0) return { text: '—', color: 'text-slate-400', bars: 0, barColor: '' };
    if (criteriaCount <= 1) return { text: 'Weak', color: 'text-rose-600', bars: 1, barColor: 'bg-rose-400' };
    if (criteriaCount === 2) return { text: 'Fair', color: 'text-amber-600', bars: 2, barColor: 'bg-amber-400' };
    if (criteriaCount === 3) return { text: 'Good', color: 'text-blue-600', bars: 3, barColor: 'bg-blue-500' };
    return { text: 'Strong', color: 'text-emerald-700', bars: 4, barColor: 'bg-emerald-500' };
  })();

  // Estimated entropy = length x log2(size of the character pool used)
  const poolSize =
    (/[a-z]/.test(newPassword) ? 26 : 0) +
    (/[A-Z]/.test(newPassword) ? 26 : 0) +
    (/[0-9]/.test(newPassword) ? 10 : 0) +
    (/[^A-Za-z0-9]/.test(newPassword) ? 32 : 0);
  const entropyBits = newPassword.length && poolSize ? Math.round(newPassword.length * Math.log2(poolSize)) : 0;

  const checklist = [
    { ok: hasLength, label: 'At least 8 characters long' },
    { ok: hasUppercase, label: 'At least one uppercase (A-Z)' },
    { ok: hasNumber, label: 'At least one number (0-9)' },
    { ok: hasSymbol, label: 'One symbol (!@#$%^&*)' },
  ];

  const resetForm = () => {
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setError('');
    setSuccess('');
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!currentPassword) {
      setError('Enter your current password.');
      return;
    }
    if (!allRulesPass) {
      setError('Your new password does not meet all the requirements.');
      return;
    }
    if (newPassword === currentPassword) {
      setError('The new password must be different from the current password.');
      return;
    }
    if (!passwordsMatch) {
      setError('The new password and confirmation do not match.');
      return;
    }

    const result = await dispatch(
      changePassword({
        current_password: currentPassword,
        new_password: newPassword,
      })
    );

    if (result.success) {
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setSuccess(result.message);
    } else {
      setError(result.message);
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#f4f7f4] text-slate-800 font-sans p-4 md:p-6 lg:p-7 flex gap-5 antialiased selection:bg-emerald-200">
      {/* ========================================================= */}
      {/* 1. LEFT SIDEBAR                                           */}
      {/* ========================================================= */}
      <aside className="hidden lg:flex flex-col justify-between w-64 flex-shrink-0 bg-white rounded-3xl p-5 shadow-sm border border-slate-100/90">
        <div className="space-y-6">
          {/* NANDGATE wordmark */}
          <div className="px-2 pt-1 flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span className="text-xl font-black tracking-tight text-slate-900 font-sans">NANDGATE</span>
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            </div>
          </div>

          {/* Workspace switcher */}
          <div className="px-1">
            <button className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl border border-slate-200/80 hover:border-slate-300 hover:bg-slate-50/60 transition-colors text-xs font-semibold text-slate-700 shadow-sm">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span>My Workspace</span>
              </div>
              <svg className="w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          </div>

          {/* Dashboard link */}
          <div className="px-1">
            <Link
              href="/dashboard"
              className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-slate-600 hover:bg-slate-50 hover:text-slate-900 font-medium text-xs transition-colors"
            >
              <span>🏠</span> Dashboard
            </Link>
          </div>

          {/* Work Management */}
          <div className="space-y-2.5 px-1">
            <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 px-2">Work Management</p>
            <nav className="space-y-1 text-xs font-medium text-slate-600">
              {workItems.map((item) => (
                <div
                  key={item.label}
                  className="flex items-center justify-between px-2 py-1.5 hover:bg-slate-50 rounded-lg cursor-pointer text-slate-700"
                >
                  <span className="flex items-center gap-2">
                    <span className={item.label === 'Tasks' ? 'text-emerald-600 font-bold' : 'text-slate-400'}>
                      {item.icon}
                    </span>
                    {item.label}
                  </span>
                  {item.badge && (
                    <span className="px-2 py-px bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded-full">
                      {item.badge}
                    </span>
                  )}
                </div>
              ))}
            </nav>
          </div>

          {/* Collaboration */}
          <div className="space-y-2 px-1 pt-1">
            <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 px-2">Collaboration</p>
            <div className="space-y-1 text-xs font-medium text-slate-600">
              <div className="flex items-center justify-between px-2 py-1.5 hover:bg-slate-50 rounded-lg cursor-pointer">
                <span className="flex items-center gap-2">
                  <span>💬</span> Chat
                </span>
                <span className="w-5 h-5 flex items-center justify-center bg-emerald-500 text-white text-[10px] font-bold rounded-full">
                  3
                </span>
              </div>
              <div className="flex items-center justify-between px-2 py-1.5 hover:bg-slate-50 rounded-lg cursor-pointer">
                <span className="flex items-center gap-2">
                  <span>🔔</span> Notifications
                </span>
                <span className="w-2 h-2 rounded-full bg-rose-500" />
              </div>
            </div>
          </div>

          {/* Reports, Settings (active), Profile */}
          <div className="px-1 pt-1 space-y-1 text-xs font-medium text-slate-600">
            <div className="flex items-center gap-2 px-2 py-1.5 hover:bg-slate-50 rounded-lg cursor-pointer">
              <span>📊</span> Reports
            </div>
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-emerald-50/90 text-emerald-900 font-semibold text-xs border border-emerald-200/60 shadow-sm">
              <span>⚙️</span> Settings
            </div>
            <div className="flex items-center gap-2 px-2 py-1.5 hover:bg-slate-50 rounded-lg cursor-pointer">
              <span>👤</span> Profile
            </div>
          </div>
        </div>

        {/* Profile footer */}
        <div className="pt-4 border-t border-slate-100">
          <div className="flex items-center justify-between p-2 rounded-2xl bg-slate-50/80 border border-slate-100">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-emerald-600 text-white font-black text-xs flex items-center justify-center shadow-sm">
                SK
              </div>
              <div className="leading-tight">
                <p className="text-xs font-bold text-slate-900">Shalika</p>
                <p className="text-[10px] text-slate-400">Software Engineer</p>
              </div>
            </div>
            <button className="text-slate-400 hover:text-slate-600 p-1" aria-label="More options">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
              </svg>
            </button>
          </div>
        </div>
      </aside>

      {/* ========================================================= */}
      {/* 2. MAIN CONTENT                                           */}
      {/* ========================================================= */}
      <main className="flex-1 flex flex-col gap-5 min-w-0">
        {/* Top header bar */}
        <header className="bg-white rounded-3xl p-4 px-6 flex items-center justify-between shadow-sm border border-slate-100/90">
          <div className="flex items-center gap-3 w-1/3">
            <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 rounded-xl text-xs text-slate-400 w-full border border-slate-200/60 focus-within:border-slate-300">
              <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                <circle cx="11" cy="11" r="8" />
                <path d="M21 21l-4.35-4.35" />
              </svg>
              <input
                type="text"
                placeholder="Search workspace... (⌘K)"
                className="bg-transparent outline-none w-full text-xs text-slate-800 placeholder-slate-400"
              />
              <kbd className="px-1.5 py-0.5 text-[10px] bg-white border border-slate-200 rounded font-mono text-slate-400 shadow-sm">
                ⌘K
              </kbd>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Live date & time in IST */}
            <LiveClock />

            <button className="relative p-2 rounded-xl bg-slate-50 border border-slate-200/60 hover:bg-slate-100 text-slate-600 transition-colors" aria-label="Notifications">
              <span>🔔</span>
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500" />
            </button>

            <button className="px-4 py-2 bg-slate-950 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-all">
              <span>+ New</span>
            </button>

            <div className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-xs">
              👤
            </div>
          </div>
        </header>

        {/* Breadcrumb & title */}
        <section className="space-y-2 px-1">
          <div className="flex items-center gap-2 text-xs font-medium text-slate-400">
            <span className="flex items-center gap-1 hover:text-slate-600 cursor-pointer">⚙️ Settings</span>
            <span>/</span>
            <span className="hover:text-slate-600 cursor-pointer">Account &amp; Security</span>
            <span>/</span>
            <span className="text-slate-700 font-semibold font-mono">Password &amp; Authentication</span>
          </div>

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pt-1">
            <div className="space-y-1">
              <div className="flex items-center gap-3">
                <h1 className="text-2xl lg:text-3xl font-black text-slate-900 tracking-tight">
                  Change Password &amp; Security
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                  Shield Active
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium">
                Manage your credentials, strengthen password complexity, and review real-time security telemetry for
                your NANDGATE identity.
              </p>
            </div>
          </div>

          {/* Sub navigation tabs */}
          <div className="flex flex-wrap items-center gap-1 pt-3 border-b border-slate-200/80">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2 text-xs font-semibold rounded-t-xl transition-colors flex items-center gap-1.5 border-b-2 -mb-px ${
                  tab.id === activeTab
                    ? 'bg-white text-emerald-800 border-emerald-600 shadow-sm'
                    : 'text-slate-500 border-transparent hover:text-slate-900 hover:bg-white/50'
                }`}
              >
                {tab.icon && <span>{tab.icon}</span>}
                <span>{tab.label}</span>
                {tab.dot && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />}
              </button>
            ))}
          </div>
        </section>

        {/* Main grid: form (left) and security showcase (right) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 pb-6 items-start">
          {/* ===================== FORM (span 7) ===================== */}
          <div className="lg:col-span-7 space-y-4">
            <div className="bg-white rounded-3xl p-6 md:p-7 border border-slate-100/90 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-400 via-teal-400 to-emerald-600" />

              {/* Card header */}
              <div className="flex items-center justify-between pb-5 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-lg shadow-sm">
                    🔑
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-slate-900">Update Password</h2>
                    <p className="text-[11px] text-slate-400 flex items-center gap-1">
                      <span>↺</span> Last changed 3 months ago
                    </p>
                  </div>
                </div>
                <span className="px-2.5 py-0.5 rounded-md bg-slate-100 text-slate-600 text-[10px] font-bold tracking-wide uppercase">
                  Strict Policy
                </span>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5 pt-5" noValidate>
                {/* 1. Current password */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <label htmlFor="current-password" className="font-bold text-slate-800">
                      Current Password
                    </label>
                    <a
                      href="#forgot"
                      className="text-emerald-700 hover:text-emerald-800 font-semibold hover:underline flex items-center gap-1"
                    >
                      Forgot your current password? <span className="text-[10px]">↗</span>
                    </a>
                  </div>
                  <PasswordInput
                    id="current-password"
                    value={currentPassword}
                    onChange={setCurrentPassword}
                    placeholder="Enter current password"
                    autoComplete="current-password"
                    leftIcon="🔒"
                  />
                </div>

                {/* 2. New password */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <label htmlFor="new-password" className="font-bold text-slate-800">
                      New Password
                    </label>
                    <span className={`text-[11px] font-bold ${strength.color}`}>{strength.text}</span>
                  </div>
                  <PasswordInput
                    id="new-password"
                    value={newPassword}
                    onChange={setNewPassword}
                    placeholder="Enter new strong password"
                    autoComplete="new-password"
                    leftIcon="🔐"
                  />

                  {/* Strength bar */}
                  <div className="space-y-1 pt-1">
                    <div className="grid grid-cols-4 gap-1.5">
                      {[1, 2, 3, 4].map((step) => (
                        <div
                          key={step}
                          className={`h-1.5 rounded-full transition-all duration-300 ${
                            strength.bars >= step ? strength.barColor : 'bg-slate-100'
                          }`}
                        />
                      ))}
                    </div>
                    <div className="flex items-center justify-between text-[10px] text-slate-400 font-medium pt-0.5">
                      <span>Entropy: {entropyBits} bits</span>
                      <span>Recommended: 14+ characters</span>
                    </div>
                  </div>
                </div>

                {/* Validation checklist */}
                <div className="bg-slate-50/80 border border-slate-200/70 rounded-2xl p-4">
                  <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-2.5">
                    Validation Checklist
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    {checklist.map((rule) => (
                      <div key={rule.label} className="flex items-center gap-2">
                        <span
                          className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold ${
                            rule.ok ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-400'
                          }`}
                        >
                          {rule.ok ? '✓' : '•'}
                        </span>
                        <span className={rule.ok ? 'text-slate-800 font-medium' : 'text-slate-500'}>{rule.label}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 3. Confirm new password */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <label htmlFor="confirm-password" className="font-bold text-slate-800">
                      Confirm New Password
                    </label>
                    {passwordsMatch && (
                      <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                        ✓ Passwords match
                      </span>
                    )}
                  </div>
                  <PasswordInput
                    id="confirm-password"
                    value={confirmPassword}
                    onChange={setConfirmPassword}
                    placeholder="Repeat your new password"
                    autoComplete="new-password"
                    leftIcon="🛡️"
                  />
                </div>

                {/* Terminate other sessions switch (UI only) */}
                <div className="p-4 rounded-2xl bg-emerald-50/50 border border-emerald-200/60 flex items-center justify-between gap-4">
                  <div className="space-y-0.5">
                    <p className="text-xs font-bold text-slate-900">Terminate all other active sessions</p>
                    <p className="text-[11px] text-slate-500">
                      Automatically invalidate cached tokens across mobile devices, tablets, and other browser
                      instances immediately upon update.
                    </p>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={terminateSessions}
                    aria-label="Terminate all other active sessions"
                    onClick={() => setTerminateSessions(!terminateSessions)}
                    className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors flex-shrink-0 ${
                      terminateSessions ? 'bg-emerald-600' : 'bg-slate-300'
                    }`}
                  >
                    <div
                      className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                        terminateSessions ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                {/* Messages */}
                {error && (
                  <div role="alert" className="px-4 py-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700">
                    {error}
                  </div>
                )}
                {success && (
                  <div role="status" className="px-4 py-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800">
                    {success}
                  </div>
                )}

                {/* Buttons */}
                <div className="flex items-center justify-end gap-3 pt-3">
                  <button
                    type="button"
                    onClick={resetForm}
                    disabled={loading}
                    className="px-5 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-all disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading || !currentPassword || !newPassword || !confirmPassword}
                    className="px-6 py-2.5 rounded-xl bg-slate-950 hover:bg-slate-800 text-white text-xs font-semibold shadow-sm transition-all flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <span>💾</span> {loading ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </form>
            </div>

            {/* Tip banner */}
            <div className="bg-white rounded-2xl p-4 border border-slate-100 flex items-center gap-3 shadow-sm">
              <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center text-base flex-shrink-0">
                💡
              </div>
              <div className="leading-snug">
                <p className="text-xs font-bold text-slate-900">Password Management Tip</p>
                <p className="text-[11px] text-slate-500">
                  Using a hardware security key (FIDO2 / WebAuthn)? You can configure physical passkeys in your
                  workspace settings anytime.
                </p>
              </div>
            </div>
          </div>

          {/* ================= SECURITY SHOWCASE (span 5) ================= */}
          <div className="lg:col-span-5 space-y-4">
            {/* Illustration card */}
            <div className="bg-gradient-to-b from-emerald-50/70 to-teal-50/40 rounded-3xl p-6 border border-emerald-100/90 shadow-sm flex flex-col items-center text-center relative overflow-hidden">
              <div className="relative w-56 h-56 bg-white/90 rounded-2xl p-3 border border-emerald-200/60 shadow-sm flex items-center justify-center overflow-hidden mb-4">
                <span className="absolute inset-0 flex items-center justify-center text-6xl" aria-hidden="true">
                  🛡️
                </span>
                {illustrationSrc && (
                  <img
                    src={illustrationSrc}
                    alt="Cartoon developer with security shield"
                    className="relative w-full h-full object-contain drop-shadow-sm bg-white/90"
                    onError={() =>
                      setIllustrationSrc((prev) => (prev === '/changepassword.png' ? '/loginlogo.png' : null))
                    }
                  />
                )}
              </div>

              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 mb-2">
                <span>🛡️</span> SHIELDED IDENTITY
              </span>
              <h3 className="text-base font-black text-slate-900 tracking-tight">Keep your account shielded 🛡️</h3>
              <p className="text-xs text-slate-600 font-medium mt-1.5 max-w-sm leading-relaxed">
                Use a unique password you do not duplicate across other engineering repositories. Enable multi-factor
                authentication for maximum perimeter security.
              </p>
            </div>

            {/* Security score */}
            <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Security Score</p>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-2xl font-black text-slate-900">85%</span>
                  <span className="text-xs font-bold text-emerald-700">Strong</span>
                </div>
              </div>
              <div className="w-12 h-12 rounded-full border-4 border-emerald-500 border-t-emerald-200 flex items-center justify-center text-emerald-700 font-bold text-xs bg-emerald-50/50">
                ✓
              </div>
            </div>

            {/* Two-factor card */}
            <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-slate-50 border border-slate-200/70 flex items-center justify-center text-lg">
                  📲
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-900">Two-Factor Authentication</p>
                  <p className="text-[10px] text-emerald-700 font-semibold flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Active (Authenticator App)
                  </p>
                </div>
              </div>
              <button className="px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-[11px] font-semibold text-slate-700 shadow-sm transition-colors">
                Configure
              </button>
            </div>

            {/* Recent security activity */}
            <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm space-y-3">
              <div className="flex items-center justify-between text-xs pb-1 border-b border-slate-100">
                <span className="font-bold text-slate-900 text-xs">Recent Security Activity</span>
                <a href="#audit" className="text-[11px] text-slate-400 hover:text-slate-600 font-medium">
                  Export Log
                </a>
              </div>

              <div className="space-y-3 text-xs">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center text-xs flex-shrink-0">
                      🔄
                    </div>
                    <div>
                      <p className="font-semibold text-slate-800 leading-tight">Password changed successfully</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">System • 90 days ago</p>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded-md bg-slate-100 text-[10px] font-mono text-slate-600 font-bold">
                    Audit
                  </span>
                </div>

                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center text-xs flex-shrink-0">
                      💻
                    </div>
                    <div>
                      <p className="font-semibold text-slate-800 leading-tight">Chrome on macOS</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">IP: 192.0.2.14 • 2 hours ago</p>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 text-[10px] font-bold">
                    Active
                  </span>
                </div>

                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center text-xs flex-shrink-0">
                      📱
                    </div>
                    <div>
                      <p className="font-semibold text-slate-800 leading-tight">New device authorization (iPhone 16)</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">NANDGATE Mobile App • Oct 01, 2026</p>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded-md bg-slate-100 text-[10px] font-mono text-slate-600 font-bold">
                    Verified
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}