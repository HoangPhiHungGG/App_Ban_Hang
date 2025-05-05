import React from "react";
import { StyleSheet, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";

const Seat = ({ seatId, status, onSelect, onDeselect, size }) => {
  const isSelected = status === "selected";
  const isBooked = status === "booked";

  const handlePress = () => {
    if (isBooked) return; // Cannot select booked seats
    if (isSelected) {
      onDeselect(seatId);
    } else {
      onSelect(seatId);
    }
  };

  // Determine color based on status
  const iconColor = isBooked ? "#a0a0a0" : isSelected ? "white" : "#008E97";
  const backgroundColor = isSelected ? "#FFC72C" : "transparent";
  const borderColor = isBooked ? "#a0a0a0" : isSelected ? "#FFA000" : "#008E97";

  return (
    <Pressable
      onPress={handlePress}
      disabled={isBooked}
      style={[
        styles.seat,
        {
          width: size,
          height: size,
          margin: size * 0.08,
          borderColor: borderColor,
          backgroundColor: backgroundColor,
        },
        isBooked && styles.seatBooked, // Can add specific booked styles if needed
      ]}
    >
      {/* Using Icon for seat representation */}
      <Ionicons
        name="md-square" // Simple square icon
        size={size * 0.8}
        color={iconColor}
      />
      {/* Optional: Display seat ID text inside */}
      {/* <Text style={[styles.seatText, {fontSize: size * 0.4}]}>{seatId}</Text> */}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  seat: {
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 3,
    borderWidth: 1,
  },
  seatBooked: {
    // You can add opacity or specific styles for booked seats here
    backgroundColor: "#e0e0e0",
  },
  // seatText: {
  //     fontWeight: 'bold',
  //     position: 'absolute', // Overlay text on icon
  //     color: 'rgba(0,0,0,0.5)' // Adjust text visibility/color
  // },
});

export default Seat;
