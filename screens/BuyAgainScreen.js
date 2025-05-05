import React from "react";
import { StyleSheet, Text, View, SafeAreaView } from "react-native";

const BuyAgainScreen = () => {
  // TODO:
  // 1. Fetch booking history (similar to BookingHistoryScreen)
  // 2. Process history: Identify unique movies/showtimes previously booked.
  // 3. Check if those showtimes are still available or find similar upcoming ones.
  // 4. Render a list of previously booked items with a "Book Again" button.
  // 5. Handle navigation to the booking flow when "Book Again" is pressed.

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Text style={styles.title}>Buy Again</Text>
        <Text style={styles.placeholder}>Feature coming soon!</Text>
        <Text style={styles.description}>
          This screen will show movies you've booked before, allowing you to
          quickly book tickets again for similar showtimes.
        </Text>
      </View>
    </SafeAreaView>
  );
};

export default BuyAgainScreen;

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "white" },
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 15,
  },
  placeholder: {
    fontSize: 18,
    color: "grey",
    marginBottom: 10,
  },
  description: {
    fontSize: 14,
    color: "darkgrey",
    textAlign: "center",
  },
});
