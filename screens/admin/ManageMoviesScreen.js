import React, { useState, useEffect, useCallback } from "react";
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  Pressable,
  ActivityIndicator,
  Alert,
  SafeAreaView,
  RefreshControl,
  TextInput, // Import TextInput for search
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import api from "../../api"; // Adjust path if needed
import { Ionicons } from "@expo/vector-icons";

const ManageMoviesScreen = () => {
  const navigation = useNavigation(); // Use navigation for Add/Edit actions
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState(""); // State for search query

  const fetchAdminMovies = useCallback(async () => {
    console.log("Fetching admin movies...");
    setLoading(true);
    try {
      const params = {};
      if (searchQuery) {
        params.search = searchQuery; // Add search query to params if it exists
      }
      // Use the standard movies endpoint, maybe add admin-specific flags if needed
      const response = await api.get("/movies", { params });
      setMovies(response.data);
    } catch (error) {
      console.error("Admin: Error fetching movies:", error);
      Alert.alert("Error", "Could not load movies list.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [searchQuery]); // Re-fetch when searchQuery changes

  useEffect(() => {
    fetchAdminMovies();
  }, [fetchAdminMovies]); // Fetch on initial mount and when fetch function changes

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchAdminMovies();
  }, [fetchAdminMovies]);

  // --- Action Handlers ---
  const handleAddMovie = () => {
    // Điều hướng đến route chung, không có params
    navigation.navigate("AdminAddMovie"); // <<< Đảm bảo tên route này đúng
  };

  const handleEditMovie = (movieId, movieTitle) => {
    // Điều hướng đến route chung, TRUYỀN movieId
    navigation.navigate("AdminAddMovie", { movieId: movieId }); // <<< Đảm bảo tên route này đúng
  };

  const handleDeleteMovie = (movieId, movieTitle) => {
    Alert.alert(
      "Confirm Delete",
      `Are you sure you want to delete the movie "${movieTitle}"?\n\nThis action cannot be undone.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            console.log(`Attempting to delete movie: ${movieId}`);
            try {
              // Ensure your backend API endpoint for deletion exists and requires admin auth
              // Using placeholder endpoint structure
              const response = await api.delete(`/admin/movies/${movieId}`);
              console.log("Delete response:", response.data);
              // Remove movie from state immediately for better UX
              setMovies((prevMovies) =>
                prevMovies.filter((m) => m._id !== movieId)
              );
              Alert.alert("Success", `"${movieTitle}" has been deleted.`);
            } catch (error) {
              console.error(
                "Admin: Error deleting movie:",
                error.response?.data || error.message
              );
              Alert.alert(
                "Error",
                error.response?.data?.message || "Could not delete the movie."
              );
            }
          },
        },
      ]
    );
  };

  // --- Render Movie Item ---
  const renderItem = ({ item }) => (
    <View style={styles.movieItem}>
      <View style={styles.movieInfo}>
        <Text style={styles.movieTitle}>{item.title}</Text>
        <Text style={styles.movieStatus}>Status: {item.status}</Text>
        <Text style={styles.movieId}>ID: {item._id}</Text>
      </View>
      <View style={styles.actions}>
        <Pressable
          style={styles.editButton}
          onPress={() => handleEditMovie(item._id, item.title)}
        >
          <Ionicons name="pencil-outline" size={18} color="white" />
        </Pressable>
        <Pressable
          style={styles.deleteButton}
          onPress={() => handleDeleteMovie(item._id, item.title)}
        >
          <Ionicons name="trash-outline" size={18} color="white" />
        </Pressable>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search movies by title..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          returnKeyType="search"
          onSubmitEditing={fetchAdminMovies} // Trigger search on submit
        />
        <Pressable onPress={fetchAdminMovies} style={styles.searchButton}>
          <Ionicons name="search" size={20} color="white" />
        </Pressable>
      </View>

      {loading && !refreshing ? (
        <ActivityIndicator size="large" color="#008E97" style={styles.loader} />
      ) : (
        <FlatList
          data={movies}
          keyExtractor={(item) => item._id}
          renderItem={renderItem}
          ListHeaderComponent={
            // Add Button as Header
            <Pressable style={styles.addButton} onPress={handleAddMovie}>
              <Ionicons name="add-circle-outline" size={22} color="white" />
              <Text style={styles.addButtonText}>Add New Movie</Text>
            </Pressable>
          }
          ListEmptyComponent={
            <Text style={styles.emptyText}>No movies found.</Text>
          }
          contentContainerStyle={styles.listContainer}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={["#008E97"]}
            />
          }
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#f8f9fa" }, // Light background
  loader: { flex: 1, justifyContent: "center", alignItems: "center" },
  searchContainer: {
    flexDirection: "row",
    padding: 10,
    backgroundColor: "white",
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  searchInput: {
    flex: 1,
    height: 40,
    borderColor: "#ccc",
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 15,
    backgroundColor: "white",
    marginRight: 8,
  },
  searchButton: {
    backgroundColor: "#008E97",
    paddingHorizontal: 15,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 20,
  },
  listContainer: {
    paddingBottom: 20, // Add padding at the bottom
  },
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#28a745", // Green for add
    paddingVertical: 12,
    margin: 15, // Margin around the add button
    borderRadius: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 3,
  },
  addButtonText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 16,
    marginLeft: 8,
  },
  movieItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
    backgroundColor: "white",
  },
  movieInfo: {
    flex: 1, // Allow info to take up space
    marginRight: 10,
  },
  movieTitle: {
    fontSize: 16,
    fontWeight: "500", // Medium weight title
    marginBottom: 2,
  },
  movieStatus: {
    fontSize: 12,
    color: "grey",
    fontStyle: "italic",
  },
  movieId: {
    fontSize: 10,
    color: "#aaa",
    marginTop: 3,
  },
  actions: {
    flexDirection: "row",
  },
  editButton: {
    backgroundColor: "#007bff", // Blue for edit
    padding: 8, // Make buttons slightly larger
    borderRadius: 5,
    marginRight: 8, // Space between buttons
    justifyContent: "center",
    alignItems: "center",
  },
  deleteButton: {
    backgroundColor: "#dc3545", // Red for delete
    padding: 8,
    borderRadius: 5,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyText: {
    textAlign: "center",
    marginTop: 40,
    fontSize: 16,
    color: "grey",
  },
});

export default ManageMoviesScreen;
