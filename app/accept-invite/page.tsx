'use client';

import { Suspense, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

function InvitationRedirect() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  useEffect(() => {
    if (!token) return;

    let hasExistingAccount = false;

    try {
      const storedSession = window.localStorage.getItem('work-management-auth');
      hasExistingAccount = Boolean(
        storedSession && JSON.parse(storedSession)?.token
      );
    } catch {
      hasExistingAccount = false;
    }

    const destination = hasExistingAccount
      ? `/login?token=${encodeURIComponent(token)}`
      : `/signup?token=${encodeURIComponent(token)}`;

    router.replace(destination);
  }, [router, token]);

  return (
    <main className="min-h-screen bg-[#e8efe6] p-6 text-center text-slate-700">
      <div className="mx-auto mt-24 max-w-md rounded-3xl bg-white p-8 shadow-xl">
        <h1 className="text-xl font-extrabold text-slate-900">Workspace invitation</h1>
        <p className="mt-2 text-sm">
          {token
            ? 'Redirecting to your account...'
            : 'This invitation link is missing its token.'}
        </p>
      </div>
    </main>
  );
}

export default function AcceptInvitePage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#e8efe6]" />}>
      <InvitationRedirect />
    </Suspense>
  );
}
