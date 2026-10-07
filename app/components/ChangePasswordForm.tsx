'use client';

import React, { useState, useEffect, useRef, FormEvent, ReactNode } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import type { AppDispatch, RootState } from '../store/store'; // adjust the path if this file lives deeper
import { changePassword } from '../store/auth/authSlice'; // adjust the path to your auth slice

interface ChangePasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

// ---------- Icons ----------
function EyeIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function EyeOffIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  );
}

function LockIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0110 0v4" />
    </svg>
  );
}

function ShieldIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  );
}

// ---------- Password input with left icon and eye toggle ----------
interface PasswordFieldProps {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  autoComplete: string;
  leftIcon: ReactNode;
  inputRef?: React.Ref<HTMLInputElement>;
}

function PasswordField({ id, label, value, onChange, placeholder, autoComplete, leftIcon, inputRef }: PasswordFieldProps) {
  const [show, setShow] = useState(false);

  return (
    <div>
      <label htmlFor={id} className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
        {label}
      </label>
      <div className="relative">
        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
          {leftIcon}
        </div>
        <input
          ref={inputRef}
          id={id}
          type={show ? 'text' : 'password'}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          autoComplete={autoComplete}
          className="w-full rounded-2xl border border-slate-200 bg-slate-50/60 py-2.5 pl-10 pr-10 text-sm text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition"
        />
        <button
          type="button"
          onClick={() => setShow((prev) => !prev)}
          aria-label={show ? `Hide ${label.toLowerCase()}` : `Show ${label.toLowerCase()}`}
          className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-slate-400 hover:text-slate-600 focus:outline-none focus-visible:text-emerald-700"
        >
          {show ? <EyeOffIcon /> : <EyeIcon />}
        </button>
      </div>
    </div>
  );
}

