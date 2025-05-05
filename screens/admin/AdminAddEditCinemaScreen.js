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
} from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import api from "../../api"; // API instance

const AdminAddEditCinemaScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const cinemaId = route.params?.cinemaId;
  const isEditing = !!cinemaId;

  const [loading, setLoading] = useState(false); // Submit loading
  const [fetchingData, setFetchingData] = useState(isEditing);
  const [error, setError] = useState(null);

  // --- Form State ---
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [stateProvince, setStateProvince] = useState(""); // Optional state/province
  const [postalCode, setPostalCode] = useState(""); // Optional postal code
  const [totalScreens, setTotalScreens] = useState(""); // Number of screens

  // --- Fetch Data for Editing ---
  const fetchCinemaData = useCallback(async () => {
    if (!isEditing) {
      setFetchingData(false);
      return;
    }
    console.log(`Fetching data for cinema ID: ${cinemaId}`);
    setFetchingData(true);
    setError(null);
    try {
      const response = await api.get(`/cinemas/${cinemaId}`);
      const cinema = response.data;
      if (cinema) {
        setName(cinema.name || "");
        setAddress(cinema.location?.address || "");
        setCity(cinema.location?.city || "");
        setStateProvince(cinema.location?.state || "");
        setPostalCode(cinema.location?.postalCode || "");
        setTotalScreens(cinema.totalScreens?.toString() || "1"); // Default to 1 if missing
      } else {
        throw new Error("Cinema data not found.");
      }
    } catch (err) {
      console.error(
        "Error fetching cinema data:",
        err.response?.data || err.message
      );
      setError("Could not load cinema data for editing.");
      Alert.alert("Error", "Could not load cinema data.");
    } finally {
      setFetchingData(false);
    }
  }, [isEditing, cinemaId]);

  useEffect(() => {
    fetchCinemaData();
    navigation.setOptions({
      title: isEditing ? `Edit: ${name || "Cinema"}` : "Add New Cinema",
    });
  }, [fetchCinemaData, navigation, isEditing, name]); // Update title when name changes

  // --- Form Submission ---
  const handleSubmit = async () => {
    // Validation
    if (!name.trim() || !address.trim() || !city.trim()) {
      Alert.alert(
        "Missing Information",
        "Please fill in Cinema Name, Address, and City."
      );
      return;
    }
    const screensNum = parseInt(totalScreens, 10);
    if (isNaN(screensNum) || screensNum <= 0) {
      Alert.alert(
        "Invalid Screens",
        "Please enter a valid positive number for Total Screens."
      );
      return;
    }

    setLoading(true);

    // Prepare Data
    const cinemaData = {
      name: name.trim(),
      location: {
        address: address.trim(),
        city: city.trim(),
        state: stateProvince.trim() || undefined,
        postalCode: postalCode.trim() || undefined,
      },
      totalScreens: screensNum,
    };

    // API Call (Add or Edit)
    try {
      let response;
      if (isEditing) {
        console.log(`Updating cinema ${cinemaId} with data:`, cinemaData);
        response = await api.put(`/admin/cinemas/${cinemaId}`, cinemaData);
      } else {
        console.log("Adding new cinema data:", cinemaData);
        response = await api.post("/admin/cinemas", cinemaData);
      }

      if (response.status === 200 || response.status === 201) {
        Alert.alert(
          "Success",
          `Cinema ${isEditing ? "updated" : "added"} successfully!`
        );
        navigation.goBack();
      } else {
        throw new Error(
          response.data?.message || `Unexpected status code: ${response.status}`
        );
      }
    } catch (error) {
      console.error(
        `Error ${isEditing ? "updating" : "adding"} cinema:`,
        error.response?.data || error.message
      );
      Alert.alert(
        `Error ${isEditing ? "Updating" : "Adding"} Cinema`,
        error.response?.data?.message || "An unknown error occurred."
      );
    } finally {
      setLoading(false);
    }
  };

  // --- Input Helper --- (Giữ nguyên)
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
  if (error) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>{error}</Text>
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
          <FormInput
            label="Cinema Name"
            value={name}
            onChangeText={setName}
            placeholder="Enter cinema name"
            required
            autoCapitalize="words"
          />
          <FormInput
            label="Address"
            value={address}
            onChangeText={setAddress}
            placeholder="e.g., 123 Main St"
            required
            autoCapitalize="words"
          />
          <FormInput
            label="City"
            value={city}
            onChangeText={setCity}
            placeholder="e.g., Hanoi, Ho Chi Minh City"
            required
            autoCapitalize="words"
          />
          <FormInput
            label="State/Province"
            value={stateProvince}
            onChangeText={setStateProvince}
            placeholder="(Optional)"
            autoCapitalize="words"
          />
          <FormInput
            label="Postal Code"
            value={postalCode}
            onChangeText={setPostalCode}
            placeholder="(Optional)"
            keyboardType="numeric"
          />
          <FormInput
            label="Total Screens"
            value={totalScreens}
            onChangeText={setTotalScreens}
            placeholder="e.g., 8"
            required
            keyboardType="numeric"
          />

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
                {isEditing ? "Update Cinema" : "Add Cinema"}
              </Text>
            )}
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default AdminAddEditCinemaScreen;

// --- Styles --- (Tương tự các màn hình Add/Edit khác)
const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "white" },
  container: { flex: 1 },
  scrollContent: { padding: 20, paddingBottom: 60 },
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
  errorText: { fontSize: 16, color: "red", textAlign: "center" },
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
  textArea: { height: 120, textAlignVertical: "top" }, // If needed
  submitButton: {
    backgroundColor: "#0d6efd",
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
  }, // Blue for submit
  submitButtonDisabled: { backgroundColor: "#6c757d", opacity: 0.7 },
  submitButtonText: { color: "white", fontSize: 17, fontWeight: "bold" },
});
