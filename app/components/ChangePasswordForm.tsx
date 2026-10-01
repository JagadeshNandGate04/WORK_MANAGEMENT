'use client';

import React, { useState, useEffect, FormEvent } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import type { AppDispatch, RootState } from '../store/store';
import { changePassword } from '../store/auth/authSlice';

interface ChangePasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ChangePasswordModal({ isOpen, onClose }: ChangePasswordModalProps) {
  const dispatch = useDispatch<AppDispatch>();
  const loading = useSelector((state: RootState) => state.auth?.passwordChanging ?? false);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && !loading) onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, loading]);

  // Reset form when modal opens or closes
  useEffect(() => {
    if (!isOpen) {
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setError('');
      setSuccess('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Validations
    if (!currentPassword) {
      setError('Please enter your current password.');
      return;
    }
    if (!newPassword || newPassword.length < 8) {
      setError('New password must be at least 8 characters long.');
      return;
    }
    if (newPassword === currentPassword) {
      setError('New password must be different from current password.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('New password and confirmation password do not match.');
      return;
    }

    try {
      // dispatch action
      const action = await dispatch(
        changePassword({
          current_password: currentPassword,
          new_password: newPassword,
        })
      );

      // Handle unwrap if using createAsyncThunk or direct return
      const result = (action as any)?.payload ?? action;

      if (result?.success || (action as any)?.meta?.requestStatus === 'fulfilled') {
        setSuccess(result?.message || 'Password changed successfully!');
        setTimeout(() => {
          onClose();
        }, 1200);
      } else {
        setError(result?.message || 'Failed to update password. Please check your credentials.');
      }
    } catch (err: any) {
      setError(err?.message || 'An unexpected error occurred. Please try again.');
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs transition-opacity duration-200"
      onClick={() => {
        if (!loading) onClose();
      }}
    >
      {/* Modal Dialog Card */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-emerald-900/10 overflow-hidden transform transition-all animate-in fade-in zoom-in-95 duration-150"
      >
        {/* Header with Cartoon Character Illustration */}
        <div className="bg-gradient-to-r from-emerald-50 via-teal-50/70 to-emerald-100/60 p-5 border-b border-emerald-100/80 flex items-center justify-between relative">
          <div className="flex items-center gap-3.5">
            {/* Cartoon Character / Shield Avatar */}
            <div className="w-12 h-12 rounded-2xl bg-white/90 border border-emerald-200/70 p-1 flex items-center justify-center shadow-xs overflow-hidden flex-shrink-0">
              <img
                src="/changepassword.png"
                alt="Security Cartoon Character"
                className="w-full h-full object-contain"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                  if (e.currentTarget.parentElement) {
                    e.currentTarget.parentElement.innerHTML = '<span class="text-2xl">🔐</span>';
                  }
                }}
              />
            </div>

            <div>
              <h2 id="modal-title" className="text-base font-black text-slate-900 tracking-tight">
                Change Password
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                Keep your NANDGATE account secure
              </p>
            </div>
          </div>

          {/* Close button */}
          <button
            onClick={onClose}
            disabled={loading}
            aria-label="Close modal"
            className="p-1.5 rounded-xl hover:bg-white/80 text-slate-400 hover:text-slate-700 transition-colors disabled:opacity-50"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Compact Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          
          {/* 1. Current Password Field */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-800">
              Current Password
            </label>
            <div className="relative flex items-center">
              <span className="absolute left-3.5 text-slate-400 text-sm">🔒</span>
              <input
                type={showCurrent ? 'text' : 'password'}
                disabled={loading}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Enter current password"
                className="w-full pl-10 pr-10 py-2.5 bg-slate-50 hover:bg-slate-100/70 focus:bg-white rounded-xl border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 text-xs font-mono text-slate-900 transition-all outline-none disabled:opacity-60"
              />
              <button
                type="button"
                onClick={() => setShowCurrent(!showCurrent)}
                className="absolute right-3.5 text-slate-400 hover:text-slate-600 focus:outline-none p-0.5 text-xs font-bold"
              >
                {showCurrent ? '🙈' : '👁️'}
              </button>
            </div>
          </div>

          {/* 2. New Password Field */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-800">
              New Password
            </label>
            <div className="relative flex items-center">
              <span className="absolute left-3.5 text-slate-400 text-sm">🔐</span>
              <input
                type={showNew ? 'text' : 'password'}
                disabled={loading}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new password (min. 8 characters)"
                className="w-full pl-10 pr-10 py-2.5 bg-slate-50 hover:bg-slate-100/70 focus:bg-white rounded-xl border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 text-xs font-mono text-slate-900 transition-all outline-none disabled:opacity-60"
              />
              <button
                type="button"
                onClick={() => setShowNew(!showNew)}
                className="absolute right-3.5 text-slate-400 hover:text-slate-600 focus:outline-none p-0.5 text-xs font-bold"
              >
                {showNew ? '🙈' : '👁️'}
              </button>
            </div>
          </div>

          {/* 3. Confirm New Password Field */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-800">
              Confirm New Password
            </label>
            <div className="relative flex items-center">
              <span className="absolute left-3.5 text-slate-400 text-sm">🛡️</span>
              <input
                type={showConfirm ? 'text' : 'password'}
                disabled={loading}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter your new password"
                className="w-full pl-10 pr-10 py-2.5 bg-slate-50 hover:bg-slate-100/70 focus:bg-white rounded-xl border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 text-xs font-mono text-slate-900 transition-all outline-none disabled:opacity-60"
              />
              <button
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
                className="absolute right-3.5 text-slate-400 hover:text-slate-600 focus:outline-none p-0.5 text-xs font-bold"
              >
                {showConfirm ? '🙈' : '👁️'}
              </button>
            </div>
          </div>

          {/* Error & Success Feedback */}
          {error && (
            <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 font-medium">
              {error}
            </div>
          )}
          {success && (
            <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 font-semibold flex items-center gap-1.5">
              <span>✓</span> {success}
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end gap-2.5 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 text-xs font-semibold transition-all disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !currentPassword || !newPassword || !confirmPassword}
              className="px-5 py-2 rounded-xl bg-slate-950 hover:bg-slate-800 text-white text-xs font-semibold shadow-xs transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
            >
              {loading ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Updating...</span>
                </>
              ) : (
                'Update Password'
              )}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}