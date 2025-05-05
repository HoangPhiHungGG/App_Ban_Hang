const mongoose = require("mongoose");

const movieSchema = new mongoose.Schema({
  title: { type: String, required: true, index: true },
  description: { type: String, required: true },
  posterImage: { type: String, required: true }, // URL
  bannerImage: { type: String }, // URL
  trailerUrl: { type: String },
  genre: [{ type: String, required: true, index: true }],
  language: { type: String, required: true, index: true },
  duration: { type: Number, required: true }, // minutes
  releaseDate: { type: Date, required: true },
  rating: { type: Number, default: 0, min: 0, max: 5 }, // Average rating
  status: {
    type: String,
    enum: ["now_showing", "coming_soon", "ended"],
    default: "coming_soon",
    index: true,
  },
  cast: [{ type: String }],
  director: { type: String },
  createdAt: { type: Date, default: Date.now },
});

// Method to update average rating (call after adding/deleting reviews)
movieSchema.methods.updateAverageRating = async function () {
  const movieId = this._id;
  // Need to require Review model here carefully or pass it in
  const Review = mongoose.model("Review");
  const result = await Review.aggregate([
    { $match: { movie: movieId } },
    { $group: { _id: "$movie", averageRating: { $avg: "$rating" } } },
  ]);

  this.rating = result.length > 0 ? result[0].averageRating.toFixed(1) : 0; // Keep 1 decimal place
  await this.save();
};

const Movie = mongoose.model("Movie", movieSchema);
module.exports = Movie;
