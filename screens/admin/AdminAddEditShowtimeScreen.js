import React, { useState, useEffect, useCallback } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TextInput,
  Pressable,
  Alert,
  ActivityIndicator,
  Platform,
  SafeAreaView,
  Button,
  KeyboardAvoidingView, // Import Button
} from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import api from "../../api"; // API instance
import DropDownPicker from "react-native-dropdown-picker";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Ionicons } from "@expo/vector-icons";

const AdminAddEditShowtimeScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const showtimeId = route.params?.showtimeId; // Get showtimeId if editing
  const isEditing = !!showtimeId; // Determine if adding or editing

  const [loading, setLoading] = useState(false);
  const [fetchingData, setFetchingData] = useState(true); // Loading state for initial data fetch

  // --- Form State ---
  const [selectedMovie, setSelectedMovie] = useState(null);
  const [selectedCinema, setSelectedCinema] = useState(null);
  const [screenName, setScreenName] = useState("");
  const [startTime, setStartTime] = useState(new Date()); // Default start time
  const [showStartTimePicker, setShowStartTimePicker] = useState(false);
  const [pricePerSeat, setPricePerSeat] = useState("");

  // --- Dropdown State & Data ---
  const [movieOpen, setMovieOpen] = useState(false);
  const [cinemaOpen, setCinemaOpen] = useState(false);
  const [movieItems, setMovieItems] = useState([]); // { label: 'Movie Title', value: 'movieId' }
  const [cinemaItems, setCinemaItems] = useState([]); // { label: 'Cinema Name', value: 'cinemaId' }

  // --- Fetch Initial Data (Movies, Cinemas, and existing Showtime if editing) ---
  const fetchData = useCallback(async () => {
    console.log(
      `Fetching data for ${
        isEditing ? "Edit" : "Add"
      } Showtime Screen. ID: ${showtimeId}`
    );
    setFetchingData(true);
    try {
      // Fetch movies and cinemas in parallel
      const [moviesRes, cinemasRes, showtimeRes] = await Promise.all([
        api.get("/movies?status=now_showing"), // Fetch only 'now_showing' movies for new showtimes
        api.get("/cinemas"),
        isEditing ? api.get(`/showtimes/${showtimeId}`) : Promise.resolve(null), // Fetch showtime only if editing
      ]);

      // Prepare movie items for dropdown
      if (moviesRes.data && Array.isArray(moviesRes.data)) {
        setMovieItems(
          moviesRes.data.map((movie) => ({
            label: movie.title,
            value: movie._id,
          }))
        );
      } else {
        setMovieItems([]);
      }

      // Prepare cinema items for dropdown
      if (cinemasRes.data && Array.isArray(cinemasRes.data)) {
        setCinemaItems(
          cinemasRes.data.map((cinema) => ({
            label: cinema.name,
            value: cinema._id,
          }))
        );
      } else {
        setCinemaItems([]);
      }

      // Populate form if editing
      if (isEditing && showtimeRes?.data) {
        const existingShowtime = showtimeRes.data;
        console.log("Editing existing showtime:", existingShowtime);
        setSelectedMovie(existingShowtime.movie?._id || null);
        setSelectedCinema(existingShowtime.cinema?._id || null);
        setScreenName(existingShowtime.screenName || "");
        setStartTime(new Date(existingShowtime.startTime)); // Convert ISO string back to Date object
        setPricePerSeat(existingShowtime.pricePerSeat?.toString() || "");
      } else if (isEditing) {
        throw new Error("Could not fetch showtime details for editing.");
      }
    } catch (error) {
      console.error(
        "Error fetching data for showtime form:",
        error.response?.data || error.message
      );
      Alert.alert(
        "Error",
        "Could not load necessary data. Please go back and try again."
      );
      // navigation.goBack(); // Optionally force back navigation on error
    } finally {
      setFetchingData(false);
    }
  }, [isEditing, showtimeId]);

  useEffect(() => {
    fetchData();
    // Set navigation title based on mode
    navigation.setOptions({
      title: isEditing ? "Edit Showtime" : "Add New Showtime",
    });
  }, [fetchData, navigation, isEditing]); // Run when dependencies change

  // --- Handlers ---
  const onMovieOpen = useCallback(() => setCinemaOpen(false), []);
  const onCinemaOpen = useCallback(() => setMovieOpen(false), []);

  const onStartTimeChange = (event, selectedTime) => {
    if (Platform.OS === "android") setShowStartTimePicker(false);
    if (event.type === "set" && selectedTime) {
      // Combine selected date (from state) with selected time
      const newStartTime = new Date(startTime); // Start with existing date part
      newStartTime.setHours(selectedTime.getHours());
      newStartTime.setMinutes(selectedTime.getMinutes());
      newStartTime.setSeconds(0); // Reset seconds
      newStartTime.setMilliseconds(0);
      setStartTime(newStartTime);
    }
  };
  const showStartTimepicker = () => {
    setShowStartTimePicker(true);
  };

  // --- Form Submission ---
  const handleSubmit = async () => {
    // ** 1. Validation **
    const priceNum = parseFloat(pricePerSeat);
    if (
      !selectedMovie ||
      !selectedCinema ||
      !screenName.trim() ||
      !startTime ||
      !pricePerSeat.trim()
    ) {
      Alert.alert(
        "Missing Information",
        "Please fill in all fields: Movie, Cinema, Screen Name, Start Time, and Price."
      );
      return;
    }
    if (isNaN(priceNum) || priceNum < 0) {
      Alert.alert(
        "Invalid Price",
        "Please enter a valid non-negative price per seat."
      );
      return;
    }
    // Add more validation if needed (e.g., check if start time is in the future)

    setLoading(true);

    // ** 2. Prepare Data **
    const showtimeData = {
      movie: selectedMovie,
      cinema: selectedCinema,
      screenName: screenName.trim(),
      startTime: startTime.toISOString(), // Send ISO string
      pricePerSeat: priceNum,
    };

    // ** 3. API Call (Add or Edit) **
    try {
      let response;
      if (isEditing) {
        console.log(`Updating showtime ${showtimeId} with data:`, showtimeData);
        // Use the admin endpoint for updating
        response = await api.put(
          `/admin/showtimes/${showtimeId}`,
          showtimeData
        );
      } else {
        console.log("Adding new showtime with data:", showtimeData);
        // Use the admin endpoint for creating
        response = await api.post("/admin/showtimes", showtimeData);
      }

      if (response.status === 200 || response.status === 201) {
        Alert.alert(
          "Success",
          `Showtime ${isEditing ? "updated" : "added"} successfully!`
        );
        navigation.goBack(); // Go back to the management list
      } else {
        throw new Error(
          response.data?.message || `Unexpected status code: ${response.status}`
        );
      }
    } catch (error) {
      console.error(
        `Error ${isEditing ? "updating" : "adding"} showtime:`,
        error.response?.data || error.message
      );
      Alert.alert(
        `Error ${isEditing ? "Updating" : "Adding"} Showtime`,
        error.response?.data?.message ||
          "An unknown error occurred. Please check for potential conflicts (e.g., overlapping times) or try again."
      );
    } finally {
      setLoading(false);
    }
  };

  // --- Render Loading State for Initial Data ---
  if (fetchingData) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#008E97" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView
          style={styles.container}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={styles.title}>
            {isEditing ? "Edit Showtime" : "Add New Showtime"}
          </Text>

          {/* Movie Dropdown */}
          <View style={[styles.inputGroup, { zIndex: 5000 }]}>
            <Text style={styles.label}>
              Movie <Text style={styles.required}>*</Text>
            </Text>
            <DropDownPicker
              listMode="MODAL"
              open={movieOpen}
              value={selectedMovie}
              items={movieItems}
              setOpen={setMovieOpen}
              setValue={setSelectedMovie}
              setItems={setMovieItems} // Allow adding new movies? Maybe not needed here.
              placeholder="Select Movie"
              searchable={true}
              searchPlaceholder="Search Movies..."
              containerStyle={styles.dropdownContainer}
              style={styles.dropdown}
              placeholderStyle={styles.placeholderStyles}
              modalTitle="Select Movie"
              zIndex={5000}
              onOpen={onMovieOpen}
              disabled={isEditing} // Prevent changing movie when editing
              disabledStyle={styles.disabledDropdown}
            />
          </View>

          {/* Cinema Dropdown */}
          <View style={[styles.inputGroup, { zIndex: 4000 }]}>
            <Text style={styles.label}>
              Cinema <Text style={styles.required}>*</Text>
            </Text>
            <DropDownPicker
              listMode="MODAL"
              open={cinemaOpen}
              value={selectedCinema}
              items={cinemaItems}
              setOpen={setCinemaOpen}
              setValue={setSelectedCinema}
              setItems={setCinemaItems}
              placeholder="Select Cinema"
              searchable={true}
              searchPlaceholder="Search Cinemas..."
              containerStyle={styles.dropdownContainer}
              style={styles.dropdown}
              placeholderStyle={styles.placeholderStyles}
              modalTitle="Select Cinema"
              zIndex={4000}
              onOpen={onCinemaOpen}
              disabled={isEditing} // Prevent changing cinema when editing
              disabledStyle={styles.disabledDropdown}
            />
          </View>

          {/* Screen Name Input */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>
              Screen Name <Text style={styles.required}>*</Text>
            </Text>
            <TextInput
              style={styles.input}
              value={screenName}
              onChangeText={setScreenName}
              placeholder="e.g., Screen 1, IMAX Hall"
              placeholderTextColor="#aaa"
              autoCapitalize="words"
            />
          </View>

          {/* Start Time Picker */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>
              Start Time <Text style={styles.required}>*</Text>
            </Text>
            {/* Always show date part */}
            <Text style={styles.dateInfo}>
              Date: {startTime.toLocaleDateString()}
            </Text>
            {/* Picker for time */}
            {Platform.OS === "ios" && (
              <DateTimePicker
                value={startTime}
                mode="time" // Select time only
                display="spinner" // Spinner usually better for time
                onChange={onStartTimeChange}
                style={styles.timePickerIOS}
                minuteInterval={5} // Optional: Set interval
              />
            )}
            {Platform.OS === "android" && (
              <Pressable
                onPress={showStartTimepicker}
                style={styles.timeDisplayAndroid}
              >
                <Text style={styles.timeText}>
                  {startTime.toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                    hour12: true,
                  })}
                </Text>
                <Ionicons name="time-outline" size={24} color="#555" />
              </Pressable>
            )}
            {showStartTimePicker && Platform.OS === "android" && (
              <DateTimePicker
                value={startTime}
                mode="time"
                display="default" // Clock or spinner based on device settings
                onChange={onStartTimeChange}
                minuteInterval={5} // Optional: Set interval
              />
            )}
          </View>

          {/* Price Per Seat Input */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>
              Price Per Seat <Text style={styles.required}>*</Text>
            </Text>
            <TextInput
              style={styles.input}
              value={pricePerSeat}
              onChangeText={setPricePerSeat}
              placeholder="e.g., 10.50"
              placeholderTextColor="#aaa"
              keyboardType="numeric"
            />
          </View>

          {/* Submit Button */}
          <Pressable
            style={[
              styles.submitButton,
              loading && styles.submitButtonDisabled,
            ]}
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={styles.submitButtonText}>
                {isEditing ? "Update Showtime" : "Add Showtime"}
              </Text>
            )}
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default AdminAddEditShowtimeScreen;

