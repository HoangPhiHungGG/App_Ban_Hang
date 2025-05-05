import React, { useState, useEffect, useContext } from "react";
import {
  StyleSheet,
  Text,
  View,
  SafeAreaView,
  Image,
  KeyboardAvoidingView,
  TextInput,
  Pressable,
  Alert,
  ActivityIndicator,
  Platform,
} from "react-native";
import { MaterialIcons, AntDesign } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import jwt_decode from "jwt-decode"; // Ensure installed
import api from "../api"; // Use the centralized api instance
import { UserType } from "../UserContext"; // Import context
// Optional: Import Redux actions if managing auth state there
// import { useDispatch } from 'react-redux';
// import { setAuthState, setLoading } from '../redux/AuthReducer';

const LoginScreen = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoadingState] = useState(false); // Renamed to avoid conflict
  const [checkingToken, setCheckingToken] = useState(true); // Loading state for initial token check
  const navigation = useNavigation();
  const { setUserId, setUserRole } = useContext(UserType); // Get setters from context
  // Optional: Redux dispatch
  // const dispatch = useDispatch();

  // Check login status on mount
  useEffect(() => {
    const checkLoginStatus = async () => {
      console.log("Checking login status...");
      // Optional: dispatch(setLoading(true)); // Set Redux loading state
      try {
        const token = await AsyncStorage.getItem("authToken");
        if (token) {
          console.log("Token found, attempting to decode and navigate.");
          // Decode token here to ensure it's valid before navigating
          try {
            const decoded = jwt_decode(token);
            // Optional: Check token expiry if needed: const isExpired = decoded.exp * 1000 < Date.now();
            console.log("Decoded token:", decoded);
            // Update context/Redux state before navigating
            setUserId(decoded.userId);
            setUserRole(decoded.role);
            // Optional: dispatch(setAuthState({ token, userId: decoded.userId, userRole: decoded.role }));
            navigation.replace("Main"); // Use replace to prevent going back to Login
          } catch (decodeError) {
            console.error("Invalid token found:", decodeError);
            // Token is invalid, remove it
            await AsyncStorage.removeItem("authToken");
          }
        } else {
          console.log("No token found.");
        }
      } catch (err) {
        console.error("Error checking login status:", err);
      } finally {
        setCheckingToken(false); // Finished initial check
        // Optional: dispatch(setLoading(false));
      }
    };
    checkLoginStatus();
  }, [navigation, setUserId, setUserRole]); // Add context setters to dependencies

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert("Login Error", "Please enter both email and password.");
      return;
    }
    setLoadingState(true);
    const userCredentials = {
      email: email.trim(), // Trim whitespace
      password: password,
    };

    try {
      console.log("Attempting login with:", userCredentials.email);
      const response = await api.post("/login", userCredentials); // Use central API instance

      if (response.status === 200 && response.data.token) {
        const token = response.data.token;
        console.log("Login successful, token received.");
        await AsyncStorage.setItem("authToken", token);
        console.log("Token stored in AsyncStorage.");

        // Decode token to update context/Redux state
        try {
          const decoded = jwt_decode(token);
          console.log("Decoded token on login:", decoded);
          setUserId(decoded.userId); // Update context
          setUserRole(decoded.role); // Update context role
          // Optional: dispatch(setAuthState({ token, userId: decoded.userId, userRole: decoded.role })); // Update Redux
          console.log("Navigating to Main screen.");
          navigation.replace("Main"); // Navigate after storing token and updating state
        } catch (decodeError) {
          console.error("Failed to decode token after login:", decodeError);
          Alert.alert(
            "Login Error",
            "Received an invalid token from the server."
          );
          // Clear potentially bad token
          await AsyncStorage.removeItem("authToken");
        }
      } else {
        // Handle cases where status is 200 but no token (shouldn't happen with current backend logic)
        console.warn("Login response status 200 but no token received.");
        Alert.alert("Login Error", "Login failed. Please try again.");
      }
    } catch (error) {
      console.error("Login API error:", error.response?.data || error.message);
      Alert.alert(
        "Login Error",
        error.response?.data?.message ||
          "An error occurred. Please check your credentials and try again."
      );
    } finally {
      setLoadingState(false);
    }
  };

  // Show loading indicator while checking token
  if (checkingToken) {
    return (
      <SafeAreaView style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color="#00CED1" />
        <Text style={styles.loadingText}>Checking login status...</Text>
      </SafeAreaView>
    );
  }

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
        <Text style={styles.title}>Login to Your Movie Account</Text>

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
            placeholder="Enter your Password"
            autoComplete="password"
          />
        </View>

        {/* Options (Keep logged in / Forgot Password) */}
        <View style={styles.optionsContainer}>
          {/* <Text>Keep me logged in</Text> */}
          <Pressable
            onPress={() =>
              Alert.alert("Forgot Password", "Implementation needed.")
            }
          >
            <Text style={styles.forgotPassword}>Forgot Password?</Text>
          </Pressable>
        </View>

        {/* Spacer */}
        <View style={{ marginTop: 60 }} />

        {/* Login Button */}
        <Pressable
          onPress={handleLogin}
          style={[styles.button, loading && styles.buttonDisabled]}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#ffffff" />
          ) : (
            <Text style={styles.buttonText}>Login</Text>
          )}
        </Pressable>

        {/* Sign Up Navigation */}
        <Pressable
          onPress={() => navigation.navigate("Register")}
          style={styles.signUpLink}
        >
          <Text style={styles.signUpText}>
            Don't have an account?{" "}
            <Text style={styles.signUpLinkText}>Sign Up</Text>
          </Text>
        </Pressable>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "white",
    alignItems: "center",
  },
  centered: {
    justifyContent: "center",
  },
  loadingText: {
    marginTop: 10,
    color: "gray",
  },
  logoContainer: {
    marginTop: Platform.OS === "android" ? 50 : 70, // Adjust top margin
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
    fontSize: 18, // Slightly larger title
    fontWeight: "bold",
    marginTop: 25,
    color: "#041E42", // Dark blue color
    textAlign: "center",
    marginBottom: 40, // More space after title
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F0F0F0", // Lighter grey
    borderRadius: 8, // More rounded corners
    marginTop: 20, // Consistent spacing
    paddingHorizontal: 15, // Add horizontal padding
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    color: "#333", // Darker text color
    flex: 1, // Take remaining space
    height: 50, // Fixed height
    fontSize: 16,
  },
  optionsContainer: {
    marginTop: 15,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end", // Align forgot password to the right
  },
  forgotPassword: {
    color: "#007FFF", // Blue link color
    fontWeight: "500",
  },
  button: {
    width: "80%", // Button width relative to container
    backgroundColor: "#FEBE10", // Amazon yellow/orange
    borderRadius: 8,
    padding: 15,
    alignSelf: "center", // Center button horizontally
    marginTop: 20, // Add margin top
  },
  buttonDisabled: {
    backgroundColor: "#fedb7b", // Lighter color when disabled
  },
  buttonText: {
    textAlign: "center",
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
  signUpLink: {
    marginTop: 25, // More space before sign up link
    alignItems: "center", // Center the text
  },
  signUpText: {
    textAlign: "center",
    color: "gray",
    fontSize: 15, // Slightly smaller font
  },
  signUpLinkText: {
    fontWeight: "bold",
    color: "#007FFF", // Blue link color
  },
});

export default LoginScreen;
