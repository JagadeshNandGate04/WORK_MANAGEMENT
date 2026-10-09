'use client';

import { useEffect, useRef } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import Header from '../../components/Header';
import Sidebar from '../../components/SideBar';
import { SidebarProvider, useSidebar } from '../../components/SidebarContext';
import { useDispatch, useSelector } from '../../store/hooks';
import { fetchProjects } from '../../store/project/projectSlice';

function ProjectDetailsContent() {
  const { projectId } = useParams<{ projectId: string }>();
  const { collapsed } = useSidebar();
  const dispatch = useDispatch();
  const token = useSelector((state) => state.auth.token);
  const projects = useSelector((state) => state.project.data);
  const loading = useSelector((state) => state.project.loading);
  const error = useSelector((state) => state.project.error);
  const requestedProjectId = useRef<string | null>(null);
  const project = projects.find((item) => String(item.id) === projectId);

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

  return (
    <div className="min-h-screen bg-[#dce7dc] text-[#1e293b] font-sans antialiased">
      <Sidebar />
      <main className={`min-h-screen pt-14 transition-all duration-300 lg:pt-0 ${collapsed ? 'lg:ml-20' : 'lg:ml-64'}`}>
        <div className="px-4 pt-4 sm:px-6 lg:px-7">
          <Header userName="Guest User" userRole="Team member" />
        </div>

        <div className="mx-auto max-w-5xl p-6 sm:p-8 lg:p-10">
          <Link href="/project" className="text-sm font-semibold text-emerald-800 hover:text-emerald-600">
            ← All projects
          </Link>

          {project ? (
            <article className="mt-6 rounded-3xl border border-[#d2dfd1] bg-white/95 p-6 shadow-sm sm:p-9">
              <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-100 pb-6">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.16em] text-emerald-700">Project details</p>
                  <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-slate-900">{project.name}</h1>
                </div>
                <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-800">
                  Project #{project.id}
                </span>
              </div>

              <section className="mt-6">
                <h2 className="text-sm font-bold text-slate-900">Description</h2>
                <p className="mt-2 whitespace-pre-wrap text-sm leading-7 text-slate-600">
                  {project.description || 'No description provided.'}
                </p>
              </section>

              <section className="mt-8 grid gap-6 border-t border-slate-100 pt-6 sm:grid-cols-2">
                <div>
                  <h2 className="text-sm font-bold text-slate-900">Created</h2>
                  <p className="mt-2 text-sm text-slate-600">
                    {project.created_at ? new Date(project.created_at).toLocaleDateString() : 'Not available'}
                  </p>
                </div>
                <div>
                  <h2 className="text-sm font-bold text-slate-900">Last updated</h2>
                  <p className="mt-2 text-sm text-slate-600">
                    {project.updated_at ? new Date(project.updated_at).toLocaleDateString() : 'Not available'}
                  </p>
                </div>
              </section>

              <section className="mt-8 border-t border-slate-100 pt-6">
                <h2 className="text-sm font-bold text-slate-900">Members</h2>
                {project.members?.length ? (
                  <ul className="mt-3 flex flex-wrap gap-2">
                    {project.members.map((member) => (
                      <li key={member.id} className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-700">
                        {member.name}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-2 text-sm text-slate-500">No members are assigned to this project.</p>
                )}
              </section>
            </article>
          ) : loading ? (
            <p className="mt-8 rounded-2xl bg-white p-6 text-sm text-slate-600" role="status">Loading project…</p>
          ) : error ? (
            <section className="mt-8 rounded-2xl border border-rose-200 bg-rose-50 p-6 text-sm text-rose-700" role="alert">
              <p>{error}</p>
              <button type="button" onClick={handleRetry} className="mt-4 rounded-lg bg-rose-700 px-4 py-2 font-semibold text-white hover:bg-rose-800">
                Retry loading project
              </button>
            </section>
          ) : token ? (
            <p className="mt-8 rounded-2xl bg-white p-6 text-sm text-slate-600" role="status">
              This project was not found. <Link href="/project" className="font-semibold text-emerald-800 underline">Return to projects</Link>.
            </p>
          ) : (
            <p className="mt-8 rounded-2xl bg-white p-6 text-sm text-slate-600" role="status">Sign in to load this project.</p>
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
