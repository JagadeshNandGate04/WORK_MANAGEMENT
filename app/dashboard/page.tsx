'use client';

import React, { useEffect, useState } from 'react';
import Sidebar from '../components/SideBar';
import Header from '../components/Header';
import { SidebarProvider, useSidebar } from '../components/SidebarContext';
import { useDispatch, useSelector } from '../store/hooks';
import { fetchDashboard } from '../store/dashboard/dashBoardSlice';

// ============================================================
// Types
// ============================================================

interface TaskItem {
  id: string;
  title: string;
  tag: string;
  statusBadge?: { label: string; bg: string; text: string };
  completed: boolean;
}

interface CalendarEvent {
  day: string;
  month: string;
  title: string;
  description: string;
  time: string;
}

interface ProjectProgressItem {
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

  const [tasks, setTasks] = useState<TaskItem[]>([
    {
      id: 'task-1',
      title: 'Fix Login API',
      tag: 'Backend',
      statusBadge: {
        label: 'High',
        bg: 'bg-rose-50 border border-rose-200',
        text: 'text-rose-600',
      },
      completed: false,
    },
    {
      id: 'task-2',
      title: 'Dashboard UI',
      tag: 'Design',
      statusBadge: {
        label: '• In Progress',
        bg: 'bg-emerald-50 border border-emerald-200',
        text: 'text-emerald-700',
      },
      completed: false,
    },
    {
      id: 'task-3',
      title: 'Database Integration',
      tag: 'DevOps',
      statusBadge: {
        label: 'Review',
        bg: 'bg-amber-50 border border-amber-200',
        text: 'text-amber-700',
      },
      completed: false,
    },
    {
      id: 'task-4',
      title: 'Authentication',
      tag: 'Security',
      statusBadge: { label: 'Done', bg: 'bg-emerald-100', text: 'text-emerald-800' },
      completed: true,
    },
  ]);

  const [upcomingEvents] = useState<CalendarEvent[]>([
    {
      day: '02',
      month: 'OCT',
      title: 'Client Meeting',
      description: 'Zoom with Acme Corp Partners • Product Scope',
      time: '10:00 AM',
    },
    {
      day: '03',
      month: 'OCT',
      title: 'API Testing',
      description: 'Sprint QA signoff & stress testing batch v2.4',
      time: '02:30 PM',
    },
    {
      day: '04',
      month: 'OCT',
      title: 'UI Review',
      description: 'Design handoff with UX Lead Shalika & team',
      time: '11:15 AM',
    },
  ]);

  const [projects] = useState<ProjectProgressItem[]>([
    { name: 'HR Application', progress: 72, color: 'bg-indigo-500' },
    { name: 'Mobile App', progress: 84, color: 'bg-emerald-500' },
    { name: 'Website', progress: 54, color: 'bg-amber-500' },
  ]);

  const [activities] = useState<ActivityItem[]>([
    {
      initials: 'JD',
      avatarBg: 'bg-blue-100 text-blue-800',
      author: 'John',
      action: 'created a task:',
      target: 'Implement OAuth flow',
      timeAgo: '5m ago',
    },
    {
      initials: 'SC',
      avatarBg: 'bg-purple-100 text-purple-800',
      author: 'Sarah',
      action: 'commented on',
      target: 'Bug #104',
      timeAgo: '18m ago',
    },
    {
      initials: 'SK',
      avatarBg: 'bg-emerald-100 text-emerald-800',
      author: 'You',
      action: 'completed a task:',
      target: 'Authentication',
      timeAgo: '1h ago',
    },
  ]);

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

  const toggleTask = (id: string) => {
    setTasks((prev) =>
      prev.map((task) =>
        task.id === id ? { ...task, completed: !task.completed } : task
      )
    );
  };

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
                        Sample tasks
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-400">
                      <button className="hover:text-slate-600 p-1">⚙️</button>
                      <button className="hover:text-slate-600 p-1">⇅</button>
                    </div>
                  </div>

                  <div className="divide-y divide-slate-100 pt-1">
                    {tasks.map((task) => (
                      <div
                        key={task.id}
                        onClick={() => toggleTask(task.id)}
                        className="py-3 flex items-center justify-between gap-3 hover:bg-slate-50/70 px-2 rounded-xl cursor-pointer transition-colors"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div
                            className={`w-4 h-4 rounded border flex items-center justify-center transition-colors flex-shrink-0 ${
                              task.completed
                                ? 'bg-emerald-500 border-emerald-500 text-white'
                                : 'border-slate-300 bg-white'
                            }`}
                          >
                            {task.completed && (
                              <span className="text-[10px] font-bold">✓</span>
                            )}
                          </div>
                          <span
                            className={`text-xs font-semibold transition-colors truncate ${
                              task.completed
                                ? 'line-through text-slate-400'
                                : 'text-slate-800'
                            }`}
                          >
                            {task.title}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 flex-shrink-0">
                          {task.statusBadge && (
                            <span
                              className={`hidden sm:inline-block px-2 py-0.5 text-[10px] font-bold rounded-md ${task.statusBadge.bg} ${task.statusBadge.text}`}
                            >
                              {task.statusBadge.label}
                            </span>
                          )}
                          <span className="text-[11px] text-slate-400 font-medium">
                            {task.tag}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 font-medium">
                  <span>Example task list</span>
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
                    {upcomingEvents.map((evt, idx) => (
                      <div
                        key={idx}
                        className="py-3 flex items-center justify-between gap-3 hover:bg-slate-50/70 px-2 rounded-xl transition-colors"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-200 flex flex-col items-center justify-center text-slate-700 leading-none flex-shrink-0">
                            <span className="text-[9px] uppercase font-bold text-slate-400">
                              {evt.month}
                            </span>
                            <span className="text-sm font-black text-slate-900 mt-0.5">
                              {evt.day}
                            </span>
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-slate-900 truncate">
                              {evt.title}
                            </p>
                            <p className="text-[11px] text-slate-500 truncate">
                              {evt.description}
                            </p>
                          </div>
                        </div>
                        <span className="text-[11px] font-mono font-medium text-slate-400 whitespace-nowrap">
                          {evt.time}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 font-medium">
                  <span>3 events this week</span>
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
                  {projects.map((proj, idx) => (
                    <div key={idx} className="space-y-1.5">
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
                </div>
              </div>

              {/* Recent Activity */}
              <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-100 shadow-sm">
                <h2 className="text-sm font-black text-slate-900 mb-4">
                  Recent Activity
                </h2>
                <div className="space-y-3">
                  {activities.map((act, idx) => (
                    <div
                      key={idx}
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