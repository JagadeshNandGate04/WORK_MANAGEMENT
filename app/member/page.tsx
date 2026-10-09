'use client';

import React, { useEffect, useRef, useState } from 'react';
import Header from '../components/Header';
import Sidebar from '../components/SideBar';
import CreateWorkspaceMemberModal from '../components/CreateMemberForm';
import { SidebarProvider, useSidebar } from '../components/SidebarContext';
import { useDispatch, useSelector } from '../store/hooks';
import { createWorkspaceMember, fetchWorkspaceMembers } from '../store/member/memberSlice';

const INVITE_VALID_DAYS = 7;

interface PendingInvite {
  id: string;
  email: string;
  sentAt: string;
}

function SettingsIcon({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
      <path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  );
}

async function copyText(text: string) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    try {
      const area = document.createElement('textarea');
      area.value = text;
      area.style.position = 'fixed';
      area.style.opacity = '0';
      document.body.appendChild(area);
      area.select();
      const copied = document.execCommand('copy');
      document.body.removeChild(area);
      return copied;
    } catch {
      return false;
    }
  }
}

export function InviteMemberSettings() {
  const { collapsed } = useSidebar();
  const dispatch = useDispatch();
  const [isCreateMemberOpen, setIsCreateMemberOpen] = useState(false);
  const authUser = useSelector((state) => state.auth.user);
  const token = useSelector((state) => state.auth.token);
  const workspaceId = useSelector((state) =>
    state.auth.workspace?.id ?? state.dashboard.data?.workspace?.id
  );
  const members = useSelector((state) => state.member.members);
  const fetchingMembers = useSelector((state) => state.member.fetching);
  const fetchMembersError = useSelector((state) => state.member.fetchError);
  const headerName = authUser?.name?.trim() || authUser?.email?.split('@')[0] || 'Guest User';
  const headerRole = authUser?.role || authUser?.designation || 'Team member';
  const userInitials = headerName
    .split(/\s+/)
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const [email, setEmail] = useState('');
  const [inviteLink] = useState('');
  const [copied, setCopied] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [pendingInvites, setPendingInvites] = useState<PendingInvite[]>([]);
  const localId = useRef(0);
  const copiedTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (token) {
      void dispatch(fetchWorkspaceMembers(workspaceId));
    }
  }, [dispatch, token, workspaceId]);

  useEffect(() => {
    return () => {
      if (copiedTimer.current) clearTimeout(copiedTimer.current);
    };
  }, []);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setSuccess('');

    const trimmedEmail = email.trim();
    if (!trimmedEmail) return;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      setError('Please enter a valid email address.');
      return;
    }
    if (pendingInvites.some((invite) => invite.email.toLowerCase() === trimmedEmail.toLowerCase())) {
      setError('An invitation has already been sent to this email.');
      return;
    }

    setSending(true);
    localId.current += 1;
    setPendingInvites((current) => [
      { id: `local-${localId.current}`, email: trimmedEmail, sentAt: 'Just now' },
      ...current,
    ]);
    setSuccess(`Invitation sent to ${trimmedEmail}.`);
    setEmail('');
    setSending(false);
  };

  const handleCopy = async () => {
    if (!inviteLink) return;
    const copiedSuccessfully = await copyText(inviteLink);
    if (!copiedSuccessfully) {
      setError('Could not copy the link. Please select it and copy it manually.');
      return;
    }
    setCopied(true);
    if (copiedTimer.current) clearTimeout(copiedTimer.current);
    copiedTimer.current = setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen w-full bg-[#e2ede0] text-slate-800 font-sans antialiased selection:bg-emerald-200">
      <Sidebar />

      <div className={`min-h-screen pt-14 lg:pt-0 transition-all duration-300 ${collapsed ? 'lg:ml-20' : 'lg:ml-64'}`}>
        <div className="px-4 pt-4 sm:px-6 lg:px-7">
          <Header
            userName={headerName}
            userRole={headerRole}
            userEmail={authUser?.email || ''}
            userInitials={userInitials || 'GU'}
            activeTab="Settings"
          />
        </div>

        <main className="w-full px-4 py-5 sm:px-6 lg:px-7">
          <div className="w-full max-w-[1600px] mx-auto space-y-6">
            <section className="rounded-3xl border border-[#cbdbcb] bg-white p-6 shadow-sm md:p-8">
              <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#edf3ec] text-emerald-700 shadow-sm">
                  <SettingsIcon className="h-5 w-5" />
                </div>
                <div>
                  <h1 className="text-3xl font-extrabold tracking-tight text-[#091e13]">Workspace Member</h1>
                  <p className="text-sm font-medium text-slate-600">Manage your workspace and invite collaborators.</p>
                </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsCreateMemberOpen(true)}
                  className="inline-flex items-center gap-2 rounded-xl bg-[#081b2c] px-5 py-3 text-xs font-bold text-white shadow-sm transition hover:bg-[#0f2438]"
                >
                  <span aria-hidden="true" className="text-base leading-none">+</span>
                  Create Member
                </button>
              </div>

              <div className="grid gap-8 md:grid-cols-[0.8fr_1.2fr] md:items-center">
                <div className="flex flex-col items-center rounded-2xl bg-[#edf3ec] p-6 text-center">
                  <div className="mb-4 flex aspect-square w-full max-w-[280px] items-center justify-center overflow-hidden rounded-2xl bg-[#dce8db] p-3 shadow-inner">
                    <img src="/invite.png" alt="Invite a workspace member" className="h-full w-full object-contain" />
                  </div>
                  <h2 className="text-base font-bold text-slate-900">Invite a workspace member</h2>
                  <p className="mt-2 max-w-xs text-xs leading-relaxed text-slate-500">Invite colleagues to join your current workspace.</p>
                </div>

                <div className="space-y-6">
                  <div>
                    <span className="mb-3 inline-flex rounded-full bg-[#edf3ec] px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-[#2d5034]">Team Management</span>
                    <h2 className="text-2xl font-bold text-slate-900">Invite a workspace member</h2>
                    <p className="mt-1 text-sm text-slate-500">Send an invitation to a colleague for the current workspace.</p>
                  </div>

                  <form onSubmit={handleSubmit} className="space-y-4" noValidate>
                    <label htmlFor="invite-email" className="block text-[11px] font-mono font-semibold uppercase tracking-wider text-slate-500">Member Email Address</label>
                    <div className="flex flex-col gap-3 sm:flex-row">
                      <input
                        id="invite-email"
                        type="email"
                        value={email}
                        onChange={(event) => setEmail(event.target.value)}
                        placeholder="colleague@nandgate.io"
                        autoComplete="off"
                        required
                        className="w-full rounded-xl border border-[#cbdbcb] bg-white py-2.5 pl-4 pr-4 text-sm text-slate-900 shadow-sm outline-none transition-all placeholder-slate-400 focus:border-transparent focus:ring-2 focus:ring-[#0f172a]"
                      />
                      <button type="submit" disabled={sending || !email.trim()} className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-[#081b2c] px-5 py-2.5 text-xs font-bold text-white shadow-sm transition-all hover:bg-[#0f2438] disabled:cursor-not-allowed disabled:opacity-50">
                        <span>{sending ? 'Sending...' : 'Send Invitation'}</span>
                      </button>
                    </div>
                    {error && <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs text-rose-700">{error}</div>}
                    {success && <div role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs text-emerald-800">{success}</div>}
                  </form>

                  <div className="rounded-2xl border border-[#cbdbcb] bg-[#edf3ec] p-4">
                    <div className="mb-2 flex items-center justify-between text-xs">
                      <span className="font-mono font-semibold text-slate-700">Active Workspace Onboarding Link</span>
                      <span className="font-mono text-slate-500">Valid for {INVITE_VALID_DAYS} days</span>
                    </div>
                    <div className="flex items-center gap-2 rounded-xl border border-[#cbdbcb] bg-white p-1.5 pl-3 shadow-sm">
                      <span className="min-w-0 flex-1 truncate select-all font-mono text-xs text-slate-600">{inviteLink || 'Invite link will be generated here...'}</span>
                      <button type="button" onClick={handleCopy} disabled={!inviteLink} className="inline-flex items-center gap-1.5 rounded-lg border border-[#cbdbcb] bg-[#edf3ec] px-3 py-1.5 text-xs font-semibold text-slate-700 transition-colors hover:bg-[#dfeada] disabled:cursor-not-allowed disabled:opacity-40">
                        <span>{copied ? 'Copied!' : 'Copy Link'}</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <section className="rounded-3xl border border-[#cbdbcb] bg-white p-6 shadow-sm md:p-8">
              <div className="mb-5 flex flex-wrap items-center justify-between gap-3 border-b border-[#edf3ec] pb-4">
                <div>
                  <h2 className="text-lg font-bold text-slate-900">Workspace Members</h2>
                  <p className="mt-1 text-xs text-slate-500">Workspace members loaded from your account.</p>
                </div>
                <span className="rounded-full bg-[#edf3ec] px-3 py-1 text-xs font-bold text-[#2d5034]">
                  {members.length} {members.length === 1 ? 'member' : 'members'}
                </span>
              </div>

              {fetchMembersError && (
                <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs text-rose-700" role="alert">
                  <span>{fetchMembersError}</span>
                  <button
                    type="button"
                    onClick={() => void dispatch(fetchWorkspaceMembers(workspaceId))}
                    disabled={!token || fetchingMembers}
                    className="rounded-lg border border-rose-300 bg-white px-3 py-1.5 font-semibold text-rose-800 hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Retry
                  </button>
                </div>
              )}

              {fetchingMembers && members.length === 0 ? (
                <div className="rounded-2xl border border-[#cbdbcb] bg-[#fafdfa] px-4 py-10 text-center text-sm text-slate-600" role="status">
                  Loading workspace members…
                </div>
              ) : members.length === 0 ? (
                <div className="rounded-2xl border-2 border-dashed border-[#cbdbcb] bg-[#fafdfa] px-4 py-10 text-center">
                  <p className="text-sm font-semibold text-slate-700">No members created yet</p>
                  <p className="mt-1 text-xs text-slate-500">Create a member and they will appear in this list.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[520px] text-left">
                    <thead>
                      <tr className="border-b border-[#edf3ec] text-[10px] font-bold uppercase tracking-wider text-slate-500">
                        <th className="px-3 py-3">Member</th>
                        <th className="px-3 py-3">Email</th>
                        <th className="px-3 py-3">Role</th>
                      </tr>
                    </thead>
                    <tbody>
                      {members.map((member) => (
                        <tr key={member.id} className="border-b border-[#f1f5f1] last:border-0">
                          <td className="px-3 py-4 text-sm font-semibold text-slate-900">{member.name}</td>
                          <td className="px-3 py-4 text-sm text-slate-600">{member.email}</td>
                          <td className="px-3 py-4">
                            <span className="rounded-full bg-[#edf3ec] px-2.5 py-1 text-[10px] font-bold uppercase text-[#2d5034]">
                              {member.role || 'MEMBER'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>

            <section className="rounded-3xl border border-[#cbdbcb] bg-white p-6 shadow-sm">
              <div className="mb-4 flex items-center justify-between border-b border-[#edf3ec] pb-3">
                <div>
                  <h2 className="text-sm font-bold text-slate-900">Pending Invitations</h2>
                  <p className="text-xs text-slate-500">Sent invitations will appear here.</p>
                </div>
                <span className="rounded-md border border-[#dbe5d8] bg-[#edf3ec] px-2.5 py-1 font-mono text-[11px] text-slate-500">Auto-expires in {INVITE_VALID_DAYS} days</span>
              </div>
              {pendingInvites.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-[#cbdbcb] bg-[#fafdfa] py-12 text-center">
                  <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-[#edf3ec] text-slate-600">✉</div>
                  <p className="text-sm font-bold text-slate-800">No pending invitations</p>
                  <p className="mt-0.5 text-xs text-slate-500">Sent invitations will appear here.</p>
                </div>
              ) : (
                <div className="max-h-60 space-y-2.5 overflow-y-auto pr-1">
                  {pendingInvites.map((invite) => (
                    <div key={invite.id} className="flex items-center justify-between rounded-xl border border-[#e1ebe0] bg-[#f7faf7] p-3">
                      <div className="min-w-0">
                        <p className="truncate text-xs font-semibold text-slate-900">{invite.email}</p>
                        <p className="text-[11px] text-slate-500">{invite.sentAt}</p>
                      </div>
                      <span className="rounded-full bg-[#e2ede0] px-2 py-0.5 text-[10px] font-semibold text-[#2d5034]">Pending</span>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>
        </main>
      </div>
      {isCreateMemberOpen && (
        <CreateWorkspaceMemberModal
          onClose={() => setIsCreateMemberOpen(false)}
          onSubmitSuccess={async (data) => {
            const res = await dispatch(
              createWorkspaceMember({
                name: data.name,
                email: data.email,
                password: data.password,
                role: data.role,
              })
            );
            return res as { success: boolean; message?: string };
          }}
        />
      )}
    </div>
  );
}

export default function SettingsPage() {
  return (
    <SidebarProvider>
      <InviteMemberSettings />
    </SidebarProvider>
  );
}