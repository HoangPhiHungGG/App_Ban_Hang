import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  Text,
  View,
  Pressable,
  ScrollView,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import api from "../../api"; // Adjust path as needed
import { Ionicons } from "@expo/vector-icons"; // Import icons

const AdminDashboardScreen = () => {
  const navigation = useNavigation();
  const [stats, setStats] = useState(null); // To hold dashboard stats
  const [loading, setLoading] = useState(false); // Manage loading state for stats

  // Example: Fetch dashboard stats on mount
  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);
      try {
        // Replace with your actual stats endpoint if you create one
        // const response = await api.get('/admin/stats');
        // setStats(response.data);

        // Placeholder stats for now
        setStats({
          totalUsers: "N/A",
          totalMovies: "N/A",
          totalBookings: "N/A",
        });
        Alert.alert(
          "Info",
          "Stats endpoint not implemented. Showing placeholders."
        );
      } catch (error) {
        console.error("Admin: Error fetching stats:", error);
        Alert.alert("Error", "Could not load dashboard stats.");
        setStats(null); // Clear stats on error
      } finally {
        setLoading(false);
      }
    };
    // fetchStats(); // Uncomment when API endpoint exists
    setStats({ totalUsers: "N/A", totalMovies: "N/A", totalBookings: "N/A" }); // Use placeholder for now
  }, []);

  const StatCard = ({ title, value, iconName }) => (
    <View style={styles.statCard}>
      <Ionicons name={iconName} size={30} color="#008E97" />
      <Text style={styles.statValue}>{loading ? "..." : value ?? "N/A"}</Text>
      <Text style={styles.statTitle}>{title}</Text>
    </View>
  );

  const ActionButton = ({ title, onPress, iconName }) => (
    <Pressable style={styles.button} onPress={onPress}>
      <Ionicons
        name={iconName}
        size={20}
        color="white"
        style={styles.buttonIcon}
      />
      <Text style={styles.buttonText}>{title}</Text>
    </Pressable>
  );

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Admin Dashboard</Text>

      {/* Stats Section */}
      <View style={styles.statsContainer}>
        <StatCard
          title="Total Users"
          value={stats?.totalUsers}
          iconName="people-outline"
        />
        <StatCard
          title="Movies"
          value={stats?.totalMovies}
          iconName="film-outline"
        />
        <StatCard
          title="Bookings"
          value={stats?.totalBookings}
          iconName="ticket-outline"
        />
      </View>

      {/* Actions Section */}
      <View style={styles.actionsContainer}>
        <ActionButton
          title="Manage Movies"
          onPress={() => navigation.navigate("ManageMovies")}
          iconName="film-outline"
        />
        <ActionButton
          title="Manage Cinemas"
          onPress={() => navigation.navigate("ManageCinemas")} // Điều hướng đến màn hình mới
          iconName="business-outline"
        />

        <ActionButton
          title="Manage Showtimes"
          // onPress={() => Alert.alert("TODO", "Navigate to Showtime Management")}
          onPress={() => navigation.navigate("ManageShowtimes")} // Điều hướng đến màn hình mới
          iconName="time-outline"
        />

        <ActionButton
          title="Manage Users"
          // Xóa Alert và thay bằng navigation.navigate
          // onPress={() => Alert.alert("TODO", "Navigate to User Management")}
          onPress={() => navigation.navigate("ManageUsers")} // <<< ĐIỀU HƯỚNG ĐẾN MANAGE USERS
          iconName="people-circle-outline" // Hoặc "people-outline"
        />
        <ActionButton
          title="Manage Bookings"
          // onPress={() => Alert.alert("TODO", "Navigate to Booking Management")}
          onPress={() => navigation.navigate("ManageBookings")}
          iconName="people-circle-outline"
        />
        <ActionButton
          title="Manage Reviews"
          // onPress={() => Alert.alert("TODO", "Navigate to Review Management")}
          onPress={() => navigation.navigate("ManageReviews")}
          iconName="star-outline"
        />
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa", // Light background
  },
  title: {
    fontSize: 26, // Larger title
    fontWeight: "bold",
    marginVertical: 25,
    textAlign: "center",
    color: "#343a40", // Darker title color
  },
  statsContainer: {
    flexDirection: "row",
    flexWrap: "wrap", // Allow wrapping on smaller screens
    justifyContent: "space-around",
    paddingHorizontal: 10,
    marginBottom: 25,
  },
  statCard: {
    backgroundColor: "white",
    borderRadius: 10,
    padding: 15,
    alignItems: "center",
    minWidth: 100, // Ensure minimum width
    margin: 5, // Add margin for spacing
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
    elevation: 3,
  },
  statValue: {
    fontSize: 22,
    fontWeight: "bold",
    marginTop: 5,
    color: "#008E97",
  },
  statTitle: {
    fontSize: 13,
    color: "grey",
    marginTop: 3,
  },
  actionsContainer: {
    paddingHorizontal: 20,
  },
  button: {
    flexDirection: "row", // Icon and text side-by-side
    alignItems: "center",
    backgroundColor: "#008E97", // Theme color
    paddingVertical: 14, // Slightly more padding
    paddingHorizontal: 20,
    borderRadius: 8,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 4,
  },
  buttonIcon: {
    marginRight: 12, // Space between icon and text
  },
  buttonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "500", // Medium weight
  },
});

export default AdminDashboardScreen;
