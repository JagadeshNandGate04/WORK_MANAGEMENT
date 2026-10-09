'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSidebar } from './SidebarContext';
import { useSelector } from '../store/hooks';

/* ============================================================
   Refined 3D Cartoon Sticker Vector Icons
   ============================================================ */

// 1. Dashboard: Multi-card layout badge with glossy finish
const CartoonDashboardIcon = () => (
  <div className="relative w-8 h-8 rounded-xl bg-gradient-to-tr from-amber-500 via-orange-400 to-rose-400 p-1.5 shadow-sm shadow-orange-500/25 flex items-center justify-center group-hover:scale-105 group-hover:-rotate-3 transition-transform duration-200 flex-shrink-0 border border-white/40 overflow-hidden">
    <div className="absolute -top-1 -left-1 w-5 h-3 bg-white/35 rounded-full blur-[1px] transform -rotate-12 pointer-events-none" />
    <svg viewBox="0 0 24 24" fill="none" className="w-full h-full drop-shadow-xs">
      <rect x="3" y="3" width="7.5" height="7.5" rx="2" fill="#ffffff" />
      <rect x="13.5" y="3" width="7.5" height="5" rx="2" fill="#ffffff" fillOpacity={0.9} />
      <rect x="13.5" y="11" width="7.5" height="10" rx="2" fill="#ffffff" />
      <rect x="3" y="13.5" width="7.5" height="7.5" rx="2" fill="#ffffff" fillOpacity={0.9} />
      <circle cx="5.5" cy="5.5" r="1" fill="#f97316" />
      <circle cx="16" cy="13.5" r="1" fill="#f97316" />
    </svg>
  </div>
);

// 2. Project: Layered folder with project sheet
const CartoonProjectIcon = () => (
  <div className="relative w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 via-sky-500 to-cyan-400 p-1.5 shadow-sm shadow-sky-500/25 flex items-center justify-center group-hover:scale-105 group-hover:rotate-3 transition-transform duration-200 flex-shrink-0 border border-white/40 overflow-hidden">
    <div className="absolute -top-1 -left-1 w-5 h-3 bg-white/35 rounded-full blur-[1px] transform -rotate-12 pointer-events-none" />
    <svg viewBox="0 0 24 24" fill="none" className="w-full h-full drop-shadow-xs">
      <path
        d="M3 6.5C3 5.12 4.12 4 5.5 4h3.2c.8 0 1.55.38 2.02 1.02L12 6.5h6.5C19.88 6.5 21 7.62 21 9v8.5c0 1.38-1.12 2.5-2.5 2.5h-13C4.12 20 3 18.88 3 17.5v-11z"
        fill="#ffffff"
      />
      <rect x="6" y="8" width="12" height="8" rx="1.5" fill="#bae6fd" />
      <path
        d="M2.5 10.5C2.5 9.4 3.4 8.5 4.5 8.5h15c1.1 0 2 .9 2 2v7c0 1.38-1.12 2.5-2.5 2.5h-14C3.62 20 2.5 18.88 2.5 17.5v-7z"
        fill="#0284c7"
        fillOpacity={0.85}
      />
      <line x1="7" y1="14" x2="14" y2="14" stroke="#ffffff" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  </div>
);

// 3. Task: Checkmark shield badge
const CartoonTaskIcon = () => (
  <div className="relative w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-600 via-teal-500 to-emerald-400 p-1.5 shadow-sm shadow-emerald-500/25 flex items-center justify-center group-hover:scale-105 group-hover:-rotate-3 transition-transform duration-200 flex-shrink-0 border border-white/40 overflow-hidden">
    <div className="absolute -top-1 -left-1 w-5 h-3 bg-white/35 rounded-full blur-[1px] transform -rotate-12 pointer-events-none" />
    <svg viewBox="0 0 24 24" fill="none" className="w-full h-full drop-shadow-xs">
      <rect x="3.5" y="3.5" width="17" height="17" rx="5" fill="#ffffff" />
      <path
        d="M7.5 12l3.2 3.2 6.3-6.4"
        stroke="#059669"
        strokeWidth="2.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  </div>
);

// 4. List: Clipboard checklist
const CartoonListIcon = () => (
  <div className="relative w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 via-violet-500 to-purple-400 p-1.5 shadow-sm shadow-indigo-500/25 flex items-center justify-center group-hover:scale-105 group-hover:rotate-3 transition-transform duration-200 flex-shrink-0 border border-white/40 overflow-hidden">
    <div className="absolute -top-1 -left-1 w-5 h-3 bg-white/35 rounded-full blur-[1px] transform -rotate-12 pointer-events-none" />
    <svg viewBox="0 0 24 24" fill="none" className="w-full h-full drop-shadow-xs">
      <rect x="4" y="4.5" width="16" height="16" rx="3.5" fill="#ffffff" />
      <rect x="8.5" y="2.5" width="7" height="3" rx="1.2" fill="#c7d2fe" stroke="#4338ca" strokeWidth="1" />
      <circle cx="7.5" cy="9.5" r="1.2" fill="#6366f1" />
      <rect x="10.5" y="8.5" width="6.5" height="2" rx="1" fill="#a5b4fc" />
      <circle cx="7.5" cy="13.5" r="1.2" fill="#6366f1" />
      <rect x="10.5" y="12.5" width="6.5" height="2" rx="1" fill="#a5b4fc" />
      <circle cx="7.5" cy="17.5" r="1.2" fill="#6366f1" />
      <rect x="10.5" y="16.5" width="6.5" height="2" rx="1" fill="#a5b4fc" />
    </svg>
  </div>
);

// 5. Chat: Cartoon speech bubble with dots
const CartoonChatIcon = () => (
  <div className="relative w-8 h-8 rounded-xl bg-gradient-to-tr from-pink-500 via-rose-400 to-fuchsia-400 p-1.5 shadow-sm shadow-rose-500/25 flex items-center justify-center group-hover:scale-105 group-hover:-rotate-3 transition-transform duration-200 flex-shrink-0 border border-white/40 overflow-hidden">
    <div className="absolute -top-1 -left-1 w-5 h-3 bg-white/35 rounded-full blur-[1px] transform -rotate-12 pointer-events-none" />
    <svg viewBox="0 0 24 24" fill="none" className="w-full h-full drop-shadow-xs">
      <path
        d="M4 6.5C4 4.57 5.57 3 7.5 3h9C18.43 3 20 4.57 20 6.5v6.5c0 1.93-1.57 3.5-3.5 3.5H9.6L5.3 20.3c-.7.5-1.3.1-1.3-.8V16.5C4 16.5 4 16.5 4 16.5V6.5z"
        fill="#ffffff"
      />
      <circle cx="8" cy="10" r="1.3" fill="#e11d48" />
      <circle cx="12" cy="10" r="1.3" fill="#e11d48" />
      <circle cx="16" cy="10" r="1.3" fill="#e11d48" />
    </svg>
  </div>
);

// 6. Notification: Chime bell badge
const CartoonNotificationIcon = () => (
  <div className="relative w-8 h-8 rounded-xl bg-gradient-to-tr from-amber-400 via-yellow-400 to-lime-300 p-1.5 shadow-sm shadow-yellow-500/25 flex items-center justify-center group-hover:scale-105 group-hover:rotate-3 transition-transform duration-200 flex-shrink-0 border border-white/40 overflow-hidden">
    <div className="absolute -top-1 -left-1 w-5 h-3 bg-white/35 rounded-full blur-[1px] transform -rotate-12 pointer-events-none" />
    <svg viewBox="0 0 24 24" fill="none" className="w-full h-full drop-shadow-xs">
      <path
        d="M12 3a4 4 0 00-4 4v2.5c0 .7-.3 1.4-.9 1.9L6 12.3c-1.1.9-.5 2.7 1 2.7h10c1.5 0 2.1-1.8 1-2.7l-1.1-.9c-.6-.5-.9-1.2-.9-1.9V7a4 4 0 00-4-4z"
        fill="#ffffff"
      />
      <circle cx="12" cy="17.5" r="1.8" fill="#ffffff" />
      <circle cx="12" cy="17.5" r="1" fill="#d97706" />
    </svg>
  </div>
);

// 7. Member: Cartoon group of people badge
const CartoonMemberIcon = () => (
  <div className="relative w-8 h-8 rounded-xl bg-gradient-to-tr from-orange-500 via-amber-400 to-yellow-300 p-1.5 shadow-sm shadow-orange-500/25 flex items-center justify-center group-hover:scale-105 group-hover:-rotate-3 transition-transform duration-200 flex-shrink-0 border border-white/40 overflow-hidden">
    <div className="absolute -top-1 -left-1 w-5 h-3 bg-white/35 rounded-full blur-[1px] transform -rotate-12 pointer-events-none" />
    <svg viewBox="0 0 24 24" fill="none" className="w-full h-full drop-shadow-xs">
      {/* Back person */}
      <circle cx="16.5" cy="8.5" r="2.6" fill="#ffffff" fillOpacity={0.9} />
      <path
        d="M12.2 19c.3-3 2.2-5 4.3-5s4 2 4.3 5c.1.6-.4 1.1-1 1.1h-6.6c-.6 0-1.1-.5-1-1.1z"
        fill="#ffffff"
        fillOpacity={0.9}
      />
      {/* Front person */}
      <circle cx="9" cy="8" r="3.2" fill="#ffffff" />
      <path
        d="M3.2 19.2c.4-3.6 2.8-6.2 5.8-6.2s5.4 2.6 5.8 6.2c.1.6-.4 1.1-1 1.1H4.2c-.6 0-1.1-.5-1-1.1z"
        fill="#ffffff"
      />
      {/* Accent cheeks */}
      <circle cx="7.8" cy="8.6" r="0.6" fill="#f97316" />
      <circle cx="10.2" cy="8.6" r="0.6" fill="#f97316" />
    </svg>
  </div>
);

const ChevronLeftIcon = ({ className = 'w-4 h-4' }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M15 6l-6 6 6 6" />
  </svg>
);

const MenuIcon = ({ className = 'w-6 h-6' }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" className={className}>
    <path d="M4 6h16M4 12h16M4 18h16" />
  </svg>
);

const CloseIcon = ({ className = 'w-6 h-6' }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" className={className}>
    <path d="M6 6l12 12M6 18L18 6" />
  </svg>
);

/* ============================================================
   Navigation Schema
   ============================================================ */

type NavItem = {
  id: string;
  label: string;
  href: string;
  icon: () => React.ReactElement;
  badge?: string | number;
  dot?: boolean;
};

const NAV_ITEMS: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard', href: '/dashboard', icon: CartoonDashboardIcon },
  { id: 'project', label: 'Project', href: '/project', icon: CartoonProjectIcon },
  { id: 'task', label: 'Task', href: '/task', icon: CartoonTaskIcon, badge: 24 },
  { id: 'list', label: 'List', href: '/list', icon: CartoonListIcon },
  { id: 'chat', label: 'Chat', href: '/chat', icon: CartoonChatIcon, badge: 3 },
  { id: 'notification', label: 'Notification', href: '/notification', icon: CartoonNotificationIcon, dot: true },
  { id: 'member', label: 'Member', href: '/member', icon: CartoonMemberIcon },
];

/* ============================================================
   Sidebar Component
   ============================================================ */

export default function Sidebar() {
  const pathname = usePathname();
  const { collapsed, setCollapsed } = useSidebar();
  const user = useSelector((state) => state.auth.user);
  const authWorkspace = useSelector((state) => state.auth.workspace);
  const dashboardWorkspace = useSelector((state) => state.dashboard.data?.workspace);
  const [mobileOpen, setMobileOpen] = useState(false);
  const workspaceName = dashboardWorkspace?.name || authWorkspace?.name || 'Workspace';
  const userName = user?.name?.trim() || user?.email?.split('@')[0] || 'Guest User';
  const userInitials = userName
    .split(/\s+/)
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
  const userDesignation = user?.designation || user?.role || 'Team member';

  // Auto-collapse on smaller screens
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 1023px)');
    const handle = (e: MediaQueryListEvent | MediaQueryList) => {
      if (e.matches) setCollapsed(true);
    };

    handle(mq);
    mq.addEventListener('change', handle);
    return () => mq.removeEventListener('change', handle);
  }, [setCollapsed]);

  return (
    <>
      {/* Mobile Top App Bar */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 h-14 flex items-center justify-between px-4 bg-white/95 backdrop-blur-md border-b border-emerald-900/10 shadow-xs">
        <button
          aria-label="Open navigation menu"
          onClick={() => setMobileOpen(true)}
          className="p-2 rounded-2xl bg-emerald-50 hover:bg-emerald-100/70 border border-emerald-200/60 text-emerald-900 transition-colors"
        >
          <MenuIcon className="w-5 h-5" />
        </button>

        <div className="min-w-0 flex-1 text-center">
          <span className="block truncate text-lg font-black tracking-wide text-emerald-800 [text-shadow:1px_2px_0_#a7f3d0,2px_3px_0_#d1fae5]" title={workspaceName}>
            {workspaceName}
          </span>
        </div>

        <div className="w-9" />
      </div>

      {/* Mobile Backdrop Overlay */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 z-[60] bg-slate-950/40 backdrop-blur-xs transition-opacity"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar Aside */}
      <aside
        className={[
          'fixed top-0 left-0 z-[70] h-screen',
          'bg-gradient-to-b from-white via-emerald-50/20 to-teal-50/30 backdrop-blur-md',
          'border-r border-emerald-900/10 shadow-sm',
          'flex flex-col justify-between font-[family-name:var(--font-poppins)]',
          'transition-all duration-300 ease-in-out antialiased',
          collapsed ? 'w-20' : 'w-64',
          mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
        ].join(' ')}
      >
        <div className="min-h-0 flex flex-col flex-1">
          {/* Header & Logo */}
          <div
            className={`flex items-center ${
              collapsed ? 'justify-center' : 'justify-between'
            } px-4 py-2 border-b border-slate-100 flex-shrink-0`}
          >
            {!collapsed ? (
              <div className="min-w-0 flex-1 rounded-2xl border border-emerald-200/80 bg-gradient-to-r from-emerald-50 to-teal-50 px-3 py-2.5 shadow-sm">
                <p className="truncate text-xl font-black leading-tight tracking-wide text-emerald-800 [text-shadow:1px_2px_0_#a7f3d0,2px_3px_0_#d1fae5]" title={workspaceName}>
                  {workspaceName}
                </p>
                <p className="mt-1 text-[10px] font-extrabold uppercase tracking-[0.18em] text-emerald-700">
                  Workspace
                </p>
              </div>
            ) : (
              <div
                title={workspaceName}
                className="w-9 h-9 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white font-bold text-sm shadow-xs shadow-emerald-500/30 transform hover:scale-105 transition-transform select-none"
              >
                {workspaceName.slice(0, 1).toUpperCase()}
              </div>
            )}

            {/* Mobile close */}
            <button
              aria-label="Close menu"
              onClick={() => setMobileOpen(false)}
              className="lg:hidden p-1.5 rounded-xl hover:bg-slate-100 text-slate-600 transition"
            >
              <CloseIcon className="w-5 h-5" />
            </button>

            {/* Desktop collapse toggle */}
            <button
              aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              onClick={() => setCollapsed(!collapsed)}
              className="hidden lg:flex p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-emerald-50/80 transition-colors"
            >
              <ChevronLeftIcon
                className={`w-4 h-4 transition-transform duration-300 ${
                  collapsed ? 'rotate-180' : ''
                }`}
              />
            </button>
          </div>

          {/* Navigation Links with Poppins Font & Cartoon Badges */}
          <nav className="px-3 py-4 space-y-1.5 overflow-y-auto flex-1">
            {NAV_ITEMS.map((item) => {
              const isActive =
                pathname === item.href ||
                (item.id === 'project' && pathname?.startsWith('/project/')) ||
                (item.href === '/dashboard' && (pathname === '/' || pathname?.startsWith('/dashboard')));
              const Icon = item.icon;

              return (
                <Link
                  key={item.id}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  title={collapsed ? item.label : undefined}
                  className={[
                    'relative group flex items-center gap-3.5 rounded-2xl px-3 py-2.5',
                    'transition-all duration-200 select-none',
                    collapsed ? 'justify-center' : '',
                    isActive
                      ? 'bg-gradient-to-r from-emerald-100/70 to-teal-50 text-emerald-950 font-semibold border border-emerald-200/80 shadow-2xs'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900',
                  ].join(' ')}
                >
                  {/* Active Indicator Bar */}
                  {isActive && (
                    <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-7 rounded-r-full bg-emerald-500 shadow-sm shadow-emerald-500/40" />
                  )}

                  {/* 3D Cartoon Icon Badge */}
                  <div className="relative flex-shrink-0">
                    <Icon />

                    {/* Red Notification Dot on Icon in collapsed mode */}
                    {item.dot && collapsed && (
                      <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-rose-500 ring-2 ring-white" />
                    )}
                  </div>

                  {/* Poppins Label */}
                  {!collapsed && (
                    <span
                      className={`text-xs tracking-[-0.01em] truncate flex-1 transition-colors ${
                        isActive
                          ? 'font-bold text-slate-950'
                          : 'font-medium text-slate-600 group-hover:text-slate-900'
                      }`}
                    >
                      {item.label}
                    </span>
                  )}

                  {/* Numeric Badges */}
                  {!collapsed && item.badge !== undefined && (
                    <span className="px-2 py-0.5 text-[11px] font-bold rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200/80 font-[family-name:var(--font-poppins)]">
                      {item.badge}
                    </span>
                  )}

                  {/* Red Alert Dot */}
                  {!collapsed && item.dot && (
                    <span className="w-2 h-2 rounded-full bg-rose-500 ring-2 ring-rose-100 animate-pulse" />
                  )}

                  {/* Hover Floating Tooltip when Collapsed */}
                  {collapsed && (
                    <span className="absolute left-full ml-3 px-3 py-1.5 rounded-xl bg-slate-900 text-white text-xs font-semibold whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity shadow-lg z-[80] font-[family-name:var(--font-poppins)]">
                      {item.label}
                      {item.badge !== undefined && ` (${item.badge})`}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Footer: User Identity Profile with Poppins Typography */}
        <div className="p-3 border-t border-slate-100/90 flex-shrink-0">
          <div
            className={`flex items-center ${
              collapsed ? 'justify-center' : 'gap-3'
            } p-2 rounded-2xl bg-white border border-slate-200/70 shadow-2xs hover:border-emerald-200 transition-colors`}
          >
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-emerald-500 to-teal-700 text-white font-bold text-xs flex items-center justify-center shadow-xs flex-shrink-0">
              {userInitials || 'GU'}
            </div>

            {!collapsed && (
              <div className="leading-tight min-w-0">
                <p className="text-xs font-bold text-slate-900 truncate">
                  {userName}
                </p>
                <p className="text-[10px] font-medium text-slate-400 truncate">
                  {userDesignation}
                </p>
              </div>
            )}
          </div>
        </div>
      </aside>
    </>
  );
}