import React from "react";
import { StyleSheet, Text, View, Pressable, Image } from "react-native";

const BookingItem = ({ item, onPress }) => {
  // Format date and time for display
  const showDate = item.showtime?.startTime
    ? new Date(item.showtime.startTime).toLocaleDateString()
    : "N/A";
  const showTime = item.showtime?.startTime
    ? new Date(item.showtime.startTime).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      })
    : "N/A";

  // Determine status style
  let statusStyle = styles.statusText;
  if (item.paymentStatus === "paid")
    statusStyle = [styles.statusText, styles.statusPaid];
  else if (item.paymentStatus === "pending")
    statusStyle = [styles.statusText, styles.statusPending];
  else if (item.paymentStatus === "failed")
    statusStyle = [styles.statusText, styles.statusFailed];
  else if (item.paymentStatus === "refunded")
    statusStyle = [styles.statusText, styles.statusRefunded];

  return (
    <Pressable style={styles.itemContainer} onPress={() => onPress(item)}>
      <Image
        source={
          item.movie?.posterImage
            ? { uri: item.movie.posterImage }
            : require("../assets/favicon.png")
        } // Use placeholder
        style={styles.posterImage}
      />
      <View style={styles.detailsContainer}>
        <Text style={styles.movieTitle} numberOfLines={1}>
          {item.movie?.title || "Movie Title Unavailable"}
        </Text>
        <Text style={styles.cinemaText} numberOfLines={1}>
          {item.cinema?.name || "Cinema Unavailable"} (
          {item.cinema?.location?.city || "N/A"})
        </Text>
        <Text style={styles.dateTimeText}>
          {showDate} at {showTime}
        </Text>
        <Text style={styles.seatsText}>
          Seats: {item.seats?.join(", ") || "N/A"}
        </Text>
        <View style={styles.footer}>
          <Text style={statusStyle}>
            {item.paymentStatus
              ? item.paymentStatus.charAt(0).toUpperCase() +
                item.paymentStatus.slice(1)
              : "Unknown"}
          </Text>
          <Text style={styles.bookingIdText}>
            ID: {item.bookingId || "N/A"}
          </Text>
        </View>
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  itemContainer: {
    backgroundColor: "white",
    flexDirection: "row",
    marginHorizontal: 15,
    marginVertical: 8,
    borderRadius: 8,
    padding: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.18,
    shadowRadius: 1.0,
    elevation: 2, // Increased elevation slightly
    alignItems: "center",
  },
  posterImage: {
    width: 65, // Slightly larger poster
    height: 100,
    borderRadius: 4,
    marginRight: 12,
    backgroundColor: "#f0f0f0", // Placeholder background
  },
  detailsContainer: {
    flex: 1,
  },
  movieTitle: {
    fontSize: 16, // Slightly larger title
    fontWeight: "bold",
    marginBottom: 3,
  },
  cinemaText: {
    fontSize: 13,
    color: "#555",
    marginBottom: 3,
  },
  dateTimeText: {
    fontSize: 13,
    color: "#008E97",
    fontWeight: "500",
    marginVertical: 4,
  },
  seatsText: {
    fontSize: 13,
    color: "gray",
    marginBottom: 5,
    flexWrap: "wrap", // Allow seat text to wrap
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 5,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "bold",
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 10,
    overflow: "hidden", // Clip background to border radius
    alignSelf: "flex-start", // Don't take full width
    color: "#666", // Default color
    backgroundColor: "#f0f0f0", // Default background
  },
  statusPaid: { color: "white", backgroundColor: "#4CAF50" }, // Green
  statusPending: { color: "#333", backgroundColor: "#FFC107" }, // Amber/Yellow
  statusFailed: { color: "white", backgroundColor: "#F44336" }, // Red
  statusRefunded: { color: "#333", backgroundColor: "#BDBDBD" }, // Grey
  bookingIdText: {
    fontSize: 10,
    color: "#aaa",
  },
});

export default BookingItem;
