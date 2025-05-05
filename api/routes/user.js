// module.exports = null;

const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const User = require("../models/user");
const { authenticateToken } = require("../middleware/auth"); // Chỉ cần authenticate

// GET /profile/:userId (Lấy thông tin profile)
router.get("/:userId", authenticateToken, async (req, res) => {
  // Người dùng có thể xem profile của chính mình
  // Admin có thể xem profile của bất kỳ ai (kiểm tra trong middleware hoặc ở đây)
  if (req.user.userId !== req.params.userId && req.user.role !== "admin") {
    return res.status(403).json({ message: "Forbidden: Access denied" });
  }
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.userId)) {
      return res.status(400).json({ message: "Invalid User ID format" });
    }
    const user = await User.findById(req.params.userId).select(
      "-password -verificationToken"
    );
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.status(200).json({ user });
  } catch (error) {
    console.error(`Error retrieving profile ${req.params.userId}:`, error);
    res
      .status(500)
      .json({ message: "Error retrieving profile", error: error.message });
  }
});

// PUT /profile/:userId (Cập nhật profile - người dùng tự cập nhật) - Ví dụ
router.put("/:userId", authenticateToken, async (req, res) => {
  // Chỉ cho phép user cập nhật profile của chính họ
  if (req.user.userId !== req.params.userId) {
    return res
      .status(403)
      .json({ message: "Forbidden: Cannot update another user's profile" });
  }
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.userId)) {
      return res.status(400).json({ message: "Invalid User ID format" });
    }
    const { name /*, phone, etc. */ } = req.body; // Lấy các trường cho phép cập nhật
    const updateData = {};
    if (name) updateData.name = name.trim();
    // if (phone) updateData.phone = phone.trim();

    if (Object.keys(updateData).length === 0) {
      return res
        .status(400)
        .json({ message: "No fields provided for update." });
    }

    // ** KHÔNG CẬP NHẬT email, role, verified, password ở đây **

    const updatedUser = await User.findByIdAndUpdate(
      req.params.userId,
      { $set: updateData },
      { new: true, runValidators: true }
    ).select("-password -verificationToken");

    if (!updatedUser) {
      return res.status(404).json({ message: "User not found" });
    }

    console.log(`User ${req.params.userId} updated their profile`);
    res
      .status(200)
      .json({ message: "Profile updated successfully", user: updatedUser });
  } catch (error) {
    console.error(`Error updating profile ${req.params.userId}:`, error);
    if (error.name === "ValidationError") {
      return res
        .status(400)
        .json({ message: "Validation Error", errors: error.errors });
    }
    res
      .status(500)
      .json({ message: "Error updating profile", error: error.message });
  }
});

module.exports = router;
