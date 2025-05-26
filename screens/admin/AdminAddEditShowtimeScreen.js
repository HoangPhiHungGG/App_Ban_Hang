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
  Button, // Import Button for iOS DatePicker Done button
  KeyboardAvoidingView,
} from "react-native";
import {
  useNavigation,
  useRoute,
  useFocusEffect,
} from "@react-navigation/native"; // useFocusEffect for re-fetching lists
import api from "../../api"; // Your API instance
import DropDownPicker from "react-native-dropdown-picker";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Ionicons } from "@expo/vector-icons";

const AdminAddEditShowtimeScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const showtimeId = route.params?.showtimeId; // Get showtimeId if editing
  const isEditing = !!showtimeId; // Determine if adding or editing

  const [loading, setLoading] = useState(false); // Loading state for submit button
  const [loadingInitialData, setLoadingInitialData] = useState(true); // Loading state for fetching initial data
  const [error, setError] = useState(null); // State for storing fetch errors

  // --- Form State ---
  const [selectedMovie, setSelectedMovie] = useState(null);
  const [selectedCinema, setSelectedCinema] = useState(null);
  const [screenName, setScreenName] = useState("");
  const [pricePerSeat, setPricePerSeat] = useState("");

  // State for Date and Time pickers
  const [selectedShowDate, setSelectedShowDate] = useState(new Date()); // Date part of the showtime
  const [selectedShowTime, setSelectedShowTime] = useState(() => {
    // Time part of the showtime
    const defaultTime = new Date();
    defaultTime.setHours(10, 0, 0, 0); // Default to 10:00 AM or a sensible default
    return defaultTime;
  });

  const [showDatePicker, setShowDatePicker] = useState(false); // Controls visibility of Date picker (mainly for Android)
  const [showTimePicker, setShowTimePicker] = useState(false); // Controls visibility of Time picker (mainly for Android)

  // --- Dropdown State & Data ---
  const [movieOpen, setMovieOpen] = useState(false);
  const [cinemaOpen, setCinemaOpen] = useState(false);
  const [movieItems, setMovieItems] = useState([]);
  const [cinemaItems, setCinemaItems] = useState([]);

  // --- Fetch Initial Data (Movies, Cinemas, and existing Showtime if editing) ---
  const fetchInitialData = useCallback(async () => {
    console.log(
      `Fetching initial data for ${
        isEditing ? "Edit" : "Add"
      } Showtime Screen. ID: ${showtimeId}`
    );
    setLoadingInitialData(true);
    setError(null);
    try {
      const [moviesRes, cinemasRes, showtimeRes] = await Promise.all([
        api.get("/movies?status=now_showing"), // Fetch only 'now_showing' or relevant movies
        api.get("/cinemas"),
        isEditing ? api.get(`/showtimes/${showtimeId}`) : Promise.resolve(null),
      ]);

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

      if (isEditing && showtimeRes?.data) {
        const st = showtimeRes.data;
        setSelectedMovie(st.movie?._id || st.movie || null); // Handle if movie is populated object or just ID
        setSelectedCinema(st.cinema?._id || st.cinema || null);
        setScreenName(st.screenName || "");
        const existingStartTime = new Date(st.startTime);
        setSelectedShowDate(existingStartTime); // Set date from existing showtime
        setSelectedShowTime(existingStartTime); // Set time from existing showtime
        setPricePerSeat(st.pricePerSeat?.toString() || "");
      } else if (isEditing) {
        throw new Error("Could not fetch showtime details for editing.");
      } else if (!isEditing) {
        // Reset form for Add mode
        const defaultDate = new Date();
        defaultDate.setDate(defaultDate.getDate() + 1); // Default to tomorrow
        const defaultTime = new Date();
        defaultTime.setHours(10, 0, 0, 0); // Default 10:00 AM

        setSelectedShowDate(defaultDate);
        setSelectedShowTime(defaultTime);
        setScreenName("");
        setPricePerSeat("");
        setSelectedMovie(null);
        setSelectedCinema(null);
      }
    } catch (err) {
      console.error(
        "Error fetching data for showtime form:",
        err.response?.data || err.message
      );
      const errorMsg =
        err.response?.data?.message ||
        "Could not load necessary data. Please try again.";
      setError(errorMsg);
      Alert.alert("Error Loading Data", errorMsg);
    } finally {
      setLoadingInitialData(false);
    }
  }, [isEditing, showtimeId]);

  // Fetch initial data on mount and when in editing mode if showtimeId changes
  useEffect(() => {
    fetchInitialData();
    navigation.setOptions({
      title: isEditing ? "Edit Showtime" : "Add New Showtime",
    });
  }, [fetchInitialData, navigation, isEditing]); // Re-run if isEditing or showtimeId changes

  // --- Dropdown Handlers ---
  const onMovieOpen = useCallback(() => setCinemaOpen(false), []);
  const onCinemaOpen = useCallback(() => setMovieOpen(false), []);

  // --- Date and Time Picker Handlers ---
  const onShowDateChange = (event, newSelectedDate) => {
    if (Platform.OS === "android") setShowDatePicker(false); // Hide Android picker
    if (event.type === "set" && newSelectedDate) {
      setSelectedShowDate(newSelectedDate); // Update selected date
    }
  };
  const showDatepickerModal = () => setShowDatePicker(true);

  const onShowTimeChange = (event, newSelectedTime) => {
    if (Platform.OS === "android") setShowTimePicker(false); // Hide Android picker
    if (event.type === "set" && newSelectedTime) {
      setSelectedShowTime(newSelectedTime); // Update selected time
    }
  };
  const showTimepickerModal = () => setShowTimePicker(true);

  // --- Form Submission ---
  const handleSubmit = async () => {
    // 1. Combine selected date and time into a single Date object for startTime
    const finalStartTime = new Date(selectedShowDate);
    finalStartTime.setHours(selectedShowTime.getHours());
    finalStartTime.setMinutes(selectedShowTime.getMinutes());
    finalStartTime.setSeconds(0);
    finalStartTime.setMilliseconds(0);

    console.log("Final Start Time to be sent:", finalStartTime.toISOString());

    // 2. Validation
    const priceNum = parseFloat(pricePerSeat);
    if (
      !selectedMovie ||
      !selectedCinema ||
      !screenName.trim() ||
      !finalStartTime ||
      !pricePerSeat.trim()
    ) {
      Alert.alert("Missing Information", "Please fill all required fields.");
      return;
    }
    if (isNaN(priceNum) || priceNum < 0) {
      Alert.alert("Invalid Price", "Price must be a non-negative number.");
      return;
    }
    if (finalStartTime <= new Date() && !isEditing) {
      // Only for new showtimes
      Alert.alert(
        "Invalid Time",
        "Start time must be in the future for new showtimes."
      );
      return;
    }

    setLoading(true); // Set loading for submit button

    // 3. Prepare Data
    const showtimeData = {
      movie: selectedMovie,
      cinema: selectedCinema,
      screenName: screenName.trim(),
      startTime: finalStartTime.toISOString(), // Send as ISO string
      pricePerSeat: priceNum,
    };

    // 4. API Call (Add or Edit)
    try {
      let response;
      if (isEditing) {
        console.log(`Updating showtime ${showtimeId} with data:`, showtimeData);
        response = await api.put(
          `/admin/showtimes/${showtimeId}`,
          showtimeData
        );
      } else {
        console.log("Adding new showtime with data:", showtimeData);
        response = await api.post("/admin/showtimes", showtimeData);
      }

      if (response.status === 200 || response.status === 201) {
        Alert.alert(
          "Success",
          `Showtime ${isEditing ? "updated" : "added"} successfully!`
        );
        navigation.goBack(); // Go back to the previous screen
      } else {
        throw new Error(
          response.data?.message ||
            `Request failed with status ${response.status}`
        );
      }
    } catch (errCatch) {
      console.error(
        `Error ${isEditing ? "updating" : "adding"} showtime:`,
        errCatch.response?.data || errCatch.message
      );
      Alert.alert(
        `Error ${isEditing ? "Updating" : "Adding"} Showtime`,
        errCatch.response?.data?.message ||
          "An unknown error occurred. Check for conflicts or try again."
      );
    } finally {
      setLoading(false); // Reset submit button loading state
    }
  };

  // --- Render Loading State for Initial Data ---
  if (loadingInitialData) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#008E97" />
      </View>
    );
  }
  // --- Render Error State for Initial Data ---
  if (error) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>{error}</Text>
        <Button title="Go Back" onPress={() => navigation.goBack()} />
      </View>
    );
  }

  // --- Render Form ---
  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardAvoidingView}
      >
        <ScrollView
          style={styles.container}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* Title moved to header via navigation.setOptions */}

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
              setItems={setMovieItems}
              placeholder="Select Movie"
              searchable={true}
              searchPlaceholder="Search Movies..."
              containerStyle={styles.dropdownContainer}
              style={styles.dropdown}
              placeholderStyle={styles.placeholderStyles}
              modalTitle="Select Movie"
              zIndex={5000}
              onOpen={onMovieOpen}
              disabled={isEditing}
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
              disabled={isEditing}
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

          {/* Start Date & Time Picker Section */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>
              Start Date & Time <Text style={styles.required}>*</Text>
            </Text>
            {/* Button to select DATE */}
            <Pressable
              onPress={showDatepickerModal}
              style={styles.dateTimePickerButton}
            >
              <Ionicons name="calendar-outline" size={22} color="#555" />
              <Text style={styles.dateTimePickerText}>
                Date: {selectedShowDate.toLocaleDateString("en-GB")}
              </Text>
            </Pressable>
            {/* Android DatePicker Modal */}
            {showDatePicker && Platform.OS === "android" && (
              <DateTimePicker
                value={selectedShowDate}
                mode="date"
                display="default"
                onChange={onShowDateChange}
              />
            )}
            {/* Button to select TIME */}
            <Pressable
              onPress={showTimepickerModal}
              style={[styles.dateTimePickerButton, { marginTop: 10 }]}
            >
              <Ionicons name="time-outline" size={22} color="#555" />
              <Text style={styles.dateTimePickerText}>
                Time:{" "}
                {selectedShowTime.toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                  hour12: false,
                })}
              </Text>
            </Pressable>
            {/* Android TimePicker Modal */}
            {showTimePicker && Platform.OS === "android" && (
              <DateTimePicker
                value={selectedShowTime}
                mode="time"
                display="default"
                onChange={onShowTimeChange}
                minuteInterval={5}
                is24Hour={true}
              />
            )}
            {/* iOS Inline Date & Time Pickers */}
            {Platform.OS === "ios" && (
              <>
                <Text style={styles.iosPickerLabel}>Select Date:</Text>
                <DateTimePicker
                  value={selectedShowDate}
                  mode="date"
                  display="inline"
                  onChange={onShowDateChange}
                  style={styles.iosDatePicker}
                />
                <Text style={styles.iosPickerLabel}>Select Time:</Text>
                <DateTimePicker
                  value={selectedShowTime}
                  mode="time"
                  display="spinner"
                  onChange={onShowTimeChange}
                  style={styles.iosTimePicker}
                  minuteInterval={5}
                />
              </>
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
              placeholder="e.g., 120000 or 10.50"
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

// --- Styles ---
const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "white" },
  keyboardAvoidingView: { flex: 1 },
  container: { flex: 1 },
  scrollContent: { padding: 20, paddingBottom: 60 },
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
  errorText: { fontSize: 16, color: "red", textAlign: "center" },
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
  disabledDropdown: { backgroundColor: "#e9ecef", opacity: 0.7 },
  placeholderStyles: { color: "#aaa", fontSize: 16 },
  dateTimePickerButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f8f9fa",
    borderWidth: 1,
    borderColor: "#dee2e6",
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: 12,
    minHeight: 50,
  },
  dateTimePickerText: { fontSize: 16, color: "#333", marginLeft: 10 },
  iosPickerLabel: {
    fontSize: 14,
    color: "grey",
    marginTop: 10,
    marginBottom: 2,
  },
  iosDatePicker: { alignSelf: "stretch" },
  iosTimePicker: { alignSelf: "stretch" },
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

export default AdminAddEditShowtimeScreen;
