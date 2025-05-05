// const express = require("express");
// const router = express.Router();
// const User = require("../models/user");
// const { sendVerificationEmail } = require("../utils/email");
// const { generateVerificationToken } = require("../utils/helpers");
// const jwt = require("jsonwebtoken");
// const bcrypt = require("bcrypt"); // Import bcrypt
// require("dotenv").config();

// const JWT_SECRET_KEY = process.env.JWT_SECRET_KEY;

// router.post("/register", async (req, res) => {
//   // ... implementation from index.js (adapted for router) ...
//   // Remember to hash password here before saving newUser.password = await bcrypt.hash(...)
// });

// router.get("/verify/:token", async (req, res) => {
//   // ... implementation from index.js (adapted for router) ...
// });

// router.post("/login", async (req, res) => {
//   // ... implementation from index.js (adapted for router) ...
//   // Use user.comparePassword(password) instead of direct comparison
// });

// module.exports = router;

// // --- For now, keep routes in index.js for simplicity of this example ---
// module.exports = null; // Indicate this file is currently unused if routes are in index.js

const express = require("express");
const router = express.Router(); // <<< Sử dụng Router của Express
const mongoose = require("mongoose");
const User = require("../models/user");
const { sendVerificationEmail } = require("../utils/email"); // <<< Import utils
const { generateVerificationToken } = require("../utils/helpers");
const jwt = require("jsonwebtoken");
// const bcrypt = require('bcrypt'); // <<< Import bcrypt khi dùng
require("dotenv").config({ path: "../.env" }); // <<< Đảm bảo đọc đúng file .env

const JWT_SECRET_KEY = process.env.JWT_SECRET_KEY;
const port = process.env.PORT || 8000; // <<< Lấy port nếu cần cho email

// POST /register
router.post("/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res
        .status(400)
        .json({ message: "Name, email, and password are required" });
    }
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "Email already registered" });
    }
    // Hash password here: const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({
      name,
      email,
      password: password /* hashedPassword */,
    });
    newUser.verificationToken = generateVerificationToken();
    await newUser.save();
    console.log("New User Registered:", newUser._id);
    sendVerificationEmail(newUser.email, newUser.verificationToken, port);
    res.status(201).json({ message: "Registration successful. Check email." });
  } catch (error) {
    console.error("Reg Error:", error);
    res
      .status(500)
      .json({ message: "Registration failed", error: error.message });
  }
});

// GET /verify/:token
router.get("/verify/:token", async (req, res) => {
  try {
    const token = req.params.token;
    const user = await User.findOne({ verificationToken: token });
    if (!user) return res.status(404).send("<h1>Invalid/Expired Token</h1>");
    if (user.verified)
      return res.status(200).send("<h1>Email Already Verified</h1>");
    user.verified = true;
    user.verificationToken = undefined;
    await user.save();
    console.log("Email verified:", user.email);
    res.status(200).send("<h1>Email Verified! You can log in.</h1>");
  } catch (error) {
    console.error("Verification Error:", error);
    res.status(500).send("<h1>Verification Failed</h1>");
  }
});

// POST /login
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ message: "Email/Password required" });
    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ message: "Invalid credentials" });
    // Compare password: const isMatch = await user.comparePassword(password);
    const isMatch = user.password === password; // <<< TEMPORARY
    if (!isMatch)
      return res.status(401).json({ message: "Invalid credentials" });
    if (!user.verified && user.role !== "admin") {
      // <<< Cho phép admin đăng nhập dù chưa verify?
      return res
        .status(403)
        .json({ message: "Please verify your email first." });
    }
    const payload = { userId: user._id, role: user.role };
    const token = jwt.sign(payload, JWT_SECRET_KEY, { expiresIn: "3d" });
    res.status(200).json({ token });
  } catch (error) {
    console.error("Login Error:", error);
    res.status(500).json({ message: "Login Failed", error: error.message });
  }
});

module.exports = router; // <<< Export router
