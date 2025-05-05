import React from "react";
import { StyleSheet, Text, View, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";

const CinemaItem = ({ item, onPress }) => {
  return (
    <Pressable style={styles.container} onPress={() => onPress(item)}>
      <Ionicons
        name="location-sharp"
        size={24}
        color="#008E97"
        style={styles.icon}
      />
      <View style={styles.textContainer}>
        <Text style={styles.name}>{item.name}</Text>
        <Text style={styles.address} numberOfLines={2}>
          {item.location?.address}, {item.location?.city}
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color="gray" />
    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "white",
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  icon: {
    marginRight: 15,
  },
  textContainer: {
    flex: 1, // Take available space
    marginRight: 10,
  },
  name: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 3,
  },
  address: {
    fontSize: 13,
    color: "gray",
  },
});

export default CinemaItem;
