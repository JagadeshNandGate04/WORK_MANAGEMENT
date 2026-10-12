
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
  status: number;
  created_by: number;
  created_by_name?: string;
  created_at: string;
  updated_by?: number;
  updated_at?: string;
  task_code?: string;
  project_name?: string;
}

export interface CreateTaskPayload {
  project_id: number;
  name: string;
  description?: string;
  assignee_id?: number | null;
  due_date: string;
  priority: number;
  status: number;
}

export interface UpdateTaskPayload {
  taskId: number;
  name: string;
  description?: string;
  assignee_id: number | null;
  due_date: string;
  priority: number;
}

// ========================================
// Task State Interface
// ========================================

interface TaskState {
  tasks: Task[];

  loading: boolean;
  error: string | null;

  creating: boolean;
  createError: string | null;

  updatingStatus: boolean;
  updateStatusError: string | null;

  updating: boolean;
  updateError: string | null;
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

  updatingStatus: false,
  updateStatusError: null,

  updating: false,
  updateError: null,
};

// ========================================
// Task Slice
// ========================================

const taskSlice = createSlice({
  name: 'task',
  initialState,

  reducers: {
    // Fetch tasks
    fetchTasksStart(state) {
      state.loading = true;
      state.error = null;
    },

    fetchTasksSuccess(state, action: PayloadAction<Task[]>) {
      state.loading = false;
      state.error = null;
      state.tasks = action.payload;
    },

    fetchTasksFailure(state, action: PayloadAction<string>) {
      state.loading = false;
      state.error = action.payload;
    },

    clearTaskError(state) {
      state.error = null;
    },

    setTasks(state, action: PayloadAction<Task[]>) {
      state.tasks = action.payload;
    },

    // Create task
    createTaskStart(state) {
      state.creating = true;
      state.createError = null;
    },

    createTaskSuccess(state, action: PayloadAction<Task>) {
      state.creating = false;
      state.createError = null;

      const existingIndex = state.tasks.findIndex(
        (task) => task.id === action.payload.id
      );

      if (existingIndex === -1) {
        state.tasks.push(action.payload);
      } else {
        state.tasks[existingIndex] = action.payload;
      }
    },

    createTaskFailure(state, action: PayloadAction<string>) {
      state.creating = false;
      state.createError = action.payload;
    },

    clearCreateTaskError(state) {
      state.createError = null;
    },

    // Update task status
    updateTaskStatusStart(state) {
      state.updatingStatus = true;
      state.updateStatusError = null;
    },

    updateTaskStatusSuccess(
      state,
      action: PayloadAction<{
        taskId: number;
        status: number;
        task?: Task;
      }>
    ) {
      state.updatingStatus = false;
      state.updateStatusError = null;

      const taskIndex = state.tasks.findIndex(
        (item) => item.id === action.payload.taskId
      );

      if (taskIndex !== -1) {
        if (action.payload.task) {
          state.tasks[taskIndex] = {
            ...state.tasks[taskIndex],
            ...action.payload.task,
          };
        } else {
          state.tasks[taskIndex].status = action.payload.status;
        }
      }
    },

    updateTaskStatusFailure(state, action: PayloadAction<string>) {
      state.updatingStatus = false;
      state.updateStatusError = action.payload;
    },

    clearUpdateTaskStatusError(state) {
      state.updateStatusError = null;
    },

    // Edit task
    updateTaskStart(state) {
      state.updating = true;
      state.updateError = null;
    },

    updateTaskSuccess(state, action: PayloadAction<Task>) {
      state.updating = false;
      state.updateError = null;

      const taskIndex = state.tasks.findIndex(
        (task) => task.id === action.payload.id
      );

      if (taskIndex !== -1) {
        state.tasks[taskIndex] = {
          ...state.tasks[taskIndex],
          ...action.payload,
        };
      }
    },

    updateTaskFailure(state, action: PayloadAction<string>) {
      state.updating = false;
      state.updateError = action.payload;
    },

    clearUpdateTaskError(state) {
      state.updateError = null;
    },

    // Reset task state
    resetTaskState(state) {
      state.tasks = [];

      state.loading = false;
      state.error = null;

      state.creating = false;
      state.createError = null;

      state.updatingStatus = false;
      state.updateStatusError = null;

      state.updating = false;
      state.updateError = null;
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

  updateTaskStatusStart,
  updateTaskStatusSuccess,
  updateTaskStatusFailure,
  clearUpdateTaskStatusError,

  updateTaskStart,
  updateTaskSuccess,
  updateTaskFailure,
  clearUpdateTaskError,

  resetTaskState,
} = taskSlice.actions;

// ========================================
// Export Reducer
// ========================================

export default taskSlice.reducer;

// ========================================
// Fetch Tasks By Project
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

      const result = await response.json().catch(() => ({}));

      if (
        !response.ok ||
        !result.success ||
        !Array.isArray(result.data)
      ) {
        const message = result.message || 'Failed to fetch tasks.';

        dispatch(fetchTasksFailure(message));
        return { success: false, message };
      }

      dispatch(fetchTasksSuccess(result.data as Task[]));

      return {
        success: true,
        message: result.message || 'Tasks fetched successfully.',
        data: result.data as Task[],
      };
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : 'Unknown error';

      dispatch(fetchTasksFailure(message));
      return { success: false, message };
    }
  };

// ========================================
// Fetch Tasks Across Projects
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

      const uniqueProjectIds = Array.from(
        new Set(
          projectIds.filter(
            (id) => Number.isInteger(id) && id > 0
          )
        )
      );

      if (uniqueProjectIds.length === 0) {
        dispatch(fetchTasksSuccess([]));

        return {
          success: true,
          message: 'No projects are available.',
          data: [],
        };
      }

      const responses = await Promise.all(
        uniqueProjectIds.map(async (projectId) => {
          const response = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL}/api/tasks/projects/${projectId}/tasks`,
            {
              method: 'GET',
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }
          );

          const result = await response.json().catch(() => ({}));

          if (
            !response.ok ||
            !result.success ||
            !Array.isArray(result.data)
          ) {
            throw new Error(
              result.message ||
                `Failed to fetch tasks for project ${projectId}.`
            );
          }

          return result.data as Task[];
        })
      );

      // Remove duplicate tasks in case API responses overlap.
      const taskMap = new Map<number, Task>();

      responses.flat().forEach((task) => {
        taskMap.set(task.id, task);
      });

      const tasks = Array.from(taskMap.values());

      dispatch(fetchTasksSuccess(tasks));

      return {
        success: true,
        message: 'Tasks fetched successfully.',
        data: tasks,
      };
    } catch (error: unknown) {
      const message =
        error instanceof Error
          ? error.message
          : 'Unable to fetch tasks.';

      dispatch(fetchTasksFailure(message));
      return { success: false, message };
    }
  };

// ========================================
// Create Task
// POST /api/tasks/create-task
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
        const message = 'Please select a project.';

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
              taskData.assignee_id == null
                ? null
                : Number(taskData.assignee_id),
            due_date: taskData.due_date,
            priority: Number(taskData.priority),
            status: Number(taskData.status),
          }),
        }
      );

      const result = await response.json().catch(() => ({}));

      if (!response.ok || !result.success || !result.data) {
        const message = result.message || 'Failed to create task.';

        dispatch(createTaskFailure(message));
        return { success: false, message };
      }

      dispatch(createTaskSuccess(result.data as Task));

      return {
        success: true,
        message: result.message || 'Task created successfully.',
        data: result.data as Task,
      };
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : 'Unknown error';

      dispatch(createTaskFailure(message));
      return { success: false, message };
    }
  };

// ========================================
// Update Task Status
// PATCH /api/tasks/:taskId/status
// ========================================

export const updateTaskStatus =
  (taskId: number, newStatus: number) =>
  async (dispatch: AppDispatch, getState: () => RootState) => {
    dispatch(updateTaskStatusStart());

    try {
      const token = getState().auth.token;

      if (!token) {
        const message = 'Please sign in again before updating a task.';

        dispatch(updateTaskStatusFailure(message));
        return { success: false, message };
      }

      if (!Number.isInteger(taskId) || taskId <= 0) {
        const message = 'Invalid task ID.';

        dispatch(updateTaskStatusFailure(message));
        return { success: false, message };
      }

      if (
        !Number.isInteger(newStatus) ||
        newStatus < 0 ||
        newStatus > 7
      ) {
        const message = 'Invalid task status.';

        dispatch(updateTaskStatusFailure(message));
        return { success: false, message };
      }

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/tasks/${taskId}/status`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            status: newStatus,
          }),
        }
      );

      const result = await response.json().catch(() => ({}));

      if (!response.ok || !result.success) {
        const message =
          result.message || 'Failed to update task status.';

        dispatch(updateTaskStatusFailure(message));
        return { success: false, message };
      }

      dispatch(
        updateTaskStatusSuccess({
          taskId,
          status: newStatus,
          task: result.data?.id ? (result.data as Task) : undefined,
        })
      );

      return {
        success: true,
        message: result.message || 'Task status updated successfully.',
      };
    } catch (error: unknown) {
      const message =
        error instanceof Error
          ? error.message
          : 'Unable to update task status.';

      dispatch(updateTaskStatusFailure(message));
      return { success: false, message };
    }
  };

// ========================================
// Update Task
// PATCH /api/tasks/:taskId
// ========================================

export const updateTask =
  (taskData: UpdateTaskPayload) =>
  async (dispatch: AppDispatch, getState: () => RootState) => {
    dispatch(updateTaskStart());

    try {
      const token = getState().auth.token;

      if (!token) {
        const message = 'Please sign in again before updating a task.';

        dispatch(updateTaskFailure(message));
        return { success: false, message };
      }

      if (!Number.isInteger(taskData.taskId) || taskData.taskId <= 0) {
        const message = 'Invalid task ID.';

        dispatch(updateTaskFailure(message));
        return { success: false, message };
      }

      if (!taskData.name?.trim()) {
        const message = 'Please enter a task name.';

        dispatch(updateTaskFailure(message));
        return { success: false, message };
      }

      if (!taskData.due_date) {
        const message = 'Please specify a due date.';

        dispatch(updateTaskFailure(message));
        return { success: false, message };
      }

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/tasks/${taskData.taskId}`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            name: taskData.name.trim(),
            description: taskData.description?.trim() ?? '',
            assignee_id:
              taskData.assignee_id == null
                ? null
                : Number(taskData.assignee_id),
            due_date: taskData.due_date,
            priority: Number(taskData.priority),
          }),
        }
      );

      const result = await response.json().catch(() => ({}));

      if (!response.ok || !result.success || !result.data) {
        const message = result.message || 'Failed to update task.';

        dispatch(updateTaskFailure(message));
        return { success: false, message };
      }

      dispatch(updateTaskSuccess(result.data as Task));

      return {
        success: true,
        message: result.message || 'Task updated successfully.',
        data: result.data as Task,
      };
    } catch (error: unknown) {
      const message =
        error instanceof Error
          ? error.message
          : 'Unable to update task.';

      dispatch(updateTaskFailure(message));
      return { success: false, message };
    }
  };
