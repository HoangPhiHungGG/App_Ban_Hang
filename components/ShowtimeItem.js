import React from "react";
import { StyleSheet, Text, View, Pressable } from "react-native";

// This component might be used within ShowtimeScreen's renderItem
// Or you can integrate its styling directly into ShowtimeScreen's renderShowtimeItem

const ShowtimeItem = ({ item, onPress }) => {
  const time = item.startTime
    ? new Date(item.startTime).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      })
    : "N/A";
  const price =
    item.pricePerSeat != null ? `$${item.pricePerSeat.toFixed(2)}` : "N/A";

  return (
    <Pressable style={styles.timeButton} onPress={() => onPress(item)}>
      <Text style={styles.timeText}>{time}</Text>
      <Text style={styles.screenText}>{item.screenName || "Screen N/A"}</Text>
      <Text style={styles.priceText}>{price}</Text>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  timeButton: {
    backgroundColor: "white",
    paddingVertical: 12,
    paddingHorizontal: 15,
    marginHorizontal: 5, // Adjust spacing if used horizontally
    marginVertical: 6, // Space between times vertically
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#008E97", // Use theme color for border
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    minWidth: 100, // Ensure minimum width if used horizontally
  },
  timeText: {
    fontSize: 15,
    fontWeight: "bold",
    color: "#333",
  },
  screenText: {
    fontSize: 13,
    color: "gray",
    marginHorizontal: 10, // Add some spacing
  },
  priceText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#008E97", // Theme color for price
  },
});

export default ShowtimeItem;
