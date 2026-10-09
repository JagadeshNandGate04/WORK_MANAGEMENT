// store/task/taskSlice.tsx

import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { AppDispatch, RootState } from '../store';


// ========================================
// Task Interfaces
// ========================================

export interface Task {
  id: number;
  project_id: number;
  name: string;
  description: string;
  assignee_id: number | null;
  assignee_name?: string;
  due_date: string;
  priority: number; // 0: Critical, 1: High, 2: Medium, 3: Normal
  status: number;   // 0: Todo, 1: In Progress, 2: Review, 3: Completed
  created_by: number;
  created_by_name?: string;
  created_at: string;
  updated_by?: number;
  updated_at?: string;

  // Optional — not returned by the API but used by the UI component
  task_code?: string;
  project_name?: string;
}

export interface CreateTaskPayload {
  project_id: number;
  name: string;
  description?: string;
  assignee_id?: number | null;
  due_date: string;    // YYYY-MM-DD
  priority: number;    // 0–3
  status: number;      // 0–3
}


// ========================================
// Task State Interface
// ========================================

interface TaskState {
  tasks: Task[];

  // Fetch tasks loading/error
  loading: boolean;
  error: string | null;

  // Create task loading/error
  creating: boolean;
  createError: string | null;
}


// ========================================
// Initial State
// ========================================

const initialState: TaskState = {
  tasks: [],

  loading: false,
  error: null,

  creating: false,
  createError: null,
};


// ========================================
// Task Slice
// ========================================

const taskSlice = createSlice({
  name: 'task',
  initialState,

  reducers: {
    // ------------------------------------
    // Fetch Tasks Start
    // ------------------------------------

    fetchTasksStart(state) {
      state.loading = true;
      state.error = null;
    },


    // ------------------------------------
    // Fetch Tasks Success
    // ------------------------------------

    fetchTasksSuccess(state, action: PayloadAction<Task[]>) {
      state.loading = false;
      state.error = null;
      state.tasks = action.payload;
    },


    // ------------------------------------
    // Fetch Tasks Failure
    // ------------------------------------

    fetchTasksFailure(state, action: PayloadAction<string>) {
      state.loading = false;
      state.error = action.payload;
    },


    // ------------------------------------
    // Clear Task Error
    // ------------------------------------

    clearTaskError(state) {
      state.error = null;
    },


    // ------------------------------------
    // Set Tasks (bulk replace)
    // ------------------------------------

    setTasks(state, action: PayloadAction<Task[]>) {
      state.tasks = action.payload;
    },


    // ------------------------------------
    // Create Task Start
    // ------------------------------------

    createTaskStart(state) {
      state.creating = true;
      state.createError = null;
    },


    // ------------------------------------
    // Create Task Success
    // ------------------------------------

    createTaskSuccess(state, action: PayloadAction<Task>) {
      state.creating = false;
      state.createError = null;
      state.tasks = [...state.tasks, action.payload];
    },


    // ------------------------------------
    // Create Task Failure
    // ------------------------------------

    createTaskFailure(state, action: PayloadAction<string>) {
      state.creating = false;
      state.createError = action.payload;
    },


    // ------------------------------------
    // Clear Create Error
    // ------------------------------------

    clearCreateTaskError(state) {
      state.createError = null;
    },


    // ------------------------------------
    // Reset Task State
    // ------------------------------------

    resetTaskState(state) {
      state.tasks = [];
      state.loading = false;
      state.error = null;
      state.creating = false;
      state.createError = null;
    },
  },
});


// ========================================
// Export Actions
// ========================================

export const {
  fetchTasksStart,
  fetchTasksSuccess,
  fetchTasksFailure,
  clearTaskError,
  setTasks,

  createTaskStart,
  createTaskSuccess,
  createTaskFailure,
  clearCreateTaskError,

  resetTaskState,
} = taskSlice.actions;


// ========================================
// Export Reducer
// ========================================

export default taskSlice.reducer;


// ========================================
// Fetch Tasks By Project Thunk
// ========================================

