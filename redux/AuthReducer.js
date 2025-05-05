import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  token: null,
  userId: null,
  userRole: null, // 'user' or 'admin'
  isAuthenticated: false,
  isLoading: true, // Start loading initially to check async storage
};

export const AuthSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    // Action to set authentication state, usually after login or initial check
    setAuthState: (state, action) => {
      const { token, userId, userRole } = action.payload;
      state.token = token;
      state.userId = userId;
      state.userRole = userRole;
      state.isAuthenticated = !!token; // True only if token exists
      state.isLoading = false; // Finished loading/checking
    },
    // Action to clear authentication state on logout
    logout: (state) => {
      state.token = null;
      state.userId = null;
      state.userRole = null;
      state.isAuthenticated = false;
      state.isLoading = false;
    },
    // Action to explicitly set loading state (e.g., during initial check)
    setLoading: (state, action) => {
      state.isLoading = action.payload;
    },
  },
});

// Export actions
export const { setAuthState, logout, setLoading } = AuthSlice.actions;

// Export reducer
export default AuthSlice.reducer;
