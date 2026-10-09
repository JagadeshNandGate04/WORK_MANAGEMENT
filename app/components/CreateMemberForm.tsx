'use client';

import React, { useState, useEffect, useRef } from 'react';

const DEFAULT_ROLE = 'MEMBER';

export interface NewWorkspaceMember {
  name: string;
  email: string;
  password: string;
  role: string;
}

/** What onSubmitSuccess may return. Returning { success: false, message } shows the message in the modal. */
type SubmitResult = void | { success: boolean; message?: string };

interface CreateWorkspaceMemberModalProps {
  isOpen?: boolean;
  onClose?: () => void;
  /** Create the member here (call your backend / Redux action). It may be async. */
  onSubmitSuccess?: (data: NewWorkspaceMember) => SubmitResult | Promise<SubmitResult>;
  /** Illustration image from /public, for example "/images/cartoon-dev-badge.png" */
  characterImageSrc?: string;
}

export default function CreateWorkspaceMemberModal({
  isOpen = true,
  onClose = () => {},
  onSubmitSuccess,
  characterImageSrc = '/createMember.png',
}: CreateWorkspaceMemberModalProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Mascot: given image -> /loginlogo.png -> emoji card
  const [mascotFallback, setMascotFallback] = useState(false);
  const mascotSrc = mascotFallback
    ? characterImageSrc === '/createMember.png'
      ? null
      : '/createMember.png'
    : characterImageSrc;

  const nameInputRef = useRef<HTMLInputElement>(null);
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  });

  // Focus the first field once when the modal opens
  useEffect(() => {
    if (isOpen) nameInputRef.current?.focus();
  }, [isOpen]);

  // Lock page scroll and close on Escape (unless a save is in progress)
  useEffect(() => {
    if (!isOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isSubmitting) onCloseRef.current();
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, isSubmitting]);

  if (!isOpen) return null;

  const handleClose = () => {
    if (!isSubmitting) onClose();
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');

    const data: NewWorkspaceMember = {
      name: name.trim(),
      email: email.trim(),
      password,
      role: DEFAULT_ROLE,
    };

    if (!data.name || !data.email || !data.password.trim()) {
      setError('Please fill in all required fields.');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
      setError('Please enter a valid email address.');
      return;
    }
    if (data.password.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await onSubmitSuccess?.(data);

      if (result && typeof result === 'object' && result.success === false) {
        setError(result.message || 'Failed to create the member. Please try again.');
        return;
      }

      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to create the member. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="create-member-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
    >
      {/* Dimmed backdrop */}
      <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity" onClick={handleClose} />

      {/* Centered modal card */}
      <div className="relative z-10 w-full max-w-4xl max-h-[92vh] overflow-y-auto bg-white rounded-3xl border border-[#cbdbcb] shadow-2xl">
        {/* Modal header */}
        <div className="px-6 py-5 md:px-8 border-b border-[#edf3ec] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#edf3ec] border border-[#d2ded1] flex items-center justify-center text-[#2d5034]">
              {/* User plus icon */}
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
                />
              </svg>
            </div>
            <h2 id="create-member-title" className="text-xl md:text-2xl font-extrabold text-[#091e13] tracking-tight">
              Create Workspace Member
            </h2>
          </div>

          <button
            type="button"
            onClick={handleClose}
            disabled={isSubmitting}
            aria-label="Close modal"
            className="w-9 h-9 rounded-full bg-[#f4f7f4] hover:bg-[#e4ede3] text-slate-400 hover:text-slate-700 flex items-center justify-center transition-colors border border-transparent hover:border-[#cbdbcb] disabled:opacity-50"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Modal body: 2-column split layout */}
        <div className="p-6 md:p-8 grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
          {/* Left column: form fields (7 columns) */}
          <form onSubmit={handleSubmit} className="md:col-span-7 space-y-5" noValidate>
            {/* Full name */}
            <div>
              <label
                htmlFor="member-name"
                className="block text-[11px] font-mono uppercase tracking-wider text-slate-600 font-bold mb-2"
              >
                Full Name <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </span>
                <input
                  ref={nameInputRef}
                  id="member-name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Sam Member"
                  autoComplete="off"
                  required
                  className="w-full pl-10 pr-4 py-2.5 bg-white border border-[#cbdbcb] rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0f172a] focus:border-transparent transition-all shadow-sm"
                />
              </div>
            </div>

            {/* Email address */}
            <div>
              <label
                htmlFor="member-email"
                className="block text-[11px] font-mono uppercase tracking-wider text-slate-600 font-bold mb-2"
              >
                Email Address <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                    />
                  </svg>
                </span>
                <input
                  id="member-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. sam@example.com"
                  autoComplete="off"
                  required
                  className="w-full pl-10 pr-4 py-2.5 bg-white border border-[#cbdbcb] rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0f172a] focus:border-transparent transition-all shadow-sm"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label
                  htmlFor="member-password"
                  className="block text-[11px] font-mono uppercase tracking-wider text-slate-600 font-bold"
                >
                  Password <span className="text-rose-500">*</span>
                </label>
                <span className="text-[11px] font-mono text-slate-500">Must be at least 8 characters</span>
              </div>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                    />
                  </svg>
                </span>
                <input
                  id="member-password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter member temporary password"
                  autoComplete="new-password"
                  required
                  className="w-full pl-10 pr-11 py-2.5 bg-white border border-[#cbdbcb] rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0f172a] focus:border-transparent transition-all shadow-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 focus:outline-none focus-visible:text-emerald-700"
                >
                  {showPassword ? (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18"
                      />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                      />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* Default role information box */}
            <div className="bg-[#edf3ec] border border-[#d2ded1] rounded-2xl p-4 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 animate-pulse shrink-0" />
                <div>
                  <div className="text-xs font-bold text-slate-900">Default Role: {DEFAULT_ROLE} (Active)</div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    Standard repository read, issue handling &amp; sprint commit privileges.
                  </div>
                </div>
              </div>
              <span className="px-2.5 py-1 rounded-md bg-[#dce8db] text-[#2d5034] text-[10px] font-bold font-mono tracking-wider uppercase shrink-0">
                Active
              </span>
            </div>

            {/* Error message */}
            {error && (
              <div role="alert" className="rounded-xl bg-rose-50 border border-rose-200 px-4 py-3 text-xs text-rose-700">
                {error}
              </div>
            )}

            {/* Action buttons */}
            <div className="flex items-center justify-end gap-3 pt-3">
              <button
                type="button"
                onClick={handleClose}
                disabled={isSubmitting}
                className="px-5 py-2.5 rounded-xl border border-[#cbdbcb] bg-white hover:bg-[#f4f7f4] text-slate-700 text-xs font-bold transition-all shadow-sm disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-[#081b2c] hover:bg-[#0f2438] active:scale-[0.99] text-white text-xs font-bold rounded-xl transition-all shadow-sm shrink-0 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
                    />
                  </svg>
                )}
                <span>{isSubmitting ? 'Creating...' : 'Create Member'}</span>
              </button>
            </div>
          </form>

          {/* Right column: mascot illustration card (5 columns) */}
          <div className="hidden md:flex md:col-span-5 bg-[#edf3ec] rounded-2xl border border-[#d6e3d5] p-5 flex-col items-center justify-center text-center self-stretch">
            <div className="w-full aspect-square max-w-[320px] rounded-2xl bg-[#dce8db]/75 border border-[#c8d9c7] flex items-center justify-center p-3 shadow-inner overflow-hidden">
              {mascotSrc ? (
                <img
                  src={mascotSrc}
                  alt="Workspace member character"
                  className="w-full h-full object-contain drop-shadow-md"
                  onError={() => setMascotFallback(true)}
                />
              ) : (
                <div className="flex flex-col items-center justify-center gap-2 p-6 text-slate-500">
                  <div className="text-6xl" aria-hidden="true">
                    🧑‍💻
                  </div>
                  <span className="text-xs font-bold text-slate-600">Developer Mascot</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}