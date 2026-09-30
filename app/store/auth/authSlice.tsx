
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { AppDispatch } from '../store';

interface User {
  id: number;
  email: string;
  name: string;
  role?: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  loading: boolean;
  error: string | null;
}

const initialState: AuthState = {
  user: null,
  token: null,
  loading: false,
  error: null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,

  reducers: {
    loginStart(state) {
      state.loading = true;
      state.error = null;
    },

    setUserDetails(
      state,
      action: PayloadAction<{ user: User; token: string }>
    ) {
      state.loading = false;
      state.user = action.payload.user;
      state.token = action.payload.token;
      state.error = null;
    },

    setToken(state, action: PayloadAction<string>) {
      state.token = action.payload;
    },

    setUserData(state, action: PayloadAction<User>) {
      state.user = action.payload;
    },

    loginFailure(state, action: PayloadAction<string>) {
      state.loading = false;
      state.error = action.payload;
    },

    logout(state) {
      state.user = null;
      state.token = null;
      state.error = null;
      state.loading = false;
    },
  },
});

export const {
  loginStart,
  setUserDetails,
  loginFailure,
  logout,
  setToken,
  setUserData,
} = authSlice.actions;

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
         'http://localhost:4000/api/auth/login',
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
// Logout Thunk
// ========================================

// No backend logout endpoint yet.
// This only clears the local Redux authentication state.

export const performLogout =
  () => async (dispatch: AppDispatch) => {
    dispatch(logout());

    return {
      success: true,
      message: 'Logged out successfully',
    };
  };