// --- Styles --- (Similar to AdminAddMovieScreen, adjust as needed)
const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "white" },
  container: { flex: 1 },
  scrollContent: { padding: 20, paddingBottom: 60 },
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 25,
    textAlign: "center",
    color: "#343a40",
  },
  inputGroup: { marginBottom: 22 },
  label: { fontSize: 15, fontWeight: "600", marginBottom: 8, color: "#495057" },
  required: { color: "#dc3545" },
  input: {
    backgroundColor: "#f8f9fa",
    borderWidth: 1,
    borderColor: "#dee2e6",
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: Platform.OS === "ios" ? 14 : 10,
    fontSize: 16,
    color: "#333",
    minHeight: 50,
  },
  dropdownContainer: {},
  dropdown: {
    borderColor: "#dee2e6",
    backgroundColor: "#f8f9fa",
    borderRadius: 8,
    minHeight: 50,
  },
  disabledDropdown: {
    backgroundColor: "#e9ecef", // Style for disabled dropdowns
    opacity: 0.7,
  },
  placeholderStyles: { color: "#aaa", fontSize: 16 },
  dateInfo: { fontSize: 14, color: "grey", marginBottom: 5 }, // Display selected date
  timeDisplayAndroid: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#f8f9fa",
    borderWidth: 1,
    borderColor: "#dee2e6",
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: 12,
    minHeight: 50,
  },
  timeText: { fontSize: 16, color: "#333" },
  timePickerIOS: { height: 150 }, // Adjust height for iOS time picker
  submitButton: {
    backgroundColor: "#007bff",
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 25,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 4,
  },
  submitButtonDisabled: { backgroundColor: "#6c757d", opacity: 0.7 },
  submitButtonText: { color: "white", fontSize: 17, fontWeight: "bold" },
});
