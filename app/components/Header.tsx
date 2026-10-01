'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';

interface HeaderProps {
  userName?: string;
  userRole?: string;
  userEmail?: string;
  userInitials?: string;
  activeTab?: string;
  onTabChange?: (tab: string) => void;
  onSignOut?: () => void;
}

const navTabs = ['Dashboard', 'Project', 'Task', 'List'];

export default function Header({
  userName = 'Guest User',
  userRole = 'Software Engineer',
  userEmail = 'guest@nandgate.io',
  userInitials = 'GU',
  activeTab = 'Dashboard',
  onTabChange,
  onSignOut,
}: HeaderProps) {
  const [open, setOpen] = useState(false);
  const [currentTab, setCurrentTab] = useState(activeTab);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };

    document.addEventListener('mousedown', handleClick);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClick);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [open]);

  const handleTabClick = (tab: string) => {
    setCurrentTab(tab);
    if (onTabChange) onTabChange(tab);
  };

  const menuItemClass =
    'flex items-center gap-2.5 px-3 py-2 rounded-xl text-slate-700 hover:bg-slate-50 transition-colors font-medium';

  return (
    <header className="relative z-40 w-full bg-white/95 backdrop-blur-md rounded-3xl p-3 px-4 sm:px-5 border border-emerald-900/10 shadow-sm flex items-center justify-between gap-2 sm:gap-4">
      {/* ========================================================= */}
      {/* 1. LEFT: Breadcrumb & context navigation tabs             */}
      {/* ========================================================= */}
      <div className="flex items-center gap-3 sm:gap-4 flex-shrink-0 min-w-0">
        {/* Breadcrumb indicator (hidden on small screens) */}
        <div className="hidden md:flex items-center gap-2 text-xs font-semibold">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="font-black text-slate-800 tracking-wider uppercase text-[11px]">
            Dashboard
          </span>
          <span className="text-slate-300">/</span>
          <span className="text-slate-500 font-medium">Overview</span>
        </div>

        {/* Vertical separator */}
        <div className="hidden xl:block w-px h-5 bg-slate-200" />

        {/* Quick nav tabs */}
        <div className="hidden lg:flex items-center gap-1 text-xs font-semibold">
          {navTabs.map((tab) => {
            const isActive = currentTab === tab;
            return (
              <button
                key={tab}
                type="button"
                onClick={() => handleTabClick(tab)}
                aria-current={isActive ? 'page' : undefined}
                className={`px-3 py-1.5 rounded-xl transition-all ${
                  isActive
                    ? 'text-emerald-700 font-bold bg-emerald-50/70 border-b-2 border-emerald-500 shadow-sm'
                    : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                {tab}
              </button>
            );
          })}
        </div>
      </div>

      {/* ========================================================= */}
      {/* 2. CENTER: Workspace search (Cmd + K)                     */}
      {/* ========================================================= */}
      <div className="flex-1 max-w-md hidden md:flex mx-2 min-w-0">
        <div className="flex items-center gap-2 px-3 py-2 bg-slate-50/90 rounded-2xl w-full border border-slate-200/70 focus-within:border-emerald-500 focus-within:bg-white transition-all text-xs shadow-sm">
          <svg
            className="w-4 h-4 text-slate-400 flex-shrink-0"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            strokeWidth="2"
          >
            <circle cx="11" cy="11" r="8" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35" />
          </svg>
          <input
            type="text"
            placeholder="Search workspace..."
            aria-label="Search workspace"
            className="bg-transparent outline-none w-full text-slate-800 placeholder-slate-400 text-xs"
          />
          <kbd className="px-1.5 py-0.5 text-[10px] bg-white border border-slate-200 rounded font-mono text-slate-400 shadow-sm flex-shrink-0">
            ⌘K
          </kbd>
        </div>
      </div>

      {/* ========================================================= */}
      {/* 3. RIGHT: Actions & user profile menu                     */}
      {/* ========================================================= */}
      <div className="flex items-center gap-2 sm:gap-2.5 flex-shrink-0">
        {/* + New button */}
        <button
          type="button"
          className="px-3 sm:px-4 py-2 bg-slate-950 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-all active:scale-95"
        >
          <span className="font-bold">+</span>
          <span className="hidden sm:inline">New</span>
        </button>

        {/* Notifications bell */}
        <button
          type="button"
          aria-label="Notifications"
          className="relative p-2 rounded-xl bg-slate-50 border border-slate-200/70 hover:bg-slate-100 text-slate-600 transition-colors shadow-sm"
        >
          <svg
            className="w-4 h-4 text-slate-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            strokeWidth="2"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
            />
          </svg>
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-white" />
        </button>

        {/* Divider */}
        <div className="w-px h-6 bg-slate-200 hidden sm:block" />

        {/* User account popover */}
        <div className="relative" ref={menuRef}>
          <button
            type="button"
            onClick={() => setOpen(!open)}
            aria-expanded={open}
            aria-haspopup="menu"
            className="flex items-center gap-2.5 p-1 rounded-2xl hover:bg-slate-50 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
          >
            <div className="w-8 h-8 rounded-full bg-emerald-700 text-white font-black text-xs flex items-center justify-center shadow-sm">
              {userInitials}
            </div>
            <div className="hidden sm:flex flex-col text-left leading-tight">
              <span className="text-xs font-bold text-slate-900">
                {userName}
              </span>
              <span className="text-[10px] text-slate-400">{userRole}</span>
            </div>
            <svg
              className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${
                open ? 'rotate-180' : ''
              }`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              strokeWidth={2.5}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {/* Dropdown menu — z-[100] so it stays above sidebar and hero content */}
          {open && (
            <div
              role="menu"
              className="absolute right-0 top-full mt-2 w-60 bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden z-[100]"
            >

              <div className="p-1.5 text-xs space-y-0.5">
                <Link
                  href="/profile"
                  onClick={() => setOpen(false)}
                  className={menuItemClass}
                >
                  <span className="text-slate-500">👤</span> Profile
                </Link>
                <Link
                  href="/settings/password"
                  onClick={() => setOpen(false)}
                  className={menuItemClass}
                >
                  <span className="text-emerald-600">🔑</span> Password &amp; Security
                </Link>
                <div className="pt-1 mt-1 border-t border-slate-100">
                  {onSignOut ? (
                    <button
                      type="button"
                      onClick={() => {
                        setOpen(false);
                        onSignOut();
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-rose-600 hover:bg-rose-50 transition-colors font-semibold text-left"
                    >
                      <span>↩</span> Sign out
                    </button>
                  ) : (
                    <Link
                      href="/login"
                      onClick={() => setOpen(false)}
                      className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-rose-600 hover:bg-rose-50 transition-colors font-semibold"
                    >
                      <span>↩</span> Sign out
                    </Link>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}