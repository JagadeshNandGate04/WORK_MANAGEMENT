'use client';

import React, { useState } from 'react';

export default function Sidebar() {
  // If /public/company_logo.png fails to load, the text wordmark is shown instead
  const [logoFailed, setLogoFailed] = useState(false);

  return (
    <aside className="w-64 flex-shrink-0 bg-white rounded-3xl p-5 shadow-sm flex flex-col justify-between border border-slate-100/80">
      <div className="space-y-6">
        {/* Company logo (/public/company_logo.png). Falls back to the text wordmark if the image is missing */}
        <div className="px-2 pt-1 flex items-center justify-between">
          {logoFailed ? (
            <div className="flex items-center gap-1.5">
              <span className="text-xl font-black tracking-tight text-slate-900 font-sans">NANDGATE</span>
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            </div>
          ) : (
            <img
              src="/company_logo.png"
              alt="NANDGATE"
              className="h-9 w-auto max-w-full object-contain"
              onError={() => setLogoFailed(true)}
            />
          )}
        </div>

        {/* Workspace Switcher */}
        <div className="px-1">
          <button className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl border border-slate-200/80 hover:border-slate-300 hover:bg-slate-50/50 transition-colors text-xs font-semibold text-slate-700 shadow-sm">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span>My Workspace</span>
            </div>
            <svg className="w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>

        {/* Active Navigation: Dashboard */}
        <div className="px-1">
          <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-emerald-50/90 text-emerald-900 font-semibold text-xs border border-emerald-200/60 shadow-sm">
            <span className="flex items-center gap-2">
              <span>🏠</span> Dashboard
            </span>
            <span className="px-2 py-0.5 rounded-full bg-emerald-200/70 text-emerald-800 text-[10px] font-bold">
              Active
            </span>
          </div>
        </div>

        {/* Work Management */}
        <div className="space-y-2.5 px-1">
          <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 px-2">Work Management</p>

          <nav className="space-y-1 text-xs font-medium text-slate-600">
            {/* My Work */}
            <div>
              <div className="flex items-center gap-1.5 px-2 py-1.5 hover:bg-slate-50 rounded-lg cursor-pointer text-slate-700">
                <svg className="w-3 h-3 text-slate-400 rotate-90" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                </svg>
                <span>My Work</span>
              </div>
              <div className="pl-6 space-y-1 text-[11px] text-slate-500 py-0.5">
                <p className="hover:text-slate-800 cursor-pointer py-0.5">Assigned to Me</p>
                <p className="hover:text-slate-800 cursor-pointer py-0.5">Flagged</p>
              </div>
            </div>

            {/* Spaces */}
            <div>
              <div className="flex items-center gap-1.5 px-2 py-1.5 hover:bg-slate-50 rounded-lg cursor-pointer text-slate-700">
                <svg className="w-3 h-3 text-slate-400 rotate-90" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                </svg>
                <span>Spaces</span>
              </div>
              <div className="pl-6 space-y-1 text-[11px] text-slate-500 py-0.5">
                <div className="flex items-center justify-between hover:text-slate-800 cursor-pointer py-0.5">
                  <span>Engineering</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                </div>
                <div className="flex items-center justify-between hover:text-slate-800 cursor-pointer py-0.5">
                  <span>Product</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-purple-500" />
                </div>
                <div className="flex items-center justify-between hover:text-slate-800 cursor-pointer py-0.5">
                  <span>Marketing</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                </div>
              </div>
            </div>

            {/* Folders */}
            <div>
              <div className="flex items-center gap-1.5 px-2 py-1.5 hover:bg-slate-50 rounded-lg cursor-pointer text-slate-700">
                <svg className="w-3 h-3 text-slate-400 rotate-90" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                </svg>
                <span>Folders</span>
              </div>
              <div className="pl-6 space-y-1 text-[11px] text-slate-500 py-0.5">
                <p className="hover:text-slate-800 cursor-pointer py-0.5">Sprint 14 Release</p>
                <p className="hover:text-slate-800 cursor-pointer py-0.5">Design Ops</p>
              </div>
            </div>

            {/* Lists */}
            <div>
              <div className="flex items-center gap-1.5 px-2 py-1.5 hover:bg-slate-50 rounded-lg cursor-pointer text-slate-700">
                <svg className="w-3 h-3 text-slate-400 rotate-90" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                </svg>
                <span>Lists</span>
              </div>
              <div className="pl-6 space-y-1 text-[11px] text-slate-500 py-0.5">
                <p className="hover:text-slate-800 cursor-pointer py-0.5">Sprint Backlog</p>
                <p className="hover:text-slate-800 cursor-pointer py-0.5">Defect Triage</p>
              </div>
            </div>

            {/* Tasks with counter */}
            <div className="flex items-center justify-between px-2 py-1.5 hover:bg-slate-50 rounded-lg cursor-pointer text-slate-700">
              <span className="flex items-center gap-2">
                <span className="text-emerald-600 font-bold">✓</span> Tasks
              </span>
              <span className="px-2 py-px bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded-full">24</span>
            </div>
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
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 ring-4 ring-rose-100" />
            </div>
          </div>
        </div>

        {/* Reports */}
        <div className="px-1 pt-1">
          <div className="flex items-center gap-2 px-2 py-1.5 hover:bg-slate-50 rounded-lg cursor-pointer text-xs font-medium text-slate-600">
            <span>📊</span> Reports
          </div>
        </div>
      </div>

      {/* Profile Footer */}
      <div className="pt-4 border-t border-slate-100 space-y-3">
        <div className="flex items-center justify-between text-xs text-slate-500 px-1 font-medium">
          <span className="hover:text-slate-800 cursor-pointer flex items-center gap-1.5">
            <span>⚙️</span> Settings
          </span>
          <span className="hover:text-slate-800 cursor-pointer flex items-center gap-1.5">
            <span>👤</span> Profile
          </span>
        </div>

        <div className="flex items-center justify-between p-2 rounded-2xl bg-slate-50/80 border border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-emerald-600 text-white font-black text-xs flex items-center justify-center shadow-sm">
              SK
            </div>
            <div className="leading-tight">
              <p className="text-xs font-bold text-slate-900">Shalika</p>
              <p className="text-[10px] text-slate-400">Software Developer</p>
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
  );
}