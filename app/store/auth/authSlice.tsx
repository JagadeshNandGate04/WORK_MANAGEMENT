import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { AppDispatch, RootState } from '../store';


// ========================================
// User Interface
// ========================================

interface User {
  id: number;
  email: string;
  name: string;
  role?: string;
  designation?: string | null;
}

interface Workspace {
  id: number;
  name: string;
  role?: string;
}

interface LoginProject {
  id: number;
  name: string;
  description: string;
  workspace_id: number;
  created_by: number;
  created_at: string;
  updated_at: string;
  role?: string;
  members?: Array<{ id: number; name: string }>;
}


// ========================================
// Auth State Interface
// ========================================

interface AuthState {
  user: User | null;
  token: string | null;
  workspace: Workspace | null;
  workspaces: Workspace[];
  projects: LoginProject[];

  // Login loading/error
  loading: boolean;
  error: string | null;

  // Signup loading/error
  signupLoading: boolean;
  signupError: string | null;

  // Change password loading/error
  passwordChanging: boolean;
  passwordError: string | null;
}


// ========================================
// Initial State
// ========================================

const initialState: AuthState = {
  user: null,
  token: null,
  workspace: null,
  workspaces: [],
  projects: [],

  loading: false,
  error: null,
  signupLoading: false,
  signupError: null,

  passwordChanging: false,
  passwordError: null,
};


// ========================================
// Auth Slice
// ========================================

const authSlice = createSlice({
  name: 'auth',
  initialState,

  reducers: {
    // ------------------------------------
    // Login Start
    // ------------------------------------

    loginStart(state) {
      state.loading = true;
      state.error = null;
    },


    // ------------------------------------
    // Set User Details After Login
    // ------------------------------------

    setUserDetails(
      state,
      action: PayloadAction<{
        user: User;
        token: string;
        workspace?: Workspace | null;
        workspaces?: Workspace[];
        projects?: LoginProject[];
      }>
    ) {
      state.loading = false;
      state.user = action.payload.user;
      state.token = action.payload.token;
      state.workspace = action.payload.workspace ?? null;
      state.workspaces = action.payload.workspaces ?? [];
      state.projects = action.payload.projects ?? [];
      state.error = null;
    },

    restoreSession(
      state,
      action: PayloadAction<{
        user: User;
        token: string;
        workspace?: Workspace | null;
        workspaces?: Workspace[];
        projects?: LoginProject[];
      }>
    ) {
      state.user = action.payload.user;
      state.token = action.payload.token;
      state.workspace = action.payload.workspace ?? null;
      state.workspaces = action.payload.workspaces ?? [];
      state.projects = action.payload.projects ?? [];
      state.loading = false;
      state.error = null;
    },


    // ------------------------------------
    // Set Token
    // ------------------------------------

    setToken(state, action: PayloadAction<string>) {
      state.token = action.payload;
    },


    // ------------------------------------
    // Set User Data
    // ------------------------------------

    setUserData(state, action: PayloadAction<User>) {
      state.user = action.payload;
    },


    // ------------------------------------
    // Login Failure
    // ------------------------------------

    loginFailure(state, action: PayloadAction<string>) {
      state.loading = false;
      state.error = action.payload;
    },

    signupStart(state) {
      state.signupLoading = true;
      state.signupError = null;
    },

    signupSuccess(
      state,
      action: PayloadAction<{ user: User; token: string; workspace: Workspace }>
    ) {
      state.signupLoading = false;
      state.signupError = null;
      state.user = action.payload.user;
      state.token = action.payload.token;
      state.workspace = action.payload.workspace;
      state.error = null;
    },

    signupFailure(state, action: PayloadAction<string>) {
      state.signupLoading = false;
      state.signupError = action.payload;
    },


    // ------------------------------------
    // Change Password Start
    // ------------------------------------

    changePasswordStart(state) {
      state.passwordChanging = true;
      state.passwordError = null;
    },


    // ------------------------------------
    // Change Password Success
    // ------------------------------------

    changePasswordSuccess(state) {
      state.passwordChanging = false;
      state.passwordError = null;
    },


    // ------------------------------------
    // Change Password Failure
    // ------------------------------------

    changePasswordFailure(
      state,
      action: PayloadAction<string>
    ) {
      state.passwordChanging = false;
      state.passwordError = action.payload;
    },


    // ------------------------------------
    // Clear Password Error
    // ------------------------------------

    clearPasswordError(state) {
      state.passwordError = null;
    },


    // ------------------------------------
    // Logout
    // ------------------------------------

    logout(state) {
      state.user = null;
      state.token = null;
      state.workspace = null;
      state.workspaces = [];
      state.projects = [];

      state.error = null;
      state.loading = false;
      state.signupLoading = false;
      state.signupError = null;

      state.passwordChanging = false;
      state.passwordError = null;
    },
  },
});


