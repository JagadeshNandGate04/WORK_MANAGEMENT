
 // store/member/memberSlice.tsx

import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { AppDispatch, RootState } from '../store';

// ========================================
// Member Interfaces
// ========================================

export interface Member {
  id: number;
  name: string;
  email: string;
  workspace_id?: number;
  role: string;
  status?: string;
  joined_at?: string;
}

export interface CreateMemberPayload {
  name: string;
  email: string;
  password: string;
  role?: string;
}

export interface CreateMemberResponse {
  success: boolean;
  message: string;
  data: Member;
}

export interface FetchMembersResponse {
  success: boolean;
  message: string;
  data: Member[];
}

// ========================================
// Member State Interface
// ========================================

interface MemberState {
  members: Member[];

  // Create member loading/error
  creating: boolean;
  createError: string | null;

  // Fetch members loading/error
  fetching: boolean;
  fetchError: string | null;
}

// ========================================
// Initial State
// ========================================

const initialState: MemberState = {
  members: [],

  creating: false,
  createError: null,

  fetching: false,
  fetchError: null,
};

// ========================================
// Member Slice
// ========================================

const memberSlice = createSlice({
  name: 'member',
  initialState,

  reducers: {
    // ------------------------------------
    // Create Member Start
    // ------------------------------------

    createMemberStart(state) {
      state.creating = true;
      state.createError = null;
    },

    // ------------------------------------
    // Create Member Success
    // ------------------------------------

    createMemberSuccess(
      state,
      action: PayloadAction<Member>
    ) {
      state.creating = false;
      state.createError = null;
      state.members = [...state.members, action.payload];
    },

    // ------------------------------------
    // Create Member Failure
    // ------------------------------------

    createMemberFailure(
      state,
      action: PayloadAction<string>
    ) {
      state.creating = false;
      state.createError = action.payload;
    },

    // ------------------------------------
    // Clear Create Error
    // ------------------------------------

    clearCreateMemberError(state) {
      state.createError = null;
    },

    // ------------------------------------
    // Set Members (bulk replace)
    // ------------------------------------

    setMembers(
      state,
      action: PayloadAction<Member[]>
    ) {
      state.members = action.payload;
    },

    // ------------------------------------
    // Reset Member State
    // ------------------------------------

    resetMemberState(state) {
      state.members = [];
      state.creating = false;
      state.createError = null;
      state.fetching = false;
      state.fetchError = null;
    },

    // ------------------------------------
    // Fetch Members Start
    // ------------------------------------

    fetchMembersStart(state) {
      state.fetching = true;
      state.fetchError = null;
    },

    // ------------------------------------
    // Fetch Members Success
    // ------------------------------------

    fetchMembersSuccess(
      state,
      action: PayloadAction<Member[]>
    ) {
      state.fetching = false;
      state.fetchError = null;
      state.members = action.payload;
    },

    // ------------------------------------
    // Fetch Members Failure
    // ------------------------------------

    fetchMembersFailure(
      state,
      action: PayloadAction<string>
    ) {
      state.fetching = false;
      state.fetchError = action.payload;
    },

    // ------------------------------------
    // Clear Fetch Members Error
    // ------------------------------------

    clearFetchMembersError(state) {
      state.fetchError = null;
    },
  },
});

// ========================================
// Export Actions
// ========================================

export const {
  createMemberStart,
  createMemberSuccess,
  createMemberFailure,
  clearCreateMemberError,
  setMembers,
  resetMemberState,

  fetchMembersStart,
  fetchMembersSuccess,
  fetchMembersFailure,
  clearFetchMembersError,
} = memberSlice.actions;

// ========================================
// Export Reducer
// ========================================

export default memberSlice.reducer;

// ========================================
// Create Workspace Member Thunk
// ========================================

export const createWorkspaceMember =
  (memberData: CreateMemberPayload) =>
  async (
    dispatch: AppDispatch,
    getState: () => RootState
  ) => {
    dispatch(createMemberStart());

    try {
      const token = getState().auth.token;

      if (!token) {
        const message =
          'Please sign in again before creating a member.';

        dispatch(createMemberFailure(message));

        return { success: false, message };
      }

      const workspaceId =
        getState().auth.workspace?.id ??
        getState().dashboard.data?.workspace?.id;

      if (!workspaceId) {
        const message = 'No active workspace found.';

        dispatch(createMemberFailure(message));

        return { success: false, message };
      }

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/workspaces/${workspaceId}/members`,
        {
          method: 'POST',

          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },

          body: JSON.stringify({
            name: memberData.name,
            email: memberData.email,
            password: memberData.password,
            role: memberData.role ?? 'MEMBER',
          }),
        }
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        const message =
          result.message || 'Failed to create member';

        dispatch(createMemberFailure(message));

        return {
          success: false,
          message,
        };
      }

      // Member created successfully

      dispatch(createMemberSuccess(result.data as Member));

      return {
        success: true,
        message:
          result.message ||
          'Workspace member created successfully',
        data: result.data as Member,
      };
    } catch (error: unknown) {
      const message =
        error instanceof Error
          ? error.message
          : 'Unknown error';

      dispatch(createMemberFailure(message));

      return {
        success: false,
        message,
      };
    }
  };

// ========================================
// Fetch Workspace Members Thunk
// ========================================

export const fetchWorkspaceMembers =
  (workspaceId?: number) =>
  async (
    dispatch: AppDispatch,
    getState: () => RootState
  ) => {
    dispatch(fetchMembersStart());

    try {
      const state = getState();
      const token = state.auth.token;

      // Check JWT token
      if (!token) {
        const message = 'Please sign in again.';

        dispatch(fetchMembersFailure(message));

        return {
          success: false,
          message,
        };
      }

      // Get the workspace ID
      const activeWorkspaceId =
        workspaceId ??
        state.auth.workspace?.id ??
        state.dashboard.data?.workspace?.id;

      if (!activeWorkspaceId) {
        const message = 'No active workspace found.';

        dispatch(fetchMembersFailure(message));

        return {
          success: false,
          message,
        };
      }

      // GET workspace members API
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/workspaces/${activeWorkspaceId}/members`,
        {
          method: 'GET',

          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const result: FetchMembersResponse =
        await response.json();

      if (!response.ok || !result.success) {
        const message =
          result.message ||
          'Failed to fetch workspace members';

        dispatch(fetchMembersFailure(message));

        return {
          success: false,
          message,
        };
      }

      // Store fetched members in Redux
      dispatch(fetchMembersSuccess(result.data));

      return {
        success: true,
        message: result.message,
        data: result.data,
      };
    } catch (error: unknown) {
      const message =
        error instanceof Error
          ? error.message
          : 'Unknown error';

      dispatch(fetchMembersFailure(message));

      return {
        success: false,
        message,
      };
    }
  };