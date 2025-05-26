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
  // Button, // Không cần thiết nếu dùng Pressable cho date picker Android
} from "react-native";
import {
  useNavigation,
  useRoute,
  // useFocusEffect, // Không cần thiết trong file này nếu chỉ fetch 1 lần khi edit
} from "@react-navigation/native";
import api from "../../api"; // Your API instance
import DropDownPicker from "react-native-dropdown-picker";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Ionicons } from "@expo/vector-icons";

const AdminAddMovieScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const movieId = route.params?.movieId;
  const isEditing = !!movieId;

  const [loading, setLoading] = useState(false);
  const [fetchingData, setFetchingData] = useState(isEditing);
  const [error, setError] = useState(null);

  // --- Form State ---
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [posterImage, setPosterImage] = useState("");
  const [bannerImage, setBannerImage] = useState("");
  const [trailerUrl, setTrailerUrl] = useState("");
  const [genreInput, setGenreInput] = useState(""); // Sẽ là string "Action, Comedy"
  const [language, setLanguage] = useState(null); // Value cho DropDownPicker
  const [duration, setDuration] = useState(""); // String từ TextInput
  const [releaseDate, setReleaseDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [status, setStatus] = useState(isEditing ? null : "coming_soon"); // Giá trị cho DropDownPicker
  const [castInput, setCastInput] = useState(""); // Sẽ là string "Actor1, Actor2"
  const [director, setDirector] = useState("");
  const [country, setCountry] = useState(""); // Thêm state cho country

  // --- Dropdown State & Data ---
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

  // --- Fetch Movie Data for Editing ---
  const fetchMovieData = useCallback(async () => {
    if (!isEditing || !movieId) {
      setFetchingData(false);
      return;
    }
    console.log(`AdminAddMovieScreen: Fetching data for movie ID: ${movieId}`);
    setFetchingData(true);
    setError(null);
    try {
      const response = await api.get(`/movies/${movieId}`);
      const movie = response.data;
      if (movie) {
        setTitle(movie.title || "");
        setDescription(movie.description || "");
        setPosterImage(movie.posterImage || "");
        setBannerImage(movie.bannerImage || "");
        setTrailerUrl(movie.trailerUrl || "");
        setGenreInput(Array.isArray(movie.genre) ? movie.genre.join(", ") : "");
        setLanguage(movie.language || null);
        setDuration(movie.duration?.toString() || "");
        setReleaseDate(
          movie.releaseDate ? new Date(movie.releaseDate) : new Date()
        );
        setStatus(movie.status || null); // Quan trọng: Nếu status từ API là null/undefined, để DropDown hiển thị placeholder
        setCastInput(Array.isArray(movie.cast) ? movie.cast.join(", ") : "");
        setDirector(movie.director || "");
        setCountry(movie.country || ""); // Thêm country
      } else {
        throw new Error("Movie data not found.");
      }
    } catch (err) {
      console.error(
        "AdminAddMovieScreen: Error fetching movie data:",
        err.response?.data || err.message
      );
      setError("Could not load movie data for editing.");
      Alert.alert(
        "Error Loading Data",
        "Could not load movie data. Please try again."
      );
    } finally {
      setFetchingData(false);
    }
  }, [isEditing, movieId]);

  useEffect(() => {
    if (isEditing) {
      fetchMovieData();
    }
    // Đặt tiêu đề động ban đầu, sẽ được cập nhật sau khi fetch xong nếu là edit
    navigation.setOptions({
      title: isEditing ? "Loading Movie..." : "Add New Movie",
    });
  }, [isEditing, movieId, navigation, fetchMovieData]); // <<< THÊM fetchMovieData vào dependencies

  // Hook riêng để cập nhật tiêu đề sau khi `title` (từ fetch) hoặc `isEditing` thay đổi
  useEffect(() => {
    if (isEditing) {
      if (!fetchingData) {
        // Chỉ cập nhật title khi đã fetch xong
        navigation.setOptions({ title: `Edit: ${title || "Movie"}` });
      }
    } else {
      navigation.setOptions({ title: "Add New Movie" });
    }
  }, [isEditing, title, fetchingData, navigation]);

  // --- Handlers ---
  const onLanguageOpen = useCallback(() => setStatusOpen(false), []);
  const onStatusOpen = useCallback(() => setLanguageOpen(false), []);

  const onDateChange = (event, selectedDateFromPicker) => {
    if (Platform.OS === "android") {
      setShowDatePicker(false); // Luôn ẩn picker Android sau khi chọn/hủy
    }
    if (event.type === "set" && selectedDateFromPicker) {
      // Chỉ cập nhật nếu người dùng chọn "set"
      setReleaseDate(selectedDateFromPicker);
    }
  };
  const showDatepicker = () => setShowDatePicker(true);

  // --- Form Submission ---
  const handleSubmit = async () => {
    if (
      !title.trim() ||
      !description.trim() ||
      !posterImage.trim() ||
      !genreInput.trim() ||
      !language || // Kiểm tra language đã được chọn
      !duration.trim() ||
      !status // Kiểm tra status đã được chọn
    ) {
      Alert.alert(
        "Missing Information",
        "Please fill in all required fields marked with *."
      );
      return;
    }

    const durationNumber = parseInt(duration, 10);
    if (isNaN(durationNumber) || durationNumber <= 0) {
      Alert.alert(
        "Invalid Duration",
        "Please enter a valid positive number for duration."
      );
      return;
    }

    setLoading(true);
    setError(null);

    const genresArray = genreInput
      .split(",")
      .map((g) => g.trim())
      .filter((g) => g);
    const castArray = castInput
      .split(",")
      .map((c) => c.trim())
      .filter((c) => c);

    const movieDataPayload = {
      title: title.trim(),
      description: description.trim(),
      posterImage: posterImage.trim(),
      bannerImage: bannerImage.trim() || undefined,
      trailerUrl: trailerUrl.trim() || undefined,
      genre: genresArray,
      language: language,
      duration: durationNumber,
      releaseDate: releaseDate.toISOString(),
      status: status,
      cast: castArray,
      director: director.trim() || undefined,
      country: country.trim() || undefined,
    };

    console.log(
      "Frontend: Submitting movie data:",
      JSON.stringify(movieDataPayload, null, 2)
    );

    try {
      let response;
      if (isEditing) {
        // SỬA Ở ĐÂY: sử dụng movieDataPayload
        response = await api.put(`/admin/movies/${movieId}`, movieDataPayload);
      } else {
        response = await api.post("/admin/movies", movieDataPayload);
      }

      if (response.status === 200 || response.status === 201) {
        Alert.alert(
          "Success",
          `Movie ${isEditing ? "updated" : "added"} successfully!`
        );
        navigation.goBack();
      } else {
        const errorMessage =
          response.data?.message ||
          `Unexpected status code: ${response.status}`;
        console.error(`API Error (Status ${response.status}):`, errorMessage);
        setError(errorMessage);
        Alert.alert(
          `Error ${isEditing ? "Updating" : "Adding"} Movie`,
          errorMessage
        );
      }
    } catch (error) {
      console.error(
        `Caught Error ${isEditing ? "updating" : "adding"} movie:`,
        error.response?.data || error.message || error
      );
      const errorMessage =
        error.response?.data?.message ||
        (error.isAxiosError
          ? "Network error or server issue."
          : "An unknown error occurred.");
      setError(errorMessage);
      Alert.alert(
        `Error ${isEditing ? "Updating" : "Adding"} Movie`,
        errorMessage
      );
    } finally {
      setLoading(false);
    }
  };

  // --- Input Component Helper ---
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

  if (fetchingData) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#008E97" />
      </View>
    );
  }
  if (error && isEditing) {
    // Chỉ hiển thị lỗi này nếu đang edit và fetch lỗi
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>{error}</Text>
        <Pressable onPress={fetchMovieData} style={styles.retryButton}>
          <Text style={styles.retryButtonText}>Retry Fetching Data</Text>
        </Pressable>
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
          keyboardShouldPersistTaps="handled" // Giúp các input trong ScrollView dễ focus hơn
        >
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
          <FormInput // Thêm input cho Country
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

          <View style={[styles.inputGroup, { zIndex: 3000 }]}>
            <Text style={styles.label}>
              Language <Text style={styles.required}>*</Text>
            </Text>
            <DropDownPicker
              listMode="MODAL" // Sử dụng modal để tránh bị che khuất
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
              onOpen={onLanguageOpen} // Để đóng dropdown khác nếu có
            />
          </View>

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

          <View style={styles.inputGroup}>
            <Text style={styles.label}>
              Release Date <Text style={styles.required}>*</Text>
            </Text>
            {Platform.OS === "ios" ? ( // Picker inline cho iOS
              <DateTimePicker
                value={releaseDate}
                mode="date"
                display="spinner" // hoặc "compact", "inline"
                onChange={onDateChange}
                style={styles.datePickerIOS} // Style riêng nếu cần
              />
            ) : (
              // Nút bấm cho Android
              <Pressable
                onPress={showDatepicker}
                style={styles.dateDisplayAndroid}
              >
                <Text style={styles.dateText}>
                  {releaseDate.toLocaleDateString("en-GB")}
                </Text>
                <Ionicons name="calendar-outline" size={24} color="#555" />
              </Pressable>
            )}
            {showDatePicker && Platform.OS === "android" && (
              <DateTimePicker // Modal picker cho Android
                value={releaseDate}
                mode="date"
                display="default"
                onChange={onDateChange}
              />
            )}
          </View>

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
                {isEditing ? "Update Movie" : "Add Movie"}
              </Text>
            )}
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "white" },
  container: { flex: 1 },
  scrollContent: { padding: 20, paddingBottom: 60 }, // Tăng padding bottom
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
  errorText: {
    fontSize: 16,
    color: "red",
    textAlign: "center",
    marginBottom: 15,
  },
  retryButton: {
    // Style cho nút Retry
    backgroundColor: "#007bff",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
    marginTop: 10,
  },
  retryButtonText: {
    // Style cho text của nút Retry
    color: "white",
    fontSize: 16,
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
  dropdownContainer: {
    // Không cần style đặc biệt nếu dùng modal
  },
  dropdown: {
    borderColor: "#dee2e6",
    backgroundColor: "#f8f9fa",
    borderRadius: 8,
    minHeight: 50, // Đảm bảo chiều cao tối thiểu
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
  datePickerIOS: {
    // height: 150, // Điều chỉnh nếu cần
    alignSelf: "stretch", // Để chiếm toàn bộ chiều rộng
    // backgroundColor: '#f8f9fa', // Có thể thêm nền nếu muốn
  },
  dateText: { fontSize: 16, color: "#333" },
  submitButton: {
    backgroundColor: "#007bff", // Blue
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

export default AdminAddMovieScreen;
