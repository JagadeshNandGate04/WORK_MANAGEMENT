'use client';

import React, { useEffect, useRef } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import Header from '../../components/Header';
import Sidebar from '../../components/SideBar';
import { SidebarProvider, useSidebar } from '../../components/SidebarContext';
import { useDispatch, useSelector } from '../../store/hooks';
import { fetchProjects } from '../../store/project/projectSlice';

interface Member {
  id: string | number;
  name: string;
  email?: string;
}

interface Project {
  id: string | number;
  name: string;
  description?: string;
  created_at?: string;
  updated_at?: string;
  members?: Member[];
}

function ProjectDetailsContent() {
  const { projectId } = useParams<{ projectId: string }>();
  const { collapsed } = useSidebar();
  const dispatch = useDispatch();
  
  // Dynamic Redux state selectors (no hardcoded data)
  const token = useSelector((state: any) => state.auth.token);
  const projects = useSelector((state: any) => state.project.data) as Project[];
  const loading = useSelector((state: any) => state.project.loading);
  const error = useSelector((state: any) => state.project.error);
  const requestedProjectId = useRef<string | null>(null);

  const project = projects?.find((item) => String(item.id) === String(projectId));

  useEffect(() => {
    if (!token || project) return;

    if (loading) {
      requestedProjectId.current = projectId;
      return;
    }

    if (requestedProjectId.current === projectId) return;
    requestedProjectId.current = projectId;
    void dispatch(fetchProjects());
  }, [dispatch, loading, project, projectId, token]);

  const handleRetry = () => {
    requestedProjectId.current = projectId;
    void dispatch(fetchProjects());
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '—';
    try {
      const d = new Date(dateString);
      if (isNaN(d.getTime())) return dateString;
      return d.toLocaleDateString('en-US', {
        month: '2-digit',
        day: '2-digit',
        year: 'numeric',
      });
    } catch {
      return dateString;
    }
  };

  const getInitials = (name?: string) => {
    if (!name) return 'MB';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  return (
    <div className="min-h-screen bg-[#eaf1ea] text-[#0f172a] font-['Poppins',sans-serif] antialiased">
      <Sidebar />
      <main
        className={`min-h-screen pt-14 transition-all duration-300 lg:pt-0 ${
          collapsed ? 'lg:ml-20' : 'lg:ml-64'
        }`}
      >
        {/* Global Header */}
        <div className="px-4 pt-4 sm:px-6 lg:px-8">
          <Header userName="Guest User" userRole="Software Engineer" />
        </div>

        <div className="mx-auto max-w-6xl p-4 sm:p-6 lg:p-8 space-y-6">
          {/* Top Bar Navigation & Status */}
          <div className="flex items-center justify-between">
            <Link
              href="/project"
              className="inline-flex items-center gap-2 text-sm font-semibold text-[#1e293b] hover:text-[#059669] transition-colors"
            >
              <span>←</span>
              <span>All projects</span>
            </Link>

            {/* <div className="flex items-center gap-2 rounded-full border border-[#d2dfd2] bg-white/80 px-3.5 py-1 text-xs font-semibold text-[#0f172a] shadow-xs backdrop-blur-xs">
              <span className="h-2 w-2 rounded-full bg-[#10b981] animate-pulse"></span>
             Workspace Synced
            </div> */}
          </div>

          {project ? (
            <div className="space-y-6">
              {/* 1. HERO BANNER CARD */}
              <article className="relative overflow-hidden rounded-3xl border border-[#d2dfd2] bg-white p-6 shadow-xs sm:p-8 md:p-10">
                <div className="flex flex-col-reverse items-start justify-between gap-6 sm:flex-row sm:items-center">
                  <div className="max-w-xl space-y-4">
                    {/* Badge Chips */}
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="inline-flex items-center gap-1.5 rounded-full border border-[#a7f3d0] bg-[#ecfdf5] px-3 py-1 text-[11px] font-bold tracking-wider text-[#065f46] uppercase">
                        <span className="h-1.5 w-1.5 rounded-full bg-[#10b981]"></span>
                        PROJECT DETAILS
                      </span>
                      <span className="rounded-full border border-[#d2dfd2] bg-white px-3 py-1 text-xs font-semibold text-[#475569]">
                        Project #{project.id}
                      </span>
                    </div>

                    {/* Dynamic Project Title */}
                    <h1 className="text-3xl font-extrabold tracking-tight text-[#0f172a] sm:text-4xl md:text-5xl">
                      {project.name || 'Untitled Project'}
                    </h1>
                  </div>

                  {/* Cartoon Mascot Card */}
                  <div className="flex flex-col items-center justify-center rounded-2xl border border-[#d2dfd2] bg-[#f2f7f2] p-4 shadow-inner">
                    <div className="relative flex h-32 w-32 items-center justify-center sm:h-36 sm:w-36">
                      <img
                        src="/projectdetails.png"
                        alt="NANDGATE Developer Mascot"
                        className="h-full w-full object-contain"
                        onError={(e) => {
                          (e.currentTarget as HTMLElement).style.display = 'none';
                          const parent = e.currentTarget.parentElement;
                          if (parent && !parent.querySelector('.mascot-fallback')) {
                            const fallback = document.createElement('div');
                            fallback.className =
                              'mascot-fallback flex flex-col items-center justify-center text-center p-2';
                            fallback.innerHTML = `
                              <div class="w-12 h-12 rounded-xl bg-[#dcfce7] border border-[#86efac] flex items-center justify-center text-2xl shadow-sm mb-1">👨‍💻</div>
                            `;
                            parent.appendChild(fallback);
                          }
                        }}
                      />
                    </div>
                    {/* <div className="mt-2 inline-flex items-center gap-1.5 rounded-full border border-[#d2dfd2] bg-white px-3 py-0.5 text-[11px] font-semibold text-[#047857] shadow-xs">
                      <span className="h-1.5 w-1.5 rounded-full bg-[#10b981]"></span>
                      Active Project
                    </div> */}
                  </div>
                </div>
              </article>

              {/* 2. DATES ROW (CREATED & LAST UPDATED) */}
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                {/* Created Card */}
                <div className="relative overflow-hidden rounded-2xl border border-[#d2dfd2] bg-white p-6 shadow-xs transition-shadow hover:shadow-sm">
                  <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#10b981] to-[#34d399]"></div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold tracking-wider text-[#64748b] uppercase">
                      CREATED
                    </span>
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#e2e8f0] bg-[#f8fafc] text-[#10b981]">
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </span>
                  </div>
                  <div className="mt-4 text-2xl font-extrabold tracking-tight text-[#0f172a] sm:text-3xl">
                    {formatDate(project.created_at)}
                  </div>
                </div>

                {/* Last Updated Card */}
                <div className="relative overflow-hidden rounded-2xl border border-[#d2dfd2] bg-white p-6 shadow-xs transition-shadow hover:shadow-sm">
                  <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#10b981] to-[#34d399]"></div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold tracking-wider text-[#64748b] uppercase">
                      LAST UPDATED
                    </span>
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#e2e8f0] bg-[#f8fafc] text-[#10b981]">
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                    </span>
                  </div>
                  <div className="mt-4 text-2xl font-extrabold tracking-tight text-[#0f172a] sm:text-3xl">
                    {formatDate(project.updated_at)}
                  </div>
                </div>
              </div>

              {/* 3. CONTENT ROW: DESCRIPTION & MEMBERS */}
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
                {/* Description Box (7 cols) */}
                <div className="rounded-3xl border border-[#d2dfd2] bg-white p-6 shadow-xs sm:p-8 lg:col-span-7">
                  <div className="flex items-center gap-2.5 pb-4">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#ecfdf5] text-[#059669]">
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <h2 className="text-lg font-bold text-[#0f172a]">Description</h2>
                  </div>

                  {/* Soft inset panel for description text */}
                  <div className="mt-2 rounded-2xl border border-[#e2e8f0] bg-[#f8faf8] p-5">
                    <p className="text-sm font-medium leading-relaxed text-[#334155] whitespace-pre-wrap">
                      {project.description || 'No description provided.'}
                    </p>
                  </div>
                </div>

                {/* Members List (5 cols) */}
                <div className="rounded-3xl border border-[#d2dfd2] bg-white p-6 shadow-xs sm:p-8 lg:col-span-5">
                  <div className="flex items-center justify-between pb-4">
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#ecfdf5] text-[#059669]">
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                      </div>
                      <h2 className="text-lg font-bold text-[#0f172a]">Members</h2>
                    </div>

                    <span className="rounded-full border border-[#d2dfd2] bg-[#f1f5f1] px-3 py-1 text-xs font-semibold text-[#0f172a]">
                      {project.members?.length || 0} Members
                    </span>
                  </div>

                  {/* Dynamic Member Cards */}
                  <div className="mt-2 space-y-3">
                    {project.members && project.members.length > 0 ? (
                      project.members.map((member, idx) => {
                        const avatarBg =
                          idx % 3 === 0
                            ? 'bg-[#0f172a]'
                            : idx % 3 === 1
                            ? 'bg-[#059669]'
                            : 'bg-[#334155]';

                        return (
                          <div
                            key={member.id || idx}
                            className="flex items-center gap-3.5 rounded-2xl border border-[#e2e8f0] bg-white p-3.5 shadow-2xs transition-colors hover:border-[#10b981]"
                          >
                            <div
                              className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl font-bold text-xs text-white shadow-xs ${avatarBg}`}
                            >
                              {getInitials(member.name)}
                            </div>
                            <span className="truncate text-sm font-semibold text-[#0f172a]">
                              {member.name}
                            </span>
                          </div>
                        );
                      })
                    ) : (
                      <div className="rounded-2xl border border-dashed border-[#cbd5e1] p-6 text-center text-xs font-medium text-[#64748b]">
                        No members assigned to this project yet.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ) : loading ? (
            /* Loading State */
            <div className="flex flex-col items-center justify-center rounded-3xl border border-[#d2dfd2] bg-white p-16 text-center shadow-xs space-y-4">
              <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#d2dfd2] border-t-[#059669]"></div>
              <p className="text-sm font-semibold text-[#0f172a]">Loading project details…</p>
            </div>
          ) : error ? (
            /* Error State */
            <div
              className="rounded-3xl border border-rose-200 bg-rose-50 p-8 text-center text-sm text-rose-800 shadow-xs space-y-4"
              role="alert"
            >
              <p className="font-semibold">{error}</p>
              <button
                type="button"
                onClick={handleRetry}
                className="rounded-xl bg-rose-700 px-5 py-2 text-xs font-semibold text-white shadow-xs hover:bg-rose-800 active:scale-95 transition-all"
              >
                Retry
              </button>
            </div>
          ) : (
            /* Not Found State */
            <div className="rounded-3xl border border-[#d2dfd2] bg-white p-12 text-center shadow-xs space-y-3">
              <p className="text-sm font-semibold text-[#0f172a]">Project not found.</p>
              <Link href="/project" className="text-xs font-semibold text-[#059669] underline">
                Return to projects list
              </Link>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default function ProjectDetailsPage() {
  return (
    <SidebarProvider>
      <ProjectDetailsContent />
    </SidebarProvider>
  );
}