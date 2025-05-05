import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { AntDesign } from "@expo/vector-icons";

const ReviewItem = ({ item }) => {
  // Helper to render stars based on rating
  const renderStars = (rating) => {
    return [...Array(5)].map((_, i) => (
      <AntDesign
        key={i}
        name={i < Math.round(rating) ? "star" : "staro"} // Round rating for stars
        size={14}
        color="#FFC72C"
      />
    ));
  };

  return (
    <View style={styles.reviewCard}>
      <View style={styles.reviewHeader}>
        <Text style={styles.reviewUser}>
          {item.user?.name || "Anonymous User"}
        </Text>
        <View style={styles.reviewRating}>{renderStars(item.rating)}</View>
      </View>
      {item.comment && ( // Only display comment if it exists
        <Text style={styles.reviewComment}>{item.comment}</Text>
      )}
      <Text style={styles.reviewDate}>
        {item.createdAt ? new Date(item.createdAt).toLocaleDateString() : ""}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  reviewCard: {
    backgroundColor: "#fff",
    padding: 15, // Increased padding
    borderRadius: 8, // More rounded
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#e8e8e8", // Lighter border
  },
  reviewHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8, // More space after header
  },
  reviewUser: {
    fontWeight: "bold",
    fontSize: 15, // Slightly larger user name
    color: "#333",
  },
  reviewRating: {
    flexDirection: "row",
  },
  reviewComment: {
    fontSize: 14,
    color: "#555",
    lineHeight: 19, // Better readability
    marginBottom: 8,
  },
  reviewDate: {
    fontSize: 11,
    color: "grey", // Use grey consistently
    textAlign: "right",
  },
});

export default ReviewItem;
