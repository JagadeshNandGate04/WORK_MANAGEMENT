import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { AppDispatch, RootState } from '../store';

// =====================================================
// API TYPES
// =====================================================

export interface ReportApiMember {
  id: number;
  name: string;
  role: string;
}

export interface ReportApiTask {
  id: number;
  name: string;
  status: number;
  due_date: string | null;
  priority: number;
  assignee_id: number | null;
  assignee_name: string | null;
}

export interface ReportTaskSummary {
  total: number;
  closed: number;
  completed: number;
  completion_percentage: number;
  status_counts: Record<string, number>;
}

export interface ProjectReport {
  id: number;
  name: string;
  description: string;
  workspace_id: number;
  status: number;
  created_by: number;
  created_at: string;
  members: ReportApiMember[];
  tasks: ReportApiTask[];
  task_summary: ReportTaskSummary;
}

// Member task progress API types

export interface MemberTaskProgressTask {
  id: number;
  name: string;
  status: number;
  due_date: string | null;
  priority: number;
}

export interface MemberTaskProgressSummary {
  total: number;
  closed: number;
  completed: number;
  completion_percentage: number;
  status_counts: Record<string, number>;
}

export interface MemberTaskProgress {
  member: {
    id: number;
    name: string;
  };
  tasks: MemberTaskProgressTask[];
  task_summary: MemberTaskProgressSummary;
}

interface ReportApiResponse {
  success: boolean;
  message: string;
  data: ProjectReport[];
}

interface MemberTaskProgressApiResponse {
  success: boolean;
  message: string;
  data: MemberTaskProgress;
}

// =====================================================
// REDUX STATE
// =====================================================

interface ReportState {
  // Project report summary
  data: ProjectReport[];
  loading: boolean;
  error: string | null;

  // Individual member task progress
  memberTaskProgress: MemberTaskProgress | null;
  memberTaskProgressLoading: boolean;
  memberTaskProgressError: string | null;
}

const initialState: ReportState = {
  data: [],
  loading: false,
  error: null,

  memberTaskProgress: null,
  memberTaskProgressLoading: false,
  memberTaskProgressError: null,
};

// =====================================================
// REDUX SLICE
// =====================================================

const reportSlice = createSlice({
  name: 'report',
  initialState,
  reducers: {
    // Project report summary actions

    fetchReportStart(state) {
      state.loading = true;
      state.error = null;
    },

    fetchReportSuccess(
      state,
      action: PayloadAction<ProjectReport[]>
    ) {
      state.loading = false;
      state.data = action.payload;
      state.error = null;
    },

    fetchReportFailure(
      state,
      action: PayloadAction<string>
    ) {
      state.loading = false;
      state.error = action.payload;
    },

    clearReportError(state) {
      state.error = null;
    },

    // Member task progress actions

    fetchMemberTaskProgressStart(state) {
      state.memberTaskProgressLoading = true;
      state.memberTaskProgressError = null;
    },

    fetchMemberTaskProgressSuccess(
      state,
      action: PayloadAction<MemberTaskProgress>
    ) {
      state.memberTaskProgressLoading = false;
      state.memberTaskProgress = action.payload;
      state.memberTaskProgressError = null;
    },

    fetchMemberTaskProgressFailure(
      state,
      action: PayloadAction<string>
    ) {
      state.memberTaskProgressLoading = false;
      state.memberTaskProgressError = action.payload;
    },

    clearMemberTaskProgress(state) {
      state.memberTaskProgress = null;
      state.memberTaskProgressError = null;
      state.memberTaskProgressLoading = false;
    },
  },
});

export const {
  fetchReportStart,
  fetchReportSuccess,
  fetchReportFailure,
  clearReportError,

  fetchMemberTaskProgressStart,
  fetchMemberTaskProgressSuccess,
  fetchMemberTaskProgressFailure,
  clearMemberTaskProgress,
} = reportSlice.actions;

// =====================================================
// FETCH PROJECT REPORT SUMMARY
// =====================================================

export const fetchReportSummary =
  () =>
  async (dispatch: AppDispatch, getState: () => RootState) => {
    dispatch(fetchReportStart());

    try {
      const token = getState().auth.token;

      if (!token) {
        throw new Error(
          'Authentication token not found. Please log in again.'
        );
      }

      const baseUrl = process.env.NEXT_PUBLIC_API_URL;

      if (!baseUrl) {
        throw new Error('NEXT_PUBLIC_API_URL is not configured.');
      }

      const response = await fetch(
        `${baseUrl}/api/projects/report-summary`,
        {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      const result: ReportApiResponse = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(
          result.message || 'Failed to fetch project report summary.'
        );
      }

      if (!Array.isArray(result.data)) {
        throw new Error(
          'Invalid report data received from the server.'
        );
      }

      dispatch(fetchReportSuccess(result.data));

      return {
        success: true,
        message: result.message,
        data: result.data,
      };
    } catch (error: unknown) {
      const message =
        error instanceof Error
          ? error.message
          : 'Unknown error occurred while fetching the report.';

      dispatch(fetchReportFailure(message));

      return {
        success: false,
        message,
        data: [],
      };
    }
  };

// =====================================================
// FETCH MEMBER TASK PROGRESS
// =====================================================

export const fetchMemberTaskProgress =
  (projectId: number, memberId: number) =>
  async (dispatch: AppDispatch, getState: () => RootState) => {
    dispatch(fetchMemberTaskProgressStart());

    try {
      const token = getState().auth.token;

      if (!token) {
        throw new Error(
          'Authentication token not found. Please log in again.'
        );
      }

      const baseUrl = process.env.NEXT_PUBLIC_API_URL;

      if (!baseUrl) {
        throw new Error('NEXT_PUBLIC_API_URL is not configured.');
      }

      if (!Number.isInteger(projectId) || projectId <= 0) {
        throw new Error('A valid project ID is required.');
      }

      if (!Number.isInteger(memberId) || memberId <= 0) {
        throw new Error('A valid member ID is required.');
      }

      const response = await fetch(
        `${baseUrl}/api/projects/${projectId}/members/${memberId}/task-progress`,
        {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      const result: MemberTaskProgressApiResponse =
        await response.json();

      if (!response.ok || !result.success) {
        throw new Error(
          result.message ||
            'Failed to fetch member task progress.'
        );
      }

      if (
        !result.data ||
        !result.data.member ||
        !Array.isArray(result.data.tasks) ||
        !result.data.task_summary
      ) {
        throw new Error(
          'Invalid member task progress data received from the server.'
        );
      }

      dispatch(fetchMemberTaskProgressSuccess(result.data));

      return {
        success: true,
        message: result.message,
        data: result.data,
      };
    } catch (error: unknown) {
      const message =
        error instanceof Error
          ? error.message
          : 'Unknown error occurred while fetching member task progress.';

      dispatch(fetchMemberTaskProgressFailure(message));

      return {
        success: false,
        message,
        data: null,
      };
    }
  };

export default reportSlice.reducer;