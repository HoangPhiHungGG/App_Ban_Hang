// --- START OF FILE api/index.js ---

require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const cors = require("cors");
// const jwt = require("jsonwebtoken"); // JWT được dùng trong middleware/auth.js

// Utils & Middleware - Chỉ import middleware ở đây nếu cần dùng global
// const { authenticateToken, isAdmin } = require('./middleware/auth'); // Chỉ cần nếu dùng app.use(authenticateToken) cho mọi route

const app = express();
const port = process.env.PORT || 8000;
// const JWT_SECRET_KEY = process.env.JWT_SECRET_KEY; // Không cần ở đây nữa

app.use(cors());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// --- Database Connection --- (Giữ nguyên)
const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  console.error("FATAL: MONGODB_URI not defined");
  process.exit(1);
}
mongoose
  .connect(MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => {
    console.error("DB Connection Error:", err);
    process.exit(1);
  });

// --- Models --- (Vẫn cần để Mongoose biết)
require("./models/user");
require("./models/movie");
require("./models/cinema");
require("./models/showtime");
require("./models/booking");
require("./models/review");

// --- Import Routers ---
const authRoutes = require("./routes/auth");
const movieRoutes = require("./routes/movies");
const cinemaRoutes = require("./routes/cinemas");
const showtimeRoutes = require("./routes/showtimes");
const bookingRoutes = require("./routes/bookings");
const reviewRoutes = require("./routes/reviews"); // Router cho reviews lồng trong movies
const adminRoutes = require("./routes/admin"); // Router cho các chức năng admin tổng hợp
const userRoutes = require("./routes/user"); // Router cho profile người dùng

// --- Mount Routers ---
if (authRoutes) app.use("/", authRoutes); // Mount auth routes ở gốc (/, /login, /register, /verify)
if (userRoutes) app.use("/profile", userRoutes); // Mount user profile route tại /profile
if (movieRoutes) app.use("/movies", movieRoutes); // Mount movie routes tại /movies
if (cinemaRoutes) app.use("/cinemas", cinemaRoutes); // Mount cinema routes tại /cinemas
if (showtimeRoutes) app.use("/showtimes", showtimeRoutes); // Mount showtime routes tại /showtimes
if (bookingRoutes) app.use("/bookings", bookingRoutes); // Mount booking routes tại /bookings

// Mount review routes lồng trong movie routes
// Cần đảm bảo movieRoutes được mount trước
if (movieRoutes && reviewRoutes) {
  movieRoutes.use("/:movieId/reviews", reviewRoutes); // Gắn review router vào /movies/:movieId/reviews
}

if (adminRoutes) app.use("/admin", adminRoutes);
if (reviewRoutes) {
  movieRoutes.use("/:movieId/reviews", reviewRoutes); // Quan trọng: gắn vào movieRoutes
}

// --- Catch-all & Error Handler --- (Giữ nguyên)
app.use((req, res, next) => {
  res.status(404).json({ message: "API endpoint not found" }); // Trả về JSON thay vì text
});

app.use((err, req, res, next) => {
  console.error("Global Error Handler caught:", err.stack);
  res
    .status(500)
    .json({ message: "Internal Server Error", error: err.message }); // Trả về JSON
});

// --- Server Listener --- (Giữ nguyên)
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

// --- END OF FILE api/index.js ---
