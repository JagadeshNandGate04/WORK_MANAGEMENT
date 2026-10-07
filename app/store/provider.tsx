'use client';

import { useEffect } from 'react';
import { Provider } from 'react-redux';
import { store } from './store';
import { restoreSession } from './auth/authSlice';

export function Providers({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const savedSession = window.localStorage.getItem('work-management-auth');
    if (!savedSession) return;

    try {
      const session = JSON.parse(savedSession) as {
        token?: unknown;
        user?: unknown;
        workspace?: unknown;
      };
      if (
        typeof session.token === 'string' &&
        session.user &&
        typeof session.user === 'object'
      ) {
        store.dispatch(
          restoreSession({
            token: session.token,
            user: session.user as {
              id: number;
              email: string;
              name: string;
              role?: string;
              designation?: string | null;
            },
            workspace:
              session.workspace && typeof session.workspace === 'object'
                ? (session.workspace as { id: number; name: string })
                : null,
          })
        );
      }
    } catch {
      window.localStorage.removeItem('work-management-auth');
    }
  }, []);

  return <Provider store={store}>{children}</Provider>;
}