import { configureStore } from "@reduxjs/toolkit";
import BookingReducer from "./redux/BookingReducer"; // Đảm bảo export default reducer
import AuthReducer from "./redux/AuthReducer"; // Đảm bảo export default reducer

// Combine reducers
const rootReducer = {
  booking: BookingReducer, // Phải là reducer function
  auth: AuthReducer, // Phải là reducer function
  // Add other reducers here if needed
};

// Configure the Redux store
const store = configureStore({
  reducer: rootReducer,
  // Optional: Add middleware if needed
  // middleware: (getDefaultMiddleware) => getDefaultMiddleware(),
  // devTools: process.env.NODE_ENV !== 'production', // Default is usually fine
});

export default store;
