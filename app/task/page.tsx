
'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import Header from '../components/Header';
import Sidebar from '../components/SideBar';
import { SidebarProvider, useSidebar } from '../components/SidebarContext';
import { useDispatch, useSelector } from '../store/hooks';
import { fetchProjects } from '../store/project/projectSlice';
import { fetchWorkspaceMembers } from '../store/member/memberSlice';
import {
  fetchTasksForProjects,
  createTask,
  updateTaskStatus,
  clearUpdateTaskStatusError,
  updateTask,
  clearUpdateTaskError,
} from '../store/task/taskSlice';
import type { UpdateTaskPayload } from '../store/task/taskSlice';
import { fetchDashboard } from '../store/dashboard/dashBoardSlice';
import CreateTaskModal from '../components/CreateTaskForm';

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
  priority: number;
  status: number;
  created_by: number;
  created_by_name: string;
  created_at: string;
}

export interface ProjectOption {
  id: number;
  name: string;
  members?: { id: number; name: string }[];
}

type ActionResult = void | { success: boolean; message?: string };

interface TaskOperationsProps {
  tasks?: TaskItem[];
  projects?: ProjectOption[];
  workspaceName?: string;
  loading?: boolean;
  error?: string;
  onRetry?: () => void;
  onNewTask?: (projectId?: number) => void;
  onViewTask?: (task: TaskItem) => void;
  onEditTask?: (task: TaskItem) => void;
  onChangeStatus?: (
    task: TaskItem,
    status: number
  ) => ActionResult | Promise<ActionResult>;
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

const STATUS_OPTIONS = [
  {
    value: 1,
    label: 'Needs Triage',
    style: 'bg-slate-100 text-slate-700 border-slate-200',
    dot: 'bg-slate-400',
  },
  {
    value: 2,
    label: 'Fixing',
    style: 'bg-amber-50 text-amber-800 border-amber-200',
    dot: 'bg-amber-500',
  },
  {
    value: 3,
    label: 'Ready to Retest',
    style: 'bg-sky-50 text-sky-800 border-sky-200',
    dot: 'bg-sky-500',
  },
  {
    value: 4,
    label: 'Retest',
    style: 'bg-purple-50 text-purple-800 border-purple-200',
    dot: 'bg-purple-500',
  },
  {
    value: 5,
    label: 'Verified',
    style: 'bg-teal-50 text-teal-800 border-teal-200',
    dot: 'bg-teal-500',
  },
  {
    value: 6,
    label: 'Closed',
    style: 'bg-slate-200 text-slate-700 border-slate-300',
    dot: 'bg-slate-500',
  },
  {
    value: 7,
    label: 'Completed',
    style: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    dot: 'bg-emerald-600',
  },
];

const UNKNOWN_STATUS_STYLE = 'bg-slate-100 text-slate-700 border-slate-200';

const STATUS_COLUMNS = STATUS_OPTIONS.map(({ value, label }) => ({
  value,
  label,
}));

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
  const option = STATUS_OPTIONS.find((o) => o.value === status);

  return (
    <span
      className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-3 py-1 text-xs font-semibold ${
        option ? option.style : UNKNOWN_STATUS_STYLE
      }`}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${
          option ? option.dot : 'bg-slate-400'
        }`}
      />
      {option ? option.label : 'Unknown'}
    </span>
  );
}

interface StatusSelectProps {
  status: number;
  disabled?: boolean;
  onChange: (status: number) => void;
}

function StatusSelect({
  status,
  disabled,
  onChange,
}: StatusSelectProps) {
  const option = STATUS_OPTIONS.find((o) => o.value === status);

  return (
    <div className="relative inline-block">
      <select
        value={status}
        disabled={disabled}
        onChange={(e) => onChange(Number(e.target.value))}
        aria-label="Change task status"
        className={`cursor-pointer appearance-none rounded-full border py-1 pl-3 pr-7 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#081b2c]/30 disabled:cursor-wait disabled:opacity-60 ${
          option ? option.style : UNKNOWN_STATUS_STYLE
        }`}
      >
        {!option && <option value={status}>Unknown</option>}
        {STATUS_OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>

      <svg
        className="pointer-events-none absolute right-2 top-1/2 h-3 w-3 -translate-y-1/2 text-current opacity-70"
        viewBox="0 0 20 20"
        fill="currentColor"
        aria-hidden="true"
      >
        <path
          fillRule="evenodd"
          d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
          clipRule="evenodd"
        />
      </svg>
    </div>
  );
}

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

/* ========================================
   EDIT TASK MODAL
======================================== */

/* ========================================
   EDIT TASK MODAL
======================================== */

interface EditTaskModalProps {
  task: TaskItem;
  members: { id: number; name: string }[];
  saving: boolean;
  error: string;
  onClose: () => void;
  onSave: (
    payload: Omit<UpdateTaskPayload, 'taskId'>
  ) => Promise<{ success: boolean; message?: string }>;
}

function toLocalDateInput(value?: string) {
  if (!value) return '';

  // Preserve date-only values without timezone conversion.
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return value;
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return '';

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

function EditTaskModal({
  task,
  members,
  saving,
  error,
  onClose,
  onSave,
}: EditTaskModalProps) {
  const [name, setName] = useState(task.name ?? '');
  const [description, setDescription] = useState(
    task.description ?? ''
  );
  const [assigneeId, setAssigneeId] = useState(
    task.assignee_id == null ? '' : String(task.assignee_id)
  );
  const [dueDate, setDueDate] = useState(
    toLocalDateInput(task.due_date)
  );
  const [priority, setPriority] = useState(
    String(task.priority)
  );
  const [formError, setFormError] = useState('');

  const inputClass =
    'w-full rounded-xl border border-[#d5e2d1] bg-[#f7faf5] px-4 py-3 text-sm text-[#243b29] placeholder:text-[#91a091] outline-none transition-all focus:border-[#47734d] focus:bg-white focus:ring-4 focus:ring-[#47734d]/10 disabled:cursor-not-allowed disabled:opacity-60';

  const labelClass =
    'mb-2 block text-sm font-semibold text-[#304b36]';

  const handleSubmit = async (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();
    setFormError('');

    if (!name.trim()) {
      setFormError('Please enter a task name.');
      return;
    }

    if (!dueDate) {
      setFormError('Please select a due date.');
      return;
    }

    const result = await onSave({
      name: name.trim(),
      description: description.trim(),
      assignee_id: assigneeId ? Number(assigneeId) : null,
      due_date: dueDate,
      priority: Number(priority),
    });

    if (!result.success) {
      setFormError(
        result.message || 'Unable to update task. Please try again.'
      );
    }
  };

  return (
    <div
      className="fixed inset-0 z-[110] flex items-center justify-center overflow-y-auto bg-[#15251a]/55 p-3 backdrop-blur-sm sm:p-6"
      onMouseDown={(event) => {
        if (
          event.target === event.currentTarget &&
          !saving
        ) {
          onClose();
        }
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="edit-task-title"
        className="my-auto w-full max-w-2xl overflow-hidden rounded-3xl border border-[#d5e2d1] bg-white shadow-[0_24px_80px_rgba(24,50,29,0.22)]"
      >
        {/* Modal heading */}
        <div className="relative overflow-hidden border-b border-[#e4ece0] bg-gradient-to-br from-[#f5f9f2] via-white to-[#eaf2e6] px-5 py-6 sm:px-8 sm:py-7">
          <div className="absolute -right-8 -top-12 h-36 w-36 rounded-full bg-[#dce9d6]/60" />
          <div className="absolute -right-2 -top-5 h-24 w-24 rounded-full border border-[#d0e0c9]/70" />

          <div className="relative flex items-start justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-[#d5e3d0] bg-white text-[#315b3d] shadow-sm">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  className="h-6 w-6"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 20h9"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M16.5 3.5a2.12 2.12 0 013 3L8 18l-4 1 1-4Z"
                  />
                </svg>
              </div>

              <div>
                <div className="mb-1 flex flex-wrap items-center gap-2">
                  <span className="rounded-full border border-[#d6e5d1] bg-[#eaf3e6] px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-[#426849]">
                    Task Management
                  </span>
                  <span className="font-mono text-[11px] font-semibold text-[#829080]">
                    {task.task_code || `TASK-${task.id}`}
                  </span>
                </div>

                <h2
                  id="edit-task-title"
                  className="text-2xl font-extrabold tracking-tight text-[#24452e] sm:text-3xl"
                >
                  Update Task
                </h2>

                <p className="mt-1.5 max-w-md text-sm leading-6 text-[#718071]">
                  Make changes to the task details and save them to
                  your workspace.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              aria-label="Close update task form"
              className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-[#dce7d8] bg-white/90 text-xl text-[#6b7c6b] transition hover:border-[#a9c3a4] hover:bg-[#eaf3e6] hover:text-[#315b3d] disabled:cursor-not-allowed disabled:opacity-50"
            >
              ×
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="max-h-[65vh] space-y-6 overflow-y-auto px-5 py-6 sm:px-8 sm:py-7">
            {(formError || error) && (
              <div
                role="alert"
                className="flex items-start gap-3 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3.5 text-sm text-rose-700"
              >
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-rose-100 font-bold">
                  !
                </span>
                <p>{formError || error}</p>
              </div>
            )}

            {/* Task name */}
            <div>
              <label
                htmlFor="edit-task-name"
                className={labelClass}
              >
                Task Name <span className="text-rose-500">*</span>
              </label>

              <input
                id="edit-task-name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                required
                maxLength={200}
                disabled={saving}
                placeholder="Enter a clear task name"
                className={inputClass}
              />
              <p className="mt-1.5 text-xs text-[#879487]">
                Give your task a short, descriptive name.
              </p>
            </div>

            {/* Description */}
            <div>
              <label
                htmlFor="edit-task-description"
                className={labelClass}
              >
                Description
                <span className="ml-2 font-normal text-[#91a091]">
                  (Optional)
                </span>
              </label>

              <textarea
                id="edit-task-description"
                value={description}
                onChange={(event) =>
                  setDescription(event.target.value)
                }
                rows={4}
                disabled={saving}
                placeholder="Add details, requirements, or notes about this task..."
                className={`${inputClass} min-h-[110px] resize-y leading-6`}
              />
            </div>

            {/* Assignment and due date */}
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="edit-task-assignee"
                  className={labelClass}
                >
                  <span className="flex items-center gap-2">
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      className="h-4 w-4 text-[#628368]"
                      aria-hidden="true"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M16 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"
                      />
                      <circle cx="10" cy="7" r="4" />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M20 8v6m3-3h-6"
                      />
                    </svg>
                    Assign To
                  </span>
                </label>

                <select
                  id="edit-task-assignee"
                  value={assigneeId}
                  onChange={(event) =>
                    setAssigneeId(event.target.value)
                  }
                  disabled={saving}
                  className={inputClass}
                >
                  <option value="">Unassigned</option>

                  {members.map((member) => (
                    <option key={member.id} value={member.id}>
                      {member.name}
                    </option>
                  ))}

                  {task.assignee_id != null &&
                    !members.some(
                      (member) =>
                        member.id === task.assignee_id
                    ) && (
                      <option value={task.assignee_id}>
                        {task.assignee_name ||
                          `Member ${task.assignee_id}`}
                      </option>
                    )}
                </select>
              </div>

              <div>
                <label
                  htmlFor="edit-task-due-date"
                  className={labelClass}
                >
                  <span className="flex items-center gap-2">
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      className="h-4 w-4 text-[#628368]"
                      aria-hidden="true"
                    >
                      <rect
                        x="3"
                        y="5"
                        width="18"
                        height="16"
                        rx="2"
                      />
                      <path
                        strokeLinecap="round"
                        d="M16 3v4M8 3v4M3 10h18"
                      />
                    </svg>
                    Due Date{' '}
                    <span className="text-rose-500">*</span>
                  </span>
                </label>

                <input
                  id="edit-task-due-date"
                  type="date"
                  value={dueDate}
                  onChange={(event) =>
                    setDueDate(event.target.value)
                  }
                  required
                  disabled={saving}
                  className={inputClass}
                />
              </div>
            </div>

            {/* Priority */}
            <div>
              <label className={labelClass}>
                Priority Level
              </label>

              <div className="grid grid-cols-3 gap-3">
                {[
                  {
                    value: '1',
                    label: 'Low',
                    description: 'Can wait',
                    selectedClass:
                      'border-[#9bb5d1] bg-[#eff5fb] text-[#355c85] ring-2 ring-[#dce8f5]',
                    dotClass: 'bg-[#7097c1]',
                  },
                  {
                    value: '2',
                    label: 'Medium',
                    description: 'Normal priority',
                    selectedClass:
                      'border-[#7eaa83] bg-[#edf5e9] text-[#315b3d] ring-2 ring-[#dcebd6]',
                    dotClass: 'bg-[#47734d]',
                  },
                  {
                    value: '3',
                    label: 'High',
                    description: 'Needs attention',
                    selectedClass:
                      'border-[#e0b58a] bg-[#fff5e9] text-[#925c24] ring-2 ring-[#f9e6ce]',
                    dotClass: 'bg-[#d18a3d]',
                  },
                ].map((option) => {
                  const selected = priority === option.value;

                  return (
                    <button
                      key={option.value}
                      type="button"
                      disabled={saving}
                      onClick={() => setPriority(option.value)}
                      aria-pressed={selected}
                      className={`rounded-2xl border p-3 text-left transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-60 ${
                        selected
                          ? option.selectedClass
                          : 'border-[#e0e9dc] bg-white text-[#627062] hover:border-[#b9cfb3] hover:bg-[#f8faf6]'
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        <span
                          className={`h-2.5 w-2.5 rounded-full ${option.dotClass}`}
                        />
                        <span className="text-sm font-bold">
                          {option.label}
                        </span>
                      </span>

                      <span className="mt-1.5 block text-[10px] leading-4 opacity-80 sm:text-xs">
                        {option.description}
                      </span>

                      <span className="mt-3 flex justify-end">
                        <span
                          className={`flex h-4 w-4 items-center justify-center rounded-full border ${
                            selected
                              ? 'border-[#47734d] bg-[#47734d] text-white'
                              : 'border-[#cbd8c7] bg-white'
                          }`}
                        >
                          {selected && (
                            <svg
                              viewBox="0 0 20 20"
                              fill="currentColor"
                              className="h-3 w-3"
                              aria-hidden="true"
                            >
                              <path
                                fillRule="evenodd"
                                d="M16.704 5.29a1 1 0 010 1.414l-7.2 7.2a1 1 0 01-1.415 0l-3.6-3.6a1 1 0 111.415-1.414l2.892 2.892 6.493-6.492a1 1 0 011.415 0z"
                                clipRule="evenodd"
                              />
                            </svg>
                          )}
                        </span>
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Footer actions */}
          <div className="flex flex-col-reverse gap-3 border-t border-[#e4ece0] bg-[#f8faf6] px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-8">
            <p className="hidden text-xs text-[#849184] sm:block">
              Changes will be saved to your workspace.
            </p>

            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                disabled={saving}
                className="rounded-xl border border-[#d4e0d0] bg-white px-5 py-3 text-sm font-semibold text-[#526652] transition hover:border-[#a9c3a4] hover:bg-[#edf4e9] disabled:cursor-not-allowed disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={saving}
                className="inline-flex min-w-[145px] items-center justify-center gap-2 rounded-xl bg-[#315b3d] px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-[#24482f] hover:shadow-md focus:outline-none focus:ring-4 focus:ring-[#47734d]/20 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving ? (
                  <>
                    <svg
                      className="h-4 w-4 animate-spin"
                      viewBox="0 0 24 24"
                      fill="none"
                      aria-hidden="true"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-90"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                      />
                    </svg>
                    Saving...
                  </>
                ) : (
                  <>
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      className="h-4 w-4"
                      aria-hidden="true"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M5 12l4 4L19 6"
                      />
                    </svg>
                    Save Changes
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ========================================
   TASK OPERATIONS
======================================== */

function TaskOperations({
  tasks: tasksProp = [],
  projects = [],
  workspaceName = 'Workspace',
  loading = false,
  error = '',
  onRetry,
  onNewTask,
  onViewTask,
  onEditTask,
  onChangeStatus,
}: TaskOperationsProps) {
  const [selectedProjectId, setSelectedProjectId] = useState<
    number | 'all'
  >('all');

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPriority, setSelectedPriority] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [activeView, setActiveView] = useState<ViewMode>('list');

  const [updatingTaskId, setUpdatingTaskId] = useState<number | null>(
    null
  );
  const [statusError, setStatusError] = useState('');
  const [statusSuccess, setStatusSuccess] = useState('');
  const [statusOverrides, setStatusOverrides] = useState<
    Record<number, number>
  >({});

  const successTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null
  );

  const [heroSrc, setHeroSrc] = useState<string | null>('/task.png');

  useEffect(() => {
    return () => {
      if (successTimeoutRef.current) {
        clearTimeout(successTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    setStatusOverrides({});
  }, [tasksProp]);

  const tasks = useMemo(
    () =>
      tasksProp.map((task) =>
        statusOverrides[task.id] !== undefined
          ? { ...task, status: statusOverrides[task.id] }
          : task
      ),
    [tasksProp, statusOverrides]
  );

  const handleStatusChange = async (
    task: TaskItem,
    status: number
  ) => {
    if (!onChangeStatus || status === task.status) return;

    setStatusError('');
    setStatusSuccess('');
    setUpdatingTaskId(task.id);

    if (successTimeoutRef.current) {
      clearTimeout(successTimeoutRef.current);
      successTimeoutRef.current = null;
    }

    try {
      const result = await onChangeStatus(task, status);

      if (
        result &&
        typeof result === 'object' &&
        result.success === false
      ) {
        setStatusError(
          result.message || 'Failed to update the status.'
        );
        return;
      }

      setStatusOverrides((prev) => ({
        ...prev,
        [task.id]: status,
      }));

      setStatusSuccess('Status changed successfully!');

      successTimeoutRef.current = setTimeout(() => {
        setStatusSuccess('');
        successTimeoutRef.current = null;
      }, 3000);
    } catch (err: unknown) {
      setStatusError(
        err instanceof Error
          ? err.message
          : 'Failed to update the status.'
      );
    } finally {
      setUpdatingTaskId(null);
    }
  };

  const dismissStatusSuccess = () => {
    setStatusSuccess('');

    if (successTimeoutRef.current) {
      clearTimeout(successTimeoutRef.current);
      successTimeoutRef.current = null;
    }
  };

  const projectTabs = useMemo(
    () => [
      {
        id: 'all' as const,
        name: 'All Projects',
        dotColor: undefined as string | undefined,
      },
      ...projects.map((p, i) => ({
        id: p.id,
        name: p.name,
        dotColor: PROJECT_DOT_COLORS[
          i % PROJECT_DOT_COLORS.length
        ] as string | undefined,
      })),
    ],
    [projects]
  );

  const filteredTasks = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return tasks.filter((task) => {
      if (
        selectedProjectId !== 'all' &&
        task.project_id !== selectedProjectId
      ) {
        return false;
      }

      if (
        query &&
        !task.name.toLowerCase().includes(query) &&
        !(task.description ?? '').toLowerCase().includes(query) &&
        !(task.task_code ?? '').toLowerCase().includes(query)
      ) {
        return false;
      }

      if (
        selectedPriority !== 'all' &&
        String(task.priority) !== selectedPriority
      ) {
        return false;
      }

      if (
        selectedStatus !== 'all' &&
        String(task.status) !== selectedStatus
      ) {
        return false;
      }

      return true;
    });
  }, [
    tasks,
    selectedProjectId,
    searchQuery,
    selectedPriority,
    selectedStatus,
  ]);

  const timelineTasks = useMemo(
    () =>
      [...filteredTasks].sort((a, b) => {
        const da = Date.parse(a.due_date);
        const db = Date.parse(b.due_date);

        if (Number.isNaN(da) && Number.isNaN(db)) return 0;
        if (Number.isNaN(da)) return 1;
        if (Number.isNaN(db)) return -1;

        return da - db;
      }),
    [filteredTasks]
  );

  const leadAssignee = useMemo(() => {
    const counts = new Map<string, number>();

    filteredTasks.forEach((task) => {
      if (task.assignee_name) {
        counts.set(
          task.assignee_name,
          (counts.get(task.assignee_name) ?? 0) + 1
        );
      }
    });

    return (
      Array.from(counts.entries()).sort((a, b) => b[1] - a[1])[0]?.[0] ??
      null
    );
  }, [filteredTasks]);

  const fixingCount = filteredTasks.filter(
    (task) => task.status === 2
  ).length;

  const retestCount = filteredTasks.filter(
    (task) => task.status === 3 || task.status === 4
  ).length;

  const completedCount = tasks.filter(
    (task) => task.status === 7
  ).length;

  const selectedProjectName =
    selectedProjectId === 'all'
      ? null
      : projects.find((project) => project.id === selectedProjectId)?.name ??
        null;

  const viewButtonClass = (view: ViewMode) =>
    `inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
      activeView === view
        ? 'bg-[#081b2c] text-white shadow-sm'
        : 'text-slate-600 hover:text-slate-900'
    }`;

  const selectClass =
    'px-3 py-2 bg-white border border-[#cbdbcb] rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#081b2c]';

  const listGrid =
    'grid grid-cols-[110px_minmax(220px,1.5fr)_minmax(170px,1fr)_minmax(185px,1.2fr)_120px_160px_150px] items-center gap-4';

  return (
    <div className="min-h-screen bg-[#dbe5d8] text-slate-800 p-4 sm:p-6 md:p-8 font-sans antialiased">
      <div className="max-w-7xl mx-auto space-y-6">
        {statusSuccess && (
          <div
            role="status"
            aria-live="polite"
            className="fixed right-6 top-6 z-[100] flex items-center gap-3 rounded-xl border border-emerald-200 bg-white px-5 py-4 text-sm text-slate-800 shadow-xl"
          >
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#e7f7ec] text-lg font-bold text-[#1b6b36]">
              ✓
            </span>
            <div>
              <p className="font-bold text-[#1b6b36]">Success!</p>
              <p className="text-slate-600">{statusSuccess}</p>
            </div>
            <button
              type="button"
              onClick={dismissStatusSuccess}
              aria-label="Dismiss success message"
              className="ml-2 text-lg text-slate-400 hover:text-slate-700"
            >
              ×
            </button>
          </div>
        )}

        {/* HERO HEADER */}
        <div className="bg-white rounded-3xl border border-[#cbdbcb] p-6 sm:p-8 shadow-sm relative overflow-hidden flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            <div className="flex items-center gap-2 text-xs font-mono font-bold tracking-wider text-slate-500 uppercase">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span>{workspaceName}</span>
              <span className="text-slate-300">/</span>
              <span className="text-[#2d5034]">SPRINT TASKS HUB</span>
            </div>

            <h1 className="text-3xl sm:text-4xl font-extrabold text-[#091e13] tracking-tight">
              Task Operations
            </h1>

            <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
              Orchestrate deliverable velocity, triage tickets, and switch
              seamlessly between active engineering projects across all
              microservices and client apps.
            </p>

            <div className="flex flex-wrap items-center gap-2 pt-2">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#edf3ec] border border-[#d2ded1] text-xs font-bold text-slate-700">
                <span>{projects.length} {projects.length === 1 ? 'Project' : 'Projects'}</span>
              </div>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#edf3ec] border border-[#d2ded1] text-xs font-bold text-slate-700">
                <span>{tasks.length} Tasks Tracked</span>
              </div>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#edf3ec] border border-[#d2ded1] text-xs font-bold text-[#1b6b36]">
                <span>{completedCount} Completed</span>
              </div>
            </div>
          </div>

          <div className="shrink-0 w-44 sm:w-52 h-44 sm:h-52 rounded-2xl bg-[#edf3ec] border border-[#d2ded1] p-2 flex items-center justify-center overflow-hidden">
            {heroSrc ? (
              <img
                src={heroSrc}
                alt="Sprint task operations mascot"
                className="w-full h-full object-contain"
                onError={() =>
                  setHeroSrc((prev) =>
                    prev === '/task.png' ? '/loginlogo.png' : null
                  )
                }
              />
            ) : (
              <div className="flex flex-col items-center justify-center text-center p-3">
                <span className="text-5xl" aria-hidden="true">📋</span>
                <span className="text-xs font-bold text-slate-600 mt-2">Sprint Board</span>
              </div>
            )}
          </div>
        </div>

        {/* PROJECT SELECTION */}
        <div className="bg-white rounded-2xl border border-[#cbdbcb] p-4 shadow-sm">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
            <div className="text-xs font-mono font-bold uppercase tracking-wider text-slate-600">
              PROJECT SELECTION &amp; SCOPE
            </div>

            <div className="flex flex-col items-start gap-2 lg:items-end">
              <button
                type="button"
                onClick={() =>
                  onNewTask?.(
                    selectedProjectId === 'all'
                      ? undefined
                      : selectedProjectId
                  )
                }
                className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-[#1b6b36] px-4 py-2 text-xs font-bold text-white shadow-sm transition-all hover:bg-[#14562b]"
              >
                + New Task
              </button>
              <span className="text-xs text-slate-400">
                {selectedProjectName
                  ? `Showing tasks for ${selectedProjectName}`
                  : 'Showing tasks for all projects'}
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 mt-3 pt-3 border-t border-[#edf3ec]">
            {projectTabs.map((tab) => {
              const isActive = selectedProjectId === tab.id;
              const count =
                tab.id === 'all'
                  ? tasks.length
                  : tasks.filter((task) => task.project_id === tab.id).length;

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
                  {tab.dotColor && (
                    <span className={`w-2 h-2 rounded-full ${tab.dotColor}`} />
                  )}
                  <span>{tab.name}</span>
                  <span className={`ml-1 px-1.5 py-0.5 rounded-md text-[10px] font-mono font-bold ${
                    isActive
                      ? 'bg-white/20 text-white'
                      : 'bg-[#dce8db] text-[#2d5034]'
                  }`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* STATS */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-2xl border border-[#cbdbcb] p-4 shadow-sm">
            <div className="text-[11px] font-mono uppercase font-bold text-slate-500">TOTAL ACTIVE TASKS</div>
            <div className="text-2xl font-black text-slate-900 mt-1">{String(filteredTasks.length).padStart(2, '0')}</div>
          </div>
          <div className="bg-white rounded-2xl border border-[#cbdbcb] p-4 shadow-sm">
            <div className="text-[11px] font-mono uppercase font-bold text-slate-500">FIXING</div>
            <div className="text-2xl font-black text-emerald-700 mt-1">{String(fixingCount).padStart(2, '0')}</div>
          </div>
          <div className="bg-white rounded-2xl border border-[#cbdbcb] p-4 shadow-sm">
            <div className="text-[11px] font-mono uppercase font-bold text-slate-500">READY FOR RETEST</div>
            <div className="text-2xl font-black text-amber-600 mt-1">{String(retestCount).padStart(2, '0')}</div>
          </div>
          <div className="bg-white rounded-2xl border border-[#cbdbcb] p-4 shadow-sm">
            <div className="text-[11px] font-mono uppercase font-bold text-slate-500">LEAD ASSIGNEE</div>
            {leadAssignee ? (
              <div className="flex items-center gap-2 mt-1">
                <span className="w-6 h-6 rounded-full bg-[#081b2c] text-white flex items-center justify-center text-[10px] font-bold">
                  {getInitials(leadAssignee)}
                </span>
                <span className="text-xs font-bold text-slate-800 truncate">{leadAssignee}</span>
              </div>
            ) : (
              <div className="text-2xl font-black text-slate-300 mt-1">—</div>
            )}
          </div>
        </div>

        {/* VIEW / FILTER CONTROLS */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="inline-flex p-1 bg-white border border-[#cbdbcb] rounded-xl self-start">
            {(['list', 'kanban', 'timeline'] as ViewMode[]).map((view) => (
              <button
                key={view}
                type="button"
                onClick={() => setActiveView(view)}
                aria-pressed={activeView === view}
                className={viewButtonClass(view)}
              >
                {view === 'list' ? 'List View' : view === 'kanban' ? 'Kanban' : 'Timeline'}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <input
              type="text"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Search tasks across projects..."
              aria-label="Search tasks"
              className="min-w-[240px] px-4 py-2 bg-white border border-[#cbdbcb] rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#081b2c]"
            />

            <select
              value={selectedPriority}
              onChange={(event) => setSelectedPriority(event.target.value)}
              aria-label="Filter by priority"
              className={selectClass}
            >
              <option value="all">All Priorities</option>
              <option value="1">Low</option>
              <option value="2">Medium</option>
              <option value="3">High</option>
            </select>

            <select
              value={selectedStatus}
              onChange={(event) => setSelectedStatus(event.target.value)}
              aria-label="Filter by status"
              className={selectClass}
            >
              <option value="all">All Statuses</option>
              {STATUS_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* ERRORS */}
        {error && (
          <div role="alert" className="rounded-2xl bg-rose-50 border border-rose-200 px-5 py-3 text-sm text-rose-700 flex items-center justify-between gap-3">
            <span>{error}</span>
            {onRetry && (
              <button type="button" onClick={onRetry} className="px-3 py-1.5 rounded-lg bg-white border border-rose-200 text-xs font-bold text-rose-700 hover:bg-rose-100">
                Retry
              </button>
            )}
          </div>
        )}

        {statusError && (
          <div role="alert" className="rounded-2xl bg-rose-50 border border-rose-200 px-5 py-3 text-sm text-rose-700 flex items-center justify-between gap-3">
            <span>{statusError}</span>
            <button type="button" onClick={() => setStatusError('')} className="px-3 py-1.5 rounded-lg bg-white border border-rose-200 text-xs font-bold text-rose-700">
              Dismiss
            </button>
          </div>
        )}

        {/* TASK LIST */}
        {loading ? (
          <div className="bg-white rounded-3xl border border-[#cbdbcb] p-12 text-center text-slate-500 text-sm shadow-sm">
            Loading tasks...
          </div>
        ) : activeView === 'list' ? (
          <div className="bg-white rounded-3xl border border-[#cbdbcb] overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <div className="min-w-[1230px]">
                <div className={`${listGrid} border-b border-[#edf3ec] bg-[#f8faf8] px-6 py-3.5 text-[11px] font-mono font-bold uppercase text-slate-500`}>
                  <div>TASK ID</div>
                  <div>TASK &amp; PROJECT HIERARCHY</div>
                  <div>ASSIGNEE</div>
                  <div>DUE DATE &amp; CREATED BY</div>
                  <div>PRIORITY</div>
                  <div>STATUS</div>
                  <div>ACTIONS</div>
                </div>

                <div className="divide-y divide-[#edf3ec]">
                  {filteredTasks.length === 0 ? (
                    <div className="p-12 text-center text-slate-500 text-sm">
                      {tasks.length === 0 ? 'No tasks yet.' : 'No tasks found matching your filters.'}
                    </div>
                  ) : (
                    filteredTasks.map((task) => (
                      <div key={task.id} className={`${listGrid} px-6 py-4 hover:bg-[#f9fbf9] transition-colors group`}>
                        <div className="flex min-w-0 items-center gap-2.5">
                          <input type="checkbox" aria-label={`Select ${task.task_code}`} className="w-4 h-4 rounded text-[#1b6b36] border-[#cbdbcb] focus:ring-[#1b6b36]" />
                          <span className="font-mono text-xs font-bold text-slate-800">{task.task_code}</span>
                        </div>

                        <div className="min-w-0 space-y-1">
                          <div className="text-sm font-bold text-[#091e13] group-hover:text-[#1b6b36]">{task.name}</div>
                          <div className="text-xs text-slate-500 line-clamp-1">{task.description}</div>
                          <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-[#edf3ec] text-[#2d5034] text-[11px] font-medium border border-[#d2ded1]">{task.project_name}</div>
                        </div>

                        <div className="flex min-w-0 items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-[#081b2c] text-white flex items-center justify-center text-xs font-bold shrink-0">{getInitials(task.assignee_name)}</div>
                          <div className="leading-tight min-w-0">
                            <div className="text-xs font-bold text-slate-900 truncate">{task.assignee_name || 'Unassigned'}</div>
                            <div className="text-[10px] text-slate-500 truncate">{task.assignee_email || (task.assignee_id ? `Member ID: ${task.assignee_id}` : 'No member assigned')}</div>
                            {task.assignee_role && <div className="text-[10px] font-semibold uppercase tracking-wide text-emerald-700">{task.assignee_role}</div>}
                          </div>
                        </div>

                        <div className="min-w-0 space-y-0.5 text-xs">
                          <div className="text-slate-700 font-medium">{task.due_date || 'No due date'}</div>
                          <div className="text-[10px] font-mono text-slate-400">
                            Created {task.created_at} by <span className="text-slate-600 font-bold">{task.created_by_name} (ID: {task.created_by})</span>
                          </div>
                        </div>

                        <div><PriorityBadge priority={task.priority} /></div>

                        <div>
                          {onChangeStatus ? (
                            <StatusSelect
                              status={task.status}
                              disabled={updatingTaskId === task.id}
                              onChange={(status) => handleStatusChange(task, status)}
                            />
                          ) : (
                            <StatusBadge status={task.status} />
                          )}
                        </div>

                        <div className="flex min-w-0 items-center justify-start gap-1.5">
                          <button type="button" onClick={() => onViewTask?.(task)} className="px-2.5 py-1 rounded-lg border border-[#cbdbcb] bg-white hover:bg-[#f4f7f4] text-slate-700 text-xs font-semibold">
                            Details
                          </button>
                          <button type="button" onClick={() => onEditTask?.(task)} className="px-2.5 py-1 rounded-lg border border-[#cbdbcb] bg-white hover:bg-[#f4f7f4] text-slate-700 text-xs font-semibold">
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
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            {STATUS_COLUMNS.map((column) => {
              const columnTasks = filteredTasks.filter((task) => task.status === column.value);

              return (
                <div key={column.value} className="bg-white/70 rounded-2xl border border-[#cbdbcb] p-3 space-y-3">
                  <div className="flex items-center justify-between px-1">
                    <StatusBadge status={column.value} />
                    <span className="text-[11px] font-mono font-bold text-slate-500">{columnTasks.length}</span>
                  </div>

                  {columnTasks.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-[#cbdbcb] py-6 text-center text-xs text-slate-400">No tasks</div>
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
                          <span className="text-xs text-slate-600">{task.assignee_name || 'Unassigned'}</span>
                          <span className="text-[11px] text-slate-400">{task.due_date}</span>
                        </div>
                        {onChangeStatus && (
                          <div className="flex items-center justify-between gap-2 border-t border-[#edf3ec] pt-2">
                            <span className="text-[10px] font-mono font-bold uppercase text-slate-400">Move to</span>
                            <StatusSelect status={task.status} disabled={updatingTaskId === task.id} onChange={(status) => handleStatusChange(task, status)} />
                          </div>
                        )}
                        <div className="flex gap-2 border-t border-[#edf3ec] pt-2">
                          <button type="button" onClick={() => onViewTask?.(task)} className="text-xs font-semibold text-slate-600 hover:text-slate-900">Details</button>
                          <button type="button" onClick={() => onEditTask?.(task)} className="text-xs font-semibold text-[#1b6b36] hover:underline">Edit</button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              );
            })}
          </div>
        ) : (
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
                    <div className="text-xs text-slate-500 mt-0.5">{task.project_name} • {task.assignee_name || 'Unassigned'}</div>
                    <div className="flex gap-3 mt-2">
                      <button type="button" onClick={() => onViewTask?.(task)} className="text-xs font-semibold text-slate-600 hover:text-slate-900">Details</button>
                      <button type="button" onClick={() => onEditTask?.(task)} className="text-xs font-semibold text-[#1b6b36] hover:underline">Edit</button>
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

/* ========================================
   TASK PAGE
======================================== */

function TaskPageContent() {
  const { collapsed } = useSidebar();
  const dispatch = useDispatch();

  const [isCreateTaskOpen, setIsCreateTaskOpen] = useState(false);
  const [initialTaskProjectId, setInitialTaskProjectId] = useState<number | undefined>();

  const [editingTask, setEditingTask] = useState<TaskItem | null>(null);
  const [editTaskLoading, setEditTaskLoading] = useState(false);
  const [editTaskError, setEditTaskError] = useState('');
  const [editTaskSuccess, setEditTaskSuccess] = useState('');

  const token = useSelector((state) => state.auth.token);
  const authUser = useSelector((state) => state.auth.user);
  const authWorkspace = useSelector((state) => state.auth.workspace);
  const dashboardWorkspace = useSelector((state) => state.dashboard.data?.workspace);
  const authProjects = useSelector((state) => state.auth.projects);
  const projectData = useSelector((state) => state.project.data);

  const workspaceId = useSelector(
    (state) => state.auth.workspace?.id ?? state.dashboard.data?.workspace?.id
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
      const existing = byId.get(project.id);
      byId.set(project.id, {
        id: project.id,
        name: project.name,
        members: project.members ?? existing?.members ?? [],
      });
    });

    return Array.from(byId.values());
  }, [authProjects, projectData]);

  const projectIdsKey = projects
    .map((project) => project.id)
    .sort((a, b) => a - b)
    .join(',');

  const isWorkspaceMember = [authUser?.role, authWorkspace?.role]
    .some((role) => role?.trim().toUpperCase() === 'MEMBER');
  const loggedInMemberId = isWorkspaceMember ? authUser?.id : undefined;
  const taskFetchKey = `${isWorkspaceMember ? `member:${authUser?.id ?? ''}` : 'all'}|${projectIdsKey}`;

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
    if (!token || !projectIdsKey) return;
    if (isWorkspaceMember && !loggedInMemberId) return;
    if (lastFetchKey.current === taskFetchKey) return;

    lastFetchKey.current = taskFetchKey;
    const projectIds = projectIdsKey.split(',').map(Number);
    void dispatch(fetchTasksForProjects(projectIds, loggedInMemberId));
  }, [dispatch, isWorkspaceMember, loggedInMemberId, projectIdsKey, taskFetchKey, token]);

  const taskItems = useMemo(
    () =>
      tasks.map((task) => {
        const assignee = members.find((member) => member.id === task.assignee_id);

        return {
          ...task,
          task_code: task.task_code || `TASK-${task.id}`,
          project_name:
            task.project_name ||
            projects.find((project) => project.id === task.project_id)?.name ||
            'Project',
          assignee_name: task.assignee_name || assignee?.name || '',
          assignee_email: assignee?.email,
          assignee_role: assignee?.role,
          created_by_name: task.created_by_name || `Member ${task.created_by}`,
        };
      }),
    [members, projects, tasks]
  );

  const userName =
    authUser?.name?.trim() ||
    authUser?.email?.split('@')[0] ||
    'Guest User';

  const userInitials = userName
    .split(/\s+/)
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const retryTasks = () => {
    if (!token || projects.length === 0 || (isWorkspaceMember && !loggedInMemberId)) return;
    lastFetchKey.current = taskFetchKey;
    void dispatch(
      fetchTasksForProjects(projects.map((project) => project.id), loggedInMemberId)
    );
  };

  const openCreateTask = (projectId?: number) => {
    setInitialTaskProjectId(projectId);
    setIsCreateTaskOpen(true);
  };

  const handleChangeStatus = async (task: TaskItem, status: number) => {
    dispatch(clearUpdateTaskStatusError());
    return await dispatch(updateTaskStatus(task.id, status));
  };

  const openEditTask = (task: TaskItem) => {
    setEditTaskError('');
    setEditTaskSuccess('');
    setEditingTask(task);
  };

  const handleEditTask = async (
    payload: Omit<UpdateTaskPayload, 'taskId'>
  ): Promise<{ success: boolean; message?: string }> => {
    if (!editingTask) {
      return { success: false, message: 'No task selected.' };
    }

    setEditTaskLoading(true);
    setEditTaskError('');
    dispatch(clearUpdateTaskError());

    try {
      const result = await dispatch(
        updateTask({
          taskId: editingTask.id,
          ...payload,
        })
      );

      if (!result.success) {
        const message = result.message || 'Failed to update task.';
        setEditTaskError(message);
        return { success: false, message };
      }

      setEditingTask(null);
      setEditTaskSuccess(result.message || 'Task updated successfully!');

      return { success: true, message: result.message };
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Failed to update task.';
      setEditTaskError(message);
      return { success: false, message };
    } finally {
      setEditTaskLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#dbe5d8]">
      <Sidebar />

      <main
        className={`min-h-screen pt-14 transition-all duration-300 lg:pt-0 ${
          collapsed ? 'lg:ml-20' : 'lg:ml-64'
        }`}
      >
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
          onEditTask={openEditTask}
          onChangeStatus={handleChangeStatus}
        />
      </main>

      {isCreateTaskOpen && (
        <CreateTaskModal
          isOpen={isCreateTaskOpen}
          initialProjectId={initialTaskProjectId}
          projects={projects}
          onClose={() => setIsCreateTaskOpen(false)}
          onSubmitSuccess={async (payload) => {
            return await dispatch(createTask(payload));
          }}
        />
      )}

      {editingTask && (
        <EditTaskModal
          key={editingTask.id}
          task={editingTask}
          members={members.map((member) => ({
            id: member.id,
            name: member.name,
          }))}
          saving={editTaskLoading}
          error={editTaskError}
          onClose={() => {
            if (!editTaskLoading) {
              setEditingTask(null);
              setEditTaskError('');
            }
          }}
          onSave={handleEditTask}
        />
      )}

      {editTaskSuccess && (
        <div
          role="status"
          aria-live="polite"
          className="fixed right-6 top-6 z-[120] flex items-center gap-3 rounded-xl border border-emerald-200 bg-white px-5 py-4 text-sm text-slate-800 shadow-xl"
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#e7f7ec] text-lg font-bold text-[#1b6b36]">
            ✓
          </span>
          <div>
            <p className="font-bold text-[#1b6b36]">Success!</p>
            <p className="text-slate-600">{editTaskSuccess}</p>
          </div>
          <button
            type="button"
            onClick={() => setEditTaskSuccess('')}
            aria-label="Dismiss success message"
            className="ml-2 text-lg text-slate-400 hover:text-slate-700"
          >
            ×
          </button>
        </div>
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
