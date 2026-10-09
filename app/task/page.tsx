'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import Header from '../components/Header';
import Sidebar from '../components/SideBar';
import { SidebarProvider, useSidebar } from '../components/SidebarContext';
import { useDispatch, useSelector } from '../store/hooks';
import { fetchProjects } from '../store/project/projectSlice';
import { fetchWorkspaceMembers } from '../store/member/memberSlice';
import { fetchTasksForProjects } from '../store/task/taskSlice';
import { fetchDashboard } from '../store/dashboard/dashBoardSlice';
import { createTask } from '../store/task/taskSlice';
import CreateTaskModal from '../components/CreateTaskForm';

// Task shape used by the list
export interface TaskItem {
  id: number;
  task_code: string;
  project_id: number;
  project_name: string;
  name: string;
  description: string;
  assignee_id: number | null;
  assignee_name: string;
  assignee_email?: string;
  assignee_role?: string;
  due_date: string;
  priority: number; // 0: Critical (P0), 1: High (P1), 2: Medium (P2), 3: Normal (P3)
  status: number; // 0: Todo, 1: In Progress, 2: Review, 3: Completed
  created_by: number;
  created_by_name: string;
  created_at: string;
}

export interface ProjectOption {
  id: number;
  name: string;
}

interface TaskOperationsProps {
  /** Tasks to show. Empty by default. */
  tasks?: TaskItem[];
  /** Projects for the scope tabs. Empty by default. */
  projects?: ProjectOption[];
  workspaceName?: string;
  loading?: boolean;
  error?: string;
  onRetry?: () => void;
  /** Opens your "create task" popup or page */
  onNewTask?: (projectId?: number) => void;
  onViewTask?: (task: TaskItem) => void;
  onEditTask?: (task: TaskItem) => void;
}

type ViewMode = 'list' | 'kanban' | 'timeline';

const PROJECT_DOT_COLORS = [
  'bg-emerald-500',
  'bg-blue-500',
  'bg-purple-500',
  'bg-amber-500',
  'bg-rose-500',
  'bg-sky-500',
];

const STATUS_COLUMNS = [
  { value: 1, label: 'Needs Triage' },
  { value: 2, label: 'Fixing' },
  { value: 3, label: 'Ready to Retest' },
  { value: 4, label: 'Retest' },
  { value: 5, label: 'Verified' },
  { value: 6, label: 'Closed' },
  { value: 7, label: 'Completed' },
];

// ---------- Badges ----------
function PriorityBadge({ priority }: { priority: number }) {
  switch (priority) {
    case 1:
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200 whitespace-nowrap">
          <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
          Low
        </span>
      );
    case 2:
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200 whitespace-nowrap">
          <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
          Medium
        </span>
      );
    case 3:
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200 whitespace-nowrap">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
          High
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200 whitespace-nowrap">
          <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
          Unknown
        </span>
      );
  }
}

function StatusBadge({ status }: { status: number }) {
  const labels: Record<number, string> = {
    1: 'Needs Triage',
    2: 'Fixing',
    3: 'Ready to Retest',
    4: 'Retest',
    5: 'Verified',
    6: 'Closed',
    7: 'Completed',
  };
  const completed = status === 7;
  const label = labels[status] || 'Unknown';

  return (
    <span className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-3 py-1 text-xs font-semibold ${completed ? 'border-emerald-200 bg-emerald-50 text-emerald-800' : 'border-slate-200 bg-slate-100 text-slate-700'}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${completed ? 'bg-emerald-600' : 'bg-slate-400'}`} />
      {label}
    </span>
  );
}

// Assignee initials
const getInitials = (name?: string) => {
  if (!name) return '?';
  return (
    name
      .split(/\s+/)
      .filter(Boolean)
      .map((part) => part[0])
      .join('')
      .toUpperCase()
      .slice(0, 2) || '?'
  );
};

function TaskOperations({
  tasks = [],
  projects = [],
  workspaceName = 'Workspace',
  loading = false,
  error = '',
  onRetry,
  onNewTask,
  onViewTask,
  onEditTask,
}: TaskOperationsProps) {
  const [selectedProjectId, setSelectedProjectId] = useState<number | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPriority, setSelectedPriority] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [activeView, setActiveView] = useState<ViewMode>('list');

  // Hero illustration: /images/cartoon-dev-taskboard.png -> /loginlogo.png -> emoji
  const [heroSrc, setHeroSrc] = useState<string | null>('/task.png');

  // Scope tabs built from the projects you pass in
  const projectTabs = useMemo(
    () => [
      { id: 'all' as const, name: 'All Projects', dotColor: undefined as string | undefined },
      ...projects.map((p, i) => ({
        id: p.id,
        name: p.name,
        dotColor: PROJECT_DOT_COLORS[i % PROJECT_DOT_COLORS.length] as string | undefined,
      })),
    ],
    [projects]
  );

  // Filtered tasks
  const filteredTasks = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return tasks.filter((task) => {
      if (selectedProjectId !== 'all' && task.project_id !== selectedProjectId) return false;
      if (
        query &&
        !task.name.toLowerCase().includes(query) &&
        !(task.description ?? '').toLowerCase().includes(query) &&
        !(task.task_code ?? '').toLowerCase().includes(query)
      ) {
        return false;
      }
      if (selectedPriority !== 'all' && String(task.priority) !== selectedPriority) return false;
      if (selectedStatus !== 'all' && String(task.status) !== selectedStatus) return false;
      return true;
    });
  }, [tasks, selectedProjectId, searchQuery, selectedPriority, selectedStatus]);

  // Timeline: tasks ordered by due date
  const timelineTasks = useMemo(() => {
    return [...filteredTasks].sort((a, b) => {
      const da = Date.parse(a.due_date);
      const db = Date.parse(b.due_date);
      if (Number.isNaN(da) && Number.isNaN(db)) return 0;
      if (Number.isNaN(da)) return 1;
      if (Number.isNaN(db)) return -1;
      return da - db;
    });
  }, [filteredTasks]);

  // Assignee with the most tasks in the current view
  const leadAssignee = useMemo(() => {
    const counts = new Map<string, number>();
    filteredTasks.forEach((t) => {
      if (t.assignee_name) counts.set(t.assignee_name, (counts.get(t.assignee_name) ?? 0) + 1);
    });
    return Array.from(counts.entries()).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;
  }, [filteredTasks]);

  const fixingCount = filteredTasks.filter((t) => t.status === 2).length;
  const retestCount = filteredTasks.filter((t) => t.status === 3 || t.status === 4).length;
  const completedCount = tasks.filter((t) => t.status === 7).length;

  const selectedProjectName =
    selectedProjectId === 'all' ? null : projects.find((p) => p.id === selectedProjectId)?.name ?? null;

  const viewButtonClass = (view: ViewMode) =>
    `inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
      activeView === view ? 'bg-[#081b2c] text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
    }`;

  const selectClass =
    'px-3 py-2 bg-white border border-[#cbdbcb] rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#081b2c]';

  return (
    <div className="min-h-screen bg-[#dbe5d8] text-slate-800 p-4 sm:p-6 md:p-8 font-sans antialiased">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* 1. HERO HEADER CARD */}
        <div className="bg-white rounded-3xl border border-[#cbdbcb] p-6 sm:p-8 shadow-sm relative overflow-hidden flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            {/* Breadcrumb indicator */}
            <div className="flex items-center gap-2 text-xs font-mono font-bold tracking-wider text-slate-500 uppercase">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span>{workspaceName}</span>
              <span className="text-slate-300">/</span>
              <span className="text-[#2d5034]">SPRINT TASKS HUB</span>
            </div>

            <h1 className="text-3xl sm:text-4xl font-extrabold text-[#091e13] tracking-tight">Task Operations</h1>

            <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
              Orchestrate deliverable velocity, triage tickets, and switch seamlessly between active engineering
              projects across all microservices and client apps.
            </p>

            {/* Quick metric badges (counted from your data) */}
            <div className="flex flex-wrap items-center gap-2 pt-2">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#edf3ec] border border-[#d2ded1] text-xs font-bold text-slate-700">
                <svg className="w-3.5 h-3.5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                  />
                </svg>
                <span>
                  {projects.length} {projects.length === 1 ? 'Project' : 'Projects'}
                </span>
              </div>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#edf3ec] border border-[#d2ded1] text-xs font-bold text-slate-700">
                <svg className="w-3.5 h-3.5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>{tasks.length} Tasks Tracked</span>
              </div>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#edf3ec] border border-[#d2ded1] text-xs font-bold text-[#1b6b36]">
                <svg className="w-3.5 h-3.5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                <span>{completedCount} Completed</span>
              </div>
            </div>
          </div>

          {/* Right mascot card */}
          <div className="shrink-0 w-44 sm:w-52 h-44 sm:h-52 rounded-2xl bg-[#edf3ec] border border-[#d2ded1] p-2 flex items-center justify-center overflow-hidden">
            {heroSrc ? (
              <img
                src={heroSrc}
                alt="Sprint task operations mascot"
                className="w-full h-full object-contain"
                onError={() =>
                  setHeroSrc((prev) => (prev === '/task.png' ? '/task.png' : null))
                }
              />
            ) : (
              <div className="flex flex-col items-center justify-center text-center p-3">
                <span className="text-5xl" aria-hidden="true">
                  📋
                </span>
                <span className="text-xs font-bold text-slate-600 mt-2">Sprint Board</span>
              </div>
            )}
          </div>
        </div>

        {/* 2. PROJECT SELECTION & SCOPE TABS */}
        <div className="bg-white rounded-2xl border border-[#cbdbcb] p-4 shadow-sm">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-xs font-mono font-bold uppercase tracking-wider text-slate-600">
              <svg className="w-4 h-4 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
              </svg>
              <span>PROJECT SELECTION &amp; SCOPE</span>
            </div>
            <div className="flex flex-col items-start gap-2 lg:items-end">
              <button
                type="button"
                onClick={() => onNewTask?.(selectedProjectId === 'all' ? undefined : selectedProjectId)}
                className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-[#1b6b36] px-4 py-2 text-xs font-bold text-white shadow-sm transition-all hover:bg-[#14562b]"
              >
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" />
                </svg>
                <span>New Task</span>
              </button>
              <span className="text-xs text-slate-400">
                {selectedProjectName ? `Showing tasks for ${selectedProjectName}` : 'Showing tasks for all projects'}
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 mt-3 pt-3 border-t border-[#edf3ec]">
            {projectTabs.map((tab) => {
              const isActive = selectedProjectId === tab.id;
              const count = tab.id === 'all' ? tasks.length : tasks.filter((t) => t.project_id === tab.id).length;

              return (
                <button
                  key={String(tab.id)}
                  type="button"
                  onClick={() => setSelectedProjectId(tab.id)}
                  aria-pressed={isActive}
                  className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                    isActive
                      ? 'bg-[#081b2c] text-white shadow-sm'
                      : 'bg-[#f4f7f4] hover:bg-[#e6eee5] text-slate-700 border border-[#d2ded1]'
                  }`}
                >
                  {tab.dotColor && <span className={`w-2 h-2 rounded-full ${tab.dotColor}`} />}
                  {tab.id === 'all' && (
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
                      />
                    </svg>
                  )}
                  <span>{tab.name}</span>
                  <span
                    className={`ml-1 px-1.5 py-0.5 rounded-md text-[10px] font-mono font-bold ${
                      isActive ? 'bg-white/20 text-white' : 'bg-[#dce8db] text-[#2d5034]'
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 3. STATS CARDS */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-2xl border border-[#cbdbcb] p-4 flex items-center justify-between shadow-sm">
            <div>
              <div className="text-[11px] font-mono uppercase font-bold text-slate-500">TOTAL ACTIVE TASKS</div>
              <div className="text-2xl font-black text-slate-900 mt-1">{String(filteredTasks.length).padStart(2, '0')}</div>
            </div>
            <div className="w-9 h-9 rounded-xl bg-[#edf3ec] border border-[#d2ded1] flex items-center justify-center text-slate-600">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 10h16M4 14h16M4 18h16" />
              </svg>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-[#cbdbcb] p-4 flex items-center justify-between shadow-sm">
            <div>
              <div className="text-[11px] font-mono uppercase font-bold text-slate-500">FIXING</div>
              <div className="text-2xl font-black text-emerald-700 mt-1">{String(fixingCount).padStart(2, '0')}</div>
            </div>
            <div className="w-9 h-9 rounded-xl bg-[#e7f7ec] border border-[#c4e8cb] flex items-center justify-center text-emerald-700">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-[#cbdbcb] p-4 flex items-center justify-between shadow-sm">
            <div>
              <div className="text-[11px] font-mono uppercase font-bold text-slate-500">READY FOR RETEST</div>
              <div className="text-2xl font-black text-amber-600 mt-1">{String(retestCount).padStart(2, '0')}</div>
            </div>
            <div className="w-9 h-9 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-700">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
          </div>

          <div className="min-h-[88px] bg-white rounded-2xl border border-[#cbdbcb] p-4 flex items-center justify-between shadow-sm">
              <div className="min-w-0">
                <div className="text-[11px] font-mono uppercase font-bold text-slate-500">LEAD ASSIGNEE</div>
                {leadAssignee ? (
                  <div className="flex items-center gap-2 mt-1">
                    <span className="w-6 h-6 rounded-full bg-[#081b2c] text-white flex items-center justify-center text-[10px] font-bold shrink-0">
                      {getInitials(leadAssignee)}
                    </span>
                    <span className="text-xs font-bold text-slate-800 truncate">{leadAssignee}</span>
                  </div>
                ) : (
                  <div className="text-2xl font-black text-slate-300 mt-1">—</div>
                )}
              </div>
              <div className="w-9 h-9 rounded-xl bg-[#edf3ec] border border-[#d2ded1] flex items-center justify-center text-slate-600 shrink-0">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
          </div>
        </div>

        {/* 4. CONTROLS BAR */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* View mode switcher */}
          <div className="inline-flex p-1 bg-white border border-[#cbdbcb] rounded-xl self-start">
            <button type="button" onClick={() => setActiveView('list')} aria-pressed={activeView === 'list'} className={viewButtonClass('list')}>
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
              <span>List View</span>
            </button>
            <button type="button" onClick={() => setActiveView('kanban')} aria-pressed={activeView === 'kanban'} className={viewButtonClass('kanban')}>
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2"
                />
              </svg>
              <span>Kanban</span>
            </button>
            <button type="button" onClick={() => setActiveView('timeline')} aria-pressed={activeView === 'timeline'} className={viewButtonClass('timeline')}>
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span>Timeline</span>
            </button>
          </div>

          {/* Search and filters */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative min-w-[240px]">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search tasks across projects..."
                aria-label="Search tasks"
                className="w-full pl-9 pr-4 py-2 bg-white border border-[#cbdbcb] rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#081b2c]"
              />
            </div>

            <select value={selectedPriority} onChange={(e) => setSelectedPriority(e.target.value)} aria-label="Filter by priority" className={selectClass}>
              <option value="all">All Priorities</option>
              <option value="1">Low</option>
              <option value="2">Medium</option>
              <option value="3">High</option>
            </select>

            <select value={selectedStatus} onChange={(e) => setSelectedStatus(e.target.value)} aria-label="Filter by status" className={selectClass}>
              <option value="all">All Statuses</option>
              <option value="1">Needs Triage</option>
              <option value="2">Fixing</option>
              <option value="3">Ready to Retest</option>
              <option value="4">Retest</option>
              <option value="5">Verified</option>
              <option value="6">Closed</option>
              <option value="7">Completed</option>
            </select>

          </div>
        </div>

        {/* Error banner */}
        {error && (
          <div role="alert" className="rounded-2xl bg-rose-50 border border-rose-200/80 px-5 py-3 text-sm text-rose-700 flex items-center justify-between gap-3">
            <span>{error}</span>
            {onRetry && (
              <button
                type="button"
                onClick={onRetry}
                className="px-3 py-1.5 rounded-lg bg-white border border-rose-200 text-xs font-bold text-rose-700 hover:bg-rose-100 transition-colors"
              >
                Retry
              </button>
            )}
          </div>
        )}

        {/* 5. TASKS AREA */}
        {loading ? (
          <div className="bg-white rounded-3xl border border-[#cbdbcb] p-12 text-center text-slate-500 text-sm shadow-sm">
            Loading tasks...
          </div>
        ) : activeView === 'list' ? (
          /* ---------- List view ---------- */
          <div className="bg-white rounded-3xl border border-[#cbdbcb] overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <div className="min-w-[1180px]">
                {/* Table header row */}
                <div className="grid grid-cols-[110px_minmax(220px,1.5fr)_minmax(170px,1fr)_minmax(185px,1.2fr)_120px_110px_150px] items-center gap-4 border-b border-[#edf3ec] bg-[#f8faf8] px-6 py-3.5 text-[11px] font-mono font-bold uppercase text-slate-500">
                  <div>TASK ID</div>
                  <div>TASK &amp; PROJECT HIERARCHY</div>
                  <div>ASSIGNEE</div>
                  <div>DUE DATE &amp; CREATED BY</div>
                  <div>PRIORITY</div>
                  <div>STATUS</div>
                  <div className="text-left">ACTIONS</div>
                </div>

                {/* Task rows */}
                <div className="divide-y divide-[#edf3ec]">
                  {filteredTasks.length === 0 ? (
                    <div className="p-12 text-center text-slate-500 text-sm">
                      {tasks.length === 0 ? 'No tasks yet.' : 'No tasks found matching your filters.'}
                    </div>
                  ) : (
                    filteredTasks.map((task) => (
                      <div
                        key={task.id}
                        className="grid grid-cols-[110px_minmax(220px,1.5fr)_minmax(170px,1fr)_minmax(185px,1.2fr)_120px_110px_150px] items-center gap-4 px-6 py-4 hover:bg-[#f9fbf9] transition-colors group"
                      >
                        {/* Task ID with checkbox */}
                        <div className="flex min-w-0 items-center gap-2.5">
                          <input
                            type="checkbox"
                            aria-label={`Select ${task.task_code}`}
                            className="w-4 h-4 rounded text-[#1b6b36] border-[#cbdbcb] focus:ring-[#1b6b36]"
                          />
                          <span className="font-mono text-xs font-bold text-slate-800">{task.task_code}</span>
                        </div>

                        {/* Task title & project */}
                        <div className="min-w-0 space-y-1">
                          <div className="text-sm font-bold text-[#091e13] group-hover:text-[#1b6b36] transition-colors">
                            {task.name}
                          </div>
                          <div className="text-xs text-slate-500 line-clamp-1">{task.description}</div>
                          <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-[#edf3ec] text-[#2d5034] text-[11px] font-medium border border-[#d2ded1]">
                            <svg className="w-3 h-3 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                            </svg>
                            <span>{task.project_name}</span>
                          </div>
                        </div>

                        {/* Assignee */}
                        <div className="flex min-w-0 items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-[#081b2c] text-white flex items-center justify-center text-xs font-bold shrink-0">
                            {getInitials(task.assignee_name)}
                          </div>
                          <div className="leading-tight min-w-0">
                            <div className="text-xs font-bold text-slate-900 truncate">{task.assignee_name || 'Unassigned'}</div>
                            <div className="text-[10px] text-slate-500 truncate">
                              {task.assignee_email || (task.assignee_id ? `Member ID: ${task.assignee_id}` : 'No member assigned')}
                            </div>
                            {task.assignee_role && (
                              <div className="text-[10px] font-semibold uppercase tracking-wide text-emerald-700">{task.assignee_role}</div>
                            )}
                          </div>
                        </div>

                        {/* Due date & created by */}
                        <div className="min-w-0 space-y-0.5 text-xs">
                          <div className="flex items-center gap-1.5 text-slate-700 font-medium">
                            <svg className="w-3.5 h-3.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            <span>{task.due_date || 'No due date'}</span>
                          </div>
                          <div className="text-[10px] font-mono text-slate-400">
                            Created {task.created_at} by{' '}
                            <span className="text-slate-600 font-bold">
                              {task.created_by_name} (ID: {task.created_by})
                            </span>
                          </div>
                        </div>

                        {/* Priority */}
                        <div className="min-w-0">
                          <PriorityBadge priority={task.priority} />
                        </div>

                        {/* Status */}
                        <div className="min-w-0">
                          <StatusBadge status={task.status} />
                        </div>

                        {/* Actions */}
                        <div className="flex min-w-0 items-center justify-start gap-1.5">
                          <button
                            type="button"
                            onClick={() => onViewTask?.(task)}
                            className="px-2.5 py-1 rounded-lg border border-[#cbdbcb] bg-white hover:bg-[#f4f7f4] text-slate-700 text-xs font-semibold transition-all"
                          >
                            Details
                          </button>
                          <button
                            type="button"
                            onClick={() => onEditTask?.(task)}
                            className="px-2.5 py-1 rounded-lg border border-[#cbdbcb] bg-white hover:bg-[#f4f7f4] text-slate-700 text-xs font-semibold transition-all"
                          >
                            Edit
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        ) : activeView === 'kanban' ? (
          /* ---------- Kanban view ---------- */
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            {STATUS_COLUMNS.map((column) => {
              const columnTasks = filteredTasks.filter((t) => t.status === column.value);
              return (
                <div key={column.value} className="bg-white/70 rounded-2xl border border-[#cbdbcb] p-3 space-y-3">
                  <div className="flex items-center justify-between px-1">
                    <StatusBadge status={column.value} />
                    <span className="text-[11px] font-mono font-bold text-slate-500">{columnTasks.length}</span>
                  </div>

                  {columnTasks.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-[#cbdbcb] py-6 text-center text-xs text-slate-400">
                      No tasks
                    </div>
                  ) : (
                    columnTasks.map((task) => (
                      <div key={task.id} className="bg-white rounded-xl border border-[#d2ded1] p-3 shadow-sm space-y-2">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-mono text-[11px] font-bold text-slate-600">{task.task_code}</span>
                          <PriorityBadge priority={task.priority} />
                        </div>
                        <div className="text-sm font-bold text-[#091e13]">{task.name}</div>
                        <div className="text-[11px] text-slate-500">{task.project_name}</div>
                        <div className="flex items-center justify-between pt-1">
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="w-6 h-6 rounded-full bg-[#081b2c] text-white flex items-center justify-center text-[10px] font-bold shrink-0">
                              {getInitials(task.assignee_name)}
                            </span>
                            <span className="min-w-0 truncate text-xs text-slate-600" title={task.assignee_email || task.assignee_name}>
                              {task.assignee_name || 'Unassigned'}
                              {task.assignee_email && <span className="block truncate text-[10px] text-slate-400">{task.assignee_email}</span>}
                            </span>
                          </div>
                          <span className="text-[11px] text-slate-400 shrink-0">{task.due_date}</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          /* ---------- Timeline view (ordered by due date) ---------- */
          <div className="bg-white rounded-3xl border border-[#cbdbcb] p-6 shadow-sm">
            {timelineTasks.length === 0 ? (
              <div className="py-6 text-center text-slate-500 text-sm">No tasks to show on the timeline.</div>
            ) : (
              <ol className="relative border-l-2 border-[#dce8db] ml-2 space-y-5">
                {timelineTasks.map((task) => (
                  <li key={task.id} className="pl-5 relative">
                    <span className="absolute -left-[7px] top-1.5 w-3 h-3 rounded-full bg-emerald-500 border-2 border-white" />
                    <div className="text-[11px] font-mono font-bold text-slate-500">{task.due_date || 'No due date'}</div>
                    <div className="flex flex-wrap items-center gap-2 mt-0.5">
                      <span className="text-sm font-bold text-[#091e13]">{task.name}</span>
                      <span className="font-mono text-[11px] text-slate-400">{task.task_code}</span>
                      <StatusBadge status={task.status} />
                    </div>
                    <div className="text-xs text-slate-500 mt-0.5">
                      {task.project_name} • {task.assignee_name || 'Unassigned'}
                    </div>
                  </li>
                ))}
              </ol>
            )}
          </div>
        )}

      </div>
    </div>
  );
}

function TaskPageContent() {
  const { collapsed } = useSidebar();
  const dispatch = useDispatch();
  const [isCreateTaskOpen, setIsCreateTaskOpen] = useState(false);
  const [initialTaskProjectId, setInitialTaskProjectId] = useState<number | undefined>();
  const token = useSelector((state) => state.auth.token);
  const authUser = useSelector((state) => state.auth.user);
  const authWorkspace = useSelector((state) => state.auth.workspace);
  const dashboardWorkspace = useSelector((state) => state.dashboard.data?.workspace);
  const authProjects = useSelector((state) => state.auth.projects);
  const projectData = useSelector((state) => state.project.data);
  const workspaceId = useSelector((state) =>
    state.auth.workspace?.id ?? state.dashboard.data?.workspace?.id
  );
  const members = useSelector((state) => state.member.members);
  const tasks = useSelector((state) => state.task.tasks);
  const loading = useSelector((state) => state.task.loading);
  const error = useSelector((state) => state.task.error);
  const lastFetchKey = useRef('');
  const workspaceName = dashboardWorkspace?.name || authWorkspace?.name || 'Workspace';

  const projects = useMemo(() => {
    const byId = new Map<number, ProjectOption>();
    [...authProjects, ...projectData].forEach((project) => {
      byId.set(project.id, { id: project.id, name: project.name });
    });
    return Array.from(byId.values());
  }, [authProjects, projectData]);
  const projectIdsKey = projects.map((project) => project.id).sort((a, b) => a - b).join(',');

  useEffect(() => {
    if (token && projectData.length === 0) {
      void dispatch(fetchProjects());
    }
  }, [dispatch, projectData.length, token]);

  useEffect(() => {
    if (token && workspaceName === 'Workspace') {
      void dispatch(fetchDashboard());
    }
  }, [dispatch, token, workspaceName]);

  useEffect(() => {
    if (!token || !workspaceId) return;
    void dispatch(fetchWorkspaceMembers(workspaceId));
  }, [dispatch, token, workspaceId]);

  useEffect(() => {
    if (!token || !projectIdsKey || lastFetchKey.current === projectIdsKey) return;
    lastFetchKey.current = projectIdsKey;
    const projectIds = projectIdsKey.split(',').map(Number);
    void dispatch(fetchTasksForProjects(projectIds));
  }, [dispatch, projectIdsKey, token]);

  const taskItems = useMemo(() => tasks.map((task) => {
    const assignee = members.find((member) => member.id === task.assignee_id);
    return {
      ...task,
      task_code: task.task_code || `TASK-${task.id}`,
      project_name: task.project_name || projects.find((project) => project.id === task.project_id)?.name || 'Project',
      assignee_name: task.assignee_name || assignee?.name || '',
      assignee_email: assignee?.email,
      assignee_role: assignee?.role,
      created_by_name: task.created_by_name || `Member ${task.created_by}`,
    };
  }), [members, projects, tasks]);

  const userName = authUser?.name?.trim() || authUser?.email?.split('@')[0] || 'Guest User';
  const userInitials = userName.split(/\s+/).map((part) => part[0]).join('').slice(0, 2).toUpperCase();
  const retryTasks = () => {
    lastFetchKey.current = projectIdsKey;
    void dispatch(fetchTasksForProjects(projects.map((project) => project.id)));
  };
  const openCreateTask = (projectId?: number) => {
    setInitialTaskProjectId(projectId);
    setIsCreateTaskOpen(true);
  };

  return (
    <div className="min-h-screen bg-[#dbe5d8]">
      <Sidebar />
      <main className={`min-h-screen pt-14 transition-all duration-300 lg:pt-0 ${collapsed ? 'lg:ml-20' : 'lg:ml-64'}`}>
        <div className="px-4 pt-4 sm:px-6 lg:px-7">
          <Header
            userName={userName}
            userRole={authUser?.role || authUser?.designation || 'Team member'}
            userEmail={authUser?.email || ''}
            userInitials={userInitials || 'GU'}
            activeTab="Task"
          />
        </div>
        <TaskOperations
          tasks={taskItems}
          projects={projects}
          workspaceName={workspaceName}
          loading={loading}
          error={error || ''}
          onRetry={retryTasks}
          onNewTask={openCreateTask}
        />
      </main>
      {isCreateTaskOpen && (
        <CreateTaskModal
          isOpen={isCreateTaskOpen}
          initialProjectId={initialTaskProjectId}
          projects={projects}
          assignees={members.map((member) => ({ id: member.id, name: member.name }))}
          onClose={() => setIsCreateTaskOpen(false)}
          onSubmitSuccess={async (payload) => {
            const result = await dispatch(createTask(payload));
            return result;
          }}
        />
      )}
    </div>
  );
}

export default function TaskPage() {
  return (
    <SidebarProvider>
      <TaskPageContent />
    </SidebarProvider>
  );
}