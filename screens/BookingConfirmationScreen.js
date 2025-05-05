// import React, { useEffect, useRef } from "react";
// import {
//   StyleSheet,
//   Text,
//   View,
//   SafeAreaView,
//   Pressable,
//   ScrollView,
//   ActivityIndicator,

// } from "react-native";
// import { useNavigation, useRoute } from "@react-navigation/native";
// import LottieView from "lottie-react-native";
// import QRCode from "react-native-qrcode-svg";
// import { Ionicons } from "@expo/vector-icons"; // For icons

// const BookingConfirmationScreen = () => {
//   const navigation = useNavigation();
//   const route = useRoute();
//   const animationRef = useRef(null);

//   // Get booking details passed via route params
//   // Provide default values if bookingDetails or its properties are missing
//   const bookingDetails = route.params?.bookingDetails || {};
//   const movie = bookingDetails.movie || { title: "N/A" };
//   const cinema = bookingDetails.cinema || {
//     name: "N/A",
//     location: { city: "N/A" },
//   };
//   const showtime = bookingDetails.showtime || {
//     screenName: "N/A",
//     startTime: null,
//   };
//   const seats = bookingDetails.seats || [];
//   const totalPrice = bookingDetails.totalPrice ?? 0; // Use nullish coalescing for default
//   const paymentMethod = bookingDetails.paymentMethod || "N/A";
//   const paymentStatus = bookingDetails.paymentStatus || "N/A";
//   const bookingId = bookingDetails.bookingId || "N/A";
//   const qrCodeData = bookingDetails.qrCodeData;

//   useEffect(() => {
//     // Play animation on mount
//     animationRef.current?.play();

//     // Navigate back to main screen after a delay
//     const timer = setTimeout(() => {
//       // Use replace to prevent user from navigating back to the confirmation screen
//       navigation.replace("Main");
//     }, 7000); // Longer delay (7 seconds)

//     // Cleanup timer when the component unmounts
//     return () => clearTimeout(timer);
//   }, [navigation]);

//   // Check if essential details are present
//   if (!bookingDetails || !bookingId || bookingId === "N/A") {
//     // Show loading or error if details are fundamentally missing
//     return (
//       <SafeAreaView style={[styles.container, styles.centered]}>
//         <ActivityIndicator size="large" color="#008E97" />
//         <Text style={styles.errorText}>Loading booking details...</Text>
//         {/* Add a manual go back button in case auto-redirect fails */}
//         <Pressable
//           onPress={() => navigation.replace("Main")}
//           style={styles.homeButton}
//         >
//           <Text style={styles.homeButtonText}>Go Home</Text>
//         </Pressable>
//       </SafeAreaView>
//     );
//   }

//   // Format date and time safely
//   const showDateStr = showtime.startTime
//     ? new Date(showtime.startTime).toLocaleDateString()
//     : "N/A";
//   const showTimeStr = showtime.startTime
//     ? new Date(showtime.startTime).toLocaleTimeString([], {
//         hour: "2-digit",
//         minute: "2-digit",
//         hour12: true,
//       })
//     : "N/A";

//   return (
//     <SafeAreaView style={styles.container}>
//       <ScrollView contentContainerStyle={styles.scrollContent}>
//         {/* Success Animation */}
//         <LottieView
//           ref={animationRef}
//           source={require("../assets/thumbs.json")} // Or a success/ticket animation
//           style={styles.lottieTop}
//           autoPlay={false} // Start manually or via ref
//           loop={false}
//           speed={0.8} // Slightly faster
//         />
//         <Text style={styles.title}>Booking Confirmed!</Text>
//         <Text style={styles.subtitle}>Thank you! Your tickets are booked.</Text>

//         {/* QR Code Section */}
//         <View style={styles.qrContainer}>
//           {qrCodeData ? (
//             <QRCode
//               value={qrCodeData} // Usually bookingId or a unique hash
//               size={width * 0.5} // QR code size relative to screen width
//               logoBackgroundColor="transparent"
//               // Optional: Add a logo in the center
//               // logo={require('../assets/logo_small.png')}
//               // logoSize={30}
//             />
//           ) : (
//             <View style={styles.qrPlaceholder}>
//               <Ionicons name="qr-code-outline" size={60} color="grey" />
//               <Text style={styles.qrPlaceholderText}>QR Code Unavailable</Text>
//             </View>
//           )}
//           <Text style={styles.bookingId}>Booking ID: {bookingId}</Text>
//         </View>

//         {/* Booking Details Card */}
//         <View style={styles.detailsCard}>
//           <Text style={styles.movieTitle}>{movie.title}</Text>
//           <View style={styles.detailItem}>
//             <Ionicons
//               name="location-outline"
//               size={16}
//               color="grey"
//               style={styles.icon}
//             />
//             <Text style={styles.detailText}>
//               {cinema.name} ({cinema.location.city})
//             </Text>
//           </View>
//           <View style={styles.detailItem}>
//             <Ionicons
//               name="calendar-outline"
//               size={16}
//               color="grey"
//               style={styles.icon}
//             />
//             <Text style={styles.detailText}>{showDateStr}</Text>
//           </View>
//           <View style={styles.detailItem}>
//             <Ionicons
//               name="time-outline"
//               size={16}
//               color="grey"
//               style={styles.icon}
//             />
//             <Text style={styles.detailText}>
//               {showTimeStr} (Screen: {showtime.screenName})
//             </Text>
//           </View>
//           <View style={styles.detailItem}>
//             <Ionicons
//               name="pricetag-outline"
//               size={16}
//               color="grey"
//               style={styles.icon}
//             />
//             <Text style={styles.detailText}>
//               ${totalPrice.toFixed(2)} ({paymentMethod} - {paymentStatus})
//             </Text>
//           </View>
//           <View style={styles.detailItem}>
//             <Ionicons
//               name="people-outline"
//               size={16}
//               color="grey"
//               style={styles.icon}
//             />
//             <Text style={[styles.detailText, styles.seatsText]}>
//               {seats.join(", ")} ({seats.length} Ticket
//               {seats.length !== 1 ? "s" : ""})
//             </Text>
//           </View>
//         </View>

//         {/* Sparkle Animation Overlay */}
//         <LottieView
//           source={require("../assets/sparkle.json")}
//           style={styles.lottieSparkle}
//           autoPlay
//           loop={false}
//           speed={0.7}
//           pointerEvents="none" // Make sparkle touch-through
//         />

//         {/* Home Button */}
//         <Pressable
//           onPress={() => navigation.replace("Main")}
//           style={styles.homeButton}
//         >
//           <Ionicons
//             name="home-outline"
//             size={20}
//             color="white"
//             style={styles.icon}
//           />
//           <Text style={styles.homeButtonText}>Back to Home</Text>
//         </Pressable>
//       </ScrollView>
//     </SafeAreaView>
//   );
// };

// export default BookingConfirmationScreen;

// const styles = StyleSheet.create({
//   safeArea: { flex: 1, backgroundColor: "white" },
//   container: { flex: 1 },
//   centered: { justifyContent: "center", alignItems: "center" },
//   scrollContent: {
//     alignItems: "center",
//     paddingBottom: 40,
//     paddingHorizontal: 20,
//   },
//   lottieTop: { height: 180, width: 220, marginTop: 15, marginBottom: 0 },
//   title: {
//     marginTop: 5,
//     fontSize: 26,
//     fontWeight: "bold",
//     textAlign: "center",
//     color: "#008E97",
//   },
//   subtitle: {
//     fontSize: 16,
//     color: "gray",
//     textAlign: "center",
//     marginBottom: 25,
//   },
//   qrContainer: {
//     alignItems: "center",
//     marginVertical: 20,
//     padding: 15,
//     backgroundColor: "white",
//     borderRadius: 12,
//     shadowColor: "#000",
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.1,
//     shadowRadius: 4,
//     elevation: 3,
//   },
//   qrPlaceholder: {
//     alignItems: "center",
//     justifyContent: "center",
//     width: width * 0.5,
//     height: width * 0.5,
//     backgroundColor: "#f0f0f0",
//     borderRadius: 8,
//   },
//   qrPlaceholderText: { marginTop: 10, color: "grey", fontSize: 14 },
//   bookingId: { fontSize: 13, color: "#555", fontWeight: "600", marginTop: 10 },
//   detailsCard: {
//     backgroundColor: "white",
//     borderRadius: 10,
//     padding: 20,
//     width: "100%",
//     marginBottom: 30,
//     borderWidth: 1,
//     borderColor: "#eee",
//   },
//   movieTitle: {
//     fontSize: 19,
//     fontWeight: "bold",
//     textAlign: "center",
//     marginBottom: 15,
//     color: "#333",
//   },
//   detailItem: { flexDirection: "row", alignItems: "center", marginBottom: 8 }, // Row for icon + text
//   icon: { marginRight: 8 },
//   detailText: { fontSize: 14.5, color: "#555", flexShrink: 1 }, // Allow text wrapping
//   seatsText: { fontWeight: "bold", color: "#008E97" },
//   lottieSparkle: {
//     height: 350,
//     position: "absolute",
//     top: 80,
//     width: 350,
//     alignSelf: "center",
//     opacity: 0.7,
//   },
//   errorText: {
//     fontSize: 18,
//     color: "red",
//     textAlign: "center",
//     marginBottom: 15,
//   },
//   homeButton: {
//     flexDirection: "row",
//     marginTop: 25,
//     backgroundColor: "#008E97",
//     paddingVertical: 12,
//     paddingHorizontal: 30,
//     borderRadius: 25,
//     alignItems: "center",
//     justifyContent: "center",
//   },
//   homeButtonText: {
//     color: "white",
//     fontSize: 16,
//     fontWeight: "bold",
//     marginLeft: 5,
//   },
// });

//
import React, { useEffect, useRef } from "react";
import {
  StyleSheet,
  Text,
  View,
  SafeAreaView,
  Pressable,
  ScrollView,
  ActivityIndicator,
  Dimensions, // ✅ Thêm dòng này
} from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import LottieView from "lottie-react-native";
import QRCode from "react-native-qrcode-svg";
import { Ionicons } from "@expo/vector-icons";

const BookingConfirmationScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const animationRef = useRef(null);

  const { width } = Dimensions.get("window"); // ✅ Khai báo width

  const bookingDetails = route.params?.bookingDetails || {};
  const movie = bookingDetails.movie || { title: "N/A" };
  const cinema = bookingDetails.cinema || {
    name: "N/A",
    location: { city: "N/A" },
  };
  const showtime = bookingDetails.showtime || {
    screenName: "N/A",
    startTime: null,
  };
  const seats = bookingDetails.seats || [];
  const totalPrice = bookingDetails.totalPrice ?? 0;
  const paymentMethod = bookingDetails.paymentMethod || "N/A";
  const paymentStatus = bookingDetails.paymentStatus || "N/A";
  const bookingId = bookingDetails.bookingId || "N/A";
  const qrCodeData = bookingDetails.qrCodeData;

  useEffect(() => {
    animationRef.current?.play();
    const timer = setTimeout(() => {
      navigation.replace("Main");
    }, 7000);
    return () => clearTimeout(timer);
  }, [navigation]);

  if (!bookingDetails || !bookingId || bookingId === "N/A") {
    return (
      <SafeAreaView style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color="#008E97" />
        <Text style={styles.errorText}>Loading booking details...</Text>
        <Pressable
          onPress={() => navigation.replace("Main")}
          style={styles.homeButton}
        >
          <Text style={styles.homeButtonText}>Go Home</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  const showDateStr = showtime.startTime
    ? new Date(showtime.startTime).toLocaleDateString()
    : "N/A";
  const showTimeStr = showtime.startTime
    ? new Date(showtime.startTime).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      })
    : "N/A";

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <LottieView
          ref={animationRef}
          source={require("../assets/thumbs.json")}
          style={styles.lottieTop}
          autoPlay={false}
          loop={false}
          speed={0.8}
        />
        <Text style={styles.title}>Booking Confirmed!</Text>
        <Text style={styles.subtitle}>Thank you! Your tickets are booked.</Text>

        <View style={styles.qrContainer}>
          {qrCodeData ? (
            <QRCode
              value={qrCodeData}
              size={width * 0.5} // ✅ Sử dụng width đã khai báo
              logoBackgroundColor="transparent"
            />
          ) : (
            <View
              style={{
                alignItems: "center",
                justifyContent: "center",
                width: width * 0.5,
                height: width * 0.5,
                backgroundColor: "#f0f0f0",
                borderRadius: 8,
              }}
            >
              <Ionicons name="qr-code-outline" size={60} color="grey" />
              <Text style={styles.qrPlaceholderText}>QR Code Unavailable</Text>
            </View>
          )}
          <Text style={styles.bookingId}>Booking ID: {bookingId}</Text>
        </View>

        <View style={styles.detailsCard}>
          <Text style={styles.movieTitle}>{movie.title}</Text>
          <View style={styles.detailItem}>
            <Ionicons
              name="location-outline"
              size={16}
              color="grey"
              style={styles.icon}
            />
            <Text style={styles.detailText}>
              {cinema.name} ({cinema.location})
            </Text>
          </View>
          <View style={styles.detailItem}>
            <Ionicons
              name="calendar-outline"
              size={16}
              color="grey"
              style={styles.icon}
            />
            <Text style={styles.detailText}>{showDateStr}</Text>
          </View>
          <View style={styles.detailItem}>
            <Ionicons
              name="time-outline"
              size={16}
              color="grey"
              style={styles.icon}
            />
            <Text style={styles.detailText}>
              {showTimeStr} (Screen: {showtime.screenName})
            </Text>
          </View>
          <View style={styles.detailItem}>
            <Ionicons
              name="pricetag-outline"
              size={16}
              color="grey"
              style={styles.icon}
            />
            <Text style={styles.detailText}>
              ${totalPrice.toFixed(2)} ({paymentMethod} - {paymentStatus})
            </Text>
          </View>
          <View style={styles.detailItem}>
            <Ionicons
              name="people-outline"
              size={16}
              color="grey"
              style={styles.icon}
            />
            <Text style={[styles.detailText, styles.seatsText]}>
              {seats.join(", ")} ({seats.length} Ticket
              {seats.length !== 1 ? "s" : ""})
            </Text>
          </View>
        </View>

        <LottieView
          source={require("../assets/sparkle.json")}
          style={styles.lottieSparkle}
          autoPlay
          loop={false}
          speed={0.7}
          pointerEvents="none"
        />

        <Pressable
          onPress={() => navigation.replace("Main")}
          style={styles.homeButton}
        >
          <Ionicons
            name="home-outline"
            size={20}
            color="white"
            style={styles.icon}
          />
          <Text style={styles.homeButtonText}>Back to Home</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
};

export default BookingConfirmationScreen;

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "white" },
  container: { flex: 1 },
  centered: { justifyContent: "center", alignItems: "center" },
  scrollContent: {
    alignItems: "center",
    paddingBottom: 40,
    paddingHorizontal: 20,
  },
  lottieTop: { height: 180, width: 220, marginTop: 15, marginBottom: 0 },
  title: {
    marginTop: 5,
    fontSize: 26,
    fontWeight: "bold",
    textAlign: "center",
    color: "#008E97",
  },
  subtitle: {
    fontSize: 16,
    color: "gray",
    textAlign: "center",
    marginBottom: 25,
  },
  qrContainer: {
    alignItems: "center",
    marginVertical: 20,
    padding: 15,
    backgroundColor: "white",
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  qrPlaceholderText: { marginTop: 10, color: "grey", fontSize: 14 },
  bookingId: { fontSize: 13, color: "#555", fontWeight: "600", marginTop: 10 },
  detailsCard: {
    backgroundColor: "white",
    borderRadius: 10,
    padding: 20,
    width: "100%",
    marginBottom: 30,
    borderWidth: 1,
    borderColor: "#eee",
  },
  movieTitle: {
    fontSize: 19,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 15,
    color: "#333",
  },
  detailItem: { flexDirection: "row", alignItems: "center", marginBottom: 8 },
  icon: { marginRight: 8 },
  detailText: { fontSize: 14.5, color: "#555", flexShrink: 1 },
  seatsText: { fontWeight: "bold", color: "#008E97" },
  lottieSparkle: {
    height: 350,
    position: "absolute",
    top: 80,
    width: 350,
    alignSelf: "center",
    opacity: 0.7,
  },
  errorText: {
    fontSize: 18,
    color: "red",
    textAlign: "center",
    marginBottom: 15,
  },
  homeButton: {
    flexDirection: "row",
    marginTop: 25,
    backgroundColor: "#008E97",
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 25,
    alignItems: "center",
    justifyContent: "center",
  },
  homeButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
    marginLeft: 5,
  },
});
