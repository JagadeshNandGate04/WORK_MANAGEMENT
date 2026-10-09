import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { AppDispatch, RootState } from '../store';

export interface DashboardUser {
  id: number;
  email: string;
  name: string;
  designation: string | null;
  status: number;
}

export interface DashboardTaskStats {
  completed_tasks: number;
  overdue_tasks: number;
  due_today: number;
}

export interface DashboardWorkspace {
  id: number;
  name: string;
}

export interface DashboardProjectMember {
  id: number;
  name: string;
}

export interface DashboardProject {
  id: number;
  name: string;
  description: string;
  workspace_id: number;
  created_by: number;
  created_at: string;
  updated_at: string;
  role: string;
  members: DashboardProjectMember[];
}

export interface DashboardTask {
  id: number;
  project_id: number;
  project_name: string;
  name: string;
  description: string;
  assignee_id: number | null;
  due_date: string | null;
  priority: number;
  status: number;
  created_by: number;
  created_at: string;
  updated_at: string;
}

export interface DashboardData {
  date: string;
  time: string;
  user: DashboardUser;
  task_stats: DashboardTaskStats;
  projects: DashboardProject[];
  tasks: DashboardTask[];
  workspace: DashboardWorkspace;
}

interface DashboardState {
  data: DashboardData | null;
  loading: boolean;
  error: string | null;
}

interface DashboardResponse {
  success: boolean;
  message?: string;
  data?: DashboardData;
}

const initialState: DashboardState = {
  data: null,
  loading: false,
  error: null,
};

const dashboardSlice = createSlice({
  name: 'dashboard',
  initialState,
  reducers: {
    fetchDashboardStart(state) {
      state.loading = true;
      state.error = null;
    },

    fetchDashboardSuccess(
      state,
      action: PayloadAction<DashboardData>
    ) {
      state.loading = false;
      state.data = action.payload;
      state.error = null;
    },

    fetchDashboardFailure(state, action: PayloadAction<string>) {
      state.loading = false;
      state.error = action.payload;
    },

    clearDashboard(state) {
      state.data = null;
      state.loading = false;
      state.error = null;
    },
  },
});

export const {
  fetchDashboardStart,
  fetchDashboardSuccess,
  fetchDashboardFailure,
  clearDashboard,
} = dashboardSlice.actions;

export default dashboardSlice.reducer;

export const fetchDashboard =
  () => async (dispatch: AppDispatch, getState: () => RootState) => {
    dispatch(fetchDashboardStart());

    try {
      const token = getState().auth.token;
      if (!token) {
        const message = 'You must be signed in to load dashboard data.';
        dispatch(fetchDashboardFailure(message));
        return { success: false, message };
      }

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/dashboard`,
        {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      const result = (await response.json().catch(() => ({}))) as DashboardResponse;

      if (!response.ok || !result.success || !result.data) {
        const message = result.message || 'Unable to fetch dashboard data.';
        dispatch(fetchDashboardFailure(message));
        return { success: false, message };
      }

      dispatch(fetchDashboardSuccess(result.data));

      return {
        success: true,
        message: result.message || 'Dashboard data fetched successfully',
        payload: result.data,
      };
    } catch (error: unknown) {
      const message =
        error instanceof Error
          ? error.message
          : 'Unable to fetch dashboard data.';
      dispatch(fetchDashboardFailure(message));
      return { success: false, message };
    }
  };
