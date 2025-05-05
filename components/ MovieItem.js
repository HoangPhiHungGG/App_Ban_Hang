import React from "react";
import {
  StyleSheet,
  Text,
  View,
  Pressable,
  Image,
  Dimensions,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { AntDesign } from "@expo/vector-icons"; // For rating stars

const { width } = Dimensions.get("window");
const ITEM_WIDTH = width / 2 - 30; // Adjust for margins/padding

const MovieItem = ({ item }) => {
  const navigation = useNavigation();

  const handlePress = () => {
    // Navigate to MovieDetail screen, passing the movie's ID
    navigation.navigate("MovieDetail", { movieId: item._id });
  };

  // Simple star rating display helper
  const renderStars = (rating) => {
    const fullStars = Math.floor(rating);
    const halfStar = rating % 1 >= 0.5; // Check for half star
    const stars = [];
    for (let i = 0; i < fullStars; i++) {
      stars.push(
        <AntDesign key={`full_${i}`} name="star" size={14} color="#FFC72C" />
      );
    }
    if (halfStar && stars.length < 5) {
      // Add half star if applicable and space allows
      stars.push(
        <AntDesign key="half" name="star" size={14} color="#FFC72C" />
      ); // Using full star for half for simplicity here
    }
    // Fill remaining with empty stars if needed (optional)
    const emptyStars = 5 - stars.length;
    for (let i = 0; i < emptyStars; i++) {
      stars.push(
        <AntDesign key={`empty_${i}`} name="staro" size={14} color="#ccc" />
      );
    }
    return stars;
  };

  // Fallback image if posterImage is missing
  const imageSource = item?.posterImage
    ? { uri: item.posterImage }
    : require("../assets/favicon.png"); // Assume you have a local placeholder

  return (
    <Pressable style={styles.container} onPress={handlePress}>
      <Image
        style={styles.poster}
        source={imageSource}
        resizeMode="cover" // Use cover for posters
      />
      <View style={styles.textContainer}>
        <Text numberOfLines={2} style={styles.title}>
          {item?.title || "Untitled Movie"}
        </Text>
        <Text numberOfLines={1} style={styles.genre}>
          {item?.genre?.join(", ") || "Unknown Genre"}
        </Text>
        <View style={styles.ratingContainer}>
          {renderStars(item?.rating)}
          <Text style={styles.ratingText}>
            {" "}
            ({item?.rating?.toFixed(1) || "N/A"})
          </Text>
        </View>
      </View>
    </Pressable>
  );
};

export default MovieItem;

// Add placeholder_poster.png to your assets folder

const styles = StyleSheet.create({
  container: {
    margin: 10,
    width: ITEM_WIDTH,
    backgroundColor: "#ffffff", // White background
    borderRadius: 8,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.23,
    shadowRadius: 2.62,
    elevation: 4,
    overflow: "hidden", // Clip shadow/content to rounded borders
  },
  poster: {
    width: "100%",
    height: ITEM_WIDTH * 1.5, // Maintain aspect ratio (approx 2:3)
  },
  textContainer: {
    padding: 8, // Add padding for text content
  },
  title: {
    fontSize: 14,
    fontWeight: "bold",
    marginBottom: 3,
    minHeight: 36, // Ensure space for two lines roughly
  },
  genre: {
    fontSize: 11,
    color: "gray",
    marginBottom: 4,
  },
  ratingContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: "auto", // Push rating to bottom if container has extra space
  },
  ratingText: {
    fontSize: 12,
    marginLeft: 3,
    color: "#666",
  },
});