// ========================================
// Export Actions
// ========================================

export const {
  loginStart,
  setUserDetails,
  restoreSession,
  loginFailure,
  signupStart,
  signupSuccess,
  signupFailure,

  setToken,
  setUserData,

  changePasswordStart,
  changePasswordSuccess,
  changePasswordFailure,
  clearPasswordError,

  logout,
} = authSlice.actions;


// ========================================
// Export Reducer
// ========================================

export default authSlice.reducer;


// ========================================
// Signup Thunk
// ========================================

export const signupUser =
  (signupData: {
    name: string;
    email: string;
    password: string;
    workspace_name?: string;
    invite_token?: string;
  }) =>
  async (dispatch: AppDispatch) => {
    dispatch(signupStart());

    try {
      const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
      const response = await fetch(`${apiBaseUrl}/api/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(signupData),
      });
      const result = await response.json().catch(() => ({}));

      if (!response.ok || !result.success || !result.data?.token || !result.data?.user) {
        const message = result.message || 'Signup failed. Please try again.';
        dispatch(signupFailure(message));
        return { success: false, message };
      }

      const { token, user, workspace } = result.data as {
        token: string;
        user: User;
        workspace: Workspace;
      };

      dispatch(signupSuccess({ user, token, workspace }));
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(
          'work-management-auth',
          JSON.stringify({ token, user, workspace })
        );
      }

      return {
        success: true,
        message: result.message || 'Signup successful',
        payload: { token, user, workspace },
      };
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Signup failed. Please try again.';
      dispatch(signupFailure(message));
      return { success: false, message };
    }
  };


// ========================================
// Login Thunk
// ========================================

export const loginUser =
  (loginData: { email: string; password: string }) =>
  async (dispatch: AppDispatch) => {
    dispatch(loginStart());

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/auth/login`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(loginData),
        }
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        const message = result.message || 'Login failed';

        dispatch(loginFailure(message));

        return {
          success: false,
          message,
        };
      }


      // API response:
      //
      // {
      //   success: true,
      //   message: 'Login successful',
      //   data: {
      //     token: '...',
      //     user: {...},
      //     workspace: {...}
      //   }
      // }

      const {
        token,
        user,
        workspace,
        workspaces = [],
        projects = [],
      } = result.data as {
        token: string;
        user: User;
        workspace?: Workspace | null;
        workspaces?: Workspace[];
        projects?: LoginProject[];
      };

      if (typeof window !== 'undefined') {
        window.localStorage.setItem(
          'work-management-auth',
          JSON.stringify({
            token,
            user,
            workspace: workspace ?? null,
            workspaces,
            projects,
          })
        );
      }

      dispatch(
        setUserDetails({
          user,
          token,
          workspace: workspace ?? null,
          workspaces,
          projects,
        })
      );

      return {
        success: true,
        message: result.message,
        payload: result.data,
      };

    } catch (error: unknown) {
      const message =
        error instanceof Error
          ? error.message
          : 'Unknown error';

      dispatch(loginFailure(message));

      return {
        success: false,
        message,
      };
    }
  };


// ========================================
// Change Password Thunk
// ========================================

export const changePassword =
  (passwordData: {
    current_password: string;
    new_password: string;
  }) =>
  async (dispatch: AppDispatch, getState: () => RootState) => {

    dispatch(changePasswordStart());

    try {
      const token = getState().auth.token;
      if (!token) {
        const message = 'Please sign in again before changing your password.';
        dispatch(changePasswordFailure(message));
        return { success: false, message };
      }

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/auth/change-password`,
        {
          method: 'PUT',

          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },

          body: JSON.stringify(passwordData),
        }
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        const message =
          result.message || 'Failed to change password';

        dispatch(changePasswordFailure(message));

        return {
          success: false,
          message,
        };
      }


      // Password changed successfully

      dispatch(changePasswordSuccess());

      return {
        success: true,
        message:
          result.message ||
          'Password changed successfully',
      };

    } catch (error: unknown) {
      const message =
        error instanceof Error
          ? error.message
          : 'Unknown error';

      dispatch(changePasswordFailure(message));

      return {
        success: false,
        message,
      };
    }
  };


// ========================================
// Logout Thunk
// ========================================
//
// No backend logout endpoint yet.
// This only clears the local Redux authentication state.
// ========================================

export const performLogout =
  () => async (dispatch: AppDispatch) => {

    if (typeof window !== 'undefined') {
      window.localStorage.removeItem('work-management-auth');
    }
    dispatch(logout());

    return {
      success: true,
      message: 'Logged out successfully',
    };
  };