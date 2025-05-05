import React, { useContext } from "react";
import { StyleSheet } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import {
  Entypo,
  AntDesign,
  Ionicons,
  MaterialCommunityIcons,
} from "@expo/vector-icons";

// Import Screens
import LoginScreen from "../screens/LoginScreen";
import RegisterScreen from "../screens/RegisterScreen";
import HomeScreen from "../screens/HomeScreen";
import MovieDetailScreen from "../screens/MovieDetailScreen";
import CinemaListScreen from "../screens/CinemaListScreen";
import ShowtimeScreen from "../screens/ShowtimeScreen";
import SeatSelectionScreen from "../screens/SeatSelectionScreen";
import BookingSummaryScreen from "../screens/BookingSummaryScreen";
import BookingConfirmationScreen from "../screens/BookingConfirmationScreen";
import ProfileScreen from "../screens/ProfileScreen";
import BookingHistoryScreen from "../screens/BookingHistoryScreen";

import AccountSettingsScreen from "../screens/AccountSettingsScreen"; // <<< Import mới
import BuyAgainScreen from "../screens/BuyAgainScreen"; // <<< Import mới

// Import Admin Screens
import AdminDashboardScreen from "../screens/admin/AdminDashboardScreen";
import ManageMoviesScreen from "../screens/admin/ManageMoviesScreen";
import AdminAddMovieScreen from "../screens/admin/AdminAddMovieScreen";

import ManageShowtimesScreen from "../screens/admin/ManageShowtimesScreen";
import AdminAddEditShowtimeScreen from "../screens/admin/AdminAddEditShowtimeScreen";
// Import other admin screens...

import ManageCinemasScreen from "../screens/admin/ManageCinemasScreen"; // <<< Import Manage
import AdminAddEditCinemaScreen from "../screens/admin/AdminAddEditCinemaScreen"; // <<< Import Add/Edit

import ManageUsersScreen from "../screens/admin/ManageUsersScreen"; // <<< Import mới
import AdminEditUserScreen from "../screens/admin/AdminEditUserScreen";

import ManageBookingsScreen from "../screens/admin/ManageBookingsScreen";

import ManageReviewsScreen from "../screens/admin/ManageReviewsScreen"; // <<< Import mới

import { UserType } from "../UserContext"; // Import UserContext to check role

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// --- Bottom Tab Navigator ---
function BottomTabs() {
  const { userRole } = useContext(UserType); // Get role from context

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarActiveTintColor: "#008E97", // Active icon/label color
        tabBarInactiveTintColor: "black", // Inactive icon/label color
        tabBarLabelStyle: { fontSize: 11, paddingBottom: 3 },
        tabBarStyle: { height: 60, paddingTop: 5 }, // Adjust tab bar style
        headerShown: false, // Hide header for all tab screens by default
        tabBarIcon: ({ focused, color, size }) => {
          // Centralized icon logic
          let iconName;
          size = focused ? 26 : 22; // Make focused icon slightly larger

          if (route.name === "HomeNav") {
            iconName = focused ? "home" : "home-outline";
            return <Ionicons name={iconName} size={size} color={color} />;
          } else if (route.name === "CinemasNav") {
            iconName = focused ? "location" : "location-outline";
            return <Ionicons name={iconName} size={size} color={color} />;
          } else if (route.name === "ProfileNav") {
            iconName = focused ? "person" : "person-outline";
            return <Ionicons name={iconName} size={size} color={color} />;
          } else if (route.name === "AdminNav") {
            iconName = focused ? "settings" : "settings-outline";
            return <Ionicons name={iconName} size={size} color={color} />;
          }
          // Default icon if needed
          return <Ionicons name="apps-outline" size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen
        name="HomeNav"
        component={HomeScreen}
        options={{ tabBarLabel: "Movies" }}
      />
      <Tab.Screen
        name="CinemasNav"
        component={CinemaListScreen}
        options={{ tabBarLabel: "Cinemas" }}
      />
      <Tab.Screen
        name="ProfileNav"
        component={ProfileScreen}
        options={{ tabBarLabel: "Profile" }}
      />

      {/* Conditionally render Admin tab */}
      {userRole === "admin" && (
        <Tab.Screen
          name="AdminNav"
          component={AdminDashboardScreen} // Entry point for Admin section
          options={{ tabBarLabel: "Admin" }}
        />
      )}
    </Tab.Navigator>
  );
}

// --- Main Stack Navigator ---
const StackNavigator = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Login" // Start with Login screen
        screenOptions={{
          headerStyle: { backgroundColor: "#00CED1" }, // Default header style
          headerTintColor: "#fff", // Default header text color
          headerTitleStyle: { fontWeight: "bold" },
          headerBackTitleVisible: false, // Hide "< Back" text on iOS
        }}
      >
        {/* Auth Flow */}
        <Stack.Screen
          name="Login"
          component={LoginScreen}
          options={{ headerShown: false }} // No header for Login
        />
        <Stack.Screen
          name="Register"
          component={RegisterScreen}
          options={{ headerShown: false }} // No header for Register
        />

        {/* Main App Flow (contains Tabs) */}
        <Stack.Screen
          name="Main"
          component={BottomTabs}
          options={{ headerShown: false }} // Tabs manage their own (or no) headers
        />

        {/* Screens reachable from Tabs or other screens */}
        <Stack.Screen
          name="MovieDetail"
          component={MovieDetailScreen}
          options={{ title: "Movie Details" }} // Set title for this screen
        />
        <Stack.Screen
          name="Showtimes"
          component={ShowtimeScreen}
          options={{ title: "Select Showtime" }}
        />
        <Stack.Screen
          name="SeatSelection"
          component={SeatSelectionScreen}
          options={{ title: "Select Seats" }}
        />
        <Stack.Screen
          name="BookingSummary"
          component={BookingSummaryScreen}
          options={{ title: "Confirm Booking" }}
        />
        <Stack.Screen
          name="BookingConfirmation"
          component={BookingConfirmationScreen}
          options={{ headerShown: false }} // Full screen confirmation
        />
        <Stack.Screen
          name="BookingHistory"
          component={BookingHistoryScreen}
          options={{ title: "My Bookings" }}
        />

        {/* Admin Screens (reachable from Admin Tab or Profile) */}
        <Stack.Screen
          name="AdminDashboard"
          component={AdminDashboardScreen}
          options={{ title: "Admin Dashboard" }}
        />
        <Stack.Screen
          name="ManageMovies"
          component={ManageMoviesScreen}
          options={{ title: "Manage Movies" }}
        />
        <Stack.Screen
          name="AdminAddMovie" // Đặt tên route
          component={AdminAddMovieScreen}
          options={({ route }) => ({
            // Title động
            title: route.params?.movieId ? "Edit Movie" : "Add New Movie",
          })} // Đặt tiêu đề header
        />

        <Stack.Screen
          name="ManageCinemas" // Route cho màn hình quản lý
          component={ManageCinemasScreen}
          options={{ title: "Manage Cinemas" }}
        />
        <Stack.Screen
          name="AdminAddEditCinema" // Route chung cho Add/Edit Cinema
          component={AdminAddEditCinemaScreen}
          options={({ route }) => ({
            // Title động
            title: route.params?.movieId ? "Edit Movie" : "Add New Movie",
          })}
        />

        <Stack.Screen
          name="ManageShowtimes" // Tên route cho màn hình quản lý
          component={ManageShowtimesScreen}
          options={{ title: "Manage Showtimes" }}
        />
        <Stack.Screen
          name="AdminAddEditShowtime" // Route name dùng chung cho cả Add và Edit
          component={AdminAddEditShowtimeScreen}
          // Title sẽ được đặt động trong component dựa vào isEditing
          // options={{ title: 'Add/Edit Showtime' }}
          options={({ route }) => ({
            // Đặt title động dựa trên params
            title: route.params?.showtimeId
              ? "Edit Showtime"
              : "Add New Showtime",
          })}
        />
        <Stack.Screen
          name="AccountSettings"
          component={AccountSettingsScreen}
          options={{ title: "Account Settings" }}
        />
        <Stack.Screen
          name="BuyAgain"
          component={BuyAgainScreen}
          options={{ title: "Buy Again" }}
        />
        <Stack.Screen
          name="ManageUsers"
          component={ManageUsersScreen}
          options={{ title: "Manage Users" }}
        />
        {/* === THÊM MÀN HÌNH NÀY === */}
        <Stack.Screen
          name="AdminEditUser"
          component={AdminEditUserScreen}
          options={{ title: "Edit User" }}
        />
        <Stack.Screen
          name="ManageBookings"
          component={ManageBookingsScreen}
          options={{ title: "Manage Bookings" }}
        />
        <Stack.Screen
          name="ManageReviews"
          component={ManageReviewsScreen}
          options={{ title: "Manage Reviews" }}
        />
        {/* <Stack.Screen name="ManageCinemas" component={ManageCinemasScreen} options={{ title: 'Manage Cinemas' }} /> */}
        {/* <Stack.Screen name="ManageShowtimes" component={ManageShowtimesScreen} options={{ title: 'Manage Showtimes' }} /> */}
        {/* <Stack.Screen name="ManageUsers" component={ManageUsersScreen} options={{ title: 'Manage Users' }} /> */}
        {/* Add other Admin screens as needed */}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default StackNavigator;
