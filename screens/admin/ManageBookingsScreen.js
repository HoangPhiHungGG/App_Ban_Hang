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
  TextInput,
  ScrollView,
  Button,
  Platform,
} from "react-native";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import api from "../../api";
import { Ionicons } from "@expo/vector-icons";
import DropDownPicker from "react-native-dropdown-picker";
import DateTimePicker from "@react-native-community/datetimepicker";

const ManageBookingsScreen = () => {
  const navigation = useNavigation();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  // Filter States
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState(null);
  const [filterDate, setFilterDate] = useState(null);
  const [statusOpen, setStatusOpen] = useState(false);
  const [showFilterDatePicker, setShowFilterDatePicker] = useState(false);

  const statusItems = [
    { label: "Tất cả", value: null },
    { label: "Đã thanh toán", value: "paid" },
    { label: "Chờ thanh toán", value: "pending" },
    { label: "Thanh toán thất bại", value: "failed" },
    { label: "Đã huỷ/Đã hoàn tiền", value: "refunded" },
  ];

  // Helper to format date for API query
  const formatDateForAPI = (date) =>
    date ? date.toISOString().split("T")[0] : null;

  // Fetch bookings with filters
  const fetchAdminBookings = useCallback(
    async (isRefresh = false) => {
      if (!isRefresh && !loading) setLoading(true);
      if (isRefresh) setRefreshing(true);
      setError(null);

      try {
        const params = {};
        if (searchQuery.trim()) params.search = searchQuery.trim();
        if (filterStatus !== null) params.status = filterStatus;
        if (filterDate) params.date = formatDateForAPI(filterDate);

        const response = await api.get("/admin/bookings", { params });
        const fetchedBookings = Array.isArray(response.data?.bookings)
          ? response.data.bookings
          : [];
        setBookings(fetchedBookings);
      } catch (err) {
        const errorMsg =
          err.response?.data?.message ||
          err.message ||
          "Unknown error fetching bookings.";
        setError("Could not load bookings. Please try again or check filters.");
        setBookings([]);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [searchQuery, filterStatus, filterDate]
  );

  // Debounced fetch on filter change
  useEffect(() => {
    const handler = setTimeout(() => {
      if (!refreshing) fetchAdminBookings(false);
    }, 500);
    return () => clearTimeout(handler);
  }, [searchQuery, filterStatus, filterDate, fetchAdminBookings]);

  // Fetch data when screen is focused
  useFocusEffect(
    useCallback(() => {
      fetchAdminBookings(false);
    }, [fetchAdminBookings])
  );

  // Pull-to-refresh handler
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchAdminBookings(true);
  }, [fetchAdminBookings]);

  // Date picker handlers
  const onFilterDateChange = (event, selectedDate) => {
    setShowFilterDatePicker(false);
    if (event.type === "set" && selectedDate) {
      if (
        !filterDate ||
        selectedDate.toDateString() !== filterDate.toDateString()
      ) {
        setFilterDate(selectedDate);
      }
    }
  };

  const showFilterDatepicker = () => setShowFilterDatePicker(true);
  const clearDateFilter = () => setFilterDate(null);

  // Action handlers
  const handleViewDetails = (booking) => {
    navigation.navigate("BookingConfirmation", { bookingDetails: booking });
  };

  const handleCancelBooking = (bookingId, bookingCode) => {
    Alert.alert("Confirm Cancellation", `Cancel booking ${bookingCode}?`, [
      { text: "Keep" },
      {
        text: "Cancel Booking",
        style: "destructive",
        onPress: async () => {
          try {
            await api.delete(`/admin/bookings/${bookingId}`);
            Alert.alert("Success", `Booking ${bookingCode} cancelled.`);
            setBookings((prev) => prev.filter((b) => b._id !== bookingId));
          } catch (error) {
            Alert.alert(
              "Error",
              error.response?.data?.message || "Could not cancel."
            );
          }
        },
      },
    ]);
  };

  // Render booking item
  const renderItem = ({ item }) => {
    const movieTitle = item.movie?.title ?? "N/A";
    const userName = item.user?.name ?? "N/A";
    const userContact = item.user?.email || "N/A";
    const cinemaName = item.cinema?.name ?? "N/A";
    const screenName = item.showtime?.screenName ?? "N/A";
    const showTime = item.showtime?.startTime
      ? new Date(item.showtime.startTime).toLocaleString("en-GB", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        })
      : "N/A";
    const seats = Array.isArray(item.seats) ? item.seats.join(", ") : "N/A";
    const status = item.paymentStatus || "N/A";
    const bookingCode = item.bookingId || "N/A";
    const bookingDate = item.bookingDate
      ? new Date(item.bookingDate).toLocaleDateString("en-GB")
      : "N/A";

    let statusStyle = styles.statusDefault;
    if (status === "paid") statusStyle = styles.statusPaid;
    else if (status === "pending") statusStyle = styles.statusPending;
    else if (status === "failed") statusStyle = styles.statusFailed;
    else if (status === "refunded" || status === "cancelled")
      statusStyle = styles.statusCancelled;

    return (
      <View style={styles.itemContainer}>
        <Pressable
          style={styles.itemInfo}
          onPress={() => handleViewDetails(item)}
        >
          <View style={styles.itemHeaderRow}>
            <Text style={styles.itemHeader}>ID: {bookingCode}</Text>
            <Text style={[styles.statusBadge, statusStyle]}>
              {status.toUpperCase()}
            </Text>
          </View>
          <Text style={styles.itemDetail} numberOfLines={1}>
            <Ionicons name="person-circle-outline" size={14} color="#555" />{" "}
            {userName} ({userContact})
          </Text>
          <Text style={styles.itemDetail} numberOfLines={1}>
            <Ionicons name="film-outline" size={14} color="#555" /> {movieTitle}
          </Text>
          <Text style={styles.itemDetail} numberOfLines={1}>
            <Ionicons name="business-outline" size={14} color="#555" />{" "}
            {cinemaName} - {screenName}
          </Text>
          <Text style={styles.itemDetail}>
            <Ionicons name="calendar-outline" size={14} color="#555" />{" "}
            {showTime}
          </Text>
          <Text style={styles.itemDetail}>
            <Ionicons name="pricetag-outline" size={14} color="#555" /> Seats:{" "}
            {seats} ({item.seats?.length || 0})
          </Text>
          <Text style={styles.itemDetail}>
            <Ionicons name="cash-outline" size={14} color="#555" /> Total: $
            {item.totalPrice?.toFixed(2) ?? "N/A"}
          </Text>
          <Text style={styles.itemDetail}>
            <Ionicons name="card-outline" size={14} color="#555" /> Method:{" "}
            {item.paymentMethod || "N/A"}
          </Text>
          <Text style={styles.itemDetail}>
            <Ionicons name="time-outline" size={14} color="#555" /> Booked:{" "}
            {bookingDate}
          </Text>
        </Pressable>
        {(status === "paid" || status === "pending") && (
          <View style={styles.itemActions}>
            <Pressable
              style={styles.cancelButton}
              onPress={() => handleCancelBooking(item._id, bookingCode)}
            >
              <Ionicons name="close-circle-outline" size={20} color="#dc3545" />
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </Pressable>
          </View>
        )}
      </View>
    );
  };

  // Render loading, error, or empty state
  const renderListFeedback = () => {
    if (loading && !refreshing) {
      return (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#008E97" />
        </View>
      );
    }
    if (error && !loading) {
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
            onPress={() => fetchAdminBookings(false)}
            style={styles.retryButton}
          >
            <Text style={styles.retryText}>Retry</Text>
          </Pressable>
        </ScrollView>
      );
    }
    if (!loading && !error && bookings.length === 0) {
      return (
        <View style={styles.centered}>
          <Ionicons
            name="receipt-outline"
            size={50}
            color="grey"
            style={{ marginBottom: 10 }}
          />
          <Text style={styles.emptyText}>
            No bookings found
            {searchQuery || filterStatus !== null || filterDate
              ? " matching filters"
              : ""}
            .
          </Text>
        </View>
      );
    }
    return null;
  };

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
          placeholder="Search ID, User Email, Movie..."
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
      <View style={[styles.filterContainer, { zIndex: 10 }]}>
        <Pressable
          onPress={showFilterDatepicker}
          style={styles.datePickerButton}
        >
          <Ionicons name="calendar-outline" size={18} color="#333" />
          <Text style={styles.datePickerText}>
            {filterDate ? filterDate.toLocaleDateString("en-GB") : "All Dates"}
          </Text>
          {filterDate && (
            <Pressable onPress={clearDateFilter} style={styles.clearDateButton}>
              <Ionicons name="close-circle" size={16} color="grey" />
            </Pressable>
          )}
        </Pressable>
        <DropDownPicker
          listMode="MODAL"
          open={statusOpen}
          value={filterStatus}
          items={statusItems}
          setOpen={setStatusOpen}
          setValue={setFilterStatus}
          placeholder="Filter Status"
          containerStyle={styles.dropdownFilter}
          style={styles.dropdownStyle}
          placeholderStyle={styles.placeholderStyle}
          zIndex={2000}
          modalTitle="Filter by Status"
        />
      </View>

      {/* Date Picker */}
      {showFilterDatePicker &&
        (Platform.OS === "android" ? (
          <DateTimePicker
            value={filterDate || new Date()}
            mode="date"
            display="default"
            onChange={onFilterDateChange}
          />
        ) : (
          <View style={styles.iosDatePickerContainer}>
            <DateTimePicker
              value={filterDate || new Date()}
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

      {/* Bookings List */}
      {renderListFeedback() || (
        <FlatList
          data={bookings}
          renderItem={renderItem}
          keyExtractor={(item) => item._id?.toString() || item.bookingId}
          contentContainerStyle={styles.listContainer}
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
    paddingVertical: 8,
    backgroundColor: "#f1f3f5",
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
    alignItems: "center",
    justifyContent: "space-between",
  },
  datePickerButton: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 5,
    paddingVertical: 8,
    paddingHorizontal: 10,
    backgroundColor: "white",
    height: 40,
    marginRight: 5,
  },
  datePickerText: {
    marginLeft: 6,
    fontSize: 14,
    color: "#333",
    marginRight: 5,
  },
  clearDateButton: { paddingLeft: 5 },
  dropdownFilter: { width: "48%", height: 40 },
  dropdownStyle: {
    borderColor: "#ccc",
    height: 40,
    minHeight: 40,
    backgroundColor: "white",
  },
  placeholderStyle: { color: "grey", fontSize: 14 },
  iosDatePickerContainer: {
    backgroundColor: "white",
    borderTopWidth: 1,
    borderColor: "#ccc",
    paddingBottom: 10,
  },
  listContainer: { paddingBottom: 20 },
  itemContainer: { backgroundColor: "white", padding: 15 },
  separator: { height: 8, backgroundColor: "#f0f0f0" },
  itemInfo: { marginBottom: 10 },
  itemHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  itemHeader: {
    fontSize: 13,
    fontWeight: "600",
    color: "#6c757d",
    flexShrink: 1,
    marginRight: 5,
  },
  statusBadge: {
    fontSize: 10,
    fontWeight: "bold",
    paddingVertical: 3,
    paddingHorizontal: 7,
    borderRadius: 8,
    overflow: "hidden",
    textTransform: "uppercase",
    textAlign: "center",
  },
  itemDetail: {
    fontSize: 14,
    color: "#444",
    marginBottom: 6,
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
  },
  statusDefault: { color: "#6c757d", backgroundColor: "#e9ecef" },
  statusPaid: { color: "white", backgroundColor: "#198754" },
  statusPending: { color: "#333", backgroundColor: "#ffc107" },
  statusFailed: { color: "white", backgroundColor: "#dc3545" },
  statusCancelled: { color: "#fff", backgroundColor: "#6c757d" },
  itemActions: {
    borderTopWidth: 1,
    borderTopColor: "#eee",
    paddingTop: 10,
    flexDirection: "row",
    justifyContent: "flex-end",
  },
  cancelButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: "#dc3545",
    borderRadius: 5,
  },
  cancelButtonText: {
    color: "#dc3545",
    marginLeft: 5,
    fontWeight: "500",
    fontSize: 13,
  },
  emptyText: {
    textAlign: "center",
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

export default ManageBookingsScreen;
