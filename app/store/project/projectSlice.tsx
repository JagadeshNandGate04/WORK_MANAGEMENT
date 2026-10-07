import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { AppDispatch, RootState } from '../store';

export interface ProjectMember {
  id: number;
  name: string;
}

export interface ProjectData {
  id: number;
  name: string;
  description: string;
  created_by: number;
  created_at: string;
  updated_at: string;
  members?: ProjectMember[];
}

interface ProjectsResponse {
  success: boolean;
  message?: string;
  data?: ProjectData[];
}

interface CreateProjectResponse {
  success: boolean;
  message?: string;
  data?: ProjectData;
}

interface CreateProjectPayload {
  name: string;
  description: string;
  members: number[];
}

interface ProjectState {
  data: ProjectData[];
  loading: boolean;
  error: string | null;
  creating: boolean;
  createError: string | null;
  createdProject: ProjectData | null;
}

const initialState: ProjectState = {
  data: [],
  loading: false,
  error: null,
  creating: false,
  createError: null,
  createdProject: null,
};

const projectSlice = createSlice({
  name: 'project',
  initialState,
  reducers: {
    fetchProjectsStart(state) {
      state.loading = true;
      state.error = null;
    },

    fetchProjectsSuccess(state, action: PayloadAction<ProjectData[]>) {
      state.loading = false;
      state.data = action.payload;
      state.error = null;
    },

    fetchProjectsFailure(state, action: PayloadAction<string>) {
      state.loading = false;
      state.error = action.payload;
    },

    clearProjects(state) {
      state.data = [];
      state.loading = false;
      state.error = null;
    },

    createProjectStart(state) {
      state.creating = true;
      state.createError = null;
      state.createdProject = null;
    },

    createProjectSuccess(state, action: PayloadAction<ProjectData>) {
      state.creating = false;
      state.createError = null;
      state.createdProject = action.payload;
      state.data = [action.payload, ...state.data];
    },

    createProjectFailure(state, action: PayloadAction<string>) {
      state.creating = false;
      state.createError = action.payload;
    },

    resetCreateProjectState(state) {
      state.creating = false;
      state.createError = null;
      state.createdProject = null;
    },
  },
});

export const {
  fetchProjectsStart,
  fetchProjectsSuccess,
  fetchProjectsFailure,
  clearProjects,
  createProjectStart,
  createProjectSuccess,
  createProjectFailure,
  resetCreateProjectState,
} = projectSlice.actions;

export default projectSlice.reducer;

export const fetchProjects =
  () => async (dispatch: AppDispatch, getState: () => RootState) => {
    dispatch(fetchProjectsStart());

    try {
      const token = getState().auth.token;
      if (!token) {
        const message = 'You must be signed in to load projects.';
        dispatch(fetchProjectsFailure(message));
        return { success: false, message };
      }

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/projects`,
        {
          method: 'GET',
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      const result = (await response.json().catch(() => ({}))) as ProjectsResponse;

      if (!response.ok || !result.success || !Array.isArray(result.data)) {
        const message = result.message || 'Unable to fetch projects.';
        dispatch(fetchProjectsFailure(message));
        return { success: false, message };
      }

      dispatch(fetchProjectsSuccess(result.data));

      return {
        success: true,
        message: result.message || 'Projects fetched successfully',
        payload: result.data,
      };
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : 'Unable to fetch projects.';
      dispatch(fetchProjectsFailure(message));
      return { success: false, message };
    }
  };

export const createProject =
  (payload: CreateProjectPayload) =>
  async (dispatch: AppDispatch, getState: () => RootState) => {
    dispatch(createProjectStart());

    try {
      const token = getState().auth.token;
      if (!token) {
        const message = 'You must be signed in to create a project.';
        dispatch(createProjectFailure(message));
        return { success: false, message };
      }

      const apiBaseUrl =
        process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
      const response = await fetch(
  `${process.env.NEXT_PUBLIC_API_URL}/api/create-project`,
  {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  }
);
      const result = (await response.json().catch(() => ({}))) as CreateProjectResponse;

      if (!response.ok || !result.success || !result.data) {
        const message = result.message || 'Unable to create project.';
        dispatch(createProjectFailure(message));
        return { success: false, message };
      }

      dispatch(createProjectSuccess(result.data));
      return {
        success: true,
        message: result.message || 'Project created successfully',
        payload: result.data,
      };
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : 'Unable to create project.';
      dispatch(createProjectFailure(message));
      return { success: false, message };
    }
  };
