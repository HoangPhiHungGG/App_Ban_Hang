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
  KeyboardAvoidingView,
  Button,
} from "react-native";
import {
  useNavigation,
  useRoute,
  useFocusEffect,
} from "@react-navigation/native";
import api from "../../api"; // Your API instance
import DropDownPicker from "react-native-dropdown-picker";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Ionicons } from "@expo/vector-icons";

const AdminAddMovieScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const movieId = route.params?.movieId; // Lấy movieId nếu được truyền qua (chế độ Edit)
  const isEditing = !!movieId; // Xác định chế độ: true nếu có movieId (Edit), false nếu không (Add)

  const [loading, setLoading] = useState(false); // Loading cho nút Submit
  const [fetchingData, setFetchingData] = useState(isEditing); // Loading khi fetch dữ liệu ban đầu (chỉ khi Edit)
  const [error, setError] = useState(null); // Lỗi khi fetch dữ liệu

  // --- Form State (Khởi tạo rỗng) ---
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [posterImage, setPosterImage] = useState("");
  const [bannerImage, setBannerImage] = useState("");
  const [trailerUrl, setTrailerUrl] = useState("");
  const [genreInput, setGenreInput] = useState("");
  const [language, setLanguage] = useState(null);
  const [duration, setDuration] = useState("");
  const [releaseDate, setReleaseDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [status, setStatus] = useState(isEditing ? "" : "coming_soon"); // Mặc định là coming_soon khi Add
  const [castInput, setCastInput] = useState("");
  const [director, setDirector] = useState("");
  const [country, setCountry] = useState("");

  // --- Dropdown State & Data --- (Giữ nguyên)
  const [languageOpen, setLanguageOpen] = useState(false);
  const [statusOpen, setStatusOpen] = useState(false);
  const [languageItems, setLanguageItems] = useState([
    { label: "English", value: "English" },
    { label: "Vietnamese", value: "Vietnamese" },
    { label: "Korean", value: "Korean" },
    { label: "Japanese", value: "Japanese" },
    { label: "Hindi", value: "Hindi" },
    { label: "Spanish", value: "Spanish" },
    { label: "Other", value: "Other" },
  ]);
  const [statusItems, setStatusItems] = useState([
    { label: "Coming Soon", value: "coming_soon" },
    { label: "Now Showing", value: "now_showing" },
    { label: "Ended", value: "ended" },
  ]);

  // --- Fetch dữ liệu phim hiện có nếu là chế độ Edit ---
  const fetchMovieData = useCallback(async () => {
    if (!isEditing) {
      // Chỉ fetch nếu đang edit
      setFetchingData(false); // Không cần fetch nếu là Add
      return;
    }
    console.log(`Fetching data for movie ID: ${movieId}`);
    setFetchingData(true);
    setError(null);
    try {
      const response = await api.get(`/movies/${movieId}`);
      const movie = response.data;
      if (movie) {
        // Điền dữ liệu vào form state
        setTitle(movie.title || "");
        setDescription(movie.description || "");
        setPosterImage(movie.posterImage || "");
        setBannerImage(movie.bannerImage || "");
        setTrailerUrl(movie.trailerUrl || "");
        setGenreInput(Array.isArray(movie.genre) ? movie.genre.join(", ") : ""); // Join array thành string
        setLanguage(movie.language || null);
        setDuration(movie.duration?.toString() || "");
        setReleaseDate(
          movie.releaseDate ? new Date(movie.releaseDate) : new Date()
        ); // Chuyển ISO string thành Date
        setStatus(movie.status || "coming_soon"); // Đặt status lấy được
        setCastInput(Array.isArray(movie.cast) ? movie.cast.join(", ") : ""); // Join array thành string
        setDirector(movie.director || "");
        // setCountry(movie.country || ''); // Nếu có trường country
      } else {
        throw new Error("Movie data not found.");
      }
    } catch (err) {
      console.error(
        "Error fetching movie data:",
        err.response?.data || err.message
      );
      setError("Could not load movie data for editing.");
      Alert.alert("Error", "Could not load movie data. Please try again.");
    } finally {
      setFetchingData(false);
    }
  }, [isEditing, movieId]); // Phụ thuộc isEditing và movieId

  // Chạy fetch khi component mount hoặc movieId thay đổi (chỉ khi isEditing)
  useEffect(() => {
    if (isEditing) {
      fetchMovieData();
    }
    // Đặt tiêu đề động ban đầu
    navigation.setOptions({
      title: isEditing ? "Edit Movie" : "Add New Movie",
    });
  }, [fetchMovieData, navigation, isEditing]); // Chỉ fetchMovieData là dependency chính

  // Cập nhật tiêu đề header khi 'title' state thay đổi (chỉ khi đang edit)
  useEffect(() => {
    if (isEditing) {
      navigation.setOptions({ title: `Edit: ${title || "Movie"}` });
    }
  }, [isEditing, navigation]); // Phụ thuộc title

  // --- Handlers --- (Giữ nguyên DatePicker và Dropdown handlers)

  const onLanguageOpen = useCallback(() => setStatusOpen(false), []);
  const onStatusOpen = useCallback(() => setLanguageOpen(false), []);
  const onDateChange = (event, selectedDate) => {
    if (Platform.OS === "android") setShowDatePicker(false);
    if (event.type === "set" && selectedDate) {
      setReleaseDate(selectedDate);
    }
  };
  const showDatepicker = () => setShowDatePicker(true);

  // --- Form Submission (Xử lý cả Add và Edit) ---
  const handleSubmit = async () => {
    // ** 1. Validation ** (Giữ nguyên)
    if (
      !title.trim() ||
      !description.trim() ||
      !posterImage.trim() ||
      !genreInput.trim() ||
      !language ||
      !duration.trim() ||
      !status
    ) {
      Alert.alert(
        "Missing Information",
        "Please fill in all required fields marked with *. "
      );
      return;
    }
    const durationNum = parseInt(duration, 10);
    if (isNaN(durationNum) || durationNum <= 0) {
      Alert.alert(
        "Invalid Duration",
        "Please enter a valid positive number for duration."
      );
      return;
    }

    setLoading(true);

    // ** 2. Prepare Data ** (Giữ nguyên)
    const genres = genreInput
      .split(",")
      .map((g) => g.trim())
      .filter((g) => g);
    const cast = castInput
      .split(",")
      .map((c) => c.trim())
      .filter((c) => c);

    const movieData = {
      title: title.trim(),
      description: description.trim(),
      posterImage: posterImage.trim(),
      bannerImage: bannerImage.trim() || undefined,
      trailerUrl: trailerUrl.trim() || undefined,
      genre: genres,
      language: language,
      duration: durationNum,
      releaseDate: releaseDate.toISOString(),
      status: status,
      cast: cast,
      director: director.trim() || undefined,
      // country: country.trim() || undefined,
    };

    // ** 3. API Call (Conditional POST or PUT) **
    try {
      let response;
      if (isEditing) {
        // Gọi API Update
        console.log(`Updating movie ${movieId} with data:`, movieData);
        response = await api.put(`/admin/movies/${movieId}`, movieData);
      } else {
        // Gọi API Add
        console.log("Submitting new movie data:", movieData);
        response = await api.post("/admin/movies", movieData);
      }

      // Xử lý kết quả
      if (response.status === 200 || response.status === 201) {
        Alert.alert(
          "Success",
          `Movie ${isEditing ? "updated" : "added"} successfully!`
        );
        navigation.goBack(); // Quay lại màn hình quản lý
      } else {
        throw new Error(
          response.data?.message || `Unexpected status code: ${response.status}`
        );
      }
    } catch (error) {
      console.error(
        `Error ${isEditing ? "updating" : "adding"} movie:`,
        error.response?.data || error.message
      );
      Alert.alert(
        `Error ${isEditing ? "Updating" : "Adding"} Movie`,
        error.response?.data?.message || "An unknown error occurred."
      );
    } finally {
      setLoading(false);
    }
  };

  // --- Input Component Helper --- (Giữ nguyên)
  const FormInput = ({
    label,
    value,
    onChangeText,
    placeholder,
    required = false,
    keyboardType = "default",
    multiline = false,
    numberOfLines = 1,
    autoCapitalize = "sentences",
  }) => (
    <View style={styles.inputGroup}>
      <Text style={styles.label}>
        {label}
        {required && <Text style={styles.required}> *</Text>}
      </Text>
      <TextInput
        style={[styles.input, multiline && styles.textArea]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#aaa"
        keyboardType={keyboardType}
        multiline={multiline}
        numberOfLines={multiline ? numberOfLines : 1}
        autoCapitalize={autoCapitalize}
      />
    </View>
  );

  // --- Render Loading State ---
  if (fetchingData) {
    // Hiển thị loading khi đang fetch dữ liệu (chỉ khi edit)
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#008E97" />
      </View>
    );
  }
  // --- Render Error State ---
  if (error) {
    // Hiển thị lỗi nếu fetch dữ liệu thất bại
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  // --- Render Form ---
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
          {/* Tiêu đề không cần thiết vì đã có header */}
          {/* <Text style={styles.title}>{isEditing ? 'Edit Movie' : 'Add New Movie'}</Text> */}

          {/* Form Fields */}
          <FormInput
            label="Title"
            value={title}
            onChangeText={setTitle}
            placeholder="Enter movie title"
            required
          />
          <FormInput
            label="Description"
            value={description}
            onChangeText={setDescription}
            placeholder="Enter movie description"
            required
            multiline
            numberOfLines={4}
          />
          <FormInput
            label="Poster Image URL"
            value={posterImage}
            onChangeText={setPosterImage}
            placeholder="https://example.com/poster.jpg"
            required
            keyboardType="url"
            autoCapitalize="none"
          />
          <FormInput
            label="Banner Image URL"
            value={bannerImage}
            onChangeText={setBannerImage}
            placeholder="(Optional) https://example.com/banner.jpg"
            keyboardType="url"
            autoCapitalize="none"
          />
          <FormInput
            label="Trailer URL"
            value={trailerUrl}
            onChangeText={setTrailerUrl}
            placeholder="(Optional) YouTube or Vimeo URL"
            keyboardType="url"
            autoCapitalize="none"
          />
          <FormInput
            label="Genre(s)"
            value={genreInput}
            onChangeText={setGenreInput}
            placeholder="Action, Comedy (comma-separated)"
            required
          />
          <FormInput
            label="Cast"
            value={castInput}
            onChangeText={setCastInput}
            placeholder="(Optional) Actor 1, Actor 2"
          />
          <FormInput
            label="Director"
            value={director}
            onChangeText={setDirector}
            placeholder="(Optional) Director's Name"
          />
          <FormInput
            label="Country"
            value={country}
            onChangeText={setCountry}
            placeholder="(Optional) Country of Origin"
          />
          <FormInput
            label="Duration (minutes)"
            value={duration}
            onChangeText={setDuration}
            placeholder="e.g., 120"
            required
            keyboardType="numeric"
          />

          {/* Language Dropdown */}
          <View style={[styles.inputGroup, { zIndex: 3000 }]}>
            <Text style={styles.label}>
              Language <Text style={styles.required}>*</Text>
            </Text>
            <DropDownPicker
              listMode="MODAL"
              open={languageOpen}
              value={language}
              items={languageItems}
              setOpen={setLanguageOpen}
              setValue={setLanguage}
              setItems={setLanguageItems}
              placeholder="Select Language"
              containerStyle={styles.dropdownContainer}
              style={styles.dropdown}
              placeholderStyle={styles.placeholderStyles}
              modalTitle="Select Language"
              zIndex={3000}
              onOpen={onLanguageOpen}
            />
          </View>

          {/* Status Dropdown */}
          <View style={[styles.inputGroup, { zIndex: 2000 }]}>
            <Text style={styles.label}>
              Status <Text style={styles.required}>*</Text>
            </Text>
            <DropDownPicker
              listMode="MODAL"
              open={statusOpen}
              value={status}
              items={statusItems}
              setOpen={setStatusOpen}
              setValue={setStatus}
              setItems={setStatusItems}
              placeholder="Select Status"
              containerStyle={styles.dropdownContainer}
              style={styles.dropdown}
              placeholderStyle={styles.placeholderStyles}
              modalTitle="Select Status"
              zIndex={2000}
              onOpen={onStatusOpen}
            />
          </View>

          {/* Release Date Picker */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>
              Release Date <Text style={styles.required}>*</Text>
            </Text>
            {Platform.OS === "ios" && (
              <DateTimePicker
                value={releaseDate}
                mode="date"
                display="spinner"
                onChange={onDateChange}
                style={styles.datePickerIOS}
              />
            )}
            {Platform.OS === "android" && (
              <Pressable
                onPress={showDatepicker}
                style={styles.dateDisplayAndroid}
              >
                <Text style={styles.dateText}>
                  {releaseDate.toLocaleDateString()}
                </Text>
                <Ionicons name="calendar-outline" size={24} color="#555" />
              </Pressable>
            )}
            {showDatePicker && Platform.OS === "android" && (
              <DateTimePicker
                value={releaseDate}
                mode="date"
                display="default"
                onChange={onDateChange}
              />
            )}
          </View>

          {/* Submit Button */}
          <Pressable
            style={[
              styles.submitButton,
              loading && styles.submitButtonDisabled,
            ]}
            onPress={handleSubmit} // Gọi hàm submit chung
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              // Đặt text động cho nút
              <Text style={styles.submitButtonText}>
                {isEditing ? "Update Movie" : "Add Movie"}
              </Text>
            )}
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default AdminAddMovieScreen;

// --- Styles --- (Copy từ file cũ hoặc file AdminAddEditCinemaScreen)
const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "white" },
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
  textArea: { height: 120, textAlignVertical: "top" },
  dropdownContainer: {},
  dropdown: {
    borderColor: "#dee2e6",
    backgroundColor: "#f8f9fa",
    borderRadius: 8,
    minHeight: 50,
  },
  placeholderStyles: { color: "#aaa", fontSize: 16 },
  dateDisplayAndroid: {
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
  datePickerIOS: { height: 150 },
  dateText: { fontSize: 16, color: "#333" },
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
  }, // Blue cho submit
  submitButtonDisabled: { backgroundColor: "#6c757d", opacity: 0.7 },
  submitButtonText: { color: "white", fontSize: 17, fontWeight: "bold" },
});
