// module.exports = null;

const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const Movie = require("../models/movie");
const Review = require("../models/review"); // <<< Cần Review cho route review
const { authenticateToken, isAdmin } = require("../middleware/auth"); // <<< Import middleware

// GET /movies (Public)
router.get("/", async (req, res) => {
  try {
    const { status, genre, language, search } = req.query;
    let filter = {};
    if (status && ["now_showing", "coming_soon", "ended"].includes(status))
      filter.status = status;
    if (genre) filter.genre = genre;
    if (language) filter.language = language;
    if (search) filter.title = { $regex: search.trim(), $options: "i" };
    const movies = await Movie.find(filter).sort({ releaseDate: -1 });
    res.status(200).json(movies);
  } catch (error) {
    console.error("Error fetching movies:", error);
    res
      .status(500)
      .json({ message: "Error fetching movies", error: error.message });
  }
});

// GET /movies/:id (Public)
router.get("/:id", async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id))
      return res.status(400).json({ message: "Invalid ID" });
    const movie = await Movie.findById(req.params.id);
    if (!movie) return res.status(404).json({ message: "Movie not found" });
    res.status(200).json(movie);
  } catch (error) {
    console.error(`Error fetching movie ${req.params.id}:`, error);
    res
      .status(500)
      .json({ message: "Error fetching movie details", error: error.message });
  }
});

// --- Admin Movie Routes ---

// POST /admin/movies
router.post("/admin", authenticateToken, isAdmin, async (req, res) => {
  // <<< Đổi thành /admin
  try {
    const newMovie = new Movie(req.body);
    await newMovie.save();
    console.log("Admin: Movie created:", newMovie._id);
    res
      .status(201)
      .json({ message: "Movie created successfully", movie: newMovie });
  } catch (error) {
    console.error("Admin: Error creating movie:", error);
    if (error.name === "ValidationError")
      return res
        .status(400)
        .json({ message: "Validation Error", errors: error.errors });
    res
      .status(500)
      .json({ message: "Error creating movie", error: error.message });
  }
});

// PUT /admin/movies/:id
router.put("/admin/:id", authenticateToken, isAdmin, async (req, res) => {
  // <<< Đổi thành /admin/:id
  try {
    const movieId = req.params.id;
    if (!mongoose.Types.ObjectId.isValid(movieId))
      return res.status(400).json({ message: "Invalid ID" });
    const updateData = req.body;
    delete updateData._id;
    const updatedMovie = await Movie.findByIdAndUpdate(
      movieId,
      { $set: updateData },
      { new: true, runValidators: true }
    );
    if (!updatedMovie)
      return res.status(404).json({ message: "Movie not found" });
    console.log(`Admin: Updated movie ${movieId}`);
    res.status(200).json({ message: "Movie updated", movie: updatedMovie });
  } catch (error) {
    console.error(`Admin: Error updating movie ${req.params.id}:`, error);
    if (error.name === "ValidationError")
      return res
        .status(400)
        .json({ message: "Validation Error", errors: error.errors });
    res
      .status(500)
      .json({ message: "Error updating movie", error: error.message });
  }
});

// DELETE /admin/movies/:id
router.delete("/admin/:id", authenticateToken, isAdmin, async (req, res) => {
  // <<< Đổi thành /admin/:id
  try {
    const movieId = req.params.id;
    if (!mongoose.Types.ObjectId.isValid(movieId))
      return res.status(400).json({ message: "Invalid ID" });
    const deletedMovie = await Movie.findByIdAndDelete(movieId);
    if (!deletedMovie)
      return res.status(404).json({ message: "Movie not found" });
    // TODO: Consider deleting related Showtimes, Reviews?
    console.log(`Admin: Deleted movie ${movieId}`);
    res.status(200).json({ message: `Movie "${deletedMovie.title}" deleted` });
  } catch (error) {
    console.error(`Admin: Error deleting movie ${req.params.id}:`, error);
    res
      .status(500)
      .json({ message: "Error deleting movie", error: error.message });
  }
});

module.exports = router;
