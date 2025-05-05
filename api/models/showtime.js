const mongoose = require("mongoose");

const showtimeSchema = new mongoose.Schema({
  movie: { type: mongoose.Schema.Types.ObjectId, ref: "Movie", required: true },
  cinema: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Cinema",
    required: true,
  },
  screenName: { type: String, required: true }, // e.g., "Screen 1"
  startTime: { type: Date, required: true },
  endTime: { type: Date, required: true }, // Should be calculated on creation
  // Simple seat management: array of booked seat identifiers (e.g., "A1", "B5")
  bookedSeats: {
    type: [String],
    default: [],
  },
  pricePerSeat: { type: Number, required: true },
  createdAt: { type: Date, default: Date.now },
});

// Index for faster querying of showtimes by movie, cinema, and date
showtimeSchema.index({ movie: 1, cinema: 1, startTime: 1 });
showtimeSchema.index({ cinema: 1, startTime: 1 }); // For finding shows at a cinema on a date

const Showtime = mongoose.model("Showtime", showtimeSchema);
module.exports = Showtime;