export const fetchTasksByProject =
  (projectId: number) =>
  async (dispatch: AppDispatch, getState: () => RootState) => {

    dispatch(fetchTasksStart());

    try {
      const token = getState().auth.token;
      if (!token) {
        const message = 'Please sign in again before fetching tasks.';
        dispatch(fetchTasksFailure(message));
        return { success: false, message };
      }

      if (!projectId) {
        const message = 'No project selected.';
        dispatch(fetchTasksFailure(message));
        return { success: false, message };
      }

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/tasks/projects/${projectId}/tasks`,
        {
          method: 'GET',

          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        const message =
          result.message || 'Failed to fetch tasks';

        dispatch(fetchTasksFailure(message));

        return {
          success: false,
          message,
        };
      }


      // Tasks fetched successfully

      dispatch(fetchTasksSuccess(result.data as Task[]));

      return {
        success: true,
        message:
          result.message ||
          'Tasks fetched successfully',
        data: result.data as Task[],
      };

    } catch (error: unknown) {
      const message =
        error instanceof Error
          ? error.message
          : 'Unknown error';

      dispatch(fetchTasksFailure(message));

      return {
        success: false,
        message,
      };
    }
  };


// ========================================
// Fetch Tasks Across Projects Thunk
// ========================================

export const fetchTasksForProjects =
  (projectIds: number[]) =>
  async (dispatch: AppDispatch, getState: () => RootState) => {
    dispatch(fetchTasksStart());

    try {
      const token = getState().auth.token;
      if (!token) {
        const message = 'Please sign in again before fetching tasks.';
        dispatch(fetchTasksFailure(message));
        return { success: false, message };
      }

      const uniqueProjectIds = Array.from(new Set(projectIds.filter((id) => Number.isFinite(id) && id > 0)));
      if (uniqueProjectIds.length === 0) {
        dispatch(fetchTasksSuccess([]));
        return { success: true, message: 'No projects are available.', data: [] };
      }

      const responses = await Promise.all(
        uniqueProjectIds.map(async (projectId) => {
          const response = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL}/api/tasks/projects/${projectId}/tasks`,
            { method: 'GET', headers: { Authorization: `Bearer ${token}` } }
          );
          const result = await response.json().catch(() => ({})) as {
            success?: boolean;
            message?: string;
            data?: Task[];
          };

          if (!response.ok || !result.success || !Array.isArray(result.data)) {
            throw new Error(result.message || `Failed to fetch tasks for project ${projectId}.`);
          }
          return result.data;
        })
      );

      const tasks = responses.flat();
      dispatch(fetchTasksSuccess(tasks));
      return { success: true, message: 'Tasks fetched successfully.', data: tasks };
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unable to fetch tasks.';
      dispatch(fetchTasksFailure(message));
      return { success: false, message };
    }
  };


// ========================================
// Create Task Thunk
// ========================================
//
// POST /api/tasks/create-task
//
// Request:
//   {
//     project_id: number,
//     name: string,
//     description: string,
//     assignee_id: number | null,
//     due_date: string (YYYY-MM-DD),
//     priority: number,
//     status: number
//   }
//
// Response:
//   {
//     success: true,
//     message: 'Task created successfully',
//     data: { id, project_id, name, description, assignee_id,
//             due_date, priority, status, created_by, updated_by,
//             created_at, updated_at }
//   }
// ========================================

export const createTask =
  (taskData: CreateTaskPayload) =>
  async (dispatch: AppDispatch, getState: () => RootState) => {

    dispatch(createTaskStart());

    try {
      const token = getState().auth.token;
      if (!token) {
        const message = 'Please sign in again before creating a task.';
        dispatch(createTaskFailure(message));
        return { success: false, message };
      }

      if (!taskData.project_id) {
        const message = 'Please select a project scope.';
        dispatch(createTaskFailure(message));
        return { success: false, message };
      }

      if (!taskData.name?.trim()) {
        const message = 'Please enter a task name.';
        dispatch(createTaskFailure(message));
        return { success: false, message };
      }

      if (!taskData.due_date) {
        const message = 'Please specify a due date.';
        dispatch(createTaskFailure(message));
        return { success: false, message };
      }

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/tasks/create-task`,
        {
          method: 'POST',

          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },

          body: JSON.stringify({
            project_id: Number(taskData.project_id),
            name: taskData.name.trim(),
            description: taskData.description?.trim() ?? '',
            assignee_id:
              taskData.assignee_id === null || taskData.assignee_id === undefined
                ? null
                : Number(taskData.assignee_id),
            due_date: taskData.due_date,
            priority: Number(taskData.priority),
            status: Number(taskData.status),
          }),
        }
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        const message =
          result.message || 'Failed to create task';

        dispatch(createTaskFailure(message));

        return {
          success: false,
          message,
        };
      }


      // Task created successfully

      dispatch(createTaskSuccess(result.data as Task));

      return {
        success: true,
        message:
          result.message ||
          'Task created successfully',
        data: result.data as Task,
      };

    } catch (error: unknown) {
      const message =
        error instanceof Error
          ? error.message
          : 'Unknown error';

      dispatch(createTaskFailure(message));

      return {
        success: false,
        message,
      };
    }
  };