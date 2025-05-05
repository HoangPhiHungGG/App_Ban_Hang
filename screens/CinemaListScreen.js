import React, { useState, useEffect, useCallback } from "react";
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  ActivityIndicator,
  SafeAreaView,
  TextInput, // For search/filter
  Pressable,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import api from "../api";
import CinemaItem from "../components/CinemaItem"; // Import CinemaItem component
import { Ionicons } from "@expo/vector-icons";

const CinemaListScreen = () => {
  const navigation = useNavigation();
  const [cinemas, setCinemas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState(""); // State for searching cinemas
  const [selectedCity, setSelectedCity] = useState(""); // State for city filter (optional)

  const fetchCinemas = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {};
      if (searchQuery.trim()) params.search = searchQuery.trim();
      if (selectedCity.trim()) params.city = selectedCity.trim();

      console.log("Fetching cinemas with params:", params);
      const response = await api.get("/cinemas", { params });
      setCinemas(response.data);
    } catch (err) {
      console.error("Error fetching cinemas:", err);
      setError("Failed to load cinemas. Please try again.");
      setCinemas([]); // Clear data on error
    } finally {
      setLoading(false);
    }
  }, [searchQuery, selectedCity]);

  useEffect(() => {
    fetchCinemas();
    // Set header title (optional, can be done in StackNavigator)
    navigation.setOptions({ title: "Find Cinemas" });
  }, [fetchCinemas, navigation]);

  const handleCinemaPress = (cinema) => {
    // Navigate to Showtime screen, filtering by this cinema
    navigation.navigate("Showtimes", {
      cinemaId: cinema._id,
      cinemaName: cinema.name,
    });
  };

  const renderItem = ({ item }) => (
    <CinemaItem item={item} onPress={handleCinemaPress} />
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Optional Filter/Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBox}>
          <Ionicons
            name="search"
            size={20}
            color="gray"
            style={styles.searchIcon}
          />
          <TextInput
            style={styles.searchInput}
            placeholder="Search cinemas by name or city..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            returnKeyType="search"
            onSubmitEditing={fetchCinemas} // Trigger search on submit
          />
          {searchQuery ? (
            <Pressable
              onPress={() => setSearchQuery("")}
              style={styles.clearButton}
            >
              <Ionicons name="close-circle" size={18} color="gray" />
            </Pressable>
          ) : null}
        </View>
        {/* // TODO: Add City Filter Dropdown or Button here if needed */}
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#00CED1" style={styles.loader} />
      ) : error ? (
        <View style={styles.centered}>
          <Text style={styles.errorText}>{error}</Text>
          <Pressable onPress={fetchCinemas} style={styles.retryButton}>
            <Text style={styles.retryText}>Retry</Text>
          </Pressable>
        </View>
      ) : (
        <FlatList
          data={cinemas}
          renderItem={renderItem}
          keyExtractor={(item) => item._id.toString()}
          ListEmptyComponent={
            <Text style={styles.emptyText}>No cinemas found.</Text>
          }
          contentContainerStyle={styles.listContainer}
          // Performance settings can be added if list is very long
        />
      )}
    </SafeAreaView>
  );
};

export default CinemaListScreen;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#f8f9fa", // Light background
  },
  searchContainer: {
    padding: 10,
    backgroundColor: "white",
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f0f0f0",
    borderRadius: 20,
    height: 40,
  },
  searchIcon: {
    paddingLeft: 12,
    marginRight: 5,
  },
  searchInput: {
    flex: 1,
    paddingRight: 5, // Space for clear button
    height: "100%",
    fontSize: 15,
  },
  clearButton: {
    padding: 8,
  },
  loader: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: "red",
    textAlign: "center",
    marginBottom: 15,
  },
  retryButton: {
    backgroundColor: "#008E97",
    paddingVertical: 10,
    paddingHorizontal: 25,
    borderRadius: 20,
  },
  retryText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 15,
  },
  listContainer: {
    paddingBottom: 10, // Padding at the bottom
  },
  emptyText: {
    textAlign: "center",
    marginTop: 50,
    fontSize: 16,
    color: "gray",
  },
});
