const jwt = require("jsonwebtoken");
require("dotenv").config(); // Load .env file from api directory

const JWT_SECRET_KEY = process.env.JWT_SECRET_KEY;

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1]; // Bearer TOKEN

  if (token == null) return res.sendStatus(401); // if there isn't any token

  jwt.verify(token, JWT_SECRET_KEY, (err, user) => {
    if (err) {
      console.log("JWT Verification Error:", err.message);
      return res.sendStatus(403); // Invalid token
    }
    // Attach user info (including id and role) to the request object
    // 'user' here contains the payload you signed ({ userId, role })
    req.user = user;
    // console.log("Authenticated User:", req.user); // Debug log
    next(); // pass the execution off to whatever request the client intended
  });
};

const isAdmin = (req, res, next) => {
  // Ensure authenticateToken runs first
  if (req.user && req.user.role === "admin") {
    next();
  } else {
    console.log(
      "Admin Access Denied for user:",
      req.user?.userId,
      "Role:",
      req.user?.role
    ); // Debug log
    res.status(403).json({ message: "Admin access required" });
  }
};

module.exports = {
  authenticateToken,
  isAdmin,
};
