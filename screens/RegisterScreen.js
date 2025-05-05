import React, { useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  SafeAreaView,
  Pressable,
  Image,
  KeyboardAvoidingView,
  TextInput,
  Alert,
  ActivityIndicator,
  Platform,
} from "react-native";
import { MaterialIcons, AntDesign, Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import api from "../api"; // Use the centralized api instance

const RegisterScreen = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const navigation = useNavigation();

  const handleRegister = async () => {
    if (!name || !email || !password) {
      Alert.alert("Registration Error", "Please fill in all fields.");
      return;
    }
    // Optional: Add password complexity validation here

    setLoading(true);
    const user = {
      name: name.trim(),
      email: email.trim().toLowerCase(), // Store email consistently
      password: password, // Backend should hash this
    };

    try {
      console.log("Attempting registration for:", user.email);
      const response = await api.post("/register", user);
      console.log("Registration response:", response.data);

      if (response.status === 201) {
        Alert.alert(
          "Registration Successful",
          "Please check your email to verify your account before logging in."
        );
        // Clear form
        setName("");
        setEmail("");
        setPassword("");
        // Navigate to Login screen after successful registration
        navigation.navigate("Login");
      } else {
        // Handle unexpected success status codes if needed
        Alert.alert(
          "Registration Error",
          response.data.message || "An unknown error occurred."
        );
      }
    } catch (error) {
      console.error(
        "Registration API error:",
        error.response?.data || error.message
      );
      Alert.alert(
        "Registration Error",
        error.response?.data?.message ||
          "An error occurred during registration. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Logo */}
      <View style={styles.logoContainer}>
        <Image
          style={styles.logo}
          source={{
            // Replace with your actual movie app logo
            uri: "https://assets.stickpng.com/thumbs/6160562276000b00045a7d97.png",
          }}
        />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.formContainer}
      >
        {/* Title */}
        <Text style={styles.title}>Create Your Movie Account</Text>

        {/* Name Input */}
        <View style={styles.inputContainer}>
          <Ionicons
            name="person-outline" // Use Ionicons
            size={24}
            color="gray"
            style={styles.inputIcon}
          />
          <TextInput
            value={name}
            onChangeText={(text) => setName(text)}
            style={styles.input}
            placeholder="Enter your full name"
            autoCapitalize="words" // Capitalize names
            autoComplete="name"
          />
        </View>

        {/* Email Input */}
        <View style={styles.inputContainer}>
          <MaterialIcons
            style={styles.inputIcon}
            name="email"
            size={24}
            color="gray"
          />
          <TextInput
            value={email}
            onChangeText={(text) => setEmail(text)}
            style={styles.input}
            placeholder="Enter your Email"
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
          />
        </View>

        {/* Password Input */}
        <View style={styles.inputContainer}>
          <AntDesign
            name="lock1"
            size={24}
            color="gray"
            style={styles.inputIcon}
          />
          <TextInput
            value={password}
            onChangeText={(text) => setPassword(text)}
            secureTextEntry={true}
            style={styles.input}
            placeholder="Create a Password"
            // Add password complexity hints or validation feedback if desired
          />
        </View>

        {/* Spacer */}
        <View style={{ marginTop: 60 }} />

        {/* Register Button */}
        <Pressable
          onPress={handleRegister}
          style={[styles.button, loading && styles.buttonDisabled]}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#ffffff" />
          ) : (
            <Text style={styles.buttonText}>Register</Text>
          )}
        </Pressable>

        {/* Login Navigation */}
        <Pressable
          onPress={() => navigation.goBack()} // Go back to the previous screen (usually Login)
          style={styles.signInLink}
        >
          <Text style={styles.signInText}>
            Already have an account?{" "}
            <Text style={styles.signInLinkText}>Sign In</Text>
          </Text>
        </Pressable>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

// Use similar styles as LoginScreen for consistency
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "white",
    alignItems: "center",
  },
  logoContainer: {
    marginTop: Platform.OS === "android" ? 40 : 60, // Adjust top margin
  },
  logo: {
    width: 150,
    height: 100,
    resizeMode: "contain",
  },
  formContainer: {
    width: "85%", // Use percentage for responsiveness
    marginTop: 20,
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    marginTop: 25,
    color: "#041E42",
    textAlign: "center",
    marginBottom: 30, // Space after title
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F0F0F0",
    borderRadius: 8,
    marginTop: 20, // Consistent spacing
    paddingHorizontal: 15,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    color: "#333",
    flex: 1,
    height: 50,
    fontSize: 16,
  },
  button: {
    width: "80%",
    backgroundColor: "#FEBE10",
    borderRadius: 8,
    padding: 15,
    alignSelf: "center",
    marginTop: 20,
  },
  buttonDisabled: {
    backgroundColor: "#fedb7b",
  },
  buttonText: {
    textAlign: "center",
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
  signInLink: {
    marginTop: 25,
    alignItems: "center",
  },
  signInText: {
    textAlign: "center",
    color: "gray",
    fontSize: 15,
  },
  signInLinkText: {
    fontWeight: "bold",
    color: "#007FFF",
  },
});

export default RegisterScreen;
