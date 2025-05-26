// --- START OF FILE api/models/movie.js ---
const mongoose = require("mongoose");

const movieSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, index: true },
    description: { type: String, required: true },
    posterImage: { type: String, required: true }, // URL to the image
    bannerImage: { type: String }, // Optional URL to a larger banner image
    trailerUrl: { type: String }, // Optional URL to the movie trailer (e.g., YouTube)
    genre: [{ type: String, required: true, index: true }], // Array of genre strings
    language: { type: String, required: true, index: true },
    duration: {
      type: Number,
      required: [true, "Movie duration is required."],
      min: [1, "Movie duration must be at least 1 minute."], // Duration must be positive
    }, // Duration in minutes
    releaseDate: { type: Date, required: true },
    rating: { type: Number, default: 0, min: 0, max: 5 }, // Average rating
    numReviews: { type: Number, default: 0 }, // Total number of reviews
    status: {
      type: String,
      enum: ["now_showing", "coming_soon", "ended"],
      default: ["coming_soon", "now_showing"],
      index: true,
    },
    cast: [{ type: String }], // Array of cast member names
    director: { type: String }, // Director's name
    // country: { type: String }, // Optional: Country of origin
  },
  { timestamps: true } // Automatically adds createdAt and updatedAt
);

// Method to update average rating and number of reviews
// This method is good, but ensure Review model also calls it or has similar logic.
movieSchema.methods.updateAverageRating = async function () {
  const movieId = this._id;
  const Review = mongoose.model("Review"); // Get Review model dynamically
  try {
    const stats = await Review.aggregate([
      { $match: { movie: movieId, isHidden: { $ne: true } } },
      {
        $group: {
          _id: "$movie",
          averageRating: { $avg: "$rating" },
          reviewCount: { $sum: 1 },
        },
      },
    ]);
    if (stats.length > 0) {
      this.rating = parseFloat(stats[0].averageRating.toFixed(1));
      this.numReviews = stats[0].reviewCount;
    } else {
      this.rating = 0;
      this.numReviews = 0;
    }
    await this.save(); // Save the updated movie document
    console.log(
      `Updated stats for movie ${movieId}: Rating ${this.rating}, Reviews ${this.numReviews}`
    );
  } catch (error) {
    console.error(`Error in movie.updateAverageRating for ${movieId}:`, error);
  }
};

const Movie = mongoose.model("Movie", movieSchema);
module.exports = Movie;
// --- END OF FILE api/models/movie.js ---
