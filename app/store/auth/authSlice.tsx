import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { AppDispatch } from '../store';


// ========================================
// User Interface
// ========================================

interface User {
  id: number;
  email: string;
  name: string;
  role?: string;
}


// ========================================
// Auth State Interface
// ========================================

interface AuthState {
  user: User | null;
  token: string | null;

  // Login loading/error
  loading: boolean;
  error: string | null;

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

  loading: false,
  error: null,

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
      action: PayloadAction<{ user: User; token: string }>
    ) {
      state.loading = false;
      state.user = action.payload.user;
      state.token = action.payload.token;
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

      state.error = null;
      state.loading = false;

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
  loginFailure,

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
      //     user: {...}
      //   }
      // }

      const { token, user } = result.data;

      dispatch(
        setUserDetails({
          user,
          token,
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
  async (dispatch: AppDispatch) => {

    dispatch(changePasswordStart());

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/auth/change-password`,
        {
          method: 'PUT',

          headers: {
            'Content-Type': 'application/json',

            // Send JWT token
            Authorization: `Bearer ${getTokenFromState(dispatch)}`,
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
// Helper
// ========================================
//
// This will be replaced below with a cleaner
// Redux-state based implementation.
// ========================================

const getTokenFromState = (_dispatch: AppDispatch): string => {
  return '';
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

    dispatch(logout());

    return {
      success: true,
      message: 'Logged out successfully',
    };
  };