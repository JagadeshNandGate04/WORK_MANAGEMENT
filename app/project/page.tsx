'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import Sidebar from '../components/SideBar';
import Header from '../components/Header';
import CreateNewProjectForm from '../components/CreateNewProjectForm';
import EditProjectForm from '../components/EditProjectForm';
import { SidebarProvider, useSidebar } from '../components/SidebarContext';
import { useDispatch, useSelector } from '../store/hooks';
import { fetchProjects } from '../store/project/projectSlice';

interface ProjectDisplayItem {
  id: string;
  name: string;
  category: string;
  categoryColor: 'green' | 'blue';
  date: string;
  description: string;
  createdBy: number;
  members: { id: number; name: string }[];
}

function toDisplayProject(project: {
  id: number;
  name: string;
  description: string;
  created_by: number;
  created_at: string;
  updated_at: string;
  members?: { id: number; name: string }[];
}): ProjectDisplayItem {
  const name = project.name.trim();
  const normalizedName = name.toLowerCase();
  const category = normalizedName.includes('health') || normalizedName.includes('clear path')
    ? 'HEALTHCARE'
    : 'COMMUNITY';

  return {
    id: String(project.id),
    name,
    category,
    categoryColor: category === 'HEALTHCARE' ? 'green' : 'blue',
    date: new Intl.DateTimeFormat('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }).format(new Date(project.updated_at)),
    description: project.description,
    createdBy: project.created_by,
    members: project.members ?? [],
  };
}

function ProjectPageContent() {
  const { collapsed } = useSidebar();
  const dispatch = useDispatch();
  const token = useSelector((state) => state.auth.token);
  const authUser = useSelector((state) => state.auth.user);
  const projectData = useSelector((state) => state.project.data);
  const loading = useSelector((state) => state.project.loading);
  const error = useSelector((state) => state.project.error);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<'All Projects' | 'Healthcare' | 'Community'>('All Projects');
  const [isCreateProjectOpen, setIsCreateProjectOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<ProjectDisplayItem | null>(null);

  useEffect(() => {
    if (token) {
      void dispatch(fetchProjects());
    }
  }, [dispatch, token]);

  const projects = useMemo(
    () => projectData.map(toDisplayProject),
    [projectData]
  );

  const availableMembers = useMemo(() => {
    const membersById = new Map<number, { id: number; name: string }>();

    projectData.forEach((project) => {
      project.members?.forEach((member) => {
        membersById.set(member.id, member);
      });
    });

    if (authUser?.id && !membersById.has(authUser.id)) {
      membersById.set(authUser.id, {
        id: authUser.id,
        name: authUser.name || authUser.email,
      });
    }

    return Array.from(membersById.values());
  }, [authUser, projectData]);

  const filteredProjects = useMemo(() => {
    const search = searchQuery.trim().toLowerCase();
    return projects.filter((project) => {
      const matchesSearch = !search || `${project.name} ${project.description}`.toLowerCase().includes(search);
      const matchesFilter = selectedFilter === 'All Projects'
        || (selectedFilter === 'Healthcare' && project.category === 'HEALTHCARE')
        || (selectedFilter === 'Community' && project.category === 'COMMUNITY');
      return matchesSearch && matchesFilter;
    });
  }, [projects, searchQuery, selectedFilter]);

  const headerName = authUser?.name?.trim() || authUser?.email?.split('@')[0] || 'Guest User';
  const userInitials = headerName
    .split(/\s+/)
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
  const headerRole = authUser?.role || authUser?.designation || 'Team member';

  const isOverlayOpen = isCreateProjectOpen || selectedProject !== null;

  return (
    <div className="min-h-screen bg-[#dce7dc] text-[#1e293b] font-sans antialiased selection:bg-[#0f172a] selection:text-white">
      {!isOverlayOpen && <Sidebar />}

      <div className={`min-h-screen pt-14 transition-all duration-300 lg:pt-0 ${isOverlayOpen ? 'lg:ml-0' : collapsed ? 'lg:ml-20' : 'lg:ml-64'}`}>
        <div className="px-4 pt-4 sm:px-6 lg:px-7">
          <Header
            userName={headerName}
            userRole={headerRole}
            userEmail={authUser?.email || ''}
            userInitials={userInitials || 'GU'}
            activeTab="Project"
          />
        </div>

        <div className="max-w-[1440px] w-full mx-auto space-y-6 p-6 sm:p-8 lg:p-10">
          <section className="relative flex flex-col overflow-hidden rounded-[32px] border border-[#d2dfd1] bg-[#edf3ec]/90 p-8 shadow-sm lg:flex-row lg:items-center lg:justify-between lg:p-10">
            <div className="relative z-10 max-w-2xl space-y-4">
              <div className="inline-flex items-center gap-2 rounded-full border border-[#cbdbca] bg-[#e2ede0] px-3.5 py-1 text-[11px] font-bold uppercase tracking-wider text-[#34543b]">
                <span className="h-2 w-2 rounded-full bg-[#10b981]" />
                NANDGATE WORKSPACES
              </div>
              <h1 className="flex items-center gap-3 text-3xl font-extrabold tracking-tight text-[#0f172a] sm:text-4xl lg:text-5xl">
                Projects Overview
                <img
                  src="https://cdn-icons-png.flaticon.com/256/1150/1150643.png"
                  alt="Project Overview Icon"
                  className="inline-block h-8 w-8 object-contain sm:h-10 sm:w-10"
                />
              </h1>
              <p className="max-w-xl text-sm leading-relaxed text-[#475569] sm:text-base">
                Manage your production repositories, client healthcare initiatives, and synchronized engineering workspaces across distributed teams.
              </p>
              <div className="flex flex-wrap items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCreateProjectOpen(true)}
                  className="inline-flex items-center gap-2 rounded-xl bg-[#0f172a] px-5 py-2.5 text-xs font-bold text-white shadow-md transition hover:bg-[#1e293b]"
                >
                  <span className="text-base leading-none">+</span> New Project
                </button>
                <button type="button" className="inline-flex items-center gap-2 rounded-xl border border-[#cbd5e1] bg-white px-4 py-2.5 text-xs font-bold text-[#334155] shadow-sm transition hover:bg-[#f8fafc]">
                  Documentation
                </button>
                <div className="hidden items-center gap-2 rounded-xl border border-[#cfe0ce] bg-[#e4efe2] px-3.5 py-2 text-xs font-medium text-[#475569] sm:inline-flex">
                  <span className="h-2 w-2 rounded-full bg-[#10b981]" />
                  All services operational
                </div>
              </div>
            </div>

            <div className="relative mt-8 flex shrink-0 items-center justify-center lg:mt-0">
              <div className="relative flex h-64 w-64 items-center justify-center overflow-hidden rounded-[28px] border border-[#cbdbca] bg-[#e2ede1]/80 p-3 shadow-inner sm:h-72 sm:w-72">
                <img
                  src="/project.png"
                  alt="Developer Sprint Ready Mascot"
                  className="h-full w-full object-contain"
                />
              </div>
            </div>
          </section>

          <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="relative flex flex-col justify-between overflow-hidden rounded-2xl border border-[#d2ded1] bg-white/90 p-5 shadow-sm">
              <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-[#64748b]">
                Total Projects
                <span className="rounded-lg bg-[#eaf4e8] p-1.5 text-[#2d6a4f]">▣</span>
              </div>
              <div className="mt-4 flex items-baseline justify-between">
                <span className="text-3xl font-black text-[#0f172a]">{loading ? '--' : projects.length}</span>
                <span className="text-[11px] font-semibold text-[#64748b]">Live API</span>
              </div>
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-[#10b981]" />
            </div>

            <div className="relative flex flex-col justify-between overflow-hidden rounded-2xl border border-[#d2ded1] bg-white/90 p-5 shadow-sm">
              <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-[#64748b]">
                Active Workspaces
                <span className="rounded-lg bg-[#eaf4e8] p-1.5 text-[#2d6a4f]">◇</span>
              </div>
              <div className="mt-4 flex items-baseline justify-between">
                <span className="text-3xl font-black text-[#0f172a]">{loading ? '--' : projects.length}</span>
                <span className="text-[11px] font-semibold text-[#64748b]">Connected</span>
              </div>
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-[#0ea5e9]" />
            </div>

            <div className="relative flex flex-col justify-between overflow-hidden rounded-2xl border border-[#d2ded1] bg-white/90 p-5 shadow-sm">
              <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-[#64748b]">
                Lead Maintainer
                <span className="rounded-lg bg-[#fef3c7] p-1.5 text-[#d97706]">◎</span>
              </div>
              <div className="mt-4 flex items-center justify-between">
                <div>
                  <p className="text-sm font-bold text-[#0f172a]">Session User</p>
                  <p className="mt-0.5 text-[11px] text-[#64748b]">API Authenticated</p>
                </div>
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#0f172a] text-[10px] font-bold text-white">SU</span>
              </div>
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-[#f59e0b]" />
            </div>

            <div className="relative flex flex-col justify-between overflow-hidden rounded-2xl border border-[#d2ded1] bg-white/90 p-5 shadow-sm">
              <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-[#64748b]">
                Last Sync
                <span className="rounded-lg bg-[#e0f2fe] p-1.5 text-[#0284c7]">↻</span>
              </div>
              <div className="mt-4 flex items-baseline justify-between">
                <span className="text-2xl font-black text-[#0f172a]">--:--</span>
                <span className="flex items-center gap-1.5 text-xs font-semibold text-[#10b981]">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#10b981]" /> Ready
                </span>
              </div>
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-[#8b5cf6]" />
            </div>
          </section>

          <section className="flex flex-col gap-3 rounded-2xl border border-[#d2ded1] bg-white/90 p-3 shadow-sm sm:flex-row sm:items-center sm:justify-between">
            <div className="relative w-full sm:w-96">
              <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-[#94a3b8]">⌕</span>
              <input
                type="search"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Search projects by title, tags..."
                className="w-full rounded-xl border border-[#e2e8f0] bg-white py-2 pl-9 pr-10 text-xs text-[#0f172a] placeholder:text-[#94a3b8] focus:outline-none focus:ring-2 focus:ring-[#0f172a]"
              />
              <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center rounded border border-[#e2e8f0] bg-[#f1f5f9] px-1.5 py-0.5 font-mono text-[10px] font-semibold text-[#94a3b8]">⌘K</span>
            </div>
            <div className="flex gap-2 overflow-x-auto">
              {(['All Projects', 'Healthcare', 'Community'] as const).map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setSelectedFilter(tab)}
                  className={`whitespace-nowrap rounded-lg px-4 py-1.5 text-xs font-bold transition ${selectedFilter === tab ? 'bg-[#0f172a] text-white shadow-sm' : 'bg-[#f1f5f9] text-[#64748b] hover:bg-[#e2e8f0]'}`}
                >
                  {tab}
                </button>
              ))}
            </div>
          </section>

          {error && (
            <section className="rounded-2xl border border-rose-200 bg-rose-50 px-5 py-4 text-sm text-rose-700" role="alert">
              {error}
            </section>
          )}

          <section className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredProjects.map((project) => (
              <div
                key={project.id}
                className="flex min-h-[300px] flex-col justify-between rounded-2xl border border-[#d2ded1] bg-white/95 p-6 shadow-sm transition hover:shadow-md"
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between text-xs font-semibold">
                    <span className={`rounded px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${project.categoryColor === 'green' ? 'bg-[#e8f5e9] text-[#2e7d32]' : 'bg-[#e0f2fe] text-[#0369a1]'}`}>
                      {project.category}
                    </span>
                    <span className="text-[11px] font-medium text-[#64748b]">{project.date}</span>
                  </div>

                  <div>
                    <h3 className="text-xl font-extrabold text-[#0f172a]">{project.name}</h3>
                    <p className="mt-2 text-xs leading-relaxed text-[#64748b]">
                      {project.description || 'No description provided.'}
                    </p>
                  </div>

                  {/* Members row — first letter of first name, same style as owner avatar */}
                  <div className="flex items-center gap-2">
                    <div className="flex -space-x-2">
                      {project.members.length > 0 ? (
                        project.members.slice(0, 5).map((member, idx) => {
                          const initial = member.name.trim().charAt(0).toUpperCase() || '?';
                          const palettes = [
                            'bg-[#0f172a] text-white',
                            'bg-[#10b981] text-white',
                            'bg-[#0ea5e9] text-white',
                            'bg-[#f59e0b] text-white',
                            'bg-[#8b5cf6] text-white',
                          ];
                          const palette = palettes[idx % palettes.length];
                          return (
                            <span
                              key={member.id}
                              title={member.name}
                              className={`flex h-8 w-8 items-center justify-center rounded-full border-2 border-white text-[11px] font-bold shadow-sm ${palette}`}
                            >
                              {initial}
                            </span>
                          );
                        })
                      ) : (
                        <span className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-[#0f172a] text-[11px] font-bold text-white shadow-sm">
                          U1
                        </span>
                      )}

                      {project.members.length > 5 && (
                        <span className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-[#e2e8f0] text-[11px] font-bold text-[#475569] shadow-sm">
                          +{project.members.length - 5}
                        </span>
                      )}
                    </div>

                    <span className="text-[11px] font-medium text-[#64748b]">
                      {project.members.length > 0
                        ? `${project.members.length} member${project.members.length > 1 ? 's' : ''}`
                        : 'No members'}
                    </span>
                  </div>
                </div>

                {/* Footer: Edit + Delete icons on the left, Open Project on the right */}
                <div className="mt-6 flex items-center justify-between border-t border-[#f1f5f9] pt-6">
                  <div className="flex items-center gap-1">
                    {/* EDIT ICON */}
                    <button
                      type="button"
                      aria-label={`Edit ${project.name}`}
                      title="Edit project"
                      onClick={() => setSelectedProject(project)}
                      className="rounded-lg p-2 text-[#64748b] transition hover:bg-[#e8f5e9] hover:text-[#10b981]"
                    >
                      <img
                        src="https://d1nhio0ox7pgb.cloudfront.net/_img/o_collection_png/green_dark_grey/512x512/plain/edit.png"
                        alt="Edit"
                        className="h-4 w-4 object-contain"
                      />
                    </button>

                    {/* DELETE ICON */}
                    <button
                      type="button"
                      aria-label={`Delete ${project.name}`}
                      title="Delete project"
                      onClick={() => {
                        // TODO: wire to your existing delete handler
                        // e.g. dispatch(deleteProject(Number(project.id)))
                      }}
                      className="rounded-lg p-2 text-[#64748b] transition hover:bg-rose-50 hover:text-rose-600"
                    >
                      <img
                        src="https://d1nhio0ox7pgb.cloudfront.net/_img/o_collection_png/green_dark_grey/512x512/plain/selection_delete.png"
                        alt="Delete"
                        className="h-4 w-4 object-contain"
                      />
                    </button>
                  </div>

                  <Link
                    href={`/project/${project.id}`}
                    className="text-xs font-bold text-[#0f172a] transition hover:text-[#10b981]"
                  >
                    Open Project →
                  </Link>
                </div>
              </div>
            ))}

            <button
              type="button"
              onClick={() => setIsCreateProjectOpen(true)}
              className="group flex min-h-[300px] flex-col items-center justify-center rounded-2xl border-2 border-dashed border-[#c3d5c2] bg-[#eef3ec]/70 p-6 text-center transition hover:border-[#10b981] hover:bg-white hover:shadow-md"
            >
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl border border-[#d2ded1] bg-white text-[#475569] text-2xl shadow-sm transition group-hover:scale-110 group-hover:text-[#10b981]">+</div>
              <h4 className="text-base font-bold text-[#0f172a] transition group-hover:text-[#10b981]">Create New Project</h4>
              <p className="mt-1.5 max-w-xs text-xs leading-relaxed text-[#64748b]">
                Bootstrap a repo, configure automated workflows, or import from GitHub.
              </p>
            </button>
          </section>

          {isCreateProjectOpen && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-slate-950/60 p-3 backdrop-blur-sm sm:p-6">
              <div className="w-full max-w-6xl overflow-hidden rounded-[28px] shadow-2xl">
                <CreateNewProjectForm onClose={() => setIsCreateProjectOpen(false)} />
              </div>
            </div>
          )}

          {selectedProject && (
            <EditProjectForm
              project={selectedProject}
              availableMembers={availableMembers}
              onClose={() => setSelectedProject(null)}
            />
          )}

          <footer className="mx-auto mt-10 flex max-w-[1440px] flex-col gap-3 border-t border-[#cad8c9] pt-4 text-xs text-[#64748b] sm:flex-row sm:items-center sm:justify-between">
            <span>© 2026 NANDGATE Inc. All systems operational.</span>
            <div className="flex gap-6 font-medium">
              <a href="#security" className="hover:text-[#0f172a]">Security</a>
              <a href="#privacy" className="hover:text-[#0f172a]">Privacy</a>
              <a href="#docs" className="hover:text-[#0f172a]">Docs</a>
            </div>
          </footer>
        </div>
      </div>
    </div>
  );
}

export default function ProjectsPage() {
  return (
    <SidebarProvider>
      <ProjectPageContent />
    </SidebarProvider>
  );
}