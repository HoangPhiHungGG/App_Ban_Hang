import React, { useState, useContext, useEffect, useCallback } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TextInput,
  Pressable,
  SafeAreaView,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { UserType } from "../UserContext";
import api from "../api"; // Assuming you have configured api instance
import { Ionicons } from "@expo/vector-icons";

const AccountSettingsScreen = () => {
  const navigation = useNavigation();
  const { userId } = useContext(UserType);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // State for editable fields (optional, add more later)
  const [name, setName] = useState("");
  // const [phone, setPhone] = useState(''); // Example if you add phone number

  const [isEditing, setIsEditing] = useState(false); // Flag to toggle edit mode
  const [isSaving, setIsSaving] = useState(false); // Loading indicator for save button

  // Fetch user profile data when screen focuses or userId changes
  const fetchUserProfile = useCallback(async () => {
    if (!userId) {
      setError("User not logged in.");
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const response = await api.get(`/profile/${userId}`);
      if (response.data?.user) {
        const userData = response.data.user;
        setUser(userData);
        // Initialize editable fields with fetched data
        setName(userData.name || "");
        // setPhone(userData.phone || ''); // Initialize phone if exists
      } else {
        throw new Error("User data not found.");
      }
    } catch (err) {
      console.error("Error fetching profile for settings:", err);
      setError("Could not load account details.");
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useFocusEffect(
    useCallback(() => {
      fetchUserProfile();
    }, [fetchUserProfile])
  );

  // Handle saving changes
  const handleSaveChanges = async () => {
    if (!name.trim()) {
      Alert.alert("Validation Error", "Name cannot be empty.");
      return;
    }
    // Add other validations if needed

    setIsSaving(true);
    setError(null);
    try {
      const updateData = {
        name: name.trim(),
        // phone: phone.trim(), // Include other fields to update
      };
      // Use the appropriate API endpoint (assuming a general profile update or specific admin endpoint)
      // For simplicity, let's assume a general update endpoint exists (you might need to create this)
      // IMPORTANT: Ensure backend handles this update securely!
      // Maybe use PUT /profile/:userId or a dedicated PUT /account/settings
      const response = await api.put(`/profile/${userId}`, updateData); // EXAMPLE ENDPOINT

      if (response.status === 200 && response.data?.user) {
        setUser(response.data.user); // Update local user state
        Alert.alert("Success", "Account details updated successfully.");
        setIsEditing(false); // Exit edit mode
      } else {
        throw new Error(response.data?.message || "Failed to update account.");
      }
    } catch (err) {
      console.error(
        "Error saving account settings:",
        err.response?.data || err.message
      );
      Alert.alert(
        "Update Failed",
        err.response?.data?.message || "Could not save changes."
      );
    } finally {
      setIsSaving(false);
    }
  };

  // Render loading or error state
  if (loading) {
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
  if (!user) {
    // Should not happen if logged in, but handle defensively
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>Could not load user data.</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
      >
        <Text style={styles.title}>Account Information</Text>

        {/* Display/Edit Fields */}
        <View style={styles.infoSection}>
          <View style={styles.fieldContainer}>
            <Text style={styles.label}>Name:</Text>
            {isEditing ? (
              <TextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
                autoCapitalize="words"
              />
            ) : (
              <Text style={styles.value}>{user.name}</Text>
            )}
          </View>

          <View style={styles.fieldContainer}>
            <Text style={styles.label}>Email:</Text>
            <Text style={[styles.value, styles.readOnlyValue]}>
              {user.email}
            </Text>
            <Text style={styles.readOnlyHint}>(Email cannot be changed)</Text>
          </View>

          <View style={styles.fieldContainer}>
            <Text style={styles.label}>Role:</Text>
            <Text style={[styles.value, styles.readOnlyValue]}>
              {user.role}
            </Text>
          </View>

          {/* Add other fields like Phone Number here if needed */}
          {/* <View style={styles.fieldContainer}>
                        <Text style={styles.label}>Phone:</Text>
                        {isEditing ? (
                            <TextInput style={styles.input} value={phone} onChangeText={setPhone} keyboardType="phone-pad"/>
                        ) : (
                            <Text style={styles.value}>{user.phone || 'Not set'}</Text>
                        )}
                    </View> */}
        </View>

        {/* Action Buttons */}
        <View style={styles.buttonRow}>
          {isEditing ? (
            <>
              <Pressable
                style={[
                  styles.actionButton,
                  styles.saveButton,
                  isSaving && styles.disabledButton,
                ]}
                onPress={handleSaveChanges}
                disabled={isSaving}
              >
                {isSaving ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.buttonText}>Save Changes</Text>
                )}
              </Pressable>
              <Pressable
                style={[styles.actionButton, styles.cancelButton]}
                onPress={() => {
                  setIsEditing(false);
                  // Reset fields to original fetched values
                  setName(user.name || "");
                  // setPhone(user.phone || '');
                }}
                disabled={isSaving}
              >
                <Text style={styles.buttonText}>Cancel</Text>
              </Pressable>
            </>
          ) : (
            <Pressable
              style={[styles.actionButton, styles.editButton]}
              onPress={() => setIsEditing(true)}
            >
              <Text style={styles.buttonText}>Edit Profile</Text>
            </Pressable>
          )}
        </View>

        {/* Change Password Section (Placeholder) */}
        <Pressable
          style={[styles.actionButton, styles.changePasswordButton]}
          onPress={() => Alert.alert("Change Password", "Feature coming soon!")}
        >
          <Text style={styles.buttonText}>Change Password</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
};

export default AccountSettingsScreen;

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "white" },
  container: { flex: 1 },
  scrollContent: { padding: 20, paddingBottom: 40 },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  errorText: { fontSize: 16, color: "red", textAlign: "center" },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 30,
    textAlign: "center",
    color: "#343a40",
  },
  infoSection: { marginBottom: 30 },
  fieldContainer: { marginBottom: 18 },
  label: { fontSize: 14, fontWeight: "600", color: "#6c757d", marginBottom: 5 }, // Muted label color
  value: { fontSize: 17, color: "#343a40", paddingVertical: 8 }, // Standard value text
  readOnlyValue: {
    color: "#495057",
    backgroundColor: "#f8f9fa",
    paddingHorizontal: 10,
    borderRadius: 5,
  }, // Style for non-editable fields
  readOnlyHint: {
    fontSize: 11,
    color: "grey",
    fontStyle: "italic",
    marginTop: 2,
  },
  input: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#ced4da",
    borderRadius: 5,
    paddingHorizontal: 10,
    paddingVertical: 10,
    fontSize: 16,
    color: "#333",
  },
  buttonRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginTop: 20,
    marginBottom: 15,
  },
  actionButton: {
    flex: 0.45, // Adjust width slightly less than half
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
    elevation: 2,
  },
  editButton: { backgroundColor: "#007bff" }, // Blue for Edit
  saveButton: { backgroundColor: "#28a745" }, // Green for Save
  cancelButton: { backgroundColor: "#6c757d" }, // Grey for Cancel
  changePasswordButton: { backgroundColor: "#ffc107", marginTop: 10 }, // Yellow for Change Password
  disabledButton: { opacity: 0.6 },
  buttonText: { color: "white", fontSize: 16, fontWeight: "bold" },
});
