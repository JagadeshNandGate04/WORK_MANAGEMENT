'use client';

import Image from 'next/image';

interface RequestStateProps {
  type: 'loading' | 'error';
  message: string;
  onRetry?: () => void;
  compact?: boolean;
}

export default function RequestState({ type, message, onRetry, compact = false }: RequestStateProps) {
  const isLoading = type === 'loading';

  return (
    <div
      role={isLoading ? 'status' : 'alert'}
      aria-live={isLoading ? 'polite' : 'assertive'}
      className={`flex flex-col items-center justify-center gap-3 rounded-2xl border text-center ${
        compact ? 'px-4 py-5' : 'px-6 py-8 sm:px-10 sm:py-10'
      } ${isLoading ? 'border-[#d2ded1] bg-white text-slate-600' : 'border-rose-200 bg-rose-50 text-rose-700'}`}
    >
      <Image
        src={isLoading ? '/loading.png' : '/error.png'}
        alt=""
        width={compact ? 88 : 132}
        height={compact ? 88 : 132}
        className={`object-contain ${compact ? 'h-20 w-20' : 'h-28 w-28'}`}
        priority={!compact && isLoading}
      />
      <p className="max-w-xl text-sm font-medium">{message}</p>
      {!isLoading && onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="rounded-lg border border-rose-300 bg-white px-4 py-2 text-xs font-bold text-rose-800 transition hover:bg-rose-100"
        >
          Try again
        </button>
      )}
    </div>
  );
}