// ---------- Modal ----------
export default function ChangePasswordModal({ isOpen, onClose, onSuccess }: ChangePasswordModalProps) {
  const dispatch = useDispatch<AppDispatch>();
  // Loading flag comes from your slice (changePasswordStart / Success / Failure)
  const loading = useSelector((state: RootState) => state.auth.passwordChanging);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Illustration: /changepassword.png -> /loginlogo.png -> emoji
  const [illustrationSrc, setIllustrationSrc] = useState<string | null>('/changepassword.png');

  const firstFieldRef = useRef<HTMLInputElement>(null);

  // Keep the latest callbacks in refs so the auto-close timer is not reset by parent re-renders
  const onCloseRef = useRef(onClose);
  const onSuccessRef = useRef(onSuccess);
  useEffect(() => {
    onCloseRef.current = onClose;
    onSuccessRef.current = onSuccess;
  });

  // Reset the form every time the modal closes
  useEffect(() => {
    if (!isOpen) {
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setError('');
      setSuccess('');
    }
  }, [isOpen]);

  // Focus the first field, lock page scroll and close on Escape while open
  useEffect(() => {
    if (!isOpen) return;

    firstFieldRef.current?.focus();

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !loading) onCloseRef.current();
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, loading]);

  // After a successful change, show the message briefly, then notify the parent and close
  useEffect(() => {
    if (!success) return;
    const timer = setTimeout(() => {
      onSuccessRef.current?.();
      onCloseRef.current();
    }, 1200);
    return () => clearTimeout(timer);
  }, [success]);

  if (!isOpen) return null;

  const handleClose = () => {
    if (!loading) onClose();
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!currentPassword || !newPassword || !confirmPassword) {
      setError('Please fill in all password fields.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('New password and confirm password do not match.');
      return;
    }
    if (newPassword.length < 8) {
      setError('New password must be at least 8 characters long.');
      return;
    }
    if (newPassword === currentPassword) {
      setError('The new password must be different from the current password.');
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
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="change-password-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
    >
      {/* Dimmed & blurred backdrop */}
      <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity" onClick={handleClose} />

      {/* Modal dialog card */}
      <div className="relative z-10 w-full max-w-3xl max-h-[90vh] overflow-y-auto overflow-x-hidden rounded-3xl bg-white shadow-2xl ring-1 ring-slate-900/5 transition-all">
        {/* Header bar */}
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5 sm:px-8">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 ring-1 ring-emerald-500/20">
              {/* Key icon */}
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 2l-2 2m-1.5 1.5L16 7l-2-2-1.5 1.5M15 11l-3 3-2-2-5 5a3.5 3.5 0 105 5l5-5 2 2 3-3-2-2z" />
              </svg>
            </div>
            <div>
              <h2 id="change-password-title" className="text-lg font-bold text-slate-900">
                Change Password
              </h2>
              <p className="text-xs text-slate-500">Update your account credentials to keep your workspace protected.</p>
            </div>
          </div>

          {/* Close button */}
          <button
            type="button"
            onClick={handleClose}
            disabled={loading}
            aria-label="Close dialog"
            className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition disabled:opacity-50"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body: form (left) and illustration (right) */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 p-6 sm:p-8">
          {/* Left column: form fields */}
          <form onSubmit={handleSubmit} className="md:col-span-7 flex flex-col justify-between space-y-5" noValidate>
            {error && (
              <div role="alert" className="rounded-xl bg-rose-50 border border-rose-200/80 px-3.5 py-2.5 text-xs text-rose-700 flex items-center gap-2">
                <svg className="h-4 w-4 flex-shrink-0 text-rose-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                <span>{error}</span>
              </div>
            )}

            {success && (
              <div role="status" className="rounded-xl bg-emerald-50 border border-emerald-200/80 px-3.5 py-2.5 text-xs text-emerald-800 flex items-center gap-2">
                <span className="font-bold">✓</span>
                <span>{success}</span>
              </div>
            )}

            <div className="space-y-4">
              <PasswordField
                id="cp-current-password"
                label="Current Password"
                value={currentPassword}
                onChange={setCurrentPassword}
                placeholder="Enter current password"
                autoComplete="current-password"
                leftIcon={<LockIcon />}
                inputRef={firstFieldRef}
              />

              <PasswordField
                id="cp-new-password"
                label="New Password"
                value={newPassword}
                onChange={setNewPassword}
                placeholder="Enter new password"
                autoComplete="new-password"
                leftIcon={<LockIcon />}
              />

              <PasswordField
                id="cp-confirm-password"
                label="Confirm Password"
                value={confirmPassword}
                onChange={setConfirmPassword}
                placeholder="Confirm new password"
                autoComplete="new-password"
                leftIcon={<ShieldIcon />}
              />
            </div>

            {/* Bottom form actions */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={handleClose}
                disabled={loading}
                className="rounded-xl px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100 transition disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || !!success}
                className="flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-5 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900/20 disabled:opacity-60 transition"
              >
                {loading && (
                  <svg className="h-3.5 w-3.5 animate-spin text-white" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                )}
                <span>{loading ? 'Saving...' : 'Save Changes'}</span>
              </button>
            </div>
          </form>

          {/* Right column: security illustration (hidden on small screens) */}
          <div className="hidden md:flex md:col-span-5 flex-col items-center justify-center rounded-2xl bg-gradient-to-b from-emerald-50/70 to-teal-50/40 p-6 border border-emerald-100/60 text-center">
            <div className="relative w-44 h-44 mb-3 flex items-center justify-center">
              <span className="absolute inset-0 flex items-center justify-center text-6xl" aria-hidden="true">
                🛡️
              </span>
              {illustrationSrc && (
                <img
                  src={illustrationSrc}
                  alt="Security illustration"
                  className="relative w-full h-full object-contain drop-shadow-md select-none pointer-events-none"
                  onError={() =>
                    setIllustrationSrc((prev) => (prev === '/changepassword.png' ? '/loginlogo.png' : null))
                  }
                />
              )}
            </div>

            <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100/90 px-3 py-1 text-[11px] font-bold text-emerald-800 border border-emerald-200/70 mb-2">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-600 animate-pulse" />
              Shielded Identity
            </div>
            <h3 className="text-sm font-bold text-slate-800">Keep your account safe</h3>
            <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
              Use a unique password you do not duplicate across other repositories.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}