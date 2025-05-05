const mongoose = require("mongoose");

const reviewSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  movie: { type: mongoose.Schema.Types.ObjectId, ref: "Movie", required: true },
  rating: { type: Number, required: true, min: 1, max: 5 },
  comment: { type: String },
  createdAt: { type: Date, default: Date.now },
});

// Ensure a user reviews a specific movie only once
reviewSchema.index({ movie: 1, user: 1 }, { unique: true });
reviewSchema.index({ movie: 1, createdAt: -1 }); // For fetching reviews for a movie

// Middleware to update movie's average rating after save/remove
reviewSchema.post("save", async function () {
  await this.constructor.updateMovieRating(this.movie);
});

// Need to handle remove/delete scenarios as well if reviews can be deleted
reviewSchema.post("findOneAndDelete", async function (doc) {
  // Example hook
  if (doc) {
    await this.model.updateMovieRating(doc.movie);
  }
});
reviewSchema.post("deleteMany", async function (result) {
  // This is more complex, might need to refetch affected movies
  console.warn(
    "Review deleteMany hook needs implementation to update movie ratings"
  );
});

reviewSchema.statics.updateMovieRating = async function (movieId) {
  const Movie = mongoose.model("Movie"); // Import locally
  try {
    const movie = await Movie.findById(movieId);
    if (movie) {
      await movie.updateAverageRating(); // Call the method defined in movieSchema
      console.log(
        `Updated average rating for movie ${movieId} to ${movie.rating}`
      );
    }
  } catch (error) {
    console.error(`Error updating movie rating for ${movieId}:`, error);
  }
};

const Review = mongoose.model("Review", reviewSchema);
module.exports = Review;
