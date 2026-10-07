'use client';

import React, { useState, ChangeEvent, FormEvent, KeyboardEvent } from 'react';
import { useDispatch, useSelector } from '../store/hooks';
import { createProject } from '../store/project/projectSlice';

interface Member {
  id: string;
  name: string;
  email: string;
  role: string;
  initials: string;
  avatarBg: string;
}

interface CreateProjectFormProps {
  onClose: () => void;
}

export default function CreateProjectPage({ onClose }: CreateProjectFormProps) {
  const dispatch = useDispatch();
  const creating = useSelector((state) => state.project.creating);
  const createError = useSelector((state) => state.project.createError);
  const [projectName, setProjectName] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [memberInput, setMemberInput] = useState<string>('');
  const [members, setMembers] = useState<Member[]>([]);

  // Avatar background color rotation for added members
  const colorOptions = [
    'bg-indigo-500',
    'bg-emerald-500',
    'bg-amber-500',
    'bg-rose-500',
    'bg-purple-500',
    'bg-sky-500',
  ];

  const handleAddMember = () => {
    const trimmed = memberInput.trim();
    if (!trimmed) return;

    // Generate initials
    const parts = trimmed.split(' ');
    const initials =
      parts.length > 1
        ? (parts[0][0] + parts[1][0]).toUpperCase()
        : trimmed.slice(0, 2).toUpperCase();

    const newMember: Member = {
      id: Date.now().toString(),
      name: trimmed,
      email: trimmed.includes('@')
        ? trimmed
        : `${trimmed.toLowerCase().replace(/\s+/g, '')}@nandgate.io`,
      role: 'Contributor',
      initials,
      avatarBg: colorOptions[members.length % colorOptions.length],
    };

    setMembers((prev) => [...prev, newMember]);
    setMemberInput('');
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddMember();
    }
  };

  const handleRemoveMember = (id: string) => {
    setMembers((prev) => prev.filter((m) => m.id !== id));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    const result = await dispatch(
      createProject({
        name: projectName.trim(),
        description: description.trim(),
        members: [],
      })
    );

    if (result.success) {
      handleReset();
      onClose();
    }
  };

  const handleReset = () => {
    setProjectName('');
    setDescription('');
    setMembers([]);
  };

  return (
    /* Form card only (no page background, top bar or footer) */
    <div className="w-full max-w-6xl mx-auto bg-white/95 backdrop-blur-md border border-[#cbd5e1] rounded-[28px] shadow-2xl overflow-hidden flex flex-col">
      {/* Header Bar */}
      <div className="bg-[#f4f8f3] border-b border-[#e2e8f0] px-6 sm:px-8 py-5 flex items-center justify-between">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-[#e2ede0] border border-[#c5ddc0] flex items-center justify-center p-2 shadow-sm">
            <img
              src="https://cdn-icons-png.flaticon.com/512/16806/16806078.png"
              alt="Create Project Icon"
              className="w-full h-full object-contain"
            />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
              Create New Project
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 font-medium">
              Initialize a repository workspace and invite your team
            </p>
          </div>
        </div>

        {/* Close / Cancel Button */}
        <button
          type="button"
          onClick={onClose}
          className="w-9 h-9 rounded-full bg-white border border-slate-200 text-slate-400 hover:text-slate-700 hover:bg-slate-50 flex items-center justify-center transition-all shadow-sm"
          title="Close modal"
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
              strokeWidth={2.2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-slate-100">
        {/* Left Visual Panel */}
        <div className="lg:col-span-4 bg-gradient-to-b from-[#f9fbf8] to-[#edf4eb]/50 p-6 sm:p-8 flex flex-col justify-between items-center text-center">
          <div className="w-full flex justify-start">
            {/* <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-100 text-emerald-700 text-[11px] font-bold uppercase tracking-widest border border-emerald-200">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
            
            </span> */}
          </div>

          <div className="my-6 relative w-56 h-56 sm:w-64 sm:h-64 flex items-center justify-center">
            <div className="absolute inset-0 bg-[#d9e8d7]/60 rounded-3xl transform -rotate-1 scale-95 shadow-inner" />
            <div className="relative z-10 w-full h-full p-2 flex items-center justify-center">
              <img
                src="/createproject.png"
                alt="Developer Cartoon Character holding blueprint and launch wrench"
                className="max-h-full max-w-full object-contain drop-shadow-md"
              />
            </div>
          </div>

          <div className="w-full pt-2">
            {/* <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-white border border-slate-200/80 shadow-sm">
              <img
                src="https://cdn-icons-png.flaticon.com/512/16806/16806078.png"
                alt="Project Kickoff Icon"
                className="w-4 h-4 object-contain"
              />
              <span className="text-xs font-bold text-slate-800 tracking-wide uppercase">
                Project Kickoff
              </span>
            </div> */}
            <p className="mt-3 text-sm font-bold text-slate-800">Project Architect</p>
            <p className="mt-1 text-xs text-slate-500">
              Turn project goals into a clear, coordinated workspace.
            </p>
          </div>
        </div>

        {/* Form */}
        <form
          onSubmit={handleSubmit}
          className="lg:col-span-8 p-6 sm:p-8 flex flex-col justify-between"
        >
          {createError && (
            <div className="mb-5 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs font-medium text-rose-700" role="alert">
              {createError}
            </div>
          )}
          <div className="space-y-6">
            {/* Field 1: Project Name */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label
                  htmlFor="projectName"
                  className="text-sm font-bold text-slate-800 flex items-center gap-1.5"
                >
                  <svg
                    className="w-4 h-4 text-emerald-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
                    />
                  </svg>
                  Project Name <span className="text-rose-500">*</span>
                </label>
                <span className="text-xs font-medium text-slate-400">
                  {projectName.length} / 64 max
                </span>
              </div>
              <div className="relative rounded-xl shadow-sm">
                <input
                  id="projectName"
                  type="text"
                  maxLength={64}
                  value={projectName}
                  onChange={(e: ChangeEvent<HTMLInputElement>) =>
                    setProjectName(e.target.value)
                  }
                  placeholder="e.g. Clinical Guidance Engine"
                  className="w-full px-4 py-3 bg-[#f8fafc] border border-[#cbd5e1] rounded-xl text-sm font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0f172a] focus:bg-white transition-all"
                  required
                />
              </div>
            </div>

            {/* Field 2: Description */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label
                  htmlFor="description"
                  className="text-sm font-bold text-slate-800 flex items-center gap-1.5"
                >
                  <svg
                    className="w-4 h-4 text-emerald-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 6h16M4 12h16M4 18h7"
                    />
                  </svg>
                  Description
                </label>
                <span className="text-xs font-medium text-slate-400">
                  Optional
                </span>
              </div>
              <textarea
                id="description"
                rows={3}
                value={description}
                onChange={(e: ChangeEvent<HTMLTextAreaElement>) =>
                  setDescription(e.target.value)
                }
                placeholder="Enter a concise description of your project scope, deliverables, or microservices..."
                className="w-full px-4 py-3 bg-[#f8fafc] border border-[#cbd5e1] rounded-xl text-sm font-normal text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0f172a] focus:bg-white transition-all resize-none"
              />
            </div>

            {/* Field 3: Members */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                  <svg
                    className="w-4 h-4 text-emerald-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                    />
                  </svg>
                  Members &amp; Collaborators
                </label>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-[#e2ede0] text-[#1b6b47] border border-[#c8e2c4]">
                  {members.length} assigned
                </span>
              </div>

              {/* Add Member Input Pill */}
              <div className="flex items-center gap-2 mb-3">
                <div className="relative flex-1">
                  <input
                    type="text"
                    value={memberInput}
                    onChange={(e: ChangeEvent<HTMLInputElement>) =>
                      setMemberInput(e.target.value)
                    }
                    onKeyDown={handleKeyDown}
                    placeholder="Add members by name, email, or handle..."
                    className="w-full pl-10 pr-4 py-2.5 bg-[#f8fafc] border border-[#cbd5e1] rounded-xl text-sm font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0f172a] focus:bg-white transition-all"
                  />
                  <svg
                    className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
                    />
                  </svg>
                </div>
                <button
                  type="button"
                  onClick={handleAddMember}
                  disabled={!memberInput.trim()}
                  className="px-4 py-2.5 bg-white border border-[#cbd5e1] hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-xl transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-sm shrink-0"
                >
                  + Add
                </button>
              </div>

              {/* Active Collaborator Chips */}
              {members.length > 0 ? (
                <div className="flex flex-wrap gap-2 pt-1 max-h-36 overflow-y-auto pr-1">
                  {members.map((member) => (
                    <div
                      key={member.id}
                      className="inline-flex items-center gap-2 pl-1.5 pr-2.5 py-1 rounded-xl bg-white border border-slate-200/90 shadow-sm text-xs font-medium text-slate-700 hover:border-slate-300 transition-colors"
                    >
                      <div
                        className={`w-6 h-6 rounded-lg ${member.avatarBg} text-white font-bold flex items-center justify-center text-[10px] shadow-xs`}
                      >
                        {member.initials}
                      </div>
                      <span className="font-semibold text-slate-900">
                        {member.name}
                      </span>
                      <span className="text-[10px] text-slate-400 font-normal">
                        ({member.role})
                      </span>
                      <button
                        type="button"
                        onClick={() => handleRemoveMember(member.id)}
                        className="ml-1 text-slate-400 hover:text-rose-500 rounded p-0.5 transition-colors"
                        title={`Remove ${member.name}`}
                      >
                        <svg
                          className="w-3.5 h-3.5"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2.2}
                            d="M6 18L18 6M6 6l12 12"
                          />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="border border-dashed border-slate-200 rounded-xl py-3 px-4 text-center">
                  <p className="text-xs text-slate-400 font-medium">
                    No team members added yet. Type above and press Enter to
                    assign collaborators.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-8 mt-6 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl border border-[#cbd5e1] bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold tracking-wide transition-all shadow-sm"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!projectName.trim() || creating}
              className="px-6 py-2.5 rounded-xl bg-[#0f172a] hover:bg-[#1e293b] text-white text-xs font-bold tracking-wide flex items-center gap-2 transition-all shadow-md disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {creating ? (
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
              ) : (
                <svg
                  className="w-4 h-4 text-emerald-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2.2}
                    d="M12 4v16m8-8H4"
                  />
                </svg>
              )}
              {creating ? 'Creating...' : 'Create Project'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}