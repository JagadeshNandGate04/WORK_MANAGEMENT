'use client';

import { useState, useMemo, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import type { AppDispatch, RootState } from '../store/store';

import {
  fetchReportSummary,
  fetchMemberTaskProgress,
  clearMemberTaskProgress,
  type ProjectReport,
  type ReportApiTask,
} from '../store/report/reportSlice';

import Header from '../components/Header';
import Sidebar from '../components/SideBar';
import {
  SidebarProvider,
  useSidebar,
} from '../components/SidebarContext';

// =====================================================
// TYPES
// =====================================================

type ReportTaskStatus =
  | 'In Progress'
  | 'In Review'
  | 'Completed'
  | 'Pending';

interface ReportTask {
  id: string;
  title: string;
  assignee: string;
  category: string;
  status: ReportTaskStatus;
  dueDate?: string;
  priority?: number;
}

interface ReportMember {
  id: number;
  name: string;
  role: string;
  completedTasks: number;
  totalTasks: number;
  assignedTasks: number;
}

// =====================================================
// CONSTANTS
// =====================================================

const STATUS_STYLES: Record<ReportTaskStatus, string> = {
  'In Progress':
    'bg-[#eff6ff] text-[#2563eb] border border-[#bfdbfe]',
  'In Review':
    'bg-[#fefce8] text-[#ca8a04] border border-[#fef08a]',
  Completed:
    'bg-[#f0fdf4] text-[#15803d] border border-[#bbf7d0]',
  Pending:
    'bg-[#f8fafc] text-[#64748b] border border-[#e2e8f0]',
};

const AVATAR_COLORS = [
  'bg-[#15803d]',
  'bg-[#0f766e]',
  'bg-[#475569]',
  'bg-[#b45309]',
  'bg-[#2563eb]',
  'bg-[#7c3aed]',
];

// =====================================================
// HELPERS
// =====================================================

const avatarColor = (name: string) => {
  let hash = 0;

  for (let i = 0; i < name.length; i += 1) {
    hash = (hash * 31 + name.charCodeAt(i)) >>> 0;
  }

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

const getReportTaskStatus = (
  status: number
): ReportTaskStatus => {
  switch (status) {
    case 1:
      return 'In Progress';
    case 2:
      return 'In Review';
    case 3:
      return 'Completed';
    case 0:
    default:
      return 'Pending';
  }
};

const downloadCsv = (
  rows: (string | number | undefined | null)[][],
  filename: string
) => {
  const escape = (
    value: string | number | undefined | null
  ) => `"${String(value ?? '').replace(/"/g, '""')}"`;

  const csv = rows
    .map((row) => row.map(escape).join(','))
    .join('\r\n');

  const blob = new Blob(['\uFEFF' + csv], {
    type: 'text/csv;charset=utf-8;',
  });

  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');

  link.href = url;
  link.download = filename;

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  URL.revokeObjectURL(url);
};

// =====================================================
// SHARED SECTION TITLE
// =====================================================

function SectionHeading({
  title,
  subtitle,
  count,
}: {
  title: string;
  subtitle: string;
  count?: number;
}) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 border-b border-[#e5ebe4]">
      <div>
        <h2 className="text-lg font-bold text-[#0f172a]">
          {title}
        </h2>
        <p className="text-xs text-[#64748b] mt-1">
          {subtitle}
        </p>
      </div>

      {count !== undefined && (
        <span className="self-start text-xs font-semibold text-[#15803d] bg-[#dcfce7] px-3 py-1.5 rounded-full">
          {count} {count === 1 ? 'item' : 'items'}
        </span>
      )}
    </div>
  );
}

// =====================================================
// PROJECT CARD
// =====================================================

function ProjectCard({
  project,
  onClick,
}: {
  project: ProjectReport;
  onClick: () => void;
}) {
  const totalTasks = project.tasks.length;

  const completedTasks = project.tasks.filter(
    (task) => getReportTaskStatus(task.status) === 'Completed'
  ).length;

  const percentage =
    totalTasks > 0
      ? Math.round((completedTasks / totalTasks) * 100)
      : 0;

  return (
    <button
      type="button"
      onClick={onClick}
      className="group w-full text-left bg-white border border-[#cbdbcb] rounded-2xl p-5 shadow-sm hover:border-[#15803d] hover:shadow-md transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-[#15803d]"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="w-12 h-12 rounded-xl bg-[#dcfce7] border border-[#bbf7d0] flex items-center justify-center">
          <svg
            className="w-6 h-6 text-[#15803d]"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.8}
              d="M3 7a2 2 0 012-2h5l2 2h7a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V7z"
            />
          </svg>
        </div>

        <span className="text-xs font-semibold text-[#15803d] bg-[#f0fdf4] px-2.5 py-1 rounded-full">
          Project #{project.id}
        </span>
      </div>

      <h3 className="mt-4 text-base font-bold text-[#0f172a] group-hover:text-[#15803d] transition-colors">
        {project.name}
      </h3>

      <p className="mt-2 text-sm text-[#64748b] leading-relaxed min-h-10 line-clamp-2">
        {project.description || 'No project description available.'}
      </p>

      <div className="grid grid-cols-3 gap-2 mt-5">
        <div className="rounded-xl bg-[#f8faf7] p-3">
          <p className="text-[10px] text-[#64748b]">Members</p>
          <p className="text-xl font-bold text-[#0f172a] mt-1">
            {project.members.length}
          </p>
        </div>

        <div className="rounded-xl bg-[#f8faf7] p-3">
          <p className="text-[10px] text-[#64748b]">Tasks</p>
          <p className="text-xl font-bold text-[#0f172a] mt-1">
            {totalTasks}
          </p>
        </div>

        <div className="rounded-xl bg-[#f8faf7] p-3">
          <p className="text-[10px] text-[#64748b]">Completed</p>
          <p className="text-xl font-bold text-[#15803d] mt-1">
            {completedTasks}
          </p>
        </div>
      </div>

      <div className="mt-4">
        <div className="flex items-center justify-between text-xs mb-2">
          <span className="text-[#64748b]">Task completion</span>
          <span className="font-semibold text-[#0f172a]">
            {percentage}%
          </span>
        </div>

        <div className="w-full h-2 rounded-full bg-[#e2e8df] overflow-hidden">
          <div
            className="h-full rounded-full bg-[#15803d] transition-all"
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>

      <div className="mt-5 pt-4 border-t border-[#e5ebe4] flex items-center justify-between">
        <span className="text-sm font-semibold text-[#15803d]">
          View project
        </span>

        <svg
          className="w-5 h-5 text-[#15803d] group-hover:translate-x-1 transition-transform"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M5 12h14m-6-6l6 6-6 6"
          />
        </svg>
      </div>
    </button>
  );
}

// =====================================================
// MEMBER CARD
// =====================================================

function MemberCard({
  member,
  selected,
  onClick,
}: {
  member: ReportMember;
  selected: boolean;
  onClick: () => void;
}) {
  const percentage =
    member.totalTasks > 0
      ? Math.round(
          (member.completedTasks / member.totalTasks) * 100
        )
      : 0;

  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={`w-full text-left p-4 rounded-2xl border transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-[#15803d] ${
        selected
          ? 'bg-[#f0fdf4] border-[#16a34a] ring-2 ring-[#86efac]/50'
          : 'bg-[#f8faf7] border-[#cbdbcb] hover:border-[#15803d] hover:bg-white'
      }`}
    >
      <div className="flex items-center gap-3">
        <div
          className={`w-11 h-11 rounded-xl ${avatarColor(member.name)} text-white flex items-center justify-center font-bold text-sm`}
        >
          {getInitials(member.name)}
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-sm text-[#0f172a] truncate">
            {member.name}
          </h3>
          <p className="text-xs text-[#64748b] mt-1">
            {member.role || 'Member'}
          </p>
        </div>

        <svg
          className="w-5 h-5 text-[#15803d] flex-shrink-0"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 5l7 7-7 7"
          />
        </svg>
      </div>

      <div className="mt-4 flex items-center justify-between text-xs">
        <span className="text-[#64748b]">
          {member.completedTasks} of {member.totalTasks} completed
        </span>
        <span className="font-bold text-[#0f172a]">
          {percentage}%
        </span>
      </div>

      <div className="mt-2 h-2 rounded-full bg-[#e2e8df] overflow-hidden">
        <div
          className="h-full rounded-full bg-[#15803d] transition-all"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </button>
  );
}

// =====================================================
// TASK LIST
// =====================================================

function TaskList({
  tasks,
  loading,
  searchQuery,
  statusFilter,
  onSearchChange,
  onStatusChange,
  onExport,
}: {
  tasks: ReportTask[];
  loading: boolean;
  searchQuery: string;
  statusFilter: string;
  onSearchChange: (value: string) => void;
  onStatusChange: (value: string) => void;
  onExport: () => void;
}) {
  const filteredTasks = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();

    return tasks.filter((task) => {
      const matchesSearch =
        !query ||
        task.title.toLowerCase().includes(query) ||
        task.assignee.toLowerCase().includes(query) ||
        task.category.toLowerCase().includes(query);

      const matchesStatus =
        statusFilter === 'All' || task.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [tasks, searchQuery, statusFilter]);

  return (
    <div className="bg-white border border-[#cbdbcb] rounded-3xl p-5 sm:p-6 shadow-sm space-y-5">
      <SectionHeading
        title="Project Tasks"
        subtitle="Tasks belonging to the selected project"
        count={filteredTasks.length}
      />

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <svg
            className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#64748b]"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>

          <input
            type="text"
            value={searchQuery}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Search project tasks..."
            className="w-full bg-[#edf3ec] border border-[#cbdbcb] rounded-xl pl-10 pr-4 py-2.5 text-sm text-[#0f172a] placeholder-[#64748b] focus:outline-none focus:ring-2 focus:ring-[#15803d] focus:bg-white"
          />
        </div>

        <select
          aria-label="Filter tasks by status"
          value={statusFilter}
          onChange={(event) => onStatusChange(event.target.value)}
          className="bg-[#edf3ec] border border-[#cbdbcb] rounded-xl px-3 py-2.5 text-sm text-[#0f172a] focus:outline-none focus:ring-2 focus:ring-[#15803d]"
        >
          <option value="All">All Statuses</option>
          <option value="In Progress">In Progress</option>
          <option value="In Review">In Review</option>
          <option value="Pending">Pending</option>
          <option value="Completed">Completed</option>
        </select>

        <button
          type="button"
          onClick={onExport}
          disabled={filteredTasks.length === 0}
          className="px-4 py-2.5 rounded-xl border border-[#cbdbcb] text-sm font-semibold text-[#091e13] hover:bg-[#f1f5f0] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Export CSV
        </button>
      </div>

      {loading ? (
        <div className="p-8 text-center text-sm text-[#64748b]">
          Loading tasks...
        </div>
      ) : filteredTasks.length === 0 ? (
        <div className="p-8 text-center text-sm text-[#64748b] bg-[#f8faf7] rounded-2xl border border-dashed border-[#cbdbcb]">
          No tasks match your search.
        </div>
      ) : (
        <div className="space-y-3">
          {filteredTasks.map((task) => (
            <div
              key={task.id}
              className="p-4 rounded-2xl border border-[#cbdbcb] bg-[#f8faf7] hover:bg-white hover:border-[#15803d] transition-all"
            >
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-xs text-[#64748b]">
                    Task ID: {task.id}
                  </p>

                  <h3 className="text-sm font-semibold text-[#0f172a] mt-1">
                    {task.title}
                  </h3>

                  <p className="text-xs text-[#64748b] mt-2">
                    Assignee: {task.assignee}
                  </p>
                </div>

                <span
                  className={`self-start text-[11px] font-semibold px-2.5 py-1 rounded-full ${STATUS_STYLES[task.status]}`}
                >
                  {task.status}
                </span>
              </div>

              <div className="flex flex-wrap gap-3 mt-4 pt-3 border-t border-[#e5ebe4] text-xs text-[#64748b]">
                <span>Project: {task.category}</span>

                <span>
                  Due date: {task.dueDate ?? 'Not set'}
                </span>

                {task.priority !== undefined && (
                  <span>Priority code: {task.priority}</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// =====================================================
// MEMBER TASK PROGRESS VIEW
// =====================================================

function MemberProgressView({
  projectName,
  memberName,
  onBack,
  onExport,
}: {
  projectName: string;
  memberName: string;
  onBack: () => void;
  onExport: () => void;
}) {
  const {
    memberTaskProgress,
    memberTaskProgressLoading,
    memberTaskProgressError,
  } = useSelector((state: RootState) => state.report);

  const progress =
    memberTaskProgress?.member.name === memberName
      ? memberTaskProgress
      : null;

  return (
    <div className="space-y-6">
      <div className="bg-white border border-[#cbdbcb] rounded-3xl p-5 sm:p-6 shadow-sm">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-2 text-sm font-semibold text-[#15803d] hover:text-[#166534] mb-5"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
          Back to project members
        </button>

        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <div
            className={`w-14 h-14 rounded-2xl ${avatarColor(memberName)} text-white flex items-center justify-center font-bold text-lg`}
          >
            {getInitials(memberName)}
          </div>

          <div className="flex-1">
            <p className="text-xs uppercase tracking-wider font-semibold text-[#15803d]">
              Individual task report
            </p>

            <h2 className="text-2xl font-bold text-[#0f172a] mt-1">
              {memberName}
            </h2>

            <p className="text-sm text-[#64748b] mt-1">
              Project: {projectName}
            </p>
          </div>

          <button
            type="button"
            onClick={onExport}
            disabled={!progress || progress.tasks.length === 0}
            className="px-4 py-2.5 rounded-xl border border-[#cbdbcb] text-sm font-semibold text-[#091e13] hover:bg-[#f1f5f0] disabled:opacity-50"
          >
            Export CSV
          </button>
        </div>
      </div>

      {memberTaskProgressLoading && (
        <div className="bg-white border border-[#cbdbcb] rounded-2xl p-10 text-center text-sm text-[#64748b]">
          Loading {memberName}'s tasks...
        </div>
      )}

      {memberTaskProgressError && (
        <div
          role="alert"
          className="bg-red-50 border border-red-200 rounded-2xl p-5 text-sm text-red-700"
        >
          {memberTaskProgressError}
        </div>
      )}

      {!memberTaskProgressLoading &&
        !memberTaskProgressError &&
        progress && (
          <>
            <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                {
                  label: 'TOTAL TASKS',
                  value: progress.task_summary.total,
                },
                {
                  label: 'COMPLETED',
                  value: progress.task_summary.completed,
                },
                {
                  label: 'CLOSED',
                  value: progress.task_summary.closed,
                },
                {
                  label: 'COMPLETION',
                  value: `${progress.task_summary.completion_percentage}%`,
                },
              ].map((metric) => (
                <div
                  key={metric.label}
                  className="bg-white border border-[#cbdbcb] rounded-2xl p-5 shadow-sm"
                >
                  <p className="text-[11px] font-semibold tracking-wider text-[#64748b]">
                    {metric.label}
                  </p>

                  <p className="text-3xl font-bold text-[#0f172a] mt-3">
                    {metric.value}
                  </p>
                </div>
              ))}
            </section>

            <section className="bg-white border border-[#cbdbcb] rounded-3xl p-5 sm:p-6 shadow-sm">
              <SectionHeading
                title="Task Status Summary"
                subtitle="Status counts returned by the backend"
              />

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 mt-5">
                {Object.entries(
                  progress.task_summary.status_counts
                ).map(([status, count]) => (
                  <div
                    key={status}
                    className="rounded-xl border border-[#cbdbcb] bg-[#f8faf7] p-4"
                  >
                    <p className="text-xs text-[#64748b] capitalize">
                      {status.replace(/_/g, ' ')}
                    </p>

                    <p className="text-2xl font-bold text-[#0f172a] mt-2">
                      {count}
                    </p>
                  </div>
                ))}
              </div>
            </section>

            <section className="bg-white border border-[#cbdbcb] rounded-3xl p-5 sm:p-6 shadow-sm">
              <SectionHeading
                title="Individual Tasks"
                subtitle={`Tasks assigned to ${memberName} in this project`}
                count={progress.tasks.length}
              />

              {progress.tasks.length === 0 ? (
                <div className="mt-5 p-8 text-center text-sm text-[#64748b] bg-[#f8faf7] rounded-2xl border border-dashed border-[#cbdbcb]">
                  This member has no tasks in this project.
                </div>
              ) : (
                <div className="space-y-3 mt-5">
                  {progress.tasks.map((task) => (
                    <div
                      key={task.id}
                      className="p-4 rounded-2xl border border-[#cbdbcb] bg-[#f8faf7] hover:bg-white transition-colors"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                        <div>
                          <p className="text-xs text-[#64748b]">
                            Task #{task.id}
                          </p>

                          <h3 className="text-sm font-semibold text-[#0f172a] mt-1">
                            {task.name}
                          </h3>
                        </div>

                        <span className="self-start text-xs font-semibold px-3 py-1.5 rounded-full bg-[#e2e8f0] text-[#334155]">
                          Status code: {task.status}
                        </span>
                      </div>

                      <div className="flex flex-wrap gap-4 mt-4 pt-3 border-t border-[#e5ebe4] text-xs text-[#64748b]">
                        <span>
                          Due date: {task.due_date ?? 'Not set'}
                        </span>

                        <span>
                          Priority code: {task.priority}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </>
        )}
    </div>
  );
}

// =====================================================
// MAIN REPORT PAGE
// =====================================================

function ReportPageContent() {
  const { collapsed } = useSidebar();
  const dispatch = useDispatch<AppDispatch>();

  const {
    data: reportData,
    loading,
    error,
    memberTaskProgress,
    memberTaskProgressLoading,
  } = useSelector((state: RootState) => state.report);

  const [selectedProjectId, setSelectedProjectId] =
    useState<number | null>(null);

  const [selectedMemberId, setSelectedMemberId] =
    useState<number | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [mascotSrc, setMascotSrc] =
    useState<string | null>('/report.png');

  // Load project report summary on page load.

  useEffect(() => {
    dispatch(fetchReportSummary());
  }, [dispatch]);

  // Current project and member are derived from the selected IDs.

  const selectedProject = reportData.find(
    (project) => project.id === selectedProjectId
  );

  const selectedMember = selectedProject?.members.find(
    (member) => member.id === selectedMemberId
  );

  // Convert task data for the existing report UI.

  const projectTasks: ReportTask[] = useMemo(() => {
    if (!selectedProject) return [];

    return selectedProject.tasks.map((task: ReportApiTask) => ({
      id: String(task.id),
      title: task.name,
      assignee: task.assignee_name ?? 'Unassigned',
      category: selectedProject.name,
      status: getReportTaskStatus(task.status),
      dueDate: task.due_date ?? undefined,
      priority: task.priority,
    }));
  }, [selectedProject]);

  // Calculate each member's initial progress from the project summary.

  const projectMembers: ReportMember[] = useMemo(() => {
    if (!selectedProject) return [];

    return selectedProject.members.map((member) => {
      const assignedTasks = selectedProject.tasks.filter(
        (task) => task.assignee_id === member.id
      );

      const completedTasks = assignedTasks.filter(
        (task) => getReportTaskStatus(task.status) === 'Completed'
      ).length;

      return {
        id: member.id,
        name: member.name,
        role: member.role,
        completedTasks,
        totalTasks: assignedTasks.length,
        assignedTasks: assignedTasks.length - completedTasks,
      };
    });
  }, [selectedProject]);

  // Filter projects at the first navigation level.

  const filteredProjects = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();

    return reportData.filter((project) =>
      !query ||
      project.name.toLowerCase().includes(query) ||
      (project.description ?? '').toLowerCase().includes(query)
    );
  }, [reportData, searchQuery]);

  // Filter members at the project navigation level.

  const filteredMembers = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();

    return projectMembers.filter((member) =>
      !query ||
      member.name.toLowerCase().includes(query) ||
      member.role.toLowerCase().includes(query)
    );
  }, [projectMembers, searchQuery]);

  // Select a project.

  const handleProjectSelect = (project: ProjectReport) => {
    setSelectedProjectId(project.id);
    setSelectedMemberId(null);
    setSearchQuery('');
    setStatusFilter('All');
    dispatch(clearMemberTaskProgress());
  };

  // Select a member and fetch their project-specific tasks.

  const handleMemberSelect = (memberId: number) => {
    if (!selectedProject) return;

    setSelectedMemberId(memberId);
    setSearchQuery('');
    setStatusFilter('All');
    dispatch(clearMemberTaskProgress());

    dispatch(
      fetchMemberTaskProgress(selectedProject.id, memberId)
    );
  };

  // Return from the member view to the project members.

  const handleBackToMembers = () => {
    setSelectedMemberId(null);
    setSearchQuery('');
    dispatch(clearMemberTaskProgress());
  };

  // Return from the project view to the projects list.

  const handleBackToProjects = () => {
    setSelectedProjectId(null);
    setSelectedMemberId(null);
    setSearchQuery('');
    setStatusFilter('All');
    dispatch(clearMemberTaskProgress());
  };

  // Export project tasks or the selected member's tasks.

  const handleExport = () => {
    if (selectedMemberId !== null && selectedMember) {
      const progress =
        memberTaskProgress?.member.id === selectedMemberId
          ? memberTaskProgress
          : null;

      if (!progress) return;

      downloadCsv(
        [
          ['Task ID', 'Task Name', 'Status Code', 'Due Date', 'Priority Code'],
          ...progress.tasks.map((task) => [
            task.id,
            task.name,
            task.status,
            task.due_date,
            task.priority,
          ]),
        ],
        `member-${selectedMemberId}-task-report.csv`
      );

      return;
    }

    if (selectedProject) {
      downloadCsv(
        [
          ['Task ID', 'Task Name', 'Assignee', 'Status', 'Due Date', 'Priority'],
          ...projectTasks.map((task) => [
            task.id,
            task.title,
            task.assignee,
            task.status,
            task.dueDate,
            task.priority,
          ]),
        ],
        `project-${selectedProject.id}-report.csv`
      );

      return;
    }

    downloadCsv(
      [
        ['Project ID', 'Project Name', 'Members', 'Tasks', 'Completed'],
        ...filteredProjects.map((project) => [
          project.id,
          project.name,
          project.members.length,
          project.tasks.length,
          project.tasks.filter(
            (task) => getReportTaskStatus(task.status) === 'Completed'
          ).length,
        ]),
      ],
      'project-report.csv'
    );
  };

  // Top metrics reflect the current navigation level.

  const totalTasks = selectedProject
    ? selectedProject.tasks.length
    : reportData.reduce(
        (sum, project) => sum + project.tasks.length,
        0
      );

  const completedTasks = selectedProject
    ? selectedProject.tasks.filter(
        (task) => getReportTaskStatus(task.status) === 'Completed'
      ).length
    : reportData.reduce(
        (sum, project) =>
          sum +
          project.tasks.filter(
            (task) => getReportTaskStatus(task.status) === 'Completed'
          ).length,
        0
      );

  const totalMembers = selectedProject
    ? selectedProject.members.length
    : new Set(
        reportData.flatMap((project) =>
          project.members.map((member) => member.id)
        )
      ).size;

  const completionPercentage =
    totalTasks > 0
      ? Math.round((completedTasks / totalTasks) * 100)
      : 0;

  const pageTitle = selectedMember
    ? selectedMember.name
    : selectedProject
      ? selectedProject.name
      : 'Project & Member Report Summary';

  return (
    <div className="min-h-screen bg-[#dbe5d8]">
      <Sidebar />

      <div
        className={`min-h-screen transition-all duration-300 ${
          !collapsed ? 'md:ml-64' : 'md:ml-20'
        }`}
      >
        <Header />

        <main className="p-4 sm:p-6 lg:p-8 space-y-6">

          {/* HERO BANNER: KEEP THE SAME REPORT DESIGN */}

          <section className="bg-white border border-[#cbdbcb] rounded-3xl p-6 sm:p-8 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="space-y-4 max-w-2xl">
              <div className="flex flex-wrap items-center gap-2 text-xs text-[#64748b]">
                <span>Reports</span>

                {selectedProject && (
                  <>
                    <span>/</span>
                    <button
                      type="button"
                      onClick={handleBackToProjects}
                      className="hover:text-[#15803d]"
                    >
                      Projects
                    </button>
                  </>
                )}

                {selectedMember && (
                  <>
                    <span>/</span>
                    <button
                      type="button"
                      onClick={handleBackToMembers}
                      className="hover:text-[#15803d]"
                    >
                      Members
                    </button>
                  </>
                )}
              </div>

              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-[#0f172a] tracking-tight">
                {pageTitle}
              </h1>

              <p className="text-[#475569] text-sm sm:text-base leading-relaxed">
                {selectedMember
                  ? 'Review this member’s individual task progress within the selected project.'
                  : selectedProject
                    ? 'View the members and tasks associated with this project.'
                    : 'Explore your projects, review team contributions, and track task progress in one place.'}
              </p>

              <div className="flex flex-wrap items-center gap-3 pt-1">
                {selectedProject && (
                  <button
                    type="button"
                    onClick={
                      selectedMember
                        ? handleBackToMembers
                        : handleBackToProjects
                    }
                    className="inline-flex items-center gap-2 bg-[#091e13] hover:bg-[#153424] text-white px-5 py-2.5 rounded-xl font-medium text-sm transition-all shadow-sm"
                  >
                    <span aria-hidden="true">←</span>
                    {selectedMember ? 'Back to Members' : 'All Projects'}
                  </button>
                )}

                <button
                  type="button"
                  onClick={handleExport}
                  disabled={
                    loading ||
                    (selectedMemberId !== null &&
                      (!memberTaskProgress ||
                        memberTaskProgressLoading))
                  }
                  className="inline-flex items-center gap-2 bg-white hover:bg-[#f1f5f0] text-[#091e13] border border-[#cbdbcb] px-5 py-2.5 rounded-xl font-medium text-sm transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                    />
                  </svg>
                  Export Report
                </button>
              </div>
            </div>

            <div className="relative flex-shrink-0 w-44 h-44 sm:w-52 sm:h-52 rounded-2xl bg-[#eff4ec] border border-[#cbdbcb] flex items-center justify-center p-3 shadow-inner overflow-hidden">
              {mascotSrc ? (
                <img
                  src={mascotSrc}
                  alt="NANDGATE developer mascot"
                  className="w-full h-full object-contain"
                  onError={() => setMascotSrc(null)}
                />
              ) : (
                <div className="flex flex-col items-center justify-center text-center p-2">
                  <div className="w-16 h-16 rounded-2xl bg-[#dcfce7] border border-[#86efac] flex items-center justify-center text-3xl shadow-sm mb-2">
                    <span aria-hidden="true">👨‍💻</span>
                  </div>

                  <span className="text-xs font-semibold text-[#166534]">
                    Sprint Analytics
                  </span>
                </div>
              )}
            </div>
          </section>

          {/* REPORT SUMMARY METRICS */}

          <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              {
                title: 'TOTAL PROJECTS',
                value: selectedProject ? '1' : reportData.length,
                badge: selectedProject ? 'Selected project' : 'Workspace projects',
                color: 'text-[#16a34a]',
                background: 'bg-[#dcfce7]',
              },
              {
                title: 'TOTAL TASKS',
                value: selectedMember
                  ? memberTaskProgress?.task_summary.total ?? 0
                  : totalTasks,
                badge: 'Tasks in view',
                color: 'text-[#2563eb]',
                background: 'bg-[#dbeafe]',
              },
              {
                title: 'TEAM MEMBERS',
                value: selectedProject
                  ? selectedProject.members.length
                  : totalMembers,
                badge: 'Members in view',
                color: 'text-[#d97706]',
                background: 'bg-[#fef3c7]',
              },
              {
                title: 'COMPLETION',
                value: selectedMember
                  ? `${memberTaskProgress?.task_summary.completion_percentage ?? 0}%`
                  : `${completionPercentage}%`,
                badge: 'Completion progress',
                color: 'text-[#0f766e]',
                background: 'bg-[#ccfbf1]',
              },
            ].map((metric) => (
              <div
                key={metric.title}
                className="bg-white border border-[#cbdbcb] rounded-2xl p-5 shadow-sm hover:border-[#16a34a] transition-colors"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-[#64748b] tracking-wider uppercase">
                    {metric.title}
                  </span>

                  <span
                    className={`w-3 h-3 rounded-full ${metric.background}`}
                  />
                </div>

                <div className="mt-3">
                  <span className="text-3xl font-bold text-[#0f172a]">
                    {loading ? '--' : metric.value}
                  </span>
                </div>

                <span
                  className={`inline-block mt-3 text-[11px] font-medium px-2 py-1 rounded-md ${metric.color} ${metric.background}`}
                >
                  {metric.badge}
                </span>
              </div>
            ))}
          </section>

          {/* REPORT API ERROR */}

          {error && (
            <div
              role="alert"
              className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
            >
              {error}
            </div>
          )}

          {/* =================================================
              LEVEL 1: PROJECT LIST
             ================================================= */}

          {!selectedProject && (
            <section className="bg-white border border-[#cbdbcb] rounded-3xl p-5 sm:p-6 shadow-sm space-y-5">
              <SectionHeading
                title="Your Projects"
                subtitle="Select a project to view its members and tasks"
                count={filteredProjects.length}
              />

              <div className="relative max-w-md">
                <svg
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#64748b]"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>

                <input
                  type="text"
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder="Search projects..."
                  className="w-full bg-[#edf3ec] border border-[#cbdbcb] rounded-xl pl-10 pr-4 py-2.5 text-sm text-[#0f172a] placeholder-[#64748b] focus:outline-none focus:ring-2 focus:ring-[#15803d] focus:bg-white"
                />
              </div>

              {loading ? (
                <div className="p-10 text-center text-sm text-[#64748b]">
                  Loading projects...
                </div>
              ) : filteredProjects.length === 0 ? (
                <div className="p-10 text-center text-sm text-[#64748b] bg-[#f8faf7] rounded-2xl border border-dashed border-[#cbdbcb]">
                  {reportData.length === 0
                    ? 'No projects are available.'
                    : 'No projects match your search.'}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                  {filteredProjects.map((project) => (
                    <ProjectCard
                      key={project.id}
                      project={project}
                      onClick={() => handleProjectSelect(project)}
                    />
                  ))}
                </div>
              )}
            </section>
          )}

          {/* =================================================
              LEVEL 2: SELECTED PROJECT AND ITS MEMBERS
             ================================================= */}

          {selectedProject && !selectedMember && (
            <>
              <section className="bg-white border border-[#cbdbcb] rounded-3xl p-5 sm:p-6 shadow-sm space-y-5">
                <SectionHeading
                  title="Project Members"
                  subtitle={`Select a member to view their individual tasks in ${selectedProject.name}`}
                  count={filteredMembers.length}
                />

                <div className="relative max-w-md">
                  <svg
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#64748b]"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>

                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(event) => setSearchQuery(event.target.value)}
                    placeholder="Search project members..."
                    className="w-full bg-[#edf3ec] border border-[#cbdbcb] rounded-xl pl-10 pr-4 py-2.5 text-sm text-[#0f172a] placeholder-[#64748b] focus:outline-none focus:ring-2 focus:ring-[#15803d] focus:bg-white"
                  />
                </div>

                {filteredMembers.length === 0 ? (
                  <div className="p-8 text-center text-sm text-[#64748b] bg-[#f8faf7] rounded-2xl border border-dashed border-[#cbdbcb]">
                    No members found in this project.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                    {filteredMembers.map((member) => (
                      <MemberCard
                        key={member.id}
                        member={member}
                        selected={false}
                        onClick={() => handleMemberSelect(member.id)}
                      />
                    ))}
                  </div>
                )}
              </section>

              <TaskList
                tasks={projectTasks}
                loading={loading}
                searchQuery=""
                statusFilter="All"
                onSearchChange={() => {}}
                onStatusChange={() => {}}
                onExport={handleExport}
              />
            </>
          )}

          {/* =================================================
              LEVEL 3: SELECTED MEMBER TASK PROGRESS
             ================================================= */}

          {selectedProject && selectedMember && (
            <MemberProgressView
              key={`${selectedProject.id}-${selectedMember.id}`}
              projectName={selectedProject.name}
              memberName={selectedMember.name}
              onBack={handleBackToMembers}
              onExport={handleExport}
            />
          )}

        </main>
      </div>
    </div>
  );
}

// =====================================================
// DEFAULT PAGE EXPORT
// =====================================================

export default function ReportPage() {
  return (
    <SidebarProvider>
      <ReportPageContent />
    </SidebarProvider>
  );
}