'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Sidebar from '../components/SideBar';
import Header from '../components/Header';
import { SidebarProvider, useSidebar } from '../components/SidebarContext';
import { useDispatch, useSelector } from '../store/hooks';
import { fetchDashboard } from '../store/dashboard/dashBoardSlice';

// ============================================================
// Types
// ============================================================

interface ProjectProgressItem {
  id: number;
  name: string;
  progress: number;
  color: string;
}

interface ActivityItem {
  initials: string;
  avatarBg: string;
  author: string;
  action: string;
  target: string;
  timeAgo: string;
  id: number;
}

const IST = 'Asia/Kolkata';

function useIstNow() {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  return now;
}

// ============================================================
// Live Clock
// ============================================================

function LiveClock({ now }: { now: Date | null }) {
  const date = now
    ? new Intl.DateTimeFormat('en-IN', {
        timeZone: IST,
        weekday: 'long',
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      }).format(now)
    : 'Loading date…';
  const time = now
    ? new Intl.DateTimeFormat('en-IN', {
        timeZone: IST,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hourCycle: 'h23',
      }).format(now)
    : '--:--:--';

  return (
    <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 rounded-xl border border-slate-200/60 text-xs font-medium text-slate-600">
      <span>📅</span>
      {date || '--'}
      <span className="text-slate-300">|</span>
      <span className="font-mono font-bold">{time || '--:--:--'}</span>
      <span className="text-[10px] text-slate-400">IST</span>
    </div>
  );
}

// ============================================================
// Dashboard Inner (uses sidebar context)
// ============================================================

