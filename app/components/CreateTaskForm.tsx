'use client';

import React, { useState, useEffect } from 'react';

// ========================================
// Props
// ========================================

interface CreateTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmitSuccess?: (payload: CreateTaskPayload) => void | { success: boolean; message?: string } | Promise<void | { success: boolean; message?: string }>;
  initialProjectId?: number;
  projects: ProjectOption[];
  assignees: TeamMemberOption[];
}

export interface CreateTaskPayload {
  project_id: number;
  name: string;
  description: string;
  assignee_id: number | null;
  due_date: string;
  priority: number;
  status: number;
}

// ========================================
// Option shapes
// ========================================

interface ProjectOption {
  id: number;
  name: string;
}

interface TeamMemberOption {
  id: number;
  name: string;
}

// ========================================
// Component
// ========================================

export default function CreateTaskModal({
  isOpen,
  onClose,
  onSubmitSuccess,
  initialProjectId,
  projects: projectOptions,
  assignees: teamMemberOptions,
}: CreateTaskModalProps) {
  // ---- Form State (all cleared, no prefilled mock data) ----
  const [projectId, setProjectId] = useState<number | ''>(initialProjectId || '');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [assigneeId, setAssigneeId] = useState<number | null>(null);
  const [dueDate, setDueDate] = useState('');
  const [priority, setPriority] = useState<number>(2); // Default: Medium
  const [status, setStatus] = useState<number>(1); // Default: Needs Triage

  // ---- Loading & error ----
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Close on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Lock page scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  // ========================================
  // Submit
  // ========================================

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    // Validation
    if (!projectId) {
      setErrorMessage('Please select a project scope.');
      return;
    }
    if (!name.trim()) {
      setErrorMessage('Please enter a task name.');
      return;
    }
    if (!dueDate) {
      setErrorMessage('Please specify a due date.');
      return;
    }

    setLoading(true);

    // Payload matching backend POST /api/tasks/create-task
    const payload = {
      project_id: Number(projectId),
      name: name.trim(),
      description: description.trim(),
      assignee_id: assigneeId !== null ? Number(assigneeId) : null,
      due_date: dueDate,
      priority: Number(priority),
      status: Number(status),
    };

    try {
      if (!onSubmitSuccess) {
        setErrorMessage('Task creation is not available right now.');
        return;
      }

      const result = await onSubmitSuccess(payload);
      if (result && !result.success) {
        setErrorMessage(result.message || 'Failed to create task. Please try again.');
        return;
      }
      onClose();
    } catch (err: unknown) {
      setErrorMessage(
        err instanceof Error ? err.message : 'An unexpected error occurred.'
      );
    } finally {
      setLoading(false);
    }
  };

  // ========================================
  // Render
  // ========================================

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-[#091e13]/30 p-4 backdrop-blur-xs animate-in fade-in duration-200 sm:p-6"
      onClick={onClose}
    >
      {/* Modal Container */}
      <div
        className="relative w-full max-w-4xl overflow-hidden rounded-3xl border border-[#cbdbcb] bg-white shadow-2xl animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Bar */}
        <div className="flex items-center justify-between border-b border-[#edf3ec] px-6 pb-5 pt-7 sm:px-8">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-[#d2ded1] bg-[#edf3ec] text-[#1b6b36]">
              <svg
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"
                />
              </svg>
            </div>
            <div>
              <h2 className="text-xl font-black tracking-tight text-[#091e13] sm:text-2xl">
                Create New Task
              </h2>
              <p className="mt-0.5 text-xs text-slate-500 sm:text-sm">
                Deploy a new engineering deliverable into your project workflow
              </p>
            </div>
          </div>

          {/* Close 'X' Button */}
          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-[#f4f7f4] text-slate-500 transition-colors hover:bg-[#e6eee5] hover:text-slate-800"
          >
            <svg
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2.5"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Modal Body: 2-Column Split */}
        <form onSubmit={handleSubmit}>
          <div className="grid max-h-[75vh] grid-cols-1 items-start gap-8 overflow-y-auto p-6 sm:p-8 lg:grid-cols-12">
            {/* Left Column: Form Fields */}
            <div className="space-y-4 lg:col-span-7">
              {/* Error Message Box */}
              {errorMessage && (
                <div className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3.5 text-xs font-semibold text-rose-700">
                  <svg
                    className="h-4 w-4 shrink-0 text-rose-500"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* 1. Project Scope */}
              <div>
                <label className="mb-1.5 block font-mono text-[11px] font-bold uppercase text-slate-600">
                  PROJECT SCOPE (PROJECT_ID){' '}
                  <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                    <svg
                      className="h-4 w-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
                      />
                    </svg>
                  </span>
                  <select
                    value={projectId}
                    onChange={(e) =>
                      setProjectId(e.target.value ? Number(e.target.value) : '')
                    }
                    required
                    className="w-full cursor-pointer appearance-none rounded-xl border border-[#cbdbcb] bg-white py-2.5 pl-10 pr-9 text-xs font-medium text-slate-900 transition-all focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[#081b2c]"
                  >
                    <option value="" disabled>
                      Select a project scope...
                    </option>
                    {projectOptions.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                  <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3.5 text-slate-400">
                    <svg
                      className="h-4 w-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </span>
                </div>
              </div>

              {/* 2. Task Name */}
              <div>
                <label className="mb-1.5 block font-mono text-[11px] font-bold uppercase text-slate-600">
                  TASK NAME (NAME){' '}
                  <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                    <svg
                      className="h-4 w-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                      />
                    </svg>
                  </span>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Create login screen"
                    required
                    className="w-full rounded-xl border border-[#cbdbcb] bg-white py-2.5 pl-10 pr-4 text-xs font-medium text-slate-900 placeholder-slate-400 transition-all focus:outline-none focus:ring-2 focus:ring-[#081b2c]"
                  />
                </div>
              </div>

              {/* 3. Task Description */}
              <div>
                <label className="mb-1.5 block font-mono text-[11px] font-bold uppercase text-slate-600">
                  TASK DESCRIPTION (DESCRIPTION)
                </label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe the task requirements, acceptance criteria..."
                  className="w-full resize-none rounded-xl border border-[#cbdbcb] bg-white px-4 py-2.5 text-xs text-slate-900 placeholder-slate-400 transition-all focus:outline-none focus:ring-2 focus:ring-[#081b2c]"
                />
              </div>

              {/* 4. Assignee & Due Date */}
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {/* Assignee */}
                <div>
                  <label className="mb-1.5 block font-mono text-[11px] font-bold uppercase text-slate-600">
                    ASSIGNEE (ASSIGNEE_ID)
                  </label>
                  <div className="relative">
                    <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                      <svg
                        className="h-4 w-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                        />
                      </svg>
                    </span>
                    <select
                      value={assigneeId === null ? 'null' : String(assigneeId)}
                      onChange={(e) =>
                        setAssigneeId(
                          e.target.value === 'null'
                            ? null
                            : Number(e.target.value)
                        )
                      }
                      className="w-full cursor-pointer appearance-none rounded-xl border border-[#cbdbcb] bg-white py-2.5 pl-10 pr-9 text-xs font-medium text-slate-900 transition-all focus:outline-none focus:ring-2 focus:ring-[#081b2c]"
                    >
                      <option value="null">Unassigned (null)</option>
                      {teamMemberOptions.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.name}
                        </option>
                      ))}
                    </select>
                    <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3.5 text-slate-400">
                      <svg
                        className="h-4 w-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M19 9l-7 7-7-7"
                        />
                      </svg>
                    </span>
                  </div>
                </div>

                {/* Due Date */}
                <div>
                  <label className="mb-1.5 block font-mono text-[11px] font-bold uppercase text-slate-600">
                    DUE DATE (DUE_DATE){' '}
                    <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="date"
                      value={dueDate}
                      onChange={(e) => setDueDate(e.target.value)}
                      required
                      className="w-full rounded-xl border border-[#cbdbcb] bg-white px-4 py-2.5 text-xs font-medium text-slate-900 transition-all focus:outline-none focus:ring-2 focus:ring-[#081b2c]"
                    />
                  </div>
                </div>
              </div>

              {/* 5. Priority & Initial Status */}
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {/* Priority */}
                <div>
                  <label className="mb-1.5 block font-mono text-[11px] font-bold uppercase text-slate-600">
                    PRIORITY LEVEL (PRIORITY)
                  </label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(Number(e.target.value))}
                    className="w-full cursor-pointer rounded-xl border border-[#cbdbcb] bg-white px-4 py-2.5 text-xs font-medium text-slate-900 transition-all focus:outline-none focus:ring-2 focus:ring-[#081b2c]"
                  >
                    <option value={1}>1 - Low</option>
                    <option value={2}>2 - Medium</option>
                    <option value={3}>3 - High</option>
                  </select>
                </div>

                {/* Initial Status */}
                <div>
                  <label className="mb-1.5 block font-mono text-[11px] font-bold uppercase text-slate-600">
                    INITIAL STATUS (STATUS)
                  </label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(Number(e.target.value))}
                    className="w-full cursor-pointer rounded-xl border border-[#cbdbcb] bg-white px-4 py-2.5 text-xs font-medium text-slate-900 transition-all focus:outline-none focus:ring-2 focus:ring-[#081b2c]"
                  >
                    <option value={1}>1 - Needs Triage</option>
                    <option value={2}>2 - Fixing</option>
                    <option value={3}>3 - Ready to Retest</option>
                    <option value={4}>4 - Retest</option>
                    <option value={5}>5 - Verified</option>
                    <option value={6}>6 - Closed</option>
                    <option value={7}>7 - Completed</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Right Column: Cartoon Mascot Illustration Card */}
            <div className="flex h-full flex-col items-center justify-center lg:col-span-5">
              <div className="flex aspect-square w-full max-w-[340px] items-center justify-center overflow-hidden rounded-3xl border border-[#d2ded1] bg-[#edf3ec] p-4 shadow-xs">
                <img
                  src="/newtask.png"
                  alt="NANDGATE Developer Mascot configuring task"
                  className="h-full w-full object-contain"
                  onError={(e) => {
                    const parent = e.currentTarget.parentElement;
                    if (!parent) return;
                    parent.innerHTML = `
                      <div class="flex flex-col items-center justify-center text-center p-6 space-y-2">
                        <span class="text-6xl">💻</span>
                        <div class="font-black text-sm text-[#091e13]">Sprint Deployment</div>
                        <div class="text-xs text-slate-500">Mascot Illustration</div>
                      </div>
                    `;
                  }}
                />
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 border-t border-[#edf3ec] bg-[#f8faf8] px-6 py-5 sm:px-8">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="rounded-xl border border-[#cbdbcb] bg-white px-5 py-2.5 text-xs font-bold text-slate-700 transition-all hover:bg-[#f4f7f4] disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-xl bg-[#081b2c] px-6 py-2.5 text-xs font-bold text-white shadow-xs transition-all hover:bg-[#112a42] disabled:opacity-50"
            >
              {loading ? (
                <>
                  <svg
                    className="h-3.5 w-3.5 animate-spin text-white"
                    fill="none"
                    viewBox="0 0 24 24"
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
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8v8H4z"
                    />
                  </svg>
                  <span>Creating...</span>
                </>
              ) : (
                <>
                  <svg
                    className="h-3.5 w-3.5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2.5"
                      d="M12 4v16m8-8H4"
                    />
                  </svg>
                  <span>Create Task</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}