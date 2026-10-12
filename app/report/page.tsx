'use client';

import React, { useState, useMemo } from 'react';

// --- Types ---
export interface ReportMember {
  id: string | number;
  name: string;
  role: string;
  completedTasks: number;
  totalTasks: number;
  /** Tasks currently in flight for this member */
  assignedTasks: number;
}

export type ReportTaskStatus = 'In Progress' | 'In Review' | 'Completed' | 'Pending';

export interface ReportTask {
  id: string;
  title: string;
  description?: string;
  assignee: string;
  category?: string;
  status: ReportTaskStatus;
  dueDate?: string;
  /** For example "3 / 4 subtasks" */
  subtasks?: string;
}

interface ProjectMemberReportProps {
  /** Members for the roster. Empty by default. */
  members?: ReportMember[];
  /** Tasks for the list. Empty by default. */
  tasks?: ReportTask[];
  /** Optional value for the "Cycle Sprint" card, for example { label: 'Oct 08', note: 'On schedule' } */
  sprint?: { label: string; note?: string };
  loading?: boolean;
  /** Runs when "Project Overview" is clicked */
  onProjectOverview?: () => void;
  /** Replaces the built-in CSV download of the "Export Report" button */
  onExportReport?: () => void;
  /** Runs when a task card is clicked */
  onTaskClick?: (task: ReportTask) => void;
}

const STATUS_STYLES: Record<ReportTaskStatus, string> = {
  'In Progress': 'bg-[#eff6ff] text-[#2563eb] border border-[#bfdbfe]',
  'In Review': 'bg-[#fefce8] text-[#ca8a04] border border-[#fef08a]',
  Completed: 'bg-[#f0fdf4] text-[#15803d] border border-[#bbf7d0]',
  Pending: 'bg-[#f8fafc] text-[#64748b] border border-[#e2e8f0]',
};

const AVATAR_COLORS = ['bg-[#15803d]', 'bg-[#0f766e]', 'bg-[#475569]', 'bg-[#b45309]', 'bg-[#2563eb]', 'bg-[#7c3aed]'];

// Same name always gets the same color, in the roster and in the task list
const avatarColor = (name: string) => {
  let hash = 0;
  for (let i = 0; i < name.length; i += 1) hash = (hash * 31 + name.charCodeAt(i)) >>> 0;
  return AVATAR_COLORS[hash % AVATAR_COLORS.length];
};

const getInitials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || '?';

// Build and download a CSV file in the browser
const downloadCsv = (rows: (string | number | undefined)[][], filename: string) => {
  const escape = (value: string | number | undefined) => `"${String(value ?? '').replace(/"/g, '""')}"`;
  const csv = rows.map((row) => row.map(escape).join(',')).join('\r\n');
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

export default function ProjectMemberReport({
  members = [],
  tasks = [],
  sprint,
  loading = false,
  onProjectOverview,
  onExportReport,
  onTaskClick,
}: ProjectMemberReportProps) {
  // --- Search & filter state ---
  const [searchQuery, setSearchQuery] = useState('');
  const [filterMode, setFilterMode] = useState<'all' | 'task' | 'member'>('all');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);

  // Mascot: /character-avatar.png -> /loginlogo.png -> emoji
  const [mascotSrc, setMascotSrc] = useState<string | null>('/report.png');

  // --- Metrics computed from your data ---
  const completedCount = tasks.filter((t) => t.status === 'Completed').length;
  const openCount = tasks.length - completedCount;
  const completedRatio = tasks.length > 0 ? Math.round((completedCount / tasks.length) * 1000) / 10 : 0;
  const inFlight = members.reduce((sum, m) => sum + m.assignedTasks, 0);

  const summaryMetrics = [
    {
      title: 'TOTAL TASKS',
      value: String(tasks.length),
      badge: `${openCount} open`,
      badgeColor: 'text-[#16a34a] bg-[#dcfce7]',
      barColor: 'bg-[#16a34a]',
      barWidth: 100,
      icon: (
        <svg className="w-5 h-5 text-[#16a34a]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
      ),
    },
    {
      title: 'COMPLETED RATIO',
      value: `${completedRatio}%`,
      badge: `${completedCount} of ${tasks.length} completed`,
      badgeColor: 'text-[#0f766e] bg-[#ccfbf1]',
      barColor: 'bg-[#0f766e]',
      barWidth: completedRatio,
      icon: (
        <svg className="w-5 h-5 text-[#0f766e]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
    {
      title: 'ACTIVE SQUAD',
      value: String(members.length),
      badge: `${inFlight} in flight`,
      badgeColor: 'text-[#d97706] bg-[#fef3c7]',
      barColor: 'bg-[#d97706]',
      barWidth: 100,
      icon: (
        <svg className="w-5 h-5 text-[#d97706]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      ),
    },
    {
      title: 'CYCLE SPRINT',
      value: sprint?.label ?? '—',
      badge: sprint?.note ?? 'Not set',
      badgeColor: 'text-[#2563eb] bg-[#dbeafe]',
      barColor: 'bg-[#2563eb]',
      barWidth: 100,
      icon: (
        <svg className="w-5 h-5 text-[#2563eb]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      ),
    },
  ];

  // --- Filtering logic ---
  const filteredTasks = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return tasks.filter((task) => {
      const title = task.title.toLowerCase();
      const assignee = task.assignee.toLowerCase();
      const category = (task.category ?? '').toLowerCase();

      const matchesSearch =
        !q ||
        (filterMode === 'all' && (title.includes(q) || assignee.includes(q) || category.includes(q))) ||
        (filterMode === 'task' && title.includes(q)) ||
        (filterMode === 'member' && assignee.includes(q));

      const matchesStatus = statusFilter === 'All' || task.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [searchQuery, filterMode, statusFilter, tasks]);

  // Built-in export: downloads the tasks currently shown as a CSV file
  const handleExportReport = () => {
    if (onExportReport) {
      onExportReport();
      return;
    }
    downloadCsv(
      [
        ['ID', 'Title', 'Description', 'Assignee', 'Category', 'Status', 'Due', 'Subtasks'],
        ...filteredTasks.map((t) => [t.id, t.title, t.description, t.assignee, t.category, t.status, t.dueDate, t.subtasks]),
      ],
      'project-member-report.csv'
    );
  };

  const handleTaskClick = (task: ReportTask) => {
    setSelectedTaskId(task.id);
    onTaskClick?.(task);
  };

  const filterButtonClass = (mode: 'all' | 'task' | 'member') =>
    `px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
      filterMode === mode ? 'bg-white text-[#0f172a] shadow-sm' : 'text-[#64748b] hover:text-[#0f172a]'
    }`;

  return (
    <div className="min-h-screen bg-[#dbe5d8] text-[#1e293b] font-sans p-4 sm:p-6 lg:p-8 flex flex-col justify-between">
      <div className="max-w-7xl mx-auto w-full space-y-6">
        {/* 1. HERO BANNER */}
        <section className="bg-white border border-[#cbdbcb] rounded-3xl p-6 sm:p-8 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-4 max-w-2xl">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-[#0f172a] tracking-tight">
              Project &amp; Member Report Summary
            </h1>
            <p className="text-[#475569] text-sm sm:text-base leading-relaxed">
              Consolidated workspace analytics tracking sprint deliverables, individual contributor velocity, and open
              blocker reports across all assigned engineering tracks.
            </p>
            <div className="flex flex-wrap items-center gap-3 pt-1">
              <button
                type="button"
                onClick={() => onProjectOverview?.()}
                className="inline-flex items-center gap-2 bg-[#091e13] hover:bg-[#153424] text-white px-5 py-2.5 rounded-xl font-medium text-sm transition-all shadow-sm active:scale-95"
              >
                <span>+</span> Project Overview
              </button>
              <button
                type="button"
                onClick={handleExportReport}
                disabled={!onExportReport && filteredTasks.length === 0}
                className="inline-flex items-center gap-2 bg-white hover:bg-[#f1f5f0] text-[#091e13] border border-[#cbdbcb] px-5 py-2.5 rounded-xl font-medium text-sm transition-all shadow-sm active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <svg className="w-4 h-4 text-[#091e13]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Export Report
              </button>
            </div>
          </div>

          {/* Right mascot hero card */}
          <div className="relative flex-shrink-0 w-44 h-44 sm:w-52 sm:h-52 rounded-2xl bg-[#eff4ec] border border-[#cbdbcb] flex items-center justify-center p-3 shadow-inner overflow-hidden">
            {mascotSrc ? (
              <img
                src={mascotSrc}
                alt="NANDGATE developer mascot"
                className="w-full h-full object-contain"
                onError={() => setMascotSrc((prev) => (prev === '/report.png' ? '/report.png' : null))}
              />
            ) : (
              <div className="flex flex-col items-center justify-center text-center p-2">
                <div className="w-16 h-16 rounded-2xl bg-[#dcfce7] border border-[#86efac] flex items-center justify-center text-3xl shadow-sm mb-2">
                  <span aria-hidden="true">👨‍💻</span>
                </div>
                <span className="text-xs font-semibold text-[#166534]">Sprint Analytics</span>
              </div>
            )}
          </div>
        </section>

        {/* 2. SUMMARY METRIC CARDS */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {summaryMetrics.map((metric) => (
            <div
              key={metric.title}
              className="bg-white border border-[#cbdbcb] rounded-2xl p-5 shadow-sm flex flex-col justify-between hover:border-[#16a34a] transition-colors"
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-[#64748b] tracking-wider uppercase">{metric.title}</span>
                <div className="p-1.5 rounded-lg bg-[#f1f5f0]">{metric.icon}</div>
              </div>
              <div className="mt-3 flex items-baseline justify-between gap-2">
                <span className="text-3xl font-bold text-[#0f172a]">{loading ? '--' : metric.value}</span>
                <span className={`text-[11px] font-medium px-2 py-0.5 rounded-md ${metric.badgeColor}`}>
                  {loading ? 'Loading' : metric.badge}
                </span>
              </div>
              <div className="w-full h-1 mt-4 rounded-full bg-[#f1f5f0] overflow-hidden">
                <div className={`h-full rounded-full ${metric.barColor}`} style={{ width: `${loading ? 0 : metric.barWidth}%` }} />
              </div>
            </div>
          ))}
        </section>

        {/* 3. SEARCH & MULTI-FILTER BAR */}
        <section className="bg-white border border-[#cbdbcb] rounded-2xl p-3 sm:p-4 shadow-sm flex flex-col lg:flex-row items-center justify-between gap-4">
          {/* Search box */}
          <div className="relative w-full lg:max-w-md">
            <svg
              className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#64748b]"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search tasks by title, tag, or member name..."
              aria-label="Search tasks"
              className="w-full bg-[#edf3ec] border border-[#cbdbcb] rounded-xl pl-10 pr-12 py-2 text-sm text-[#0f172a] placeholder-[#64748b] focus:outline-none focus:ring-2 focus:ring-[#15803d] focus:bg-white transition-all"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-semibold text-[#64748b] bg-white border border-[#cbdbcb] px-1.5 py-0.5 rounded">
              ⌘K
            </span>
          </div>

          {/* Filter pills */}
          <div className="flex flex-wrap items-center justify-between w-full lg:w-auto gap-3">
            <div className="flex items-center bg-[#edf3ec] p-1 rounded-xl border border-[#cbdbcb]">
              <button type="button" onClick={() => setFilterMode('all')} aria-pressed={filterMode === 'all'} className={filterButtonClass('all')}>
                All
              </button>
              <button type="button" onClick={() => setFilterMode('task')} aria-pressed={filterMode === 'task'} className={filterButtonClass('task')}>
                By Task
              </button>
              <button type="button" onClick={() => setFilterMode('member')} aria-pressed={filterMode === 'member'} className={filterButtonClass('member')}>
                By Member
              </button>
            </div>

            {/* Status dropdown filter */}
            <div className="flex items-center gap-2">
              <label htmlFor="status-select" className="text-xs font-medium text-[#64748b]">
                Status:
              </label>
              <select
                id="status-select"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-[#edf3ec] border border-[#cbdbcb] rounded-xl px-3 py-1.5 text-xs font-semibold text-[#0f172a] focus:outline-none focus:ring-2 focus:ring-[#15803d]"
              >
                <option value="All">All Statuses</option>
                <option value="In Progress">In Progress</option>
                <option value="In Review">In Review</option>
                <option value="Pending">Pending</option>
                <option value="Completed">Completed</option>
              </select>
            </div>
          </div>
        </section>

        {/* 4. MAIN CONTENT GRID (ROSTER & TASKS) */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* LEFT COLUMN: SQUAD ROSTER (5 columns) */}
          <div className="lg:col-span-5 bg-white border border-[#cbdbcb] rounded-3xl p-6 shadow-sm space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-[#e5ebe4]">
              <div>
                <h2 className="text-lg font-bold text-[#0f172a]">Member Velocity Roster</h2>
                <p className="text-xs text-[#64748b]">Real-time sprint contribution progress</p>
              </div>
              <span className="text-xs font-semibold text-[#15803d] bg-[#dcfce7] px-2.5 py-1 rounded-full">
                {members.length} Active
              </span>
            </div>

            <div className="space-y-4">
              {members.length === 0 ? (
                <div className="p-8 text-center text-[#64748b] text-sm bg-[#f8faf7] rounded-2xl border border-dashed border-[#cbdbcb]">
                  {loading ? 'Loading members...' : 'No members to show yet.'}
                </div>
              ) : (
                members.map((member) => {
                  const percent = member.totalTasks > 0 ? Math.round((member.completedTasks / member.totalTasks) * 100) : 0;
                  return (
                    <div
                      key={member.id}
                      className="p-3.5 rounded-2xl bg-[#f8faf7] border border-[#cbdbcb] hover:border-[#15803d] transition-all space-y-2.5"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-9 h-9 rounded-xl ${avatarColor(member.name)} text-white flex items-center justify-center font-bold text-xs shadow-sm`}
                          >
                            {getInitials(member.name)}
                          </div>
                          <div>
                            <div className="font-semibold text-sm text-[#0f172a]">{member.name}</div>
                            <div className="text-[11px] text-[#64748b]">{member.role}</div>
                          </div>
                        </div>
                        <span className="text-xs font-bold text-[#0f172a]">{percent}%</span>
                      </div>

                      <div className="w-full bg-[#e2e8df] h-2 rounded-full overflow-hidden">
                        <div className="bg-[#15803d] h-full rounded-full transition-all duration-500" style={{ width: `${percent}%` }} />
                      </div>

                      <div className="flex items-center justify-between text-[11px] text-[#64748b] pt-0.5">
                        <span>
                          {member.completedTasks} of {member.totalTasks} completed
                        </span>
                        <span>{member.assignedTasks} in-flight</span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* RIGHT COLUMN: ACTIVE TASKS (7 columns) */}
          <div className="lg:col-span-7 bg-white border border-[#cbdbcb] rounded-3xl p-6 shadow-sm space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-[#e5ebe4]">
              <div>
                <h2 className="text-lg font-bold text-[#0f172a]">Active Tasks Telemetry</h2>
                <p className="text-xs text-[#64748b]">Showing {filteredTasks.length} matching tasks</p>
              </div>
              <span className="text-xs text-[#64748b] font-medium">Click card to open task</span>
            </div>

            {/* Task card list */}
            <div className="space-y-3.5">
              {filteredTasks.length === 0 ? (
                <div className="p-8 text-center text-[#64748b] text-sm bg-[#f8faf7] rounded-2xl border border-dashed border-[#cbdbcb]">
                  {loading
                    ? 'Loading tasks...'
                    : tasks.length === 0
                    ? 'No tasks to show yet.'
                    : 'No tasks found matching your search and filter criteria.'}
                </div>
              ) : (
                filteredTasks.map((task) => (
                  <div
                    key={task.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => handleTaskClick(task)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        handleTaskClick(task);
                      }
                    }}
                    className={`group p-4 rounded-2xl border transition-all cursor-pointer select-none space-y-3 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#15803d] ${
                      selectedTaskId === task.id
                        ? 'bg-[#f0fdf4] border-[#16a34a] ring-2 ring-[#86efac]/50 shadow-md'
                        : 'bg-[#f8faf7] border-[#cbdbcb] hover:bg-white hover:border-[#15803d] hover:shadow-md'
                    }`}
                  >
                    {/* Top tags & status */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-bold text-[#64748b] group-hover:text-[#0f172a] transition-colors">
                          {task.id}
                        </span>
                        {task.category && (
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#dcfce7] text-[#15803d]">
                            {task.category}
                          </span>
                        )}
                      </div>
                      <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full ${STATUS_STYLES[task.status]}`}>
                        {task.status}
                      </span>
                    </div>

                    {/* Title & description */}
                    <div>
                      <h3 className="text-sm font-semibold text-[#0f172a] group-hover:text-[#15803d] transition-colors">
                        {task.title}
                      </h3>
                      {task.description && (
                        <p className="text-xs text-[#475569] mt-1 line-clamp-2 leading-relaxed">{task.description}</p>
                      )}
                    </div>

                    {/* Bottom assignee & metadata */}
                    <div className="flex items-center justify-between text-xs text-[#64748b] pt-2 border-t border-[#e8eee7]">
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-6 h-6 rounded-lg ${avatarColor(task.assignee)} text-white flex items-center justify-center font-bold text-[10px]`}
                        >
                          {getInitials(task.assignee)}
                        </div>
                        <span className="font-medium text-[#334155]">{task.assignee}</span>
                      </div>

                      <div className="flex items-center gap-4">
                        {task.dueDate && (
                          <span className="text-[11px] font-medium text-[#166534] bg-[#dcfce7] px-2 py-0.5 rounded">
                            {task.dueDate}
                          </span>
                        )}
                        {task.subtasks && <span className="text-[11px] font-medium text-[#64748b]">{task.subtasks}</span>}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}