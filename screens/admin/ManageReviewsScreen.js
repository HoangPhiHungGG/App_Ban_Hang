import React, { useState, useEffect, useCallback, useRef } from "react"; // Import useRef
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
  ScrollView, // Import ScrollView
} from "react-native";
import { useNavigation, useFocusEffect } from "@react-navigation/native"; // Import hook
import api from "../../api"; // Your API instance
import { Ionicons } from "@expo/vector-icons"; // Import icons
import DropDownPicker from "react-native-dropdown-picker"; // Import DropDownPicker

const ManageReviewsScreen = () => {
  const navigation = useNavigation();
  const [reviews, setReviews] = useState([]); // State for the list of reviews
  const [loading, setLoading] = useState(true); // Main loading state, starts true
  const [refreshing, setRefreshing] = useState(false); // Pull-to-refresh state
  const [error, setError] = useState(null); // Error message state

  // --- Filter States ---
  const [searchQuery, setSearchQuery] = useState("");
  const [filterMovieId, setFilterMovieId] = useState(null);
  const [filterUserId, setFilterUserId] = useState(null);
  const [filterRating, setFilterRating] = useState(null); // null, 1, 2, 3, 4, 5
  const [filterVisibility, setFilterVisibility] = useState(null); // null, true (Hidden), false (Visible)

  // --- Dropdown States & Data ---
  const [movieOpen, setMovieOpen] = useState(false);
  const [userOpen, setUserOpen] = useState(false);
  const [ratingOpen, setRatingOpen] = useState(false);
  const [visibilityOpen, setVisibilityOpen] = useState(false);

  // Initialize dropdown items with 'All' option
  const [movieItems, setMovieItems] = useState([
    { label: "All Movies", value: null },
  ]);
  const [userItems, setUserItems] = useState([
    { label: "All Users", value: null },
  ]);
  const [ratingItems, setRatingItems] = useState([
    { label: "All Ratings", value: null },
    { label: "5 Stars", value: 5 },
    { label: "4 Stars", value: 4 },
    { label: "3 Stars", value: 3 },
    { label: "2 Stars", value: 2 },
    { label: "1 Star", value: 1 },
  ]);
  const [visibilityItems, setVisibilityItems] = useState([
    { label: "All Visibility", value: null },
    { label: "Visible", value: false },
    { label: "Hidden", value: true },
  ]);
  // Ref to track if initial data fetch (for filters) is done
  const filterDataFetched = useRef(false);
  // Ref to track if component is mounted (helps prevent state updates on unmounted component)
  const isComponentMounted = useRef(true);

  // --- Fetch Initial Data for Filters (Movies & Users) ---
  const fetchFilterData = useCallback(async () => {
    // Prevent fetching again if already done
    if (filterDataFetched.current) return;

    console.log("Fetching data for review filters (movies, users)...");
    try {
      const [moviesRes, usersRes] = await Promise.all([
        // Fetch only necessary fields if possible
        api.get("/movies?fields=title,_id"), // Assuming backend supports fields query
        api.get("/admin/users?fields=name,email,_id"), // Assuming backend supports fields query
      ]);

      if (moviesRes.data && Array.isArray(moviesRes.data)) {
        setMovieItems([
          { label: "All Movies", value: null },
          ...moviesRes.data.map((m) => ({ label: m.title, value: m._id })),
        ]);
      }
      if (usersRes.data && Array.isArray(usersRes.data)) {
        // Check component mount status before setting state
        if (isComponentMounted.current) {
          setUserItems([
            { label: "All Users", value: null },
            ...usersRes.data.map((u) => ({
              label: u.name || u.email,
              value: u._id,
            })),
          ]);
        }
      }
      filterDataFetched.current = true; // Mark as fetched
    } catch (err) {
      console.error("Error fetching filter data:", err);
      // Handle error fetching filter data (e.g., show a generic message)
    }
  }, []); // No dependencies, should run once

  useEffect(() => {
    fetchFilterData();
    // Set cleanup function for when component unmounts
    return () => {
      isComponentMounted.current = false;
    };
  }, [fetchFilterData]);

  // --- Fetching Logic for Reviews ---
  const fetchAdminReviews = useCallback(
    async (isRefresh = false) => {
      // Prevent fetching if already loading (unless refreshing)
      if (!isRefresh && loading && !refreshing) return;

      console.log("Fetching admin reviews with filters:", {
        search: searchQuery,
        movieId: filterMovieId,
        userId: filterUserId,
        rating: filterRating,
        isHidden: filterVisibility,
      });
      if (!isRefresh) setLoading(true); // Show main loader only on initial/filter fetch
      setError(null); // Clear previous errors

      try {
        const params = {};
        if (searchQuery.trim()) params.search = searchQuery.trim();
        if (filterMovieId) params.movieId = filterMovieId;
        if (filterUserId) params.userId = filterUserId;
        if (filterRating !== null) params.rating = filterRating;
        if (filterVisibility !== null) params.isHidden = filterVisibility;

        const response = await api.get("/admin/reviews", { params });
        // Check component mount status before setting state
        if (!isComponentMounted.current) return;

        const fetchedReviews = Array.isArray(response.data?.reviews)
          ? response.data.reviews
          : [];
        console.log(`Fetched ${fetchedReviews.length} reviews.`);
        setReviews(fetchedReviews);
        if (error) setError(null); // Clear error if fetch succeeds
      } catch (err) {
        const errorMsg =
          err.response?.data?.message || err.message || "Unknown error";
        console.error("Admin: Error fetching reviews:", errorMsg);
        // Check component mount status before setting state
        if (isComponentMounted.current) {
          if (!isRefresh)
            setError(
              "Could not load reviews. Pull down to refresh or check filters."
            );
          if (!isRefresh) setReviews([]); // Clear data on error only if not refreshing
        }
      } finally {
        // Check component mount status before setting state
        if (isComponentMounted.current) {
          setLoading(false); // Always turn off loading
          if (isRefresh) {
            setRefreshing(false); // Turn off refreshing indicator
          }
        }
      }
      // Depend only on filter states
    },
    [
      searchQuery,
      filterMovieId,
      filterUserId,
      filterRating,
      filterVisibility,
      loading,
      refreshing,
      error,
    ]
  ); // <<< Corrected dependencies

  // --- Effect to fetch data when filters change (with debounce for search) ---
  useEffect(() => {
    const handler = setTimeout(() => {
      // Only fetch if not currently refreshing to avoid conflicts
      if (!refreshing && isComponentMounted.current) {
        // <<< Check mount status
        fetchAdminReviews(false);
      }
    }, 500); // Debounce time
    return () => clearTimeout(handler); // Cleanup timeout
    // Depend on all filters and the stable fetch function reference
  }, [
    searchQuery,
    filterMovieId,
    filterUserId,
    filterRating,
    filterVisibility,
    refreshing,
    fetchAdminReviews,
  ]);

  // --- Fetch data when the screen comes into focus ---
  useFocusEffect(
    useCallback(() => {
      console.log(
        "ManageReviewsScreen focused, fetching reviews if not loading..."
      );
      // Fetch only if not already loading to prevent redundant calls on initial mount/focus
      if (!loading && isComponentMounted.current) {
        fetchAdminReviews(false);
      }
      // Return cleanup function for isMounted ref
      return () => {
        isComponentMounted.current = false;
      };
    }, [loading, fetchAdminReviews]) // Depend on loading and stable fetch function
  );

  // --- Pull-to-Refresh Handler ---
  const onRefresh = useCallback(() => {
    setRefreshing(true); // Set refreshing true
    fetchAdminReviews(true); // Call fetch with refresh flag
  }, [fetchAdminReviews]); // Depend on stable fetch function

  // --- Dropdown Open Handlers --- (Ensure mutual exclusivity)
  const onMovieOpen = useCallback(() => {
    setUserOpen(false);
    setRatingOpen(false);
    setVisibilityOpen(false);
  }, []);
  const onUserOpen = useCallback(() => {
    setMovieOpen(false);
    setRatingOpen(false);
    setVisibilityOpen(false);
  }, []);
  const onRatingOpen = useCallback(() => {
    setMovieOpen(false);
    setUserOpen(false);
    setVisibilityOpen(false);
  }, []);
  const onVisibilityOpen = useCallback(() => {
    setMovieOpen(false);
    setUserOpen(false);
    setRatingOpen(false);
  }, []);

  // --- Action Handlers ---
  const handleViewMovie = (movieId, movieTitle = "Details") => {
    if (movieId) navigation.navigate("MovieDetail", { movieId });
    else
      Alert.alert("Missing Info", "Movie ID is not available for this review.");
  };

  const handleToggleVisibility = (reviewId, isCurrentlyHidden, movieTitle) => {
    const actionText = isCurrentlyHidden ? "Show" : "Hide";
    Alert.alert(
      `Confirm ${actionText} Review`,
      `Review for "${movieTitle}"\n\nMake this review ${actionText.toLowerCase()}?`,
      [
        { text: "Cancel" },
        {
          text: actionText,
          onPress: async () => {
            try {
              await api.put(`/admin/reviews/${reviewId}`, {
                isHidden: !isCurrentlyHidden,
              });
              Alert.alert("Success", `Review visibility updated.`);
              setReviews((prev) =>
                prev.map((r) =>
                  r._id === reviewId
                    ? { ...r, isHidden: !isCurrentlyHidden }
                    : r
                )
              );
            } catch (error) {
              Alert.alert(
                "Error",
                error.response?.data?.message ||
                  `Could not ${actionText.toLowerCase()} review.`
              );
            }
          },
        },
      ]
    );
  };

  const handleDeleteReview = (reviewId, movieTitle) => {
    Alert.alert(
      "Confirm Delete Review",
      `Permanently delete review for "${movieTitle}"?`,
      [
        { text: "Cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await api.delete(`/admin/reviews/${reviewId}`);
              Alert.alert("Success", "Review deleted.");
              setReviews((prev) => prev.filter((r) => r._id !== reviewId));
            } catch (error) {
              Alert.alert(
                "Error",
                error.response?.data?.message || "Could not delete."
              );
            }
          },
        },
      ]
    );
  };

  // --- Render Item Component ---
  const renderItem = ({ item }) => {
    const movieTitle = item.movie?.title ?? "N/A";
    const userName = item.user?.name ?? "Anonymous";
    const rating = item.rating ?? 0;
    const comment = item.comment || "(No comment provided)";
    const reviewDate = item.createdAt
      ? new Date(item.createdAt).toLocaleString("en-GB", {
          dateStyle: "short",
          timeStyle: "short",
        })
      : "N/A";
    const isHidden = item.isHidden || false; // Assume isHidden field exists in your Review model

    const renderStars = (count) =>
      [...Array(5)].map((_, i) => (
        <Ionicons
          key={i}
          name={i < Math.round(count) ? "star" : "star-outline"}
          size={16}
          color="#FFC72C"
          style={styles.starIcon}
        />
      ));

    return (
      <View style={[styles.itemContainer, isHidden && styles.hiddenItem]}>
        {/* Header: Movie Title (Pressable) and Rating */}
        <View style={styles.itemHeaderRow}>
          <Pressable
            onPress={() => handleViewMovie(item.movie?._id, movieTitle)}
            style={styles.movieTitleContainer}
          >
            <Text style={styles.itemMovieTitle} numberOfLines={1}>
              {movieTitle}
            </Text>
          </Pressable>
          <View style={styles.ratingContainer}>{renderStars(rating)}</View>
        </View>
        {/* User Info and Date */}
        <View style={styles.userInfoRow}>
          <Text style={styles.itemUser} numberOfLines={1}>
            <Ionicons name="person-outline" size={14} color="grey" /> {userName}
          </Text>
          <Text style={styles.itemDate}>{reviewDate}</Text>
        </View>
        {/* Review Comment */}
        <Text style={styles.itemComment}>{comment}</Text>
        {/* Action Buttons */}
        <View style={styles.itemActions}>
          <Pressable
            style={styles.actionButton}
            onPress={() =>
              handleToggleVisibility(item._id, isHidden, movieTitle)
            }
          >
            <Ionicons
              name={isHidden ? "eye-off-outline" : "eye-outline"}
              size={22}
              color={isHidden ? "#6c757d" : "#198754"}
            />
          </Pressable>
          <Pressable
            style={styles.actionButton}
            onPress={() => handleDeleteReview(item._id, movieTitle)}
          >
            <Ionicons name="trash-outline" size={22} color="#dc3545" />
          </Pressable>
        </View>
      </View>
    );
  };

  // --- Render Loading, Error, or Empty State for the FlatList ---
  const renderListFeedback = () => {
    // Prioritize showing error if it exists (and not actively loading/refreshing)
    if (error && !loading && !refreshing) {
      return (
        <ScrollView
          contentContainerStyle={styles.centered}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
          <Ionicons
            name="cloud-offline-outline"
            size={50}
            color="#dc3545"
            style={{ marginBottom: 10 }}
          />
          <Text style={styles.errorText}>{error}</Text>
          <Pressable
            onPress={() => fetchAdminReviews(false)}
            style={styles.retryButton}
          >
            <Text style={styles.retryText}>Retry</Text>
          </Pressable>
        </ScrollView>
      );
    }
    // Show loading indicator if loading is true AND (it's refreshing OR the list is currently empty)
    if (loading && (refreshing || reviews.length === 0)) {
      return (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#008E97" />
        </View>
      );
    }
    // Show empty message only if not loading, no error, and the list is empty
    if (!loading && !error && reviews.length === 0) {
      return (
        <View style={styles.centered}>
          <Ionicons
            name="chatbubbles-outline"
            size={50}
            color="grey"
            style={{ marginBottom: 10 }}
          />
          <Text style={styles.emptyText}>
            No reviews found
            {searchQuery ||
            filterMovieId ||
            filterUserId ||
            filterRating !== null ||
            filterVisibility !== null
              ? " matching filters"
              : ""}
            .
          </Text>
        </View>
      );
    }
    // Otherwise, FlatList will render the data, no feedback needed here
    return null;
  };

  // --- Render Main Component ---
  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Ionicons
          name="search"
          size={20}
          color="gray"
          style={styles.searchIcon}
        />
        <TextInput
          style={styles.searchInput}
          placeholder="Search Reviews, Users, Movies..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          returnKeyType="search"
          autoCapitalize="none"
        />
        {searchQuery ? (
          <Pressable
            onPress={() => setSearchQuery("")}
            style={styles.clearButton}
          >
            <Ionicons name="close-circle" size={20} color="gray" />
          </Pressable>
        ) : null}
      </View>

      {/* Filter Section */}
      <View style={[styles.filterContainer, { zIndex: 20 }]}>
        <DropDownPicker
          listMode="MODAL"
          open={movieOpen}
          value={filterMovieId}
          items={movieItems}
          setOpen={setMovieOpen}
          setValue={setFilterMovieId}
          setItems={setMovieItems}
          placeholder="Filter by Movie"
          searchable={true}
          searchPlaceholder="Search Movies..."
          containerStyle={styles.dropdownFilter}
          style={styles.dropdownStyle}
          placeholderStyle={styles.placeholderStyle}
          zIndex={3000}
          onOpen={onMovieOpen}
          modalTitle="Filter by Movie"
        />
        <DropDownPicker
          listMode="MODAL"
          open={userOpen}
          value={filterUserId}
          items={userItems}
          setOpen={setUserOpen}
          setValue={setFilterUserId}
          setItems={setUserItems}
          placeholder="Filter by User"
          searchable={true}
          searchPlaceholder="Search Users..."
          containerStyle={styles.dropdownFilter}
          style={styles.dropdownStyle}
          placeholderStyle={styles.placeholderStyle}
          zIndex={2000}
          onOpen={onUserOpen}
          modalTitle="Filter by User"
        />
      </View>
      <View style={[styles.filterContainer, { zIndex: 10 }]}>
        <DropDownPicker
          listMode="MODAL"
          open={ratingOpen}
          value={filterRating}
          items={ratingItems}
          setOpen={setRatingOpen}
          setValue={setFilterRating}
          setItems={setRatingItems}
          placeholder="Filter by Rating"
          containerStyle={styles.dropdownFilter}
          style={styles.dropdownStyle}
          placeholderStyle={styles.placeholderStyle}
          zIndex={1000}
          onOpen={onRatingOpen}
          modalTitle="Filter by Rating"
        />
        <DropDownPicker
          listMode="MODAL"
          open={visibilityOpen}
          value={filterVisibility}
          items={visibilityItems}
          setOpen={setVisibilityOpen}
          setValue={setFilterVisibility}
          setItems={setVisibilityItems}
          placeholder="Filter Visibility"
          containerStyle={styles.dropdownFilter}
          style={styles.dropdownStyle}
          placeholderStyle={styles.placeholderStyle}
          zIndex={500}
          onOpen={onVisibilityOpen}
          modalTitle="Filter by Visibility"
        />
      </View>

      {/* FlatList to display reviews */}
      <FlatList
        data={reviews}
        renderItem={renderItem}
        keyExtractor={(item) => item._id.toString()}
        ListEmptyComponent={renderListFeedback} // Handles loading/error/empty states
        // Adjust contentContainerStyle to ensure empty state is centered
        contentContainerStyle={
          loading || error || reviews.length === 0
            ? styles.contentWhenEmpty
            : styles.listContainer
        }
        refreshControl={
          // Pull-to-refresh functionality
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={["#008E97"]} // Spinner color on Android
            tintColor={"#008E97"} // Spinner color on iOS
          />
        }
        ItemSeparatorComponent={() => <View style={styles.separator} />} // Line separator between items
        // Performance props (optional but recommended for long lists)
        removeClippedSubviews={true}
        maxToRenderPerBatch={10}
        windowSize={21} // Increased windowSize
      />
    </SafeAreaView>
  );
};

// --- Styles ---
const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#f8f9fa" },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    padding: 10,
    backgroundColor: "white",
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  searchIcon: { position: "absolute", left: 20, zIndex: 1 },
  searchInput: {
    flex: 1,
    height: 42,
    borderColor: "#ccc",
    borderWidth: 1,
    borderRadius: 25,
    paddingLeft: 40,
    paddingRight: 35,
    backgroundColor: "white",
  },
  clearButton: {
    position: "absolute",
    right: 15,
    height: 42,
    justifyContent: "center",
  },
  filterContainer: {
    flexDirection: "row",
    paddingHorizontal: 10,
    paddingVertical: 5,
    backgroundColor: "#f1f3f5",
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
    alignItems: "center",
    justifyContent: "space-between",
  },
  dropdownFilter: { width: "48%", height: 40 },
  dropdownStyle: {
    borderColor: "#ccc",
    height: 40,
    minHeight: 40,
    backgroundColor: "white",
  },
  placeholderStyle: { color: "grey", fontSize: 14 },
  listContainer: { paddingBottom: 20 },
  contentWhenEmpty: { flexGrow: 1, justifyContent: "center" },
  itemContainer: { backgroundColor: "white", padding: 15 },
  hiddenItem: { opacity: 0.5, backgroundColor: "#e9ecef" },
  separator: { height: 1, backgroundColor: "#f0f0f0" },
  itemHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  movieTitleContainer: { flexShrink: 1, marginRight: 10 },
  itemMovieTitle: { fontSize: 15, fontWeight: "bold", color: "#007bff" },
  ratingContainer: { flexDirection: "row" },
  starIcon: { marginRight: 1 },
  userInfoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  itemUser: { fontSize: 13, color: "#555", flexShrink: 1, marginRight: 10 },
  itemDate: { fontSize: 11, color: "grey", fontStyle: "italic" },
  itemComment: {
    fontSize: 14,
    color: "#333",
    marginBottom: 10,
    lineHeight: 20,
  },
  itemActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    borderTopWidth: 1,
    borderTopColor: "#eee",
    paddingTop: 8,
    marginTop: 8,
  },
  actionButton: { paddingHorizontal: 10, paddingVertical: 5 },
  emptyText: {
    textAlign: "center",
    marginTop: 40,
    fontSize: 16,
    color: "grey",
    paddingHorizontal: 20,
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
  retryText: { color: "white", fontWeight: "bold", fontSize: 15 },
});

export default ManageReviewsScreen;
