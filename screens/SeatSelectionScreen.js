// --- START OF FILE ./screens/SeatSelectionScreen.js ---

import React, { useState, useEffect, useCallback } from "react";
import {
  StyleSheet,
  Text, // <<<--- ĐẢM BẢO ĐÃ IMPORT TEXT
  View,
  ScrollView,
  Pressable,
  ActivityIndicator,
  Alert,
  Dimensions,
  SafeAreaView,
} from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import api from "../api";
import { useSelector, useDispatch } from "react-redux";
import { addSeat, removeSeat, setShowtime } from "../redux/BookingReducer";
import Seat from "../components/Seat";
import { Ionicons } from "@expo/vector-icons"; // Import Ionicons cho legend

const { width } = Dimensions.get("window");
// --- Configuration for Seat Map ---
const NUM_COLUMNS = 10;
const SEAT_SIZE = Math.floor((width - 40) / (NUM_COLUMNS + 1.5));
const SEAT_ROWS = ["A", "B", "C", "D", "E", "F", "G", "H"];
// --- End Configuration ---

const SeatSelectionScreen = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const dispatch = useDispatch();
  // Mặc định showtimeId là null nếu không được truyền qua
  const showtimeId = route.params?.showtimeId || null;

  const [showtimeDetails, setShowtimeDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Lấy state từ Redux
  const selectedSeatsFromRedux = useSelector(
    (state) => state.booking.selectedSeats
  );
  const totalPrice = useSelector((state) => state.booking.totalPrice);
  const selectedMovie = useSelector((state) => state.booking.selectedMovie);
  const reduxShowtime = useSelector((state) => state.booking.selectedShowtime);

  // Fetch chi tiết suất chiếu
  const fetchShowtimeDetails = useCallback(async () => {
    // Kiểm tra showtimeId hợp lệ trước khi fetch
    if (!showtimeId) {
      setError("Showtime ID is missing or invalid.");
      setLoading(false);
      return;
    }
    console.log(`Fetching details for showtimeId: ${showtimeId}`);
    setLoading(true);
    setError(null);
    try {
      const response = await api.get(`/showtimes/${showtimeId}`);
      setShowtimeDetails(response.data);
      // Cập nhật Redux nếu cần
      if (JSON.stringify(response.data) !== JSON.stringify(reduxShowtime)) {
        dispatch(setShowtime(response.data));
      }
    } catch (err) {
      console.error(
        "Error fetching showtime details:",
        err.response?.data || err.message
      );
      setError("Failed to load seating information. Please try again.");
      setShowtimeDetails(null);
    } finally {
      setLoading(false);
    }
    // }, [showtimeId, dispatch, reduxShowtime]); // Loại bỏ reduxShowtime khỏi dependency nếu nó gây fetch lại không cần thiết
  }, [showtimeId, dispatch]); // Chỉ phụ thuộc vào showtimeId và dispatch

  useEffect(() => {
    fetchShowtimeDetails();
    // Đặt tiêu đề header
    navigation.setOptions({ title: selectedMovie?.title || "Select Seats" });
  }, [fetchShowtimeDetails, navigation, selectedMovie]);

  // --- Seat Selection Logic ---
  const handleSelectSeat = useCallback(
    (seatId) => {
      dispatch(addSeat(seatId));
    },
    [dispatch]
  );

  const handleDeselectSeat = useCallback(
    (seatId) => {
      dispatch(removeSeat(seatId));
    },
    [dispatch]
  );

  const handleProceed = () => {
    if (selectedSeatsFromRedux.length === 0) {
      Alert.alert("No Seats Selected", "Please select at least one seat.");
      return;
    }
    navigation.navigate("BookingSummary");
  };

  // Xác định trạng thái ghế
  const getSeatStatus = useCallback(
    (seatId) => {
      const bookedSeats =
        showtimeDetails?.bookedSeats || reduxShowtime?.bookedSeats || [];
      if (bookedSeats.includes(seatId)) return "booked";
      if (selectedSeatsFromRedux.includes(seatId)) return "selected";
      return "available";
      // }, [showtimeDetails, selectedSeatsFromRedux, reduxShowtime]); // Loại bỏ reduxShowtime nếu gây lỗi
    },
    [showtimeDetails, selectedSeatsFromRedux]
  ); // Chỉ phụ thuộc vào bookedSeats lấy từ API và state Redux

  // --- Render Loading/Error ---
  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#00CED1" />
      </View>
    );
  }
  // Luôn kiểm tra error trước khi kiểm tra reduxShowtime
  if (error) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>{error}</Text>
        <Pressable onPress={fetchShowtimeDetails} style={styles.retryButton}>
          <Text style={styles.retryText}>Retry</Text>
        </Pressable>
      </View>
    );
  }
  // Nếu không loading, không error, nhưng reduxShowtime vẫn null (có thể do lỗi logic khác)
  if (!reduxShowtime) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>
          Showtime details are unavailable. Please go back.
        </Text>
        {/* Có thể thêm nút Back */}
        <Pressable
          onPress={() => navigation.goBack()}
          style={styles.retryButton}
        >
          <Text style={styles.retryText}>Go Back</Text>
        </Pressable>
      </View>
    );
  }

  // --- Main Render ---
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Screen Indicator */}
        <View style={styles.screenContainer}>
          <View style={styles.screenCurve} />
          {/* === BỌC VĂN BẢN BẰNG <Text> === */}
          <Text style={styles.screenText}>SCREEN</Text>
        </View>

        {/* Seat Map */}
        <ScrollView
          contentContainerStyle={styles.seatMapContainer}
          showsVerticalScrollIndicator={false}
        >
          {SEAT_ROWS.map((row) => (
            <View key={row} style={styles.seatRow}>
              {/* === BỌC VĂN BẢN BẰNG <Text> === */}
              <Text style={styles.rowLabel}>{row}</Text>
              <View style={styles.seatsInRow}>
                {Array.from({ length: NUM_COLUMNS }, (_, i) => i + 1).map(
                  (number) => {
                    const seatId = `${row}${number}`;
                    const status = getSeatStatus(seatId);
                    return (
                      <Seat
                        key={seatId}
                        seatId={seatId}
                        status={status}
                        size={SEAT_SIZE}
                        onSelect={handleSelectSeat}
                        onDeselect={handleDeselectSeat}
                      />
                    );
                  }
                )}
              </View>
              {/* === BỌC VĂN BẢN BẰNG <Text> === */}
              <Text style={styles.rowLabel}>{row}</Text>
            </View>
          ))}
        </ScrollView>

        {/* Legend */}
        <View style={styles.legendContainer}>
          <View style={styles.legendItem}>
            {/* Sử dụng Icon thay vì View để nhất quán nếu muốn */}
            {/* <Ionicons name="square-outline" size={18} color="#008E97" style={styles.legendIcon} /> */}
            <View style={[styles.legendSeat, styles.seatAvailable]} />
            {/* === BỌC VĂN BẢN BẰNG <Text> === */}
            <Text style={styles.legendText}>Available</Text>
          </View>
          <View style={styles.legendItem}>
            {/* <Ionicons name="checkbox" size={18} color="#FFC72C" style={styles.legendIcon} /> */}
            <View style={[styles.legendSeat, styles.seatSelected]} />
            {/* === BỌC VĂN BẢN BẰNG <Text> === */}
            <Text style={styles.legendText}>Selected</Text>
          </View>
          <View style={styles.legendItem}>
            {/* <Ionicons name="square" size={18} color="#a0a0a0" style={styles.legendIcon} /> */}
            <View style={[styles.legendSeat, styles.seatBooked]} />
            {/* === BỌC VĂN BẢN BẰNG <Text> === */}
            <Text style={styles.legendText}>Booked</Text>
          </View>
        </View>

        {/* Booking Summary Footer */}
        <View style={styles.footer}>
          <View style={styles.footerTextContainer}>
            {/* === BỌC VĂN BẢN VÀ BIẾN BẰNG <Text> === */}
            <Text style={styles.selectedSeatsText} numberOfLines={1}>
              {selectedSeatsFromRedux.length > 0
                ? `Seats: ${selectedSeatsFromRedux.join(", ")}`
                : "Select your seats"}
            </Text>
            {/* === BỌC VĂN BẢN VÀ BIẾN BẰNG <Text> === */}
            <Text style={styles.totalPriceText}>
              Total: ${totalPrice.toFixed(2)}
            </Text>
          </View>
          <Pressable
            style={[
              styles.proceedButton,
              selectedSeatsFromRedux.length === 0 &&
                styles.proceedButtonDisabled,
            ]}
            onPress={handleProceed}
            disabled={selectedSeatsFromRedux.length === 0}
          >
            {/* === BỌC VĂN BẢN BẰNG <Text> === */}
            <Text style={styles.proceedButtonText}>Proceed</Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
};

export default SeatSelectionScreen;

// --- Styles --- (Giữ nguyên)
const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "white" },
  container: { flex: 1 },
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
  screenContainer: {
    paddingVertical: 10,
    alignItems: "center",
    marginBottom: 25,
    marginTop: 10,
  },
  screenCurve: {
    width: "70%",
    height: 20,
    borderTopLeftRadius: 100,
    borderTopRightRadius: 100,
    backgroundColor: "transparent",
    borderWidth: 3,
    borderBottomWidth: 0,
    borderColor: "#666",
    marginBottom: 5,
  },
  screenText: {
    fontSize: 13,
    fontWeight: "bold",
    color: "#666",
    letterSpacing: 4,
  }, // <--- Đã nằm trong <Text>
  seatMapContainer: {
    paddingHorizontal: 10,
    alignItems: "center",
    paddingBottom: 20,
  },
  seatRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: SEAT_SIZE * 0.2,
    justifyContent: "center",
  },
  rowLabel: {
    width: 25,
    textAlign: "center",
    color: "darkgrey",
    fontWeight: "bold",
    fontSize: 12,
  }, // <--- Đã nằm trong <Text>
  seatsInRow: { flexDirection: "row" },
  legendContainer: {
    flexDirection: "row",
    justifyContent: "space-evenly",
    paddingVertical: 15,
    borderTopWidth: 1,
    borderTopColor: "#eee",
    backgroundColor: "#f8f9fa",
  },
  legendItem: { flexDirection: "row", alignItems: "center" },
  legendSeat: {
    width: 16,
    height: 16,
    borderRadius: 3,
    borderWidth: 1,
    marginRight: 6,
  },
  seatAvailable: { borderColor: "#008E97", backgroundColor: "transparent" },
  seatSelected: { borderColor: "#FFA000", backgroundColor: "#FFC72C" },
  seatBooked: { borderColor: "#a0a0a0", backgroundColor: "#e0e0e0" },
  legendText: { fontSize: 12, color: "gray" }, // <--- Đã nằm trong <Text>
  legendIcon: { marginRight: 6 }, // <<< Thêm style này nếu dùng Icon
  footer: {
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderTopWidth: 1,
    borderTopColor: "#ccc",
    backgroundColor: "white",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  footerTextContainer: { flex: 1, marginRight: 15 },
  selectedSeatsText: { fontSize: 13, color: "#555", marginBottom: 3 }, // <--- Đã nằm trong <Text>
  totalPriceText: { fontSize: 17, fontWeight: "bold", color: "black" }, // <--- Đã nằm trong <Text>
  proceedButton: {
    backgroundColor: "#FEBE10",
    paddingVertical: 12,
    paddingHorizontal: 35,
    borderRadius: 25,
  },
  proceedButtonDisabled: { backgroundColor: "#cccccc" },
  proceedButtonText: { color: "white", fontSize: 16, fontWeight: "bold" }, // <--- Đã nằm trong <Text>
});

// --- END OF FILE ./screens/SeatSelectionScreen.js ---
