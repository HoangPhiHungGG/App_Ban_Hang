const crypto = require("crypto");

const generateBookingId = () => {
  // Simple example: Prefix + Timestamp (base36) + Random hex chars
  return `BK${Date.now().toString(36).toUpperCase()}${crypto
    .randomBytes(3)
    .toString("hex")
    .toUpperCase()}`;
};

const generateVerificationToken = () => {
  return crypto.randomBytes(20).toString("hex");
};

// Add other helper functions here

module.exports = {
  generateBookingId,
  generateVerificationToken,
};
