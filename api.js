import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Read the API URL from environment variables (prefixed with EXPO_PUBLIC_)
const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL;

if (!API_BASE_URL) {
  console.error(
    "FATAL ERROR: EXPO_PUBLIC_API_URL is not defined in your .env file."
  );
  // You might want to throw an error or show an alert in a real app
  // For now, we'll let it potentially fail later.
}

console.log("API Base URL:", API_BASE_URL); // Log the URL being used

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000, // Add a timeout (10 seconds)
});

// Request interceptor to add the JWT token to Authorization header
api.interceptors.request.use(
  async (config) => {
    try {
      const token = await AsyncStorage.getItem("authToken");
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
        // console.log("Attaching token to request:", config.url); // Debug log
      }
    } catch (error) {
      console.error("Error getting token from AsyncStorage:", error);
    }
    return config; // Return the config whether token exists or not
  },
  (error) => {
    // Handle request error (e.g., network issue before sending)
    console.error("API Request Error:", error);
    return Promise.reject(error);
  }
);

// Optional: Response interceptor to handle common errors like 401 Unauthorized
api.interceptors.response.use(
  (response) => {
    // Any status code within the range of 2xx causes this function to trigger
    return response;
  },
  async (error) => {
    // Any status codes outside the range of 2xx causes this function to trigger
    const originalRequest = error.config;

    // Check for specific errors like 401 Unauthorized
    if (error.response?.status === 401 && !originalRequest._retry) {
      console.warn(
        "Received 401 Unauthorized. Token might be expired or invalid."
      );
      originalRequest._retry = true; // Mark request as retried to prevent infinite loops

      // Attempt to logout the user or refresh the token (if using refresh tokens)
      try {
        console.log("Removing invalid token and logging out.");
        await AsyncStorage.removeItem("authToken");
        // Here you might dispatch a logout action in Redux or update context
        // And potentially navigate the user to the Login screen forcefully
        // Example: navigationRef.current?.navigate('Login'); // Needs navigationRef setup
        Alert.alert(
          "Session Expired",
          "Your session has ended. Please log in again."
        );
      } catch (logoutError) {
        console.error("Error during automatic logout:", logoutError);
      }
      // Reject the original request promise after handling logout
      return Promise.reject(error);
    }

    // For other errors, just pass them along
    return Promise.reject(error);
  }
);

export default api;
