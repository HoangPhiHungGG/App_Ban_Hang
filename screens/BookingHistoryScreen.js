// --- START OF FILE ./screens/BookingHistoryScreen.js ---

import React, { useState, useEffect, useContext, useCallback } from "react";
import {
  StyleSheet,
  Text,
  View,
  FlatList, // Efficiently renders lists
  ActivityIndicator, // Loading spinner
  SafeAreaView, // Avoids notches and status bars
  RefreshControl, // Enables pull-to-refresh
  Alert, // Shows alerts to the user
  Pressable, // Tappable elements
} from "react-native";
import { useNavigation, useFocusEffect } from "@react-navigation/native"; // Hooks for navigation and screen focus
import api from "../api"; // Centralized Axios instance
import { UserType } from "../UserContext"; // Context to get the logged-in user's ID
import BookingItem from "../components/BookingItem"; // Component to display each booking
import { Ionicons } from "@expo/vector-icons"; // Icons for UI feedback

const BookingHistoryScreen = () => {
  const navigation = useNavigation();
  const { userId } = useContext(UserType); // Get userId from context
  const [bookings, setBookings] = useState([]); // State to hold the list of bookings
  const [loading, setLoading] = useState(true); // State to track loading status
  const [error, setError] = useState(null); // State to store any fetch errors
  const [refreshing, setRefreshing] = useState(false); // State for pull-to-refresh indicator

  // Function to fetch booking history from the API
  const fetchBookings = useCallback(async () => {
    // Prevent fetching if user is not logged in or already refreshing
    if (!userId) {
      setError("Please log in to view your booking history.");
      setLoading(false);
      setRefreshing(false);
      setBookings([]); // Ensure bookings list is empty
      return;
    }
    // Avoid concurrent fetches during refresh
    if (refreshing && loading) return;

    console.log("Fetching booking history for user:", userId);
    // Set loading/refreshing state only if not already refreshing
    if (!refreshing) setLoading(true);
    setError(null); // Clear previous errors

    try {
      // Make API call to the backend endpoint
      const response = await api.get(`/bookings/user/${userId}`);
      // Ensure the response data is an array, default to empty array if not
      setBookings(response.data || []);
    } catch (err) {
      console.error(
        "Error fetching booking history:",
        err.response?.data || err.message
      );
      setError("Failed to load booking history. Pull down to refresh.");
      setBookings([]); // Clear bookings on error
      // Handle specific errors, e.g., unauthorized access (token expired)
      if (err.response?.status === 401 || err.response?.status === 403) {
        Alert.alert("Session Expired", "Please log in again.", [
          { text: "OK", onPress: () => navigation.navigate("Login") },
        ]);
      }
    } finally {
      // Always turn off loading/refreshing indicators
      setLoading(false);
      setRefreshing(false);
    }
  }, [userId, refreshing, navigation]); // Dependencies for the fetch function

  // Fetch bookings when the screen comes into focus or userId changes
  useFocusEffect(
    useCallback(() => {
      fetchBookings();
    }, [fetchBookings]) // Rerun effect if fetchBookings function identity changes
  );

  // Handler for pull-to-refresh action
  const onRefresh = useCallback(() => {
    setRefreshing(true); // Set refreshing state to true
    fetchBookings(); // Manually trigger fetch (useEffect won't re-trigger immediately)
  }, [fetchBookings]); // Dependency on fetchBookings

  // Handler when a booking item is pressed
  const handleBookingPress = (booking) => {
    if (!booking || !booking._id) return; // Basic check
    console.log("Navigating to details for booking:", booking.bookingId);
    // Navigate to the Booking Confirmation screen to show full details and QR code
    navigation.navigate("BookingConfirmation", { bookingDetails: booking });
  };

  // --- Render different states (Loading, Error, Empty, List) ---
  const renderContent = () => {
    // Show loading indicator only on initial load when bookings array is empty
    if (loading && !refreshing && bookings.length === 0) {
      return (
        <ActivityIndicator size="large" color="#00CED1" style={styles.loader} />
      );
    }

    // Show error message if an error occurred and no bookings are loaded
    if (error && bookings.length === 0) {
      return (
        <View style={styles.centered}>
          <Ionicons
            name="cloud-offline-outline"
            size={50}
            color="#dc3545"
            style={{ marginBottom: 10 }}
          />
          <Text style={styles.errorText}>{error}</Text>
          {/* Allow user to retry fetching */}
          <Pressable onPress={fetchBookings} style={styles.retryButton}>
            <Text style={styles.retryText}>Retry</Text>
          </Pressable>
          {/* Offer login if the error suggests it */}
          {error.includes("log in") && (
            <Pressable
              style={[
                styles.retryButton,
                { marginTop: 10, backgroundColor: "#007bff" },
              ]}
              onPress={() => navigation.navigate("Login")}
            >
              <Text style={styles.retryText}>Go to Login</Text>
            </Pressable>
          )}
        </View>
      );
    }

    // Show message if the list is empty (and not loading/error)
    if (!loading && bookings.length === 0) {
      return (
        <View style={styles.centered}>
          <Ionicons
            name="receipt-outline"
            size={60}
            color="lightgrey"
            style={{ marginBottom: 15 }}
          />
          <Text style={styles.emptyText}>
            You have no past or upcoming bookings.
          </Text>
          {/* Button to encourage browsing movies */}
          <Pressable
            onPress={() => navigation.navigate("HomeNav")}
            style={styles.browseButton}
          >
            <Text style={styles.browseButtonText}>Find Movies</Text>
          </Pressable>
        </View>
      );
    }

    // Render the list of bookings using FlatList
    return (
      <FlatList
        data={bookings}
        // Use the BookingItem component to render each item
        renderItem={({ item }) => (
          <BookingItem item={item} onPress={handleBookingPress} />
        )}
        // Use unique booking ID as the key
        keyExtractor={(item) => item._id?.toString() || item.bookingId} // Fallback to bookingId if _id missing
        // Add padding to the list container
        contentContainerStyle={styles.listContainer}
        // Integrate pull-to-refresh functionality
        refreshControl={
          <RefreshControl
            refreshing={refreshing} // Current refreshing state
            onRefresh={onRefresh} // Function to call on refresh
            colors={["#00CED1", "#00a8b3"]} // Android spinner colors
            tintColor={"#00CED1"} // iOS spinner color
          />
        }
        // Performance optimizations for long lists
        initialNumToRender={10} // Render initial batch size
        maxToRenderPerBatch={10} // How many items to render per batch offscreen
        windowSize={15} // Virtual window size (larger means fewer blank areas during scroll)
      />
    );
  };

  // --- Main Component Return ---
  return (
    // Use SafeAreaView to handle notches and system UI elements
    <SafeAreaView style={styles.safeArea}>{renderContent()}</SafeAreaView>
  );
};

export default BookingHistoryScreen;

// --- Styles ---
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#f8f9fa", // Use a light grey background for the screen
  },
  loader: {
    flex: 1, // Ensure loader takes space for centering
    justifyContent: "center",
    alignItems: "center",
  },
  centered: {
    flex: 1, // Take full available space to center content vertically and horizontally
    justifyContent: "center",
    alignItems: "center",
    padding: 30, // Add padding around the centered content
  },
  errorText: {
    fontSize: 16,
    color: "#dc3545", // Use a standard red color for errors
    textAlign: "center",
    marginBottom: 20, // Space below the error text
  },
  retryButton: {
    backgroundColor: "#008E97", // Use the app's theme color
    paddingVertical: 10,
    paddingHorizontal: 30, // Make button wider
    borderRadius: 25, // Rounded corners
    elevation: 2, // Subtle shadow on Android
  },
  retryText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 15,
  },
  emptyText: {
    textAlign: "center",
    fontSize: 17,
    color: "#6c757d", // Use a muted grey color
    marginBottom: 25,
  },
  browseButton: {
    backgroundColor: "#008E97", // Theme color button
    paddingVertical: 12,
    paddingHorizontal: 35, // Wider button
    borderRadius: 25,
    elevation: 2,
  },
  browseButtonText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 16,
  },
  listContainer: {
    paddingTop: 5, // Add a little space at the top of the list
    paddingBottom: 20, // Space at the bottom of the list
  },
  // Note: Styles for individual booking items are defined within the BookingItem component
});
