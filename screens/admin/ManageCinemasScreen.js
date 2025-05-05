// ./screens/admin/ManageCinemasScreen.js

import React, { useState, useCallback } from "react";
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
  TextInput,
  ScrollView,
} from "react-native";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import api from "../../api";
import { Ionicons } from "@expo/vector-icons";

const ManageCinemasScreen = () => {
  const navigation = useNavigation();
  const [cinemas, setCinemas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const fetchAdminCinemas = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (searchQuery.trim()) {
        params.search = searchQuery.trim();
      }
      const response = await api.get("/cinemas", { params });
      setCinemas(response.data || []);
    } catch (error) {
      console.error("Error fetching cinemas:", error);
      Alert.alert("Error", "Could not load cinema list.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [searchQuery]);

  useFocusEffect(
    useCallback(() => {
      fetchAdminCinemas();
    }, [fetchAdminCinemas])
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchAdminCinemas();
  }, [fetchAdminCinemas]);

  const handleAddCinema = () => {
    navigation.navigate("AdminAddEditCinema"); // Navigate to add screen
  };

  const handleEditCinema = (cinemaId) => {
    navigation.navigate("AdminAddEditCinema", { cinemaId });
  };

  const handleDeleteCinema = (cinemaId, cinemaName) => {
    Alert.alert(
      "Confirm Delete",
      `Are you sure you want to delete "${cinemaName}"?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await api.delete(`/admin/cinemas/${cinemaId}`);
              setCinemas((prev) =>
                prev.filter((cinema) => cinema._id !== cinemaId)
              );
              Alert.alert("Success", `"${cinemaName}" has been deleted.`);
            } catch (error) {
              console.error("Delete error:", error);
              Alert.alert(
                "Error",
                error.response?.data?.message || "Could not delete cinema."
              );
            }
          },
        },
      ]
    );
  };

  const renderItem = ({ item }) => (
    <View style={styles.itemContainer}>
      <View style={styles.itemInfo}>
        <Text style={styles.itemTitle}>{item.name}</Text>
        <Text style={styles.itemSub}>
          {item.location?.address}, {item.location?.city}
        </Text>
        <Text style={styles.itemSub}>
          Screens: {item.totalScreens || "N/A"}
        </Text>
        <Text style={styles.itemId}>ID: {item._id}</Text>
      </View>
      <View style={styles.actions}>
        <Pressable
          style={styles.editButton}
          onPress={() => handleEditCinema(item._id)}
        >
          <Ionicons name="pencil-outline" size={18} color="white" />
        </Pressable>
        <Pressable
          style={styles.deleteButton}
          onPress={() => handleDeleteCinema(item._id, item.name)}
        >
          <Ionicons name="trash-outline" size={18} color="white" />
        </Pressable>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Search */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search cinemas..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          returnKeyType="search"
          onSubmitEditing={fetchAdminCinemas}
        />
        <Pressable onPress={fetchAdminCinemas} style={styles.searchButton}>
          <Ionicons name="search" size={20} color="white" />
        </Pressable>
      </View>

      {loading && !refreshing ? (
        <ActivityIndicator size="large" color="#008E97" style={styles.loader} />
      ) : (
        <FlatList
          data={cinemas}
          keyExtractor={(item) => item._id}
          renderItem={renderItem}
          ListHeaderComponent={
            <Pressable style={styles.addButton} onPress={handleAddCinema}>
              <Ionicons name="add-circle-outline" size={22} color="white" />
              <Text style={styles.addButtonText}>Add New Cinema</Text>
            </Pressable>
          }
          ListEmptyComponent={
            <Text style={styles.emptyText}>No cinemas found.</Text>
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
  safeArea: { flex: 1, backgroundColor: "#f8f9fa" },
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
    paddingBottom: 20,
  },
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#28a745",
    paddingVertical: 12,
    margin: 15,
    borderRadius: 8,
    elevation: 3,
  },
  addButtonText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 16,
    marginLeft: 8,
  },
  itemContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
    backgroundColor: "white",
  },
  itemInfo: {
    flex: 1,
    marginRight: 10,
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: "500",
    marginBottom: 2,
  },
  itemSub: {
    fontSize: 12,
    color: "grey",
  },
  itemId: {
    fontSize: 10,
    color: "#aaa",
    marginTop: 3,
  },
  actions: {
    flexDirection: "row",
  },
  editButton: {
    backgroundColor: "#007bff",
    padding: 8,
    borderRadius: 5,
    marginRight: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  deleteButton: {
    backgroundColor: "#dc3545",
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

export default ManageCinemasScreen;
