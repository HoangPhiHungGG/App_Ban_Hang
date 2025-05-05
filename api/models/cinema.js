const mongoose = require("mongoose");

const cinemaSchema = new mongoose.Schema({
  name: { type: String, required: true, index: true },
  location: {
    address: { type: String, required: true },
    city: { type: String, required: true, index: true },
    state: { type: String },
    postalCode: { type: String },
    // coordinates: { type: [Number], index: '2dsphere' } // Optional: [longitude, latitude]
  },
  totalScreens: { type: Number, default: 1 },
  // screenLayouts: [ { screenName: String, layout: [[String]] } ] // Optional: Detailed layout
  createdAt: { type: Date, default: Date.now },
});

const Cinema = mongoose.model("Cinema", cinemaSchema);
module.exports = Cinema;
