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
  SafeAreaView,
  Switch,
  Platform,
} from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import api from "../../api";
import DropDownPicker from "react-native-dropdown-picker";
import { Ionicons } from "@expo/vector-icons";

const AdminEditUserScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const userId = route.params?.userId;
  const isEditing = !!userId;

  const [loading, setLoading] = useState(false); // Khi submit form
  const [fetchingData, setFetchingData] = useState(true); // Khi fetch dữ liệu
  const [error, setError] = useState(null);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("user");
  const [verified, setVerified] = useState(true);

  const [roleOpen, setRoleOpen] = useState(false);
  const [roleItems, setRoleItems] = useState([
    { label: "User", value: "user" },
    { label: "Admin", value: "admin" },
  ]);

  // --- Fetch User Data ---
  const fetchUserData = useCallback(async () => {
    if (!userId) {
      Alert.alert("Error", "User ID not provided.");
      navigation.goBack();
      return;
    }
    console.log(`Fetching data for user ID: ${userId}`);
    setFetchingData(true);
    setError(null);
    try {
      const response = await api.get(`/profile/${userId}`);
      const user = response.data?.user;
      if (user) {
        setName(user.name || "");
        setEmail(user.email || "");
        setRole(user.role || "user");
        setVerified(user.verified !== undefined ? user.verified : true);
      } else {
        throw new Error("User data not found.");
      }
    } catch (err) {
      console.error(
        "Error fetching user data:",
        err.response?.data || err.message
      );
      setError("Could not load user data for editing.");
      Alert.alert("Error", "Could not load user data.");
    } finally {
      setFetchingData(false);
    }
  }, [userId, navigation]);

  // Fetch dữ liệu khi mount
  useEffect(() => {
    if (isEditing) {
      fetchUserData();
    }
    navigation.setOptions({
      title: isEditing ? "Loading User..." : "Add New User",
    });
  }, [fetchUserData, navigation, isEditing]);

  // Cập nhật title sau khi đã fetch xong
  useEffect(() => {
    if (!fetchingData && (name || email)) {
      navigation.setOptions({ title: `Edit: ${name || email || "User"}` });
    }
  }, [fetchingData, name, email, navigation]);

  // --- Form Submission ---
  const handleUpdateUser = async () => {
    if (!name.trim() || !role) {
      Alert.alert("Missing Information", "Please provide Name and Role.");
      return;
    }

    setLoading(true);
    setError(null);

    const updateData = {
      name: name.trim(),
      role,
      verified,
    };

    try {
      console.log(`Updating user ${userId} with data:`, updateData);
      const response = await api.put(`/admin/users/${userId}`, updateData);
      if (response.status === 200) {
        Alert.alert("Success", "User updated successfully!");
        navigation.goBack();
      } else {
        throw new Error(
          response.data?.message || `Unexpected status code: ${response.status}`
        );
      }
    } catch (error) {
      console.error(
        "Error updating user:",
        error.response?.data || error.message
      );
      Alert.alert(
        "Error Updating User",
        error.response?.data?.message || "An unknown error occurred."
      );
    } finally {
      setLoading(false);
    }
  };

  // --- UI ---
  if (fetchingData)
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#008E97" />
      </View>
    );

  if (error)
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* Name */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>
            Name <Text style={styles.required}>*</Text>
          </Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="Enter full name"
            autoCapitalize="words"
          />
        </View>

        {/* Email */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Email</Text>
          <TextInput
            style={[styles.input, styles.readOnlyInput]}
            value={email}
            editable={false}
          />
        </View>

        {/* Role */}
        <View style={[styles.inputGroup, { zIndex: 1000 }]}>
          <Text style={styles.label}>
            Role <Text style={styles.required}>*</Text>
          </Text>
          <DropDownPicker
            listMode="MODAL"
            open={roleOpen}
            value={role}
            items={roleItems}
            setOpen={setRoleOpen}
            setValue={setRole}
            setItems={setRoleItems}
            placeholder="Select Role"
            containerStyle={styles.dropdownContainer}
            style={styles.dropdown}
            placeholderStyle={styles.placeholderStyles}
            modalTitle="Select User Role"
            zIndex={1000}
          />
        </View>

        {/* Status */}
        <View style={styles.switchGroup}>
          <Text style={styles.label}>Account Status:</Text>
          <View style={styles.switchContainer}>
            <Text style={verified ? styles.activeStatus : styles.bannedStatus}>
              {verified ? "Active / Verified" : "Banned / Unverified"}
            </Text>
            <Switch
              trackColor={{ false: "#767577", true: "#81b0ff" }}
              thumbColor={verified ? "#007bff" : "#f4f3f4"}
              ios_backgroundColor="#3e3e3e"
              onValueChange={() => setVerified((prev) => !prev)}
              value={verified}
            />
          </View>
        </View>

        {/* Submit */}
        <Pressable
          style={[styles.submitButton, loading && styles.submitButtonDisabled]}
          onPress={handleUpdateUser}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text style={styles.submitButtonText}>Update User</Text>
          )}
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
};

export default AdminEditUserScreen;

// --- Styles ---
const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "white" },
  container: { flex: 1 },
  scrollContent: { padding: 20, paddingBottom: 60 },
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
  errorText: { fontSize: 16, color: "red", textAlign: "center" },
  inputGroup: { marginBottom: 22 },
  switchGroup: { marginBottom: 22 },
  switchContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 5,
  },
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
  readOnlyInput: { backgroundColor: "#e9ecef", color: "#6c757d" },
  dropdownContainer: {},
  dropdown: {
    borderColor: "#dee2e6",
    backgroundColor: "#f8f9fa",
    borderRadius: 8,
    minHeight: 50,
  },
  placeholderStyles: { color: "#aaa", fontSize: 16 },
  activeStatus: { fontSize: 16, fontWeight: "bold", color: "#198754" },
  bannedStatus: { fontSize: 16, fontWeight: "bold", color: "#dc3545" },
  submitButton: {
    backgroundColor: "#0d6efd",
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 25,
  },
  submitButtonDisabled: { backgroundColor: "#6c757d", opacity: 0.7 },
  submitButtonText: { color: "white", fontSize: 17, fontWeight: "bold" },
});
