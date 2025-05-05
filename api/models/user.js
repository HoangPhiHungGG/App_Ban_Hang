const mongoose = require("mongoose");
// const bcrypt = require('bcrypt'); // Import bcrypt after installing

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true }, // Will be hashed
  verified: { type: Boolean, default: false },
  verificationToken: String,
  role: {
    type: String,
    enum: ["user", "admin"],
    default: "user",
  },
  bookings: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Booking",
    },
  ],
  createdAt: { type: Date, default: Date.now },
});

const User = mongoose.model("User", userSchema);
module.exports = User;
