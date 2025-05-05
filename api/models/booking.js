const mongoose = require("mongoose");

const bookingSchema = new mongoose.Schema({
  bookingId: { type: String, required: true, unique: true }, // Custom readable ID
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  movie: { type: mongoose.Schema.Types.ObjectId, ref: "Movie", required: true },
  cinema: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Cinema",
    required: true,
  },
  showtime: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Showtime",
    required: true,
  },
  seats: [{ type: String, required: true }], // e.g., ["A1", "A2"]
  totalPrice: { type: Number, required: true },
  bookingDate: { type: Date, default: Date.now },
  paymentMethod: { type: String, required: true },
  paymentStatus: {
    type: String,
    enum: ["pending", "paid", "failed", "refunded"],
    default: "pending",
  },
  paymentTransactionId: { type: String }, // From payment gateway
  qrCodeData: { type: String }, // Data used to generate QR code (e.g., bookingId or unique hash)
});

bookingSchema.index({ user: 1, bookingDate: -1 }); // For user's booking history

const Booking = mongoose.model("Booking", bookingSchema);
module.exports = Booking;