function DashboardContent() {
  const { collapsed } = useSidebar();
  const dispatch = useDispatch();
  const authUser = useSelector((state) => state.auth.user);
  const token = useSelector((state) => state.auth.token);
  const dashboardDataFromStore = useSelector((state) => state.dashboard.data);
  const dashboardLoading = useSelector((state) => state.dashboard.loading);
  const dashboardErrorFromStore = useSelector((state) => state.dashboard.error);
  const now = useIstNow();

  useEffect(() => {
    if (!token) return;
    void dispatch(fetchDashboard());
  }, [token, dispatch]);

  const dashboardData = token ? dashboardDataFromStore : null;
  const dashboardError = token
    ? dashboardErrorFromStore
    : 'Sign in to load your dashboard data.';
  const user = dashboardData?.user || authUser;
  const displayName = user?.name?.trim() || user?.email?.split('@')[0] || 'there';
  const headerName = user?.name?.trim() || user?.email?.split('@')[0] || 'Guest User';
  const userInitials = headerName
    .split(/\s+/)
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
  const headerRole = dashboardData?.user.designation || authUser?.role || 'Team member';

  const projects = useMemo(() => dashboardData?.projects ?? [], [dashboardData?.projects]);
  const dashboardTasks = useMemo(() => dashboardData?.tasks ?? [], [dashboardData?.tasks]);
  const currentUserId = user?.id;
  const myTasks = useMemo(
    () => dashboardTasks.filter((task) => currentUserId != null && task.assignee_id === currentUserId),
    [currentUserId, dashboardTasks]
  );
  const taskStatus = (status: number) => ({
    1: 'Needs Triage',
    2: 'Fixing',
    3: 'Ready to Retest',
    4: 'Retest',
    5: 'Verified',
    6: 'Closed',
    7: 'Completed',
  }[status] || 'Unknown');
  const taskPriority = (priority: number) => ({ 1: 'Low', 2: 'Medium', 3: 'High' }[priority] || '—');
  const upcomingTasks = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    return myTasks
      .filter((task) => task.due_date && task.due_date.slice(0, 10) >= today)
      .sort((a, b) => Date.parse(a.due_date || '') - Date.parse(b.due_date || ''))
      .slice(0, 3);
  }, [myTasks]);
  const projectProgress: ProjectProgressItem[] = useMemo(() => {
    const colors = ['bg-indigo-500', 'bg-emerald-500', 'bg-amber-500', 'bg-sky-500', 'bg-rose-500'];
    return projects.map((project, index) => {
      const projectTasks = dashboardTasks.filter((task) => task.project_id === project.id);
      const doneTasks = projectTasks.filter((task) => task.status >= 5).length;
      return {
        id: project.id,
        name: project.name,
        progress: projectTasks.length ? Math.round((doneTasks / projectTasks.length) * 100) : 0,
        color: colors[index % colors.length],
      };
    });
  }, [dashboardTasks, projects]);
  const activities: ActivityItem[] = useMemo(() => {
    const colors = ['bg-blue-100 text-blue-800', 'bg-purple-100 text-purple-800', 'bg-emerald-100 text-emerald-800'];
    return [...dashboardTasks]
      .sort((a, b) => Date.parse(b.created_at) - Date.parse(a.created_at))
      .slice(0, 4)
      .map((task, index) => {
        const creator = projects
          .find((project) => project.id === task.project_id)
          ?.members.find((member) => member.id === task.created_by)?.name;
        const author = task.created_by === currentUserId ? 'You' : creator || `Member ${task.created_by}`;
        const elapsedMinutes = Math.max(0, Math.floor(((now?.getTime() ?? Date.parse(task.created_at)) - Date.parse(task.created_at)) / 60000));
        const timeAgo = elapsedMinutes < 1 ? 'Just now' : elapsedMinutes < 60 ? `${elapsedMinutes}m ago` : `${Math.floor(elapsedMinutes / 60)}h ago`;
        return {
          id: task.id,
          initials: author.split(/\s+/).map((part) => part[0]).join('').slice(0, 2).toUpperCase(),
          avatarBg: colors[index % colors.length],
          author,
          action: 'created a task:',
          target: task.name,
          timeAgo,
        };
      });
  }, [currentUserId, dashboardTasks, now, projects]);

  const istHour = now
    ? Number(
        new Intl.DateTimeFormat('en-IN', {
          timeZone: IST,
          hour: 'numeric',
          hourCycle: 'h23',
        }).format(now)
      )
    : null;

  const greeting =
    istHour === null
      ? 'Hello'
      : istHour < 12
      ? 'Good morning'
      : istHour < 17
      ? 'Good afternoon'
      : 'Good evening';

  const monthYear = now
    ? new Intl.DateTimeFormat('en-IN', {
        timeZone: IST,
        month: 'long',
        year: 'numeric',
      }).format(now)
    : '';

  return (
    <div className="min-h-screen w-full bg-[#e2ede0] text-slate-800 font-sans antialiased selection:bg-emerald-200">
      {/* Sidebar */}
      <Sidebar />

      {/* Main area — margin shifts with sidebar collapse state */}
      <div
        className={`min-h-screen pt-14 lg:pt-0 transition-all duration-300 ${
          collapsed ? 'lg:ml-20' : 'lg:ml-64'
        }`}
      >
        {/* Header wrapper so rounded card has padding */}
        <div className="px-4 pt-4 sm:px-6 lg:px-7">
          <Header
            userName={headerName}
            userRole={headerRole}
            userEmail={user?.email || ''}
            userInitials={userInitials || 'GU'}
            activeTab="Dashboard"
          />
        </div>

        {/* Dashboard Content */}
        <main className="w-full px-4 py-5 sm:px-6 lg:px-7">
          <div className="w-full max-w-[1600px] mx-auto space-y-5">
            <div className="flex justify-end">
              <LiveClock now={now} />
            </div>
            {/* ==================================================
                Hero Welcome Banner
            =================================================== */}
            <section className="bg-gradient-to-r from-emerald-50/70 via-teal-50/50 to-amber-50/40 rounded-3xl p-5 sm:p-7 border border-emerald-100/80 shadow-sm flex flex-col xl:flex-row items-center justify-between gap-6 relative overflow-hidden">
              <div className="space-y-3 z-10 max-w-xl w-full">
                <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                  {greeting}, {displayName} 👋
                </h1>

                <p className="text-xs text-slate-600 leading-relaxed font-medium">
                  Here&apos;s what&apos;s happening in your workspace today. You have{' '}
                  <span className="text-emerald-700 font-bold underline underline-offset-4 decoration-emerald-400">
                    {dashboardLoading ? '—' : dashboardData?.task_stats.due_today ?? '—'} tasks due today
                  </span>.
                </p>

                <div className="flex flex-wrap items-center gap-3 pt-2">
                  <button className="px-5 py-2.5 bg-slate-950 hover:bg-slate-800 text-white text-xs font-semibold rounded-xl shadow-sm transition-all">
                    + New Task
                  </button>
                  <button className="px-5 py-2.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-semibold rounded-xl shadow-sm transition-all">
                    View calendar
                  </button>
                </div>
              </div>

              {/* Character */}
              <div className="relative w-full sm:w-80 h-52 md:h-64 lg:w-[28rem] lg:h-72 bg-white/70 backdrop-blur-sm border border-emerald-100 rounded-2xl p-2 flex items-center justify-center shadow-sm flex-shrink-0 overflow-hidden">
                <span className="absolute inset-0 flex items-center justify-center text-5xl">
                  👨‍💻
                </span>
                <img
                  src="/screen.png"
                  alt="Cartoon Software Developer"
                  className="relative w-full h-full object-contain drop-shadow-sm"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
              </div>
            </section>

            {/* ==================================================
                KPI Cards
            =================================================== */}
            <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {/* Completed */}
              <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm flex flex-col justify-between">
                <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
                  <span>Completed</span>
                  <span className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600">
                    ✓
                  </span>
                </div>
                <div className="flex items-baseline justify-between mt-3">
                  <span className="text-3xl font-black text-slate-900">
                    {dashboardLoading ? '—' : dashboardData?.task_stats.completed_tasks ?? '—'}
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold">
                    Completed tasks
                  </span>
                </div>
                <div className="w-full h-1 bg-emerald-500 rounded-full mt-3" />
              </div>

              {/* Due Today */}
              <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm flex flex-col justify-between">
                <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
                  <span>Due Today</span>
                  <span className="p-1.5 rounded-lg bg-amber-50 text-amber-600">
                    ⏰
                  </span>
                </div>
                <div className="flex items-baseline justify-between mt-3">
                  <span className="text-3xl font-black text-slate-900">
                    {dashboardLoading ? '—' : dashboardData?.task_stats.due_today ?? '—'}
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 text-[10px] font-bold flex items-center gap-1">
                    Due today
                  </span>
                </div>
                <div className="w-full h-1 bg-amber-500 rounded-full mt-3" />
              </div>

              {/* Overdue */}
              <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm flex flex-col justify-between">
                <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
                  <span className="text-rose-600 font-semibold">Overdue</span>
                  <span className="p-1.5 rounded-lg bg-rose-50 text-rose-600">
                    !
                  </span>
                </div>
                <div className="flex items-baseline justify-between mt-3">
                  <span className="text-3xl font-black text-slate-900">
                    {dashboardLoading ? '—' : dashboardData?.task_stats.overdue_tasks ?? '—'}
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 text-[10px] font-bold border border-rose-100">
                    Overdue tasks
                  </span>
                </div>
                <div className="w-full h-1 bg-rose-500 rounded-full mt-3" />
              </div>
            </section>

            {dashboardError && (
              <div role="alert" className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs text-rose-700">
                <span>{dashboardError}</span>
                {token && (
                  <button
                    type="button"
                    onClick={() => void dispatch(fetchDashboard())}
                    className="font-bold underline underline-offset-2"
                  >
                    Try again
                  </button>
                )}
              </div>
            )}

            {/* ==================================================
                Tasks & Schedule
            =================================================== */}
            <section className="grid grid-cols-1 xl:grid-cols-2 gap-5">
              {/* My Tasks */}
              <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-100 shadow-sm flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                      <h2 className="text-sm font-black text-slate-900">
                        My Tasks
                      </h2>
                      <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[10px] font-bold">
                        {myTasks.length} {myTasks.length === 1 ? 'task' : 'tasks'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-400">
                      <button className="hover:text-slate-600 p-1">⚙️</button>
                      <button className="hover:text-slate-600 p-1">⇅</button>
                    </div>
                  </div>

                  <div className="divide-y divide-slate-100 pt-1">
                    {myTasks.map((task) => (
                      <div
                        key={task.id}
                        className="py-3 flex items-center justify-between gap-3 hover:bg-slate-50/70 px-2 rounded-xl transition-colors"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div
                            className={`w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 ${task.status >= 5 ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-slate-300 bg-white'}`}
                          >
                            {task.status >= 5 && (
                              <span className="text-[10px] font-bold">✓</span>
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className={`truncate text-xs font-semibold ${task.status >= 5 ? 'line-through text-slate-400' : 'text-slate-800'}`}>
                              {task.name}
                            </p>
                            <p className="truncate text-[10px] text-slate-400">{task.project_name}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 flex-shrink-0">
                          <span className="hidden sm:inline-block rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 text-[10px] font-bold text-slate-600">
                            {taskStatus(task.status)}
                          </span>
                          <span className="text-[11px] text-slate-400 font-medium">
                            {taskPriority(task.priority)}
                          </span>
                        </div>
                      </div>
                    ))}
                    {!dashboardLoading && myTasks.length === 0 && (
                      <p className="px-2 py-8 text-center text-xs text-slate-500">No tasks are currently assigned to you.</p>
                    )}
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 font-medium">
                  <span>Tasks assigned to you</span>
                  <a
                    href="#all-tasks"
                    className="text-slate-900 font-bold hover:underline flex items-center gap-1"
                  >
                    View all tasks →
                  </a>
                </div>
              </div>

              {/* Upcoming Schedule */}
              <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-100 shadow-sm flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                      <h2 className="text-sm font-black text-slate-900">
                        Upcoming
                      </h2>
                      {monthYear && (
                        <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 text-[10px] font-bold border border-emerald-200">
                          {monthYear}
                        </span>
                      )}
                    </div>
                    <button className="text-slate-400 hover:text-slate-600 p-1">
                      📅
                    </button>
                  </div>

                  <div className="divide-y divide-slate-100 pt-1">
                    {upcomingTasks.map((task) => {
                      const dueDate = new Date(task.due_date || '');
                      const isValidDate = !Number.isNaN(dueDate.getTime());
                      return (
                      <div
                        key={task.id}
                        className="py-3 flex items-center justify-between gap-3 hover:bg-slate-50/70 px-2 rounded-xl transition-colors"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-200 flex flex-col items-center justify-center text-slate-700 leading-none flex-shrink-0">
                            <span className="text-[9px] uppercase font-bold text-slate-400">
                              {isValidDate ? new Intl.DateTimeFormat('en', { month: 'short' }).format(dueDate) : '--'}
                            </span>
                            <span className="text-sm font-black text-slate-900 mt-0.5">
                              {isValidDate ? new Intl.DateTimeFormat('en', { day: '2-digit' }).format(dueDate) : '--'}
                            </span>
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-slate-900 truncate">
                              {task.name}
                            </p>
                            <p className="text-[11px] text-slate-500 truncate">
                              {task.project_name} · {taskStatus(task.status)}
                            </p>
                          </div>
                        </div>
                        <span className="text-[11px] font-mono font-medium text-slate-400 whitespace-nowrap">
                          {isValidDate ? new Intl.DateTimeFormat('en-IN', { hour: '2-digit', minute: '2-digit' }).format(dueDate) : '—'}
                        </span>
                      </div>
                      );
                    })}
                    {!dashboardLoading && upcomingTasks.length === 0 && (
                      <p className="px-2 py-8 text-center text-xs text-slate-500">No upcoming task due dates.</p>
                    )}
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 font-medium">
                  <span>{upcomingTasks.length} upcoming {upcomingTasks.length === 1 ? 'task' : 'tasks'}</span>
                  <a
                    href="#calendar"
                    className="text-slate-900 font-bold hover:underline flex items-center gap-1"
                  >
                    View calendar →
                  </a>
                </div>
              </div>
            </section>

            {/* ==================================================
                Project Progress & Activity
            =================================================== */}
            <section className="grid grid-cols-1 xl:grid-cols-2 gap-5 pb-6">
              {/* Project Progress */}
              <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-100 shadow-sm">
                <h2 className="text-sm font-black text-slate-900 mb-4">
                  Project Progress
                </h2>
                <div className="space-y-4">
                  {projectProgress.map((proj) => (
                    <div key={proj.id} className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
                        <div className="flex items-center gap-2">
                          <span className={`w-2 h-2 rounded-full ${proj.color}`} />
                          <span>{proj.name}</span>
                        </div>
                        <span className="font-mono text-slate-900 font-bold">
                          {proj.progress}%
                        </span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                        <div
                          className={`h-full rounded-full ${proj.color} transition-all duration-500`}
                          style={{ width: `${proj.progress}%` }}
                        />
                      </div>
                    </div>
                  ))}
                  {!dashboardLoading && projectProgress.length === 0 && (
                    <p className="py-6 text-center text-xs text-slate-500">No projects are associated with this account.</p>
                  )}
                </div>
                <p className="mt-4 text-[10px] text-slate-400">Progress is calculated from tasks at Verified, Closed, or Completed status.</p>
              </div>

              {/* Recent Activity */}
              <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-100 shadow-sm">
                <h2 className="text-sm font-black text-slate-900 mb-4">
                  Recent Activity
                </h2>
                <div className="space-y-3">
                    {activities.map((act) => (
                    <div
                      key={act.id}
                      className="flex items-center justify-between gap-3 text-xs"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div
                          className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0 ${act.avatarBg}`}
                        >
                          {act.initials}
                        </div>
                        <p className="text-slate-600 truncate">
                          <strong className="text-slate-900">
                            {act.author}
                          </strong>{' '}
                          {act.action}{' '}
                          <span className="text-emerald-700 font-medium">
                            {act.target}
                          </span>
                        </p>
                      </div>
                      <span className="text-[10px] text-slate-400 font-mono whitespace-nowrap flex-shrink-0">
                        {act.timeAgo}
                      </span>
                    </div>
                  ))}
                    {!dashboardLoading && activities.length === 0 && (
                      <p className="py-6 text-center text-xs text-slate-500">No task activity is available yet.</p>
                    )}
                </div>
              </div>
            </section>
          </div>
        </main>
      </div>
    </div>
  );
}

// ============================================================
// Dashboard — wraps everything in SidebarProvider
// ============================================================

export default function NandgateDashboard() {
  return (
    <SidebarProvider>
      <DashboardContent />
    </SidebarProvider>
  );
}