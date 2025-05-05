import React, {
  useState,
  useEffect,
  useCallback,
  useContext,
  useRef,
} from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Pressable,
  Image,
  ActivityIndicator,
  Dimensions,
  Alert,
  TextInput, // For review comment
  Keyboard, // To dismiss keyboard
  SafeAreaView,
} from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import { Ionicons, AntDesign } from "@expo/vector-icons";
import YoutubePlayer from "react-native-youtube-iframe";
import api from "../api";
import { UserType } from "../UserContext";
import { useDispatch } from "react-redux";
import { setMovie } from "../redux/BookingReducer";
import ReviewItem from "../components/ReviewItem"; // Import ReviewItem component

const { width } = Dimensions.get("window");

const MovieDetailScreen = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const scrollViewRef = useRef(null); // Ref for scrolling

  // Ensure movieId is passed correctly
  const movieId = route.params?.movieId;

  const { userId } = useContext(UserType); // Get logged-in user ID

  const [movie, setMovieData] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showTrailer, setShowTrailer] = useState(false);

  // Review Form State
  const [userRating, setUserRating] = useState(0);
  const [userComment, setUserComment] = useState("");
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [userHasReviewed, setUserHasReviewed] = useState(false);
  const [tempRating, setTempRating] = useState(0); // For hover-like effect on stars

  const fetchMovieDetails = useCallback(async () => {
    if (!movieId) {
      console.error("MovieDetailScreen: movieId is missing from route params.");
      setError("Movie ID not provided.");
      setLoading(false);
      return;
    }
    console.log(`Fetching details for movieId: ${movieId}`);
    setLoading(true);
    setError(null);
    try {
      // Fetch movie and reviews in parallel for faster loading
      const [movieResponse, reviewsResponse] = await Promise.all([
        api.get(`/movies/${movieId}`),
        api.get(`/movies/${movieId}/reviews`),
      ]);

      setMovieData(movieResponse.data);
      dispatch(setMovie(movieResponse.data)); // Update Redux state

      setReviews(reviewsResponse.data);

      // Reset review state before checking
      setUserRating(0);
      setUserComment("");
      setUserHasReviewed(false);

      // Check if current user has reviewed this movie
      if (userId && Array.isArray(reviewsResponse.data)) {
        const existingReview = reviewsResponse.data.find(
          (review) => review.user?._id === userId || review.user === userId // Handle populated vs non-populated user field
        );
        if (existingReview) {
          console.log("Existing review found:", existingReview);
          setUserRating(existingReview.rating);
          setUserComment(existingReview.comment || "");
          setUserHasReviewed(true);
        } else {
          console.log("No existing review found for user:", userId);
        }
      }
    } catch (err) {
      console.error(
        "Error fetching movie details/reviews:",
        err.response?.data || err.message
      );
      setError("Failed to load movie details. Please try again.");
      // If movie fetch failed specifically
      if (
        err.config?.url?.includes(`/movies/${movieId}`) &&
        !err.config?.url?.includes("/reviews")
      ) {
        setMovieData(null); // Ensure movie is null on error
      }
    } finally {
      setLoading(false);
    }
  }, [movieId, userId, dispatch]);

  useEffect(() => {
    fetchMovieDetails();
    // Optionally set header title dynamically
    // navigation.setOptions({ title: movie?.title || 'Movie Details' });
  }, [fetchMovieDetails, navigation]); // Add navigation as dependency if using setOptions

  const handleBookTickets = () => {
    if (!movie) return;
    // Ensure movie details are passed correctly if needed by Showtime screen
    navigation.navigate("Showtimes", {
      movieId: movie._id,
      movieTitle: movie.title,
    });
  };

  // Extract YouTube Video ID
  const getYoutubeVideoId = (url) => {
    if (!url) return null;
    const regExp =
      /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return match && match[2].length === 11 ? match[2] : null;
  };
  const videoId = getYoutubeVideoId(movie?.trailerUrl);

  const handleRatingSubmit = async () => {
    Keyboard.dismiss(); // Dismiss keyboard before submitting
    if (!userId) {
      Alert.alert("Login Required", "Please log in to submit a review.", [
        { text: "OK", onPress: () => navigation.navigate("Login") },
      ]);
      return;
    }
    if (userRating < 1 || userRating > 5) {
      Alert.alert("Invalid Rating", "Please select a rating (1-5 stars).");
      return;
    }

    setIsSubmittingReview(true);
    try {
      const response = await api.post(`/movies/${movieId}/reviews`, {
        rating: userRating,
        comment: userComment,
      });

      // Update UI optimistically or refetch
      // Optimistic update example (add/update review locally before refetching)
      // const newReview = response.data.review;
      // setReviews(prevReviews => {
      //     const existingIndex = prevReviews.findIndex(r => r._id === newReview._id || (r.user?._id === userId));
      //     if (existingIndex > -1) {
      //         const updatedReviews = [...prevReviews];
      //         updatedReviews[existingIndex] = newReview;
      //         return updatedReviews;
      //     } else {
      //         return [newReview, ...prevReviews];
      //     }
      // });
      // setUserHasReviewed(true); // Mark as reviewed

      // Or simply refetch for guaranteed consistency
      fetchMovieDetails(); // Refetch all details

      Alert.alert(
        "Success",
        userHasReviewed
          ? "Review updated successfully!"
          : "Review submitted successfully!"
      );
    } catch (err) {
      console.error(
        "Error submitting review:",
        err.response?.data || err.message
      );
      Alert.alert(
        "Error",
        err.response?.data?.message || "Failed to submit review."
      );
    } finally {
      setIsSubmittingReview(false);
    }
  };

  // Scroll to review section when user presses "Add Review"
  const scrollToReviewForm = () => {
    // This requires measuring the position of the review form, which is complex.
    // A simpler approach is to scroll down by a fixed amount or to the end.
    if (scrollViewRef.current) {
      scrollViewRef.current.scrollToEnd({ animated: true });
    }
    Alert.alert(
      "Info",
      "Scroll to review form - Needs accurate measurement or scrollToEnd"
    );
  };

  // --- Render Loading/Error States ---
  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#00CED1" />
      </View>
    );
  }
  if (error || !movie) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>
          {error || "Movie details not found."}
        </Text>
        <Pressable onPress={fetchMovieDetails} style={styles.retryButton}>
          <Text style={styles.retryText}>Retry</Text>
        </Pressable>
      </View>
    );
  }

  // --- Main Render ---
  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        ref={scrollViewRef}
        style={styles.container}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled" // Dismiss keyboard when tapping outside inputs
      >
        {/* Banner Image */}
        <Image
          source={
            movie.bannerImage
              ? { uri: movie.bannerImage }
              : movie.posterImage
              ? { uri: movie.posterImage }
              : require("../assets/favicon.png")
          }
          style={styles.bannerImage}
          resizeMode="cover"
        />

        {/* Basic Info Section */}
        <View style={styles.infoContainer}>
          <View style={styles.titleRow}>
            <Text style={styles.title}>{movie.title}</Text>
            <View style={styles.ratingContainer}>
              <AntDesign name="star" size={18} color="#FFC72C" />
              <Text style={styles.ratingAvgText}>
                {movie.rating?.toFixed(1) || "N/A"} / 5
              </Text>
            </View>
          </View>
          <Text style={styles.detailsText}>
            {movie.language} | {movie.duration} min |{" "}
            {new Date(movie.releaseDate).toLocaleDateString()}
          </Text>
          <Text style={styles.detailsText}>
            Genre: {movie.genre?.join(", ") || "N/A"}
          </Text>
          <Text style={styles.description}>{movie.description}</Text>
        </View>

        {/* Cast & Director */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Cast & Crew</Text>
          {movie.director && (
            <Text style={styles.detailsText}>
              <Text style={styles.boldText}>Director:</Text> {movie.director}
            </Text>
          )}
          {movie.cast && movie.cast.length > 0 && (
            <Text style={styles.detailsText}>
              <Text style={styles.boldText}>Cast:</Text> {movie.cast.join(", ")}
            </Text>
          )}
        </View>

        {/* Trailer Section */}
        {videoId && (
          <View style={styles.section}>
            <Pressable
              onPress={() => setShowTrailer(!showTrailer)}
              style={styles.trailerButton}
            >
              <Ionicons
                name={showTrailer ? "chevron-up-circle" : "play-circle"}
                size={24}
                color="#007AFF"
              />
              <Text style={styles.trailerButtonText}>
                {showTrailer ? "Hide Trailer" : "Watch Trailer"}
              </Text>
            </Pressable>
            {showTrailer && (
              <View style={styles.trailerPlayer}>
                <YoutubePlayer
                  height={width * 0.5} // Adjust height relative to width
                  play={true} // Auto play when shown
                  videoId={videoId}
                  webViewStyle={{ opacity: 0.99 }} // Android workaround
                />
              </View>
            )}
          </View>
        )}

        {/* Reviews Section */}
        <View style={styles.section}>
          <View style={styles.reviewSectionHeader}>
            <Text style={styles.sectionTitle}>Reviews ({reviews.length})</Text>
            {/* Add Review Button - Only if logged in and hasn't reviewed */}
            {userId && !userHasReviewed && (
              <Pressable
                onPress={scrollToReviewForm}
                style={styles.addReviewButton}
              >
                <Ionicons name="add-circle-outline" size={20} color="#007AFF" />
                <Text style={styles.addReviewButtonText}>Add Review</Text>
              </Pressable>
            )}
          </View>

          {/* Review Form */}
          {userId && ( // Only show form if logged in
            <View style={styles.reviewForm}>
              <Text style={styles.reviewFormTitle}>
                {userHasReviewed ? "Update Your Review" : "Rate this movie"}
              </Text>
              {/* Star Rating Input */}
              <View style={styles.ratingInputContainer}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <Pressable
                    key={star}
                    onPress={() => setUserRating(star)}
                    onPressIn={() => setTempRating(star)} // Show temporary selection
                    onPressOut={() => setTempRating(0)} // Clear temporary selection
                  >
                    <AntDesign
                      // Use tempRating for visual feedback, userRating for actual state
                      name={
                        (tempRating || userRating) >= star ? "star" : "staro"
                      }
                      size={32} // Slightly larger stars
                      color="#FFC72C"
                      style={styles.starIcon}
                    />
                  </Pressable>
                ))}
              </View>
              <TextInput
                style={styles.commentInput}
                placeholder="Write your comment (optional)"
                value={userComment}
                onChangeText={setUserComment}
                multiline
                // Increase height slightly
                numberOfLines={3}
              />
              <Pressable
                style={[
                  styles.submitButton,
                  (isSubmittingReview || userRating === 0) &&
                    styles.submitButtonDisabled,
                ]}
                onPress={handleRatingSubmit}
                disabled={isSubmittingReview || userRating === 0} // Disable if submitting or no rating
              >
                <Text style={styles.submitButtonText}>
                  {isSubmittingReview
                    ? "Submitting..."
                    : userHasReviewed
                    ? "Update Review"
                    : "Submit Review"}
                </Text>
              </Pressable>
            </View>
          )}

          {/* List of Reviews */}
          {reviews.length > 0 ? (
            reviews.map((review) => (
              <ReviewItem item={review} key={review._id} />
            )) // Render using map directly
          ) : (
            <Text style={styles.noReviewsText}>
              {userId ? "Be the first to review!" : "No reviews yet."}
            </Text>
          )}
        </View>

        {/* Spacer at the bottom */}
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Floating Action Button - Book Tickets (Only if Now Showing) */}
      {movie.status === "now_showing" && (
        <Pressable style={styles.bookButton} onPress={handleBookTickets}>
          <Text style={styles.bookButtonText}>Book Tickets</Text>
        </Pressable>
      )}
    </SafeAreaView>
  );
};

export default MovieDetailScreen;

// --- Styles ---
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
  bannerImage: { width: width, height: width * 0.56 }, // 16:9 aspect ratio approx
  infoContainer: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  titleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 5,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    flex: 1,
    marginRight: 10,
    color: "#333",
  },
  ratingContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingTop: 5,
  },
  ratingAvgText: {
    fontSize: 16,
    marginLeft: 5,
    fontWeight: "600",
    color: "#555",
  },
  detailsText: { fontSize: 13, color: "#666", marginTop: 4, lineHeight: 18 },
  boldText: { fontWeight: "bold" },
  description: { fontSize: 14.5, marginTop: 12, lineHeight: 21, color: "#444" }, // Slightly larger description
  section: {
    paddingHorizontal: 15,
    paddingVertical: 10,
    marginTop: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  sectionTitle: { fontSize: 18, fontWeight: "bold", marginBottom: 10 },
  trailerButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
  },
  trailerButtonText: {
    marginLeft: 8,
    fontSize: 16,
    color: "#007AFF",
    fontWeight: "500",
  },
  trailerPlayer: {
    marginTop: 10,
    borderRadius: 8,
    overflow: "hidden",
    backgroundColor: "#000",
  }, // Black background for player
  reviewSectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  }, // Add space between title and button
  addReviewButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 5,
  },
  addReviewButtonText: { color: "#007AFF", marginLeft: 5, fontWeight: "500" },
  reviewForm: {
    marginBottom: 25,
    padding: 15,
    backgroundColor: "#f9f9f9",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#eee",
  },
  reviewFormTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 15,
    textAlign: "center",
  }, // Increased margin bottom
  ratingInputContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: 15,
  },
  starIcon: { marginHorizontal: 6 }, // More space between stars
  commentInput: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 5,
    padding: 10,
    minHeight: 70,
    textAlignVertical: "top",
    marginBottom: 15,
    backgroundColor: "white",
    fontSize: 14,
  },
  submitButton: {
    backgroundColor: "#FFC72C",
    padding: 12,
    borderRadius: 25,
    alignItems: "center",
  }, // More rounded
  submitButtonDisabled: { backgroundColor: "#FFC72C", opacity: 0.5 },
  submitButtonText: { fontWeight: "bold", color: "#333", fontSize: 15 },
  noReviewsText: {
    textAlign: "center",
    color: "gray",
    marginTop: 20,
    paddingBottom: 15,
    fontStyle: "italic",
  }, // Italicized
  bookButton: {
    position: "absolute",
    bottom: 15,
    left: 15,
    right: 15,
    backgroundColor: "#FEBE10",
    padding: 15,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  bookButtonText: { color: "white", fontSize: 18, fontWeight: "bold" },
});
