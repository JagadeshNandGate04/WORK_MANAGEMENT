'use client';

import { useMemo, useState, useEffect, useRef, FormEvent, ChangeEvent } from 'react';
import { useDispatch } from '../store/hooks';
import { updateProject } from '../store/project/projectSlice';

interface EditProjectFormProps {
  project: {
    id: string;
    name: string;
    description: string;
    createdBy: number;
    members: { id: number; name: string }[];
  };
  availableMembers: { id: number; name: string }[];
  onClose: () => void;
}

const AVATAR_COLORS = [
  'bg-emerald-600',
  'bg-slate-900',
  'bg-indigo-600',
  'bg-sky-600',
  'bg-amber-600',
  'bg-purple-600',
];

// ---------- Edit icon (inline SVG, no external image) ----------
function EditIcon({ className = 'w-full h-full' }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z" />
    </svg>
  );
}

// Helper for member initials
const getInitials = (nameStr: string) => {
  const parts = nameStr.trim().split(/\s+/).filter(Boolean);
  if (parts.length > 1) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return nameStr.trim().slice(0, 2).toUpperCase() || 'U';
};

export default function EditProjectForm({
  project,
  availableMembers,
  onClose,
}: EditProjectFormProps) {
  const dispatch = useDispatch();

  const [name, setName] = useState(project.name);
  const [description, setDescription] = useState(project.description || '');
  const [selectedMemberIds, setSelectedMemberIds] = useState<number[]>(
    project.members.map((m) => m.id)
  );

  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Mascot: /project.png -> /loginlogo.png -> edit icon
  const [mascotSrc, setMascotSrc] = useState<string | null>('/editproject.png');

  // Focus and keyboard management
  const nameInputRef = useRef<HTMLInputElement>(null);
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onCloseRef.current = onClose;
  });

  // Focus the name field once, when the modal opens
  useEffect(() => {
    nameInputRef.current?.focus();
  }, []);

  // Lock page scroll and close on Escape (unless a save is in progress)
  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !submitting) {
        onCloseRef.current();
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [submitting]);

  const availableUsers = useMemo(
    () => availableMembers,
    [availableMembers]
  );

  const toggleMember = (id: number) => {
    setSelectedMemberIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!name.trim()) {
      setFormError('Project name is required.');
      nameInputRef.current?.focus();
      return;
    }

    setSubmitting(true);

    const result = await dispatch(
      updateProject(Number(project.id), {
        name: name.trim(),
        description: description.trim(),
        members: selectedMemberIds,
      })
    );

    setSubmitting(false);

    if (result?.success) {
      onClose();
    } else {
      setFormError(result?.message || 'Failed to update project.');
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="edit-project-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6"
    >
      {/* Blurred dimmed backdrop matching the Projects page */}
      <div
        className="fixed inset-0 bg-[#0f172a]/40 backdrop-blur-sm transition-opacity"
        onClick={() => !submitting && onClose()}
      />

      {/* Modal card */}
      <div className="relative z-10 w-full max-w-4xl max-h-[92vh] overflow-y-auto overflow-x-hidden rounded-[28px] bg-white shadow-2xl border border-[#d2ded1] transition-all">
        {/* Header bar */}
        <div className="flex items-center justify-between border-b border-[#e2e8f0] bg-[#f4f8f3] px-6 py-4 sm:px-8">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#e2ede0] border border-[#c5ddc0] p-2 text-[#34543b] shadow-sm">
              <EditIcon />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 id="edit-project-title" className="text-lg font-extrabold text-[#0f172a] sm:text-xl">
                  Edit Project
                </h2>
                <span className="rounded-md bg-[#e2ede0] px-2 py-0.5 text-[10px] font-bold text-[#34543b] border border-[#cbdbca]">
                  #{project.id}
                </span>
              </div>
              <p className="text-xs text-[#64748b] font-medium">
                Update repository details, description, and team assignments
              </p>
            </div>
          </div>

          {/* Dismiss button */}
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            aria-label="Close dialog"
            className="rounded-xl p-2 text-[#64748b] hover:bg-white hover:text-[#0f172a] transition disabled:opacity-50"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body: mascot column (left) + form fields (right) */}
        <div className="grid grid-cols-1 md:grid-cols-12 divide-y md:divide-y-0 md:divide-x divide-[#edf3ec]">
          {/* Left mascot column */}
          <div className="md:col-span-4 bg-gradient-to-b from-[#f9fbf8] to-[#edf4eb]/50 p-6 sm:p-8 flex flex-col items-center justify-center text-center">
            <div className="relative w-44 h-44 sm:w-52 sm:h-52 flex items-center justify-center">
              <div className="absolute inset-0 bg-[#d9e8d7]/50 rounded-3xl transform -rotate-1 scale-95" />
              <div className="relative z-10 w-full h-full p-2 flex items-center justify-center text-[#34543b]">
                {mascotSrc ? (
                  <img
                    src={mascotSrc}
                    alt="Developer sprint ready mascot"
                    className="max-h-full max-w-full object-contain select-none pointer-events-none drop-shadow-sm"
                    onError={() => setMascotSrc((prev) => (prev === '/project.png' ? '/loginlogo.png' : null))}
                  />
                ) : (
                  <EditIcon className="w-20 h-20" />
                )}
              </div>
            </div>
          </div>

          {/* Right column: form fields */}
          <form onSubmit={handleSubmit} className="md:col-span-8 p-6 sm:p-8 flex flex-col justify-between space-y-5" noValidate>
            {/* Error banner */}
            {formError && (
              <div role="alert" className="rounded-xl bg-rose-50 border border-rose-200 px-4 py-3 text-xs text-rose-700 flex items-center gap-2">
                <svg className="h-4 w-4 shrink-0 text-rose-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                <span>{formError}</span>
              </div>
            )}

            <div className="space-y-4">
              {/* Field 1: project name */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label htmlFor="edit-project-name" className="text-xs font-bold uppercase tracking-wider text-[#475569] flex items-center gap-1.5">
                    Project Name <span className="text-rose-500">*</span>
                  </label>
                  <span className="text-[11px] font-medium text-[#94a3b8]">{name.length} / 64 max</span>
                </div>
                <input
                  ref={nameInputRef}
                  id="edit-project-name"
                  type="text"
                  maxLength={64}
                  value={name}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => setName(e.target.value)}
                  placeholder="e.g. Clear Path"
                  autoComplete="off"
                  className="w-full px-4 py-2.5 bg-white border border-[#d2ded1] rounded-xl text-sm font-semibold text-[#0f172a] placeholder:text-[#94a3b8] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0f172a]/20 focus:border-[#0f172a] transition"
                  required
                />
              </div>

              {/* Field 2: description */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label htmlFor="edit-project-desc" className="text-xs font-bold uppercase tracking-wider text-[#475569]">
                    Description
                  </label>
                  <span className="text-[11px] font-medium text-[#94a3b8]">Optional</span>
                </div>
                <textarea
                  id="edit-project-desc"
                  rows={3}
                  value={description}
                  onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setDescription(e.target.value)}
                  placeholder="Describe the project scope or repository..."
                  className="w-full px-4 py-2.5 bg-white border border-[#d2ded1] rounded-xl text-xs leading-relaxed text-[#1e293b] placeholder:text-[#94a3b8] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0f172a]/20 focus:border-[#0f172a] transition resize-none"
                />
              </div>

              {/* Field 3: team members */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-[#475569]">Team Members</span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#e2ede0] text-[#34543b] border border-[#cbdbca]">
                    {selectedMemberIds.length} selected
                  </span>
                </div>

                {availableUsers.length === 0 ? (
                  <div className="border border-dashed border-[#cbdbca] rounded-xl py-3 px-4 text-center bg-[#f9fbf8]">
                    <span className="text-xs text-[#94a3b8]">No available members to add.</span>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-36 overflow-y-auto pr-1">
                    {availableUsers.map((u, idx) => {
                      const selected = selectedMemberIds.includes(u.id);
                      const initial = getInitials(u.name);
                      const colorClass = AVATAR_COLORS[idx % AVATAR_COLORS.length];

                      return (
                        <button
                          key={u.id}
                          type="button"
                          onClick={() => toggleMember(u.id)}
                          aria-pressed={selected}
                          className={`flex items-center justify-between p-2.5 rounded-xl border text-left transition-all ${
                            selected
                              ? 'border-[#10b981] bg-[#e8f5e9] text-[#0f172a] shadow-sm'
                              : 'border-[#e2e8f0] bg-white text-[#64748b] hover:bg-[#f8fafc] hover:border-[#cbd5e1]'
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <span
                              className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-[10px] font-bold text-white shadow-sm ${colorClass}`}
                            >
                              {initial}
                            </span>
                            <div className="truncate">
                              <p className="text-xs font-bold text-[#0f172a] truncate">{u.name}</p>
                              <p className="text-[10px] text-[#64748b]">Member</p>
                            </div>
                          </div>

                          <div
                            className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-[10px] font-bold transition-all ${
                              selected
                                ? 'bg-[#10b981] text-white'
                                : 'border border-[#cbd5e1] bg-white text-transparent'
                            }`}
                          >
                            ✓
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}

                <p className="mt-2 text-[11px] text-[#94a3b8]">
                  Click to add or remove members. Currently selected:{' '}
                  <span className="font-semibold text-[#0f172a]">{selectedMemberIds.length} members</span>
                </p>
              </div>
            </div>

            {/* Modal actions: Cancel + Save Changes */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#f1f5f9]">
              <button
                type="button"
                onClick={onClose}
                disabled={submitting}
                className="rounded-xl border border-[#cbd5e1] bg-white px-5 py-2.5 text-xs font-bold text-[#334155] shadow-sm hover:bg-[#f8fafc] transition disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting || !name.trim()}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#0f172a] px-6 py-2.5 text-xs font-bold text-white shadow-md hover:bg-[#1e293b] focus:outline-none focus:ring-2 focus:ring-[#0f172a]/20 disabled:opacity-60 transition"
              >
                {submitting && (
                  <svg className="h-3.5 w-3.5 animate-spin text-white" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth={4} />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                )}
                <span>{submitting ? 'Saving...' : 'Save Changes'}</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}