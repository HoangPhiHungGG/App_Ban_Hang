// --- START OF FILE ./screens/admin/ManageShowtimesScreen.js ---

import React, { useState, useEffect, useCallback, useRef } from "react"; // <<< Thêm useRef
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
  Platform,
  Button,
  ScrollView,
} from "react-native";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import api from "../../api";
import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";

const ManageShowtimesScreen = () => {
  const navigation = useNavigation();
  const [showtimes, setShowtimes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  // --- Filter State ---
  const [filterDate, setFilterDate] = useState(new Date());
  const [showFilterDatePicker, setShowFilterDatePicker] = useState(false);
  // const [filterMovieId, setFilterMovieId] = useState(null); // Thêm sau nếu cần
  // const [filterCinemaId, setFilterCinemaId] = useState(null);// Thêm sau nếu cần

  // --- Ref để tránh fetch trùng khi component mount và focus cùng lúc ---
  const isMounted = useRef(false); // <<< Thêm ref này

  // --- Fetching Logic ---
  const formatDateForAPI = (date) => date.toISOString().split("T")[0];

  // Hàm fetch chỉ nên phụ thuộc vào các state filter sẽ thay đổi
  // Không nên phụ thuộc vào loading/refreshing
  const fetchShowtimes = useCallback(
    async (dateToFetch, isRefresh = false) => {
      console.log(
        `Fetching showtimes for date: ${formatDateForAPI(dateToFetch)}`
      );
      if (!isRefresh) setLoading(true); // Chỉ set loading khi fetch mới
      setError(null);

      try {
        const params = { date: formatDateForAPI(dateToFetch) };
        // if (filterMovieId) params.movieId = filterMovieId;
        // if (filterCinemaId) params.cinemaId = filterCinemaId;
        const response = await api.get("/showtimes", { params });
        setShowtimes(Array.isArray(response.data) ? response.data : []);
        if (error) setError(null); // Xóa lỗi nếu fetch thành công
      } catch (err) {
        const errorMsg =
          err.response?.data?.message || err.message || "Unknown fetch error";
        console.error("Admin: Error fetching showtimes:", errorMsg);
        if (!isRefresh)
          setError("Could not load showtimes. Pull down to refresh.");
        if (!isRefresh) setShowtimes([]);
      } finally {
        setLoading(false); // Luôn tắt loading
        if (isRefresh) setRefreshing(false); // Tắt refreshing nếu là refresh
      }
      // }, [filterDate, filterMovieId, filterCinemaId]); // <<< Chỉ phụ thuộc filter state
    },
    [filterDate]
  ); // <<< Chỉ phụ thuộc filterDate hiện tại

  // --- Fetch khi filterDate thay đổi ---
  // useEffect này sẽ gọi fetch mỗi khi filterDate thay đổi
  useEffect(() => {
    // Chỉ fetch khi component đã mount xong (tránh gọi 2 lần với useFocusEffect)
    if (isMounted.current) {
      console.log("filterDate changed, fetching...");
      fetchShowtimes(filterDate, false);
    }
  }, [filterDate, fetchShowtimes]); // Phụ thuộc filterDate và hàm fetch

  // --- Fetch khi màn hình focus (chỉ chạy 1 lần khi mount xong và mỗi lần focus lại) ---
  useFocusEffect(
    useCallback(() => {
      // Đánh dấu là đã mount
      isMounted.current = true;
      console.log(
        "ManageShowtimesScreen focused, fetching data for date:",
        filterDate
      );
      // Gọi fetch khi focus, không phải là refresh
      fetchShowtimes(filterDate, false);

      // Cleanup function để đánh dấu unmount (tùy chọn)
      return () => {
        isMounted.current = false;
        console.log("ManageShowtimesScreen unfocused");
      };
    }, [fetchShowtimes, filterDate]) // Phụ thuộc vào fetch và filterDate
  );

  // --- Pull-to-Refresh Handler ---
  const onRefresh = useCallback(() => {
    console.log("Refreshing showtimes...");
    setRefreshing(true);
    fetchShowtimes(filterDate, true); // Gọi fetch với cờ refresh
  }, [fetchShowtimes, filterDate]); // Phụ thuộc vào fetch và filterDate

  // --- Date Picker Handlers --- (Giữ nguyên)
  const onFilterDateChange = (event, selectedDate) => {
    /* ... */
    setShowFilterDatePicker(false);
    if (event.type === "set" && selectedDate) {
      if (selectedDate.toDateString() !== filterDate.toDateString()) {
        setFilterDate(selectedDate);
      }
    }
  };
  const showFilterDatepicker = () => {
    setShowFilterDatePicker(true);
  };

  // --- Action Handlers --- (Giữ nguyên)
  const handleAddShowtime = () => {
    navigation.navigate("AdminAddEditShowtime");
  };
  const handleEditShowtime = (showtimeId) => {
    navigation.navigate("AdminAddEditShowtime", { showtimeId });
  };
  const handleDeleteShowtime = (showtimeId, movieTitle, cinemaName, time) => {
    /* ... */
    Alert.alert(
      "Confirm Delete",
      `Delete showtime?\n\n${movieTitle}\n${cinemaName} - ${time}`,
      [
        { text: "Cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            // setLoading(true); // Có thể thêm loading riêng
            try {
              await api.delete(`/admin/showtimes/${showtimeId}`);
              Alert.alert("Success", "Showtime deleted.");
              setShowtimes((prev) =>
                prev.filter((st) => st._id !== showtimeId)
              );
            } catch (error) {
              Alert.alert(
                "Error",
                error.response?.data?.message || "Could not delete."
              );
            }
            // finally { setLoading(false); }
          },
        },
      ]
    );
  };

  // --- Render Item Component --- (Giữ nguyên)
  const renderItem = ({ item }) => {
    /* ... */
    const startTimeStr = item.startTime
      ? new Date(item.startTime).toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
          hour12: true,
        })
      : "N/A";
    const endTimeStr = item.endTime
      ? new Date(item.endTime).toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
          hour12: true,
        })
      : "N/A";
    const movieTitle = item.movie?.title || "Unknown Movie";
    const cinemaName = item.cinema?.name || "Unknown Cinema";
    return (
      <View style={styles.itemContainer}>
        <Pressable style={styles.itemInfo}>
          <Text style={styles.itemMovieTitle} numberOfLines={1}>
            {movieTitle}
          </Text>
          <Text style={styles.itemCinemaName} numberOfLines={1}>
            {cinemaName} - {item.screenName || "N/A"}
          </Text>
          <Text style={styles.itemTime}>
            {startTimeStr} - {endTimeStr}
          </Text>
          <Text style={styles.itemPrice}>
            Price: $
            {item.pricePerSeat != null ? item.pricePerSeat.toFixed(2) : "N/A"}
          </Text>
          <Text style={styles.itemSeats}>
            Booked: {item.bookedSeats?.length || 0}
          </Text>
        </Pressable>
        <View style={styles.itemActions}>
          <Pressable
            style={styles.editButton}
            onPress={() => handleEditShowtime(item._id)}
          >
            <Ionicons name="pencil-outline" size={20} color="white" />
          </Pressable>
          <Pressable
            style={styles.deleteButton}
            onPress={() =>
              handleDeleteShowtime(
                item._id,
                movieTitle,
                cinemaName,
                startTimeStr
              )
            }
          >
            <Ionicons name="trash-outline" size={20} color="white" />
          </Pressable>
        </View>
      </View>
    );
  };

  // --- Render Loading, Error, or Empty State --- (Giữ nguyên)
  const renderListFeedback = () => {
    /* ... */
    if (loading && !refreshing)
      return (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#008E97" />
        </View>
      );
    if (error)
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
            onPress={() => fetchShowtimes(filterDate, false)}
            style={styles.retryButton}
          >
            <Text style={styles.retryText}>Retry</Text>
          </Pressable>{" "}
        </ScrollView>
      );
    if (!loading && !error && showtimes.length === 0)
      return (
        <View style={styles.centered}>
          <Ionicons
            name="film-outline"
            size={50}
            color="grey"
            style={{ marginBottom: 10 }}
          />
          <Text style={styles.emptyText}>
            No showtimes found for {filterDate.toLocaleDateString("en-GB")}.
          </Text>
        </View>
      );
    return null;
  };

  // --- Render Main --- (Giữ nguyên)
  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Filter Section */}
      <View style={styles.filterContainer}>
        <Pressable
          onPress={showFilterDatepicker}
          style={styles.datePickerButton}
        >
          <Ionicons name="calendar-outline" size={20} color="#333" />
          <Text style={styles.datePickerText}>
            {filterDate.toLocaleDateString("en-GB")}
          </Text>
        </Pressable>
        <TextInput
          placeholder="Filter by Movie/Cinema..."
          style={styles.filterInput}
          editable={false}
        />
      </View>

      {/* Date Picker */}
      {showFilterDatePicker &&
        (Platform.OS === "android" ? (
          <DateTimePicker
            value={filterDate}
            mode="date"
            display="default"
            onChange={onFilterDateChange}
          />
        ) : (
          <View style={styles.iosDatePickerContainer}>
            <DateTimePicker
              value={filterDate}
              mode="date"
              display="inline"
              onChange={onFilterDateChange}
            />
            <Button
              title="Done"
              onPress={() => setShowFilterDatePicker(false)}
            />
          </View>
        ))}

      {/* Add Button */}
      <Pressable style={styles.addButton} onPress={handleAddShowtime}>
        <Ionicons name="add-circle-outline" size={22} color="white" />
        <Text style={styles.addButtonText}>Add New Showtime</Text>
      </Pressable>

      {/* FlatList */}
      {/* *** Cập nhật logic render FlatList/Feedback *** */}
      {loading && showtimes.length === 0 && !refreshing ? ( // Chỉ hiện loading toàn màn hình lần đầu
        renderListFeedback()
      ) : (
        <FlatList
          data={showtimes}
          renderItem={renderItem}
          keyExtractor={(item) =>
            item._id?.toString() || Math.random().toString()
          }
          ListEmptyComponent={renderListFeedback} // Vẫn dùng để hiện Error/Empty khi list rỗng
          contentContainerStyle={
            showtimes.length === 0
              ? styles.contentWhenEmpty
              : styles.listContainer
          }
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={["#008E97"]}
            />
          }
          ItemSeparatorComponent={() => <View style={styles.separator} />}
        />
      )}
    </SafeAreaView>
  );
};

// --- Styles --- (Giữ nguyên)
const styles = StyleSheet.create({
  /* ... styles ... */ safeArea: { flex: 1, backgroundColor: "#f8f9fa" },
  filterContainer: {
    flexDirection: "row",
    padding: 10,
    backgroundColor: "white",
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
    alignItems: "center",
  },
  datePickerButton: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 5,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginRight: 10,
    backgroundColor: "#f0f0f0",
  },
  datePickerText: { marginLeft: 8, fontSize: 15, color: "#333" },
  iosDatePickerContainer: {
    backgroundColor: "white",
    borderTopWidth: 1,
    borderColor: "#ccc",
    paddingBottom: 10,
  },
  filterInput: {
    flex: 1,
    height: 40,
    borderColor: "#ccc",
    borderWidth: 1,
    borderRadius: 5,
    paddingHorizontal: 10,
    backgroundColor: "#e9ecef",
    color: "#aaa",
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
  loader: { flex: 1, justifyContent: "center", alignItems: "center" },
  listFeedback: { marginTop: 50 },
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
  retryText: { color: "white", fontWeight: "bold", fontSize: 15 },
  listContainer: { paddingBottom: 20 },
  contentWhenEmpty: { flexGrow: 1, justifyContent: "center" },
  itemContainer: {
    flexDirection: "row",
    backgroundColor: "white",
    paddingVertical: 12,
    paddingHorizontal: 15,
    alignItems: "center",
  },
  separator: { height: 1, backgroundColor: "#f0f0f0", marginLeft: 15 },
  itemInfo: { flex: 1, marginRight: 10 },
  itemMovieTitle: { fontSize: 16, fontWeight: "bold", marginBottom: 3 },
  itemCinemaName: { fontSize: 14, color: "#555", marginBottom: 3 },
  itemTime: {
    fontSize: 14,
    color: "#008E97",
    fontWeight: "500",
    marginBottom: 3,
  },
  itemPrice: { fontSize: 13, color: "green", marginBottom: 3 },
  itemSeats: { fontSize: 12, color: "grey" },
  itemActions: { flexDirection: "row", alignItems: "center" },
  editButton: {
    backgroundColor: "#007bff",
    padding: 9,
    borderRadius: 5,
    marginRight: 8,
  },
  deleteButton: { backgroundColor: "#dc3545", padding: 9, borderRadius: 5 },
  emptyText: {
    textAlign: "center",
    fontSize: 16,
    color: "grey",
    paddingHorizontal: 20,
  },
});

export default ManageShowtimesScreen;
// --- END OF FILE ./screens/admin/ManageShowtimesScreen.js ---
