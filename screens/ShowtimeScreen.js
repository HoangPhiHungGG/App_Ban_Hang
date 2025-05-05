import React, { useState, useEffect, useCallback } from "react";
import {
  StyleSheet,
  Text,
  View,
  SectionList, // Use SectionList for grouping
  Pressable,
  ActivityIndicator,
  SafeAreaView, // Use SafeAreaView
  Alert,
  Platform, // For Platform specific UI if needed
} from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import api from "../api";
import DateTimePicker from "@react-native-community/datetimepicker"; // Import Date Picker
import { useDispatch } from "react-redux";
import { setCinema, setShowtime, setMovie } from "../redux/BookingReducer"; // Import setMovie
import { Ionicons } from "@expo/vector-icons"; // For icons

const ShowtimeScreen = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const dispatch = useDispatch();
  // Params could include movieId, cinemaId, movieTitle, cinemaName
  const { movieId, movieTitle, cinemaId, cinemaName } = route.params;

  const [groupedShowtimes, setGroupedShowtimes] = useState([]); // Unified state for sections
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedDate, setSelectedDate] = useState(new Date()); // Default to today
  const [showDatePicker, setShowDatePicker] = useState(false);

  // Helper to format date to YYYY-MM-DD for API
  const formatDateForAPI = (date) => {
    return date.toISOString().split("T")[0];
  };

  // Helper to format date for display
  const formatDateForDisplay = (date) => {
    const options = {
      weekday: "short",
      year: "numeric",
      month: "short",
      day: "numeric",
    };
    return date.toLocaleDateString(undefined, options);
  };

  const fetchShowtimes = useCallback(async () => {
    setLoading(true);
    setError(null);
    setGroupedShowtimes([]); // Clear previous data
    try {
      const params = {
        date: formatDateForAPI(selectedDate),
      };
      // Determine the primary filter
      if (movieId) params.movieId = movieId;
      else if (cinemaId) params.cinemaId = cinemaId;
      else {
        // Handle case where neither is provided - should not happen in normal flow
        throw new Error("Movie or Cinema ID is required.");
      }

      console.log("Fetching showtimes with params:", params);
      const response = await api.get("/showtimes", { params });
      console.log("Showtimes received:", response.data.length);

      // Group data based on the *other* entity
      let groupedData = {};
      if (movieId) {
        // If filtering by movie, group by Cinema
        groupedData = response.data.reduce((acc, showtime) => {
          const key = showtime.cinema?._id || "unknown_cinema";
          if (!acc[key]) {
            acc[key] = {
              title: showtime.cinema?.name || "Unknown Cinema",
              groupData: showtime.cinema, // Store cinema data
              data: [], // Array of showtimes for this cinema
            };
          }
          acc[key].data.push(showtime);
          return acc;
        }, {});
      } else {
        // If filtering by cinema, group by Movie
        groupedData = response.data.reduce((acc, showtime) => {
          const key = showtime.movie?._id || "unknown_movie";
          if (!acc[key]) {
            acc[key] = {
              title: showtime.movie?.title || "Unknown Movie",
              groupData: showtime.movie, // Store movie data
              data: [], // Array of showtimes for this movie
            };
          }
          acc[key].data.push(showtime);
          return acc;
        }, {});
      }
      // Convert grouped object to array suitable for SectionList
      setGroupedShowtimes(
        Object.values(groupedData).sort((a, b) =>
          a.title.localeCompare(b.title)
        )
      ); // Sort sections alphabetically
    } catch (err) {
      console.error(
        "Error fetching showtimes:",
        err.response?.data || err.message
      );
      setError(err.message || "Failed to load showtimes. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [movieId, cinemaId, selectedDate]);

  useEffect(() => {
    fetchShowtimes();
    // Dynamically set header title based on context
    navigation.setOptions({
      title: movieTitle || cinemaName || "Select Showtime",
    });
  }, [fetchShowtimes, navigation, movieTitle, cinemaName]);

  const handleShowtimePress = (showtime, groupData) => {
    // Dispatch actions based on grouping context
    if (movieId) {
      // Grouped by Cinema
      dispatch(setCinema(groupData)); // groupData is cinema object
      // Movie should already be in Redux state from MovieDetailScreen
    } else {
      // Grouped by Movie
      dispatch(setMovie(groupData)); // groupData is movie object
      // Cinema should already be in Redux state from CinemaListScreen
    }
    dispatch(setShowtime(showtime)); // Set the selected showtime

    // Navigate to Seat Selection
    navigation.navigate("SeatSelection", { showtimeId: showtime._id });
  };

  // --- Date Picker Logic ---
  const onDateChange = (event, newDate) => {
    setShowDatePicker(false); // Always hide picker after selection/cancel
    if (event.type === "set" && newDate) {
      // Check if a date was selected
      // Prevent selecting dates far in the past/future if needed
      setSelectedDate(newDate);
      // fetchShowtimes will be triggered automatically by the useEffect dependency
    }
  };

  const showMode = (currentMode) => {
    setShowDatePicker(true);
  };

  const showDatepicker = () => {
    showMode("date");
  };

  // --- Render Items ---
  const renderShowtimeItem = ({ item, section }) => {
    // item is a showtime
    const time = new Date(item.startTime).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
    // Pass the groupData (Cinema or Movie object) to the press handler
    return (
      <Pressable
        style={styles.timeButton}
        onPress={() => handleShowtimePress(item, section.groupData)}
      >
        <Text style={styles.timeText}>{time}</Text>
        <Text style={styles.screenText}>{item.screenName}</Text>
        <Text style={styles.priceText}>${item.pricePerSeat.toFixed(2)}</Text>
      </Pressable>
    );
  };

  const renderSectionHeader = ({ section: { title } }) => (
    // Make section header pressable if needed (e.g., navigate to Cinema/Movie detail)
    <View style={styles.sectionHeaderContainer}>
      <Text style={styles.sectionHeader}>{title}</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Date Selection Header */}
      <View style={styles.dateHeader}>
        <Pressable onPress={showDatepicker} style={styles.datePickerButton}>
          <Ionicons name="calendar-outline" size={20} color="#007AFF" />
          <Text style={styles.dateText}>
            {formatDateForDisplay(selectedDate)}
          </Text>
          <Ionicons name="chevron-down-outline" size={20} color="#007AFF" />
        </Pressable>
      </View>

      {/* Conditionally render DateTimePicker */}
      {showDatePicker && (
        <DateTimePicker
          testID="dateTimePicker"
          value={selectedDate}
          mode="date"
          display={Platform.OS === "ios" ? "spinner" : "default"} // Use spinner on iOS for better inline feel
          onChange={onDateChange}
          minimumDate={new Date()} // Prevent selecting past dates
          // maximumDate={...} // Optionally set a max date (e.g., 2 weeks out)
        />
      )}

      {/* Main Content */}
      {loading ? (
        <ActivityIndicator size="large" color="#00CED1" style={styles.loader} />
      ) : error ? (
        <View style={styles.centered}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : (
        <SectionList
          sections={groupedShowtimes}
          keyExtractor={(item, index) => item._id + index} // Unique key for each showtime item
          renderItem={renderShowtimeItem}
          renderSectionHeader={renderSectionHeader}
          stickySectionHeadersEnabled={false}
          contentContainerStyle={styles.listPadding}
          ListEmptyComponent={
            <View style={styles.centered}>
              <Text style={styles.emptyText}>
                No showtimes available for the selected date.
              </Text>
            </View>
          }
          ItemSeparatorComponent={() => <View style={styles.separator} />} // Add separator between items in a section
        />
      )}
    </SafeAreaView>
  );
};

export default ShowtimeScreen;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#f8f9fa", // Light background
  },
  dateHeader: {
    paddingVertical: 12,
    paddingHorizontal: 15,
    backgroundColor: "white",
    alignItems: "center", // Center button
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  datePickerButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 20,
    backgroundColor: "#eef", // Light blue background for button
  },
  dateText: {
    fontSize: 16,
    fontWeight: "500",
    color: "#007AFF",
    marginHorizontal: 8,
  },
  loader: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: "red",
    textAlign: "center",
  },
  listPadding: {
    paddingBottom: 20,
  },
  sectionHeaderContainer: {
    backgroundColor: "#e9ecef", // Slightly darker grey for section header
    paddingVertical: 10,
    paddingHorizontal: 15,
    marginTop: 10, // Space above each section
    borderTopWidth: 1, // Optional top border
    borderTopColor: "#ddd",
    borderBottomWidth: 1,
    borderBottomColor: "#ddd",
  },
  sectionHeader: {
    fontSize: 17, // Slightly larger section title
    fontWeight: "600", // Bolder section title
    color: "#495057", // Dark grey text
  },
  timeButton: {
    backgroundColor: "white",
    paddingVertical: 14, // More vertical padding
    paddingHorizontal: 15,
    marginHorizontal: 15, // Add horizontal margin
    // marginVertical: 0, // Remove vertical margin if using separator
    // borderRadius: 5, // Removed for cleaner look with separator
    // borderWidth: 1, // Remove border if using separator
    // borderColor: '#ddd', // Remove border
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  separator: {
    height: 1,
    backgroundColor: "#f0f0f0", // Light separator color
    marginLeft: 15, // Align with content padding
  },
  timeText: {
    fontSize: 15,
    fontWeight: "bold",
    color: "#333",
    minWidth: 80, // Ensure time aligns somewhat
    textAlign: "left",
  },
  screenText: {
    fontSize: 14,
    color: "gray",
    flex: 1, // Allow screen name to take space
    textAlign: "center", // Center screen name
    marginHorizontal: 10,
  },
  priceText: {
    fontSize: 15,
    fontWeight: "500",
    color: "#008E97", // Teal color for price
    minWidth: 60, // Ensure price aligns somewhat
    textAlign: "right",
  },
  emptyText: {
    textAlign: "center",
    marginTop: 50,
    fontSize: 16,
    color: "gray",
  },
});
