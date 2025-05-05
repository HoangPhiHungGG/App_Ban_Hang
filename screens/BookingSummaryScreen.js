import React, { useState, useContext } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Pressable,
  Image,
  Alert,
  ActivityIndicator,
  SafeAreaView, // Use SafeAreaView
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useSelector, useDispatch } from "react-redux";
import api from "../api";
import { clearBooking } from "../redux/BookingReducer";
import { UserType } from "../UserContext"; // To potentially show user info
import { Ionicons } from "@expo/vector-icons"; // Import icons

const BookingSummaryScreen = () => {
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const { userId } = useContext(UserType); // Get user ID if needed

  // Get booking details from Redux state
  const bookingState = useSelector((state) => state.booking);
  const {
    selectedMovie,
    selectedCinema,
    selectedShowtime,
    selectedSeats,
    totalPrice,
  } = bookingState;

  const [loading, setLoading] = useState(false);
  // Default or fetch available payment methods
  const [paymentMethods, setPaymentMethods] = useState([
    "Credit Card",
    "PayPal",
    "VNPay",
    "Momo",
    "Cash on Delivery",
  ]); // Example
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState(
    paymentMethods[0]
  ); // Default to first option

  const handleConfirmBooking = async () => {
    // Double check required data
    if (
      !userId ||
      !selectedMovie ||
      !selectedCinema ||
      !selectedShowtime ||
      !selectedSeats ||
      selectedSeats.length === 0
    ) {
      Alert.alert(
        "Error",
        "Booking details are incomplete. Please go back and ensure movie, cinema, showtime, and seats are selected."
      );
      return;
    }
    if (!selectedPaymentMethod) {
      Alert.alert("Payment Method Required", "Please select a payment method.");
      return;
    }

    setLoading(true);
    try {
      const bookingData = {
        showtimeId: selectedShowtime._id,
        seats: selectedSeats,
        paymentMethod: selectedPaymentMethod,
        totalPrice: totalPrice,
        // userId is added by backend middleware
      };

      console.log("Sending booking data:", bookingData);
      const response = await api.post("/bookings", bookingData);
      console.log("Booking response:", response.data);

      if (response.status === 201 && response.data.booking) {
        // Booking successful (Backend handled seat locking and booking creation)
        const confirmedBookingDetails = response.data.booking;

        // --- Payment Step Placeholder ---
        // If payment is NOT handled by the backend immediately (e.g., needs redirect or client-side SDK)
        // you would handle that logic HERE *after* the booking is created with 'pending' status.
        // If payment fails after booking creation, you might need an endpoint to update the booking status to 'failed'.
        // For this example, we assume the backend marked it 'paid' or handles it fully.
        // --- End Payment Placeholder ---

        dispatch(clearBooking()); // Clear Redux booking state
        navigation.replace("BookingConfirmation", {
          bookingDetails: confirmedBookingDetails,
        });
      } else {
        // Throw error if status is not 201 or booking data is missing
        throw new Error(response.data?.message || "Booking creation failed");
      }
    } catch (error) {
      console.error(
        "Error confirming booking:",
        error.response?.data || error.message
      );
      Alert.alert(
        "Booking Failed",
        error.response?.data?.message ||
          "An error occurred. Your seats might have been taken. Please try again."
      );
      // Optional: Navigate back to seat selection?
      // navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  // --- Render Helper ---
  const DetailRow = ({ label, value, valueStyle }) => (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={[styles.detailValue, valueStyle]}>{value}</Text>
    </View>
  );

  // --- Render ---
  if (!selectedMovie || !selectedCinema || !selectedShowtime) {
    // Should not normally happen if navigation/state flow is correct
    return (
      <SafeAreaView style={[styles.container, styles.centered]}>
        <Text style={styles.errorText}>
          Incomplete booking details. Please start over.
        </Text>
        <Pressable
          onPress={() => navigation.popToTop()}
          style={styles.homeButton}
        >
          <Text style={styles.homeButtonText}>Go Home</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  // Format date/time once
  const showDate = new Date(selectedShowtime.startTime).toLocaleDateString();
  const showTime = new Date(selectedShowtime.startTime).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container}>
        {/* Movie Details */}
        <View style={styles.card}>
          <Image
            source={{ uri: selectedMovie.posterImage }}
            style={styles.posterImage}
          />
          <View style={styles.cardContent}>
            <Text style={styles.cardTitle}>{selectedMovie.title}</Text>
            <DetailRow label="Genre:" value={selectedMovie.genre?.join(", ")} />
            <DetailRow
              label="Duration:"
              value={`${selectedMovie.duration} min`}
            />
            <DetailRow label="Language:" value={selectedMovie.language} />
          </View>
        </View>

        {/* Cinema & Showtime Details */}
        <View style={styles.card}>
          <View style={styles.cardContent}>
            <Text style={styles.cardTitle}>{selectedCinema.name}</Text>
            <DetailRow
              label="Location:"
              value={`${selectedCinema.location?.address}, ${selectedCinema.location?.city}`}
            />
            <DetailRow label="Showtime:" value={`${showDate} at ${showTime}`} />
            <DetailRow label="Screen:" value={selectedShowtime.screenName} />
          </View>
        </View>

        {/* Seat & Price Details */}
        <View style={styles.card}>
          <View style={styles.cardContent}>
            <Text style={styles.cardTitle}>Ticket Details</Text>
            <DetailRow
              label="Seats:"
              value={selectedSeats.join(", ")}
              valueStyle={styles.seatsValue}
            />
            <DetailRow label="Tickets:" value={selectedSeats.length} />
            <DetailRow
              label="Price/Ticket:"
              value={`$${selectedShowtime.pricePerSeat.toFixed(2)}`}
            />
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Total Price:</Text>
              <Text style={styles.totalValue}>${totalPrice.toFixed(2)}</Text>
            </View>
          </View>
        </View>

        {/* Payment Method Selection */}
        <View style={styles.card}>
          <View style={styles.cardContent}>
            <Text style={styles.cardTitle}>Payment Method</Text>
            {/* Replace with a proper Picker or Radio Button Group */}
            {paymentMethods.map((method) => (
              <Pressable
                key={method}
                style={styles.paymentOption}
                onPress={() => setSelectedPaymentMethod(method)}
              >
                <Ionicons
                  name={
                    selectedPaymentMethod === method
                      ? "radio-button-on"
                      : "radio-button-off"
                  }
                  size={22}
                  color={selectedPaymentMethod === method ? "#008E97" : "grey"}
                />
                <Text style={styles.paymentText}>{method}</Text>
              </Pressable>
            ))}
            <Text style={styles.paymentInfo}>
              (Payment Gateway Integration Required)
            </Text>
          </View>
        </View>

        {/* Spacer */}
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Confirm Button Footer */}
      <View style={styles.footer}>
        <Pressable
          style={[
            styles.confirmButton,
            loading && styles.confirmButtonDisabled,
          ]}
          onPress={handleConfirmBooking}
          disabled={loading || !selectedPaymentMethod} // Disable if loading or no payment method
        >
          {loading ? (
            <ActivityIndicator size="small" color="#ffffff" />
          ) : (
            <Text style={styles.confirmButtonText}>Confirm & Book Now</Text>
          )}
        </Pressable>
      </View>
    </SafeAreaView>
  );
};

export default BookingSummaryScreen;

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#f8f9fa" },
  container: { flex: 1 },
  centered: { justifyContent: "center", alignItems: "center", padding: 20 },
  errorText: {
    fontSize: 16,
    color: "red",
    textAlign: "center",
    marginBottom: 15,
  },
  homeButton: {
    backgroundColor: "#008E97",
    paddingVertical: 10,
    paddingHorizontal: 25,
    borderRadius: 20,
  },
  homeButtonText: { color: "white", fontWeight: "bold", fontSize: 15 },
  card: {
    backgroundColor: "white",
    borderRadius: 8,
    marginHorizontal: 15,
    marginBottom: 15,
    padding: 15,
    flexDirection: "row",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1.5,
    elevation: 2,
  },
  posterImage: {
    width: 70,
    height: 105,
    borderRadius: 4,
    marginRight: 15,
    backgroundColor: "#eee",
  }, // Slightly smaller poster
  cardContent: { flex: 1, justifyContent: "center" },
  cardTitle: {
    fontSize: 17,
    fontWeight: "bold",
    marginBottom: 10,
    color: "#333",
  }, // Bolder title
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  detailLabel: {
    fontSize: 14,
    color: "#666",
    fontWeight: "500",
    marginRight: 5,
  },
  detailValue: {
    fontSize: 14,
    color: "#333",
    flexShrink: 1,
    textAlign: "right",
  }, // Allow value to shrink
  seatsValue: { color: "#008E97", fontWeight: "bold", fontSize: 14.5 },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: "#eee",
  },
  totalLabel: { fontSize: 16, fontWeight: "bold" },
  totalValue: { fontSize: 18, fontWeight: "bold", color: "#008E97" },
  paymentOption: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
  },
  paymentText: { fontSize: 15, marginLeft: 10 },
  paymentInfo: {
    fontSize: 12,
    color: "grey",
    marginTop: 10,
    fontStyle: "italic",
    textAlign: "center",
  },
  footer: {
    padding: 15,
    borderTopWidth: 1,
    borderTopColor: "#ddd",
    backgroundColor: "white",
  },
  confirmButton: {
    backgroundColor: "#FEBE10",
    padding: 15,
    borderRadius: 30,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  confirmButtonDisabled: { backgroundColor: "#cccccc" },
  confirmButtonText: { color: "white", fontSize: 17, fontWeight: "bold" },
});
