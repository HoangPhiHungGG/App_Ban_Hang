// // module.exports = null;

// const express = require("express");
// const router = express.Router();
// const mongoose = require("mongoose");
// const User = require("../models/user");
// const Cinema = require("../models/cinema");
// const Showtime = require("../models/showtime");
// const Booking = require("../models/booking");
// const Review = require("../models/review");
// const Movie = require("../models/movie"); // Cần cho delete showtime/review
// const { authenticateToken, isAdmin } = require("../middleware/auth"); // <<< Quan trọng: Apply middleware

// // <<< Áp dụng middleware cho tất cả các route trong file này >>>
// router.use(authenticateToken);
// router.use(isAdmin);

// // --- User Management ---
// // GET /admin/users
// router.get("/users", async (req, res) => {
//   try {
//     const { search, role, verified } = req.query;
//     let filter = {};
//     if (search)
//       filter.$or = [
//         { name: { $regex: search.trim(), $options: "i" } },
//         { email: { $regex: search.trim(), $options: "i" } },
//       ];
//     if (role && ["user", "admin"].includes(role)) filter.role = role;
//     if (verified !== undefined && ["true", "false"].includes(verified))
//       filter.verified = verified === "true";
//     const users = await User.find(filter)
//       .select("-password -verificationToken")
//       .sort({ createdAt: -1 });
//     res.status(200).json(users);
//   } catch (error) {
//     console.error("Admin Users Fetch Error:", error);
//     res.status(500).json({ message: "Error fetching users" });
//   }
// });

// // PUT /admin/users/:id
// router.put("/users/:id", async (req, res) => {
//   try {
//     const userId = req.params.id;
//     if (!mongoose.Types.ObjectId.isValid(userId))
//       return res.status(400).json({ message: "Invalid User ID" });
//     const { name, role, verified } = req.body;
//     const updateData = {};
//     if (name) updateData.name = name.trim();
//     if (role && ["user", "admin"].includes(role)) updateData.role = role;
//     if (verified !== undefined && typeof verified === "boolean")
//       updateData.verified = verified;
//     if (Object.keys(updateData).length === 0)
//       return res.status(400).json({ message: "No valid fields to update" });
//     if (userId === req.user.userId && updateData.role !== "admin")
//       return res
//         .status(400)
//         .json({ message: "Admin cannot demote themselves" }); // Ngăn admin tự hạ cấp
//     if (userId === req.user.userId && updateData.verified === false)
//       return res.status(400).json({ message: "Admin cannot ban themselves" }); // Ngăn admin tự khóa

//     const updatedUser = await User.findByIdAndUpdate(
//       userId,
//       { $set: updateData },
//       { new: true, runValidators: true }
//     ).select("-password -verificationToken");
//     if (!updatedUser)
//       return res.status(404).json({ message: "User not found" });
//     console.log(`Admin: Updated user ${userId}`);
//     res.status(200).json({ message: "User updated", user: updatedUser });
//   } catch (error) {
//     console.error(`Admin User Update Error (${req.params.id}):`, error);
//     res.status(500).json({ message: "Error updating user" });
//   }
// });

// // DELETE /admin/users/:id
// router.delete("/users/:id", async (req, res) => {
//   try {
//     const userId = req.params.id;
//     if (!mongoose.Types.ObjectId.isValid(userId))
//       return res.status(400).json({ message: "Invalid User ID" });
//     if (userId === req.user.userId)
//       return res
//         .status(400)
//         .json({ message: "Cannot delete own admin account" });
//     const deletedUser = await User.findByIdAndDelete(userId);
//     if (!deletedUser)
//       return res.status(404).json({ message: "User not found" });
//     // TODO: Consider deleting related data (Bookings, Reviews)
//     console.log(`Admin: Deleted user ${userId}`);
//     res.status(200).json({ message: `User "${deletedUser.name}" deleted` });
//   } catch (error) {
//     console.error(`Admin User Delete Error (${req.params.id}):`, error);
//     res.status(500).json({ message: "Error deleting user" });
//   }
// });

// // --- Cinema Management (Routes đã có trong movies.js, không cần lặp lại ở đây nếu dùng prefix)---
// // POST /admin/cinemas -> sẽ được mount ở index.js là /cinemas/admin
// // PUT /admin/cinemas/:id -> sẽ được mount ở index.js là /cinemas/admin/:id
// // DELETE /admin/cinemas/:id -> sẽ được mount ở index.js là /cinemas/admin/:id

// // --- Showtime Management ---
// // POST /admin/showtimes
// router.post("/showtimes", async (req, res) => {
//   /* ... logic từ index.js ... */
//   try {
//     const { movie, cinema, screenName, startTime, pricePerSeat } = req.body;
//     if (!movie || !cinema || !screenName || !startTime || pricePerSeat == null)
//       return res.status(400).json({ message: "Missing required fields" });
//     if (
//       !mongoose.Types.ObjectId.isValid(movie) ||
//       !mongoose.Types.ObjectId.isValid(cinema)
//     )
//       return res.status(400).json({ message: "Invalid Movie/Cinema ID" });
//     if (typeof pricePerSeat !== "number" || pricePerSeat < 0)
//       return res.status(400).json({ message: "Invalid price" });
//     const startTimeDate = new Date(startTime);
//     if (isNaN(startTimeDate))
//       return res.status(400).json({ message: "Invalid startTime" });
//     const movieDoc = await Movie.findById(movie).select("duration");
//     if (!movieDoc) return res.status(404).json({ message: "Movie not found" });
//     const endTimeDate = new Date(
//       startTimeDate.getTime() + movieDoc.duration * 60000
//     );
//     const newShowtime = new Showtime({
//       movie,
//       cinema,
//       screenName,
//       startTime: startTimeDate,
//       endTime: endTimeDate,
//       pricePerSeat,
//     });
//     await newShowtime.save();
//     console.log("Admin: Showtime created:", newShowtime._id);
//     res
//       .status(201)
//       .json({ message: "Showtime created", showtime: newShowtime });
//   } catch (error) {
//     console.error("Admin Showtime Create Error:", error);
//     res.status(500).json({ message: "Error creating showtime" });
//   }
// });

// // PUT /admin/showtimes/:id
// router.put("/showtimes/:id", async (req, res) => {
//   /* ... logic từ index.js ... */
//   try {
//     const showtimeId = req.params.id;
//     if (!mongoose.Types.ObjectId.isValid(showtimeId))
//       return res.status(400).json({ message: "Invalid ID" });
//     const updateData = req.body;
//     delete updateData._id;
//     delete updateData.movie;
//     delete updateData.cinema;
//     delete updateData.bookedSeats;
//     if (updateData.startTime) {
//       const showtime = await Showtime.findById(showtimeId).populate(
//         "movie",
//         "duration"
//       );
//       if (!showtime)
//         return res.status(404).json({ message: "Showtime not found" });
//       const startTimeDate = new Date(updateData.startTime);
//       if (isNaN(startTimeDate))
//         return res.status(400).json({ message: "Invalid startTime" });
//       updateData.endTime = new Date(
//         startTimeDate.getTime() + showtime.movie.duration * 60000
//       );
//     }
//     const updatedShowtime = await Showtime.findByIdAndUpdate(
//       showtimeId,
//       { $set: updateData },
//       { new: true, runValidators: true }
//     );
//     if (!updatedShowtime)
//       return res.status(404).json({ message: "Showtime not found" });
//     console.log(`Admin: Updated showtime ${showtimeId}`);
//     res
//       .status(200)
//       .json({ message: "Showtime updated", showtime: updatedShowtime });
//   } catch (error) {
//     console.error(`Admin Showtime Update Error (${req.params.id}):`, error);
//     res.status(500).json({ message: "Error updating showtime" });
//   }
// });

// // DELETE /admin/showtimes/:id
// router.delete("/showtimes/:id", async (req, res) => {
//   /* ... logic từ index.js ... */
//   try {
//     const showtimeId = req.params.id;
//     if (!mongoose.Types.ObjectId.isValid(showtimeId))
//       return res.status(400).json({ message: "Invalid ID" });
//     const existingBookings = await Booking.countDocuments({
//       showtime: showtimeId,
//     });
//     if (existingBookings > 0)
//       return res.status(400).json({
//         message: `Cannot delete showtime with ${existingBookings} booking(s).`,
//       });
//     const deletedShowtime = await Showtime.findByIdAndDelete(showtimeId);
//     if (!deletedShowtime)
//       return res.status(404).json({ message: "Showtime not found" });
//     console.log(`Admin: Deleted showtime ${showtimeId}`);
//     res.status(200).json({ message: `Showtime deleted` });
//   } catch (error) {
//     console.error(`Admin Showtime Delete Error (${req.params.id}):`, error);
//     res.status(500).json({ message: "Error deleting showtime" });
//   }
// });

// // --- Booking Management ---
// // GET /admin/bookings
// router.get("/bookings", async (req, res) => {
//   /* ... logic từ index.js ... */
//   try {
//     const { userId, movieId, cinemaId, date, status } = req.query;
//     let filter = {};
//     if (userId && mongoose.Types.ObjectId.isValid(userId)) filter.user = userId;
//     if (movieId && mongoose.Types.ObjectId.isValid(movieId))
//       filter.movie = movieId;
//     if (cinemaId && mongoose.Types.ObjectId.isValid(cinemaId))
//       filter.cinema = cinemaId;
//     if (status && ["pending", "paid", "failed", "refunded"].includes(status))
//       filter.paymentStatus = status;
//     if (date) {
//       const targetDate = new Date(date);
//       if (!isNaN(targetDate)) {
//         const startOfDay = new Date(targetDate);
//         startOfDay.setHours(0, 0, 0, 0);
//         const endOfDay = new Date(targetDate);
//         endOfDay.setHours(23, 59, 59, 999);
//         filter.bookingDate = { $gte: startOfDay, $lte: endOfDay };
//       }
//     }
//     const bookings = await Booking.find(filter)
//       .populate("user", "name email")
//       .populate("movie", "title")
//       .populate("cinema", "name")
//       .populate("showtime", "startTime screenName")
//       .sort({ bookingDate: -1 });
//     res.status(200).json({ bookings: bookings }); // Simplified response for now
//   } catch (error) {
//     console.error("Admin Bookings Fetch Error:", error);
//     res.status(500).json({ message: "Error fetching bookings" });
//   }
// });

// // PUT /admin/bookings/:id
// router.put("/bookings/:id", async (req, res) => {
//   /* ... logic từ index.js ... */
//   try {
//     const bookingId = req.params.id;
//     if (!mongoose.Types.ObjectId.isValid(bookingId))
//       return res.status(400).json({ message: "Invalid ID" });
//     const { paymentStatus } = req.body;
//     if (
//       !paymentStatus ||
//       !["pending", "paid", "failed", "refunded"].includes(paymentStatus)
//     )
//       return res.status(400).json({ message: "Invalid paymentStatus" });
//     const updatedBooking = await Booking.findByIdAndUpdate(
//       bookingId,
//       { $set: { paymentStatus: paymentStatus } },
//       { new: true, runValidators: true }
//     );
//     if (!updatedBooking)
//       return res.status(404).json({ message: "Booking not found" });
//     console.log(
//       `Admin: Updated booking ${bookingId} status to ${paymentStatus}`
//     );
//     res
//       .status(200)
//       .json({ message: "Booking status updated", booking: updatedBooking });
//   } catch (error) {
//     console.error(`Admin Booking Update Error (${req.params.id}):`, error);
//     res.status(500).json({ message: "Error updating booking" });
//   }
// });

// // DELETE /admin/bookings/:id
// router.delete("/bookings/:id", async (req, res) => {
//   /* ... logic từ index.js ... */
//   try {
//     const bookingId = req.params.id;
//     if (!mongoose.Types.ObjectId.isValid(bookingId))
//       return res.status(400).json({ message: "Invalid ID" });
//     const deletedBooking = await Booking.findByIdAndDelete(bookingId);
//     if (!deletedBooking)
//       return res.status(404).json({ message: "Booking not found" });
//     try {
//       await Showtime.updateOne(
//         { _id: deletedBooking.showtime },
//         { $pull: { bookedSeats: { $in: deletedBooking.seats } } }
//       );
//     } catch (showtimeError) {
//       console.error(
//         `Admin: Failed to free seats for deleted booking ${bookingId}:`,
//         showtimeError
//       );
//     }
//     try {
//       await User.updateOne(
//         { _id: deletedBooking.user },
//         { $pull: { bookings: deletedBooking._id } }
//       );
//     } catch (userUpdateError) {
//       console.error(
//         `Admin: Failed to remove booking ref from user ${deletedBooking.user}:`,
//         userUpdateError
//       );
//     }
//     console.log(`Admin: Deleted booking ${bookingId}`);
//     res
//       .status(200)
//       .json({ message: `Booking ID "${deletedBooking.bookingId}" deleted` });
//   } catch (error) {
//     console.error(`Admin Booking Delete Error (${req.params.id}):`, error);
//     res.status(500).json({ message: "Error deleting booking" });
//   }
// });

// // --- Review Management ---
// // DELETE /admin/reviews/:id
// router.delete("/reviews/:id", async (req, res) => {
//   // <<< Route mới
//   try {
//     const reviewId = req.params.id;
//     if (!mongoose.Types.ObjectId.isValid(reviewId))
//       return res.status(400).json({ message: "Invalid Review ID" });
//     // Dùng findOneAndDelete để trigger post hook (cập nhật rating phim)
//     const deletedReview = await Review.findOneAndDelete({ _id: reviewId });
//     if (!deletedReview)
//       return res.status(404).json({ message: "Review not found" });
//     console.log(`Admin: Deleted review ${reviewId}`);
//     res.status(200).json({ message: `Review deleted successfully` });
//   } catch (error) {
//     console.error(`Admin Review Delete Error (${req.params.id}):`, error);
//     res
//       .status(500)
//       .json({ message: "Error deleting review", error: error.message });
//   }
// });

// module.exports = router;

//

// --- START OF FILE api/routes/admin.js ---

const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");

// Import Models
const User = require("../models/user");
const Movie = require("../models/movie");
const Cinema = require("../models/cinema");
const Showtime = require("../models/showtime");
const Booking = require("../models/booking");
const Review = require("../models/review");

// Import Middleware
const { authenticateToken, isAdmin } = require("../middleware/auth");

// --- Apply Middleware to ALL admin routes ---
// Ensures only logged-in admins can access these endpoints
router.use(authenticateToken);
router.use(isAdmin);

// =========================
// == USER MANAGEMENT ======
// =========================

// GET /admin/users - List all users with filters
router.get("/users", async (req, res) => {
  try {
    const { search, role, verified } = req.query;
    let filter = {};

    // Search filter (name or email)
    if (search && search.trim()) {
      const searchTerm = search.trim();
      const searchRegex = { $regex: searchTerm, $options: "i" };
      filter.$or = [{ name: searchRegex }, { email: searchRegex }];
    }

    // Role filter
    if (role && ["user", "admin"].includes(role)) {
      filter.role = role;
    }

    // Status (verified) filter
    // Note: query param 'verified' comes as string 'true' or 'false'
    if (verified !== undefined && ["true", "false"].includes(verified)) {
      filter.verified = verified === "true";
    }

    // TODO: Add pagination logic here (skip, limit)

    console.log("Admin Users Filter:", JSON.stringify(filter));
    const users = await User.find(filter)
      .select("-password -verificationToken") // Exclude sensitive fields
      .sort({ createdAt: -1 }); // Sort by creation date descending

    res.status(200).json(users); // Return array of users directly
  } catch (error) {
    console.error("Admin: Error fetching users:", error);
    res
      .status(500)
      .json({ message: "Error fetching users", error: error.message });
  }
});

// PUT /admin/users/:id - Update user details (name, role, verified status)
router.put("/users/:id", async (req, res) => {
  try {
    const userId = req.params.id;
    const { name, role, verified } = req.body; // Fields allowed to be updated by admin

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: "Invalid User ID format" });
    }

    // Prevent admin from modifying their own role/status via this specific route for safety
    if (userId === req.user.userId) {
      if (role !== undefined && role !== "admin")
        return res
          .status(400)
          .json({ message: "Admin cannot demote themselves." });
      if (verified !== undefined && verified === false)
        return res
          .status(400)
          .json({ message: "Admin cannot ban themselves." });
    }

    // Build update object carefully
    const updateData = {};
    if (name !== undefined) updateData.name = name.trim(); // Allow empty name? Add validation if not.
    if (role !== undefined && ["user", "admin"].includes(role))
      updateData.role = role;
    if (verified !== undefined && typeof verified === "boolean")
      updateData.verified = verified;

    // ** DO NOT ALLOW PASSWORD UPDATE HERE without proper hashing/confirmation **

    if (Object.keys(updateData).length === 0) {
      return res
        .status(400)
        .json({ message: "No valid fields provided for update." });
    }

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $set: updateData },
      { new: true, runValidators: true } // Options: return updated doc, run schema validators
    ).select("-password -verificationToken");

    if (!updatedUser) {
      return res.status(404).json({ message: "User not found" });
    }

    console.log(`Admin: Updated user ${userId}`);
    res
      .status(200)
      .json({ message: "User updated successfully", user: updatedUser });
  } catch (error) {
    console.error(`Admin: Error updating user ${req.params.id}:`, error);
    if (error.name === "ValidationError") {
      return res
        .status(400)
        .json({ message: "Validation Error", errors: error.errors });
    }
    res
      .status(500)
      .json({ message: "Error updating user", error: error.message });
  }
});

// DELETE /admin/users/:id - Delete a user
router.delete("/users/:id", async (req, res) => {
  try {
    const userId = req.params.id;
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: "Invalid User ID format" });
    }

    // Prevent admin from deleting themselves
    if (userId === req.user.userId) {
      return res
        .status(400)
        .json({ message: "Admin cannot delete their own account." });
    }

    // Option 1: Hard delete user
    const deletedUser = await User.findByIdAndDelete(userId);

    if (!deletedUser) {
      return res.status(404).json({ message: "User not found" });
    }

    // Option 2 (More complex): Consider deleting related Bookings and Reviews
    // await Booking.deleteMany({ user: userId });
    // await Review.deleteMany({ user: userId }); // This invalidates movie average ratings unless recalculated

    console.log(`Admin: Deleted user ${userId}`);
    res
      .status(200)
      .json({ message: `User "${deletedUser.name}" deleted successfully` });
  } catch (error) {
    console.error(`Admin: Error deleting user ${req.params.id}:`, error);
    res
      .status(500)
      .json({ message: "Error deleting user", error: error.message });
  }
});

// =========================
// == MOVIE MANAGEMENT =====
// =========================
// Note: Assumes POST/PUT/DELETE are handled here under /admin prefix
// If they are handled in routes/movies.js, remove them from here.

// POST /admin/movies - Create a new movie
router.post("/movies", async (req, res) => {
  /* ... Logic from previous implementation ... */
  try {
    const newMovie = new Movie(req.body);
    await newMovie.save();
    res.status(201).json({ message: "Movie created", movie: newMovie });
  } catch (error) {
    /* ... Error handling ... */
  }
});

// PUT /admin/movies/:id - Update a movie
router.put("/movies/:id", async (req, res) => {
  /* ... Logic from previous implementation ... */
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id))
      return res.status(400).json({ message: "Invalid ID" });
    const updatedMovie = await Movie.findByIdAndUpdate(
      id,
      { $set: req.body },
      { new: true, runValidators: true }
    );
    if (!updatedMovie)
      return res.status(404).json({ message: "Movie not found" });
    res.status(200).json({ message: "Movie updated", movie: updatedMovie });
  } catch (error) {
    /* ... Error handling ... */
  }
});

// DELETE /admin/movies/:id - Delete a movie
router.delete("/movies/:id", async (req, res) => {
  /* ... Logic from previous implementation ... */
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id))
      return res.status(400).json({ message: "Invalid ID" });
    const deletedMovie = await Movie.findByIdAndDelete(id);
    if (!deletedMovie)
      return res.status(404).json({ message: "Movie not found" });
    // TODO: Cascade delete Showtimes/Reviews/Bookings?
    res.status(200).json({ message: `Movie "${deletedMovie.title}" deleted` });
  } catch (error) {
    /* ... Error handling ... */
  }
});

// =========================
// == CINEMA MANAGEMENT ====
// =========================
// POST /admin/cinemas - Create a new cinema
router.post("/cinemas", async (req, res) => {
  /* ... Logic from previous implementation ... */
  try {
    const newCinema = new Cinema(req.body);
    await newCinema.save();
    res.status(201).json({ message: "Cinema created", cinema: newCinema });
  } catch (error) {
    /* ... Error handling ... */
  }
});

// PUT /admin/cinemas/:id - Update a cinema
router.put("/cinemas/:id", async (req, res) => {
  /* ... Logic from previous implementation ... */
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id))
      return res.status(400).json({ message: "Invalid ID" });
    const updatedCinema = await Cinema.findByIdAndUpdate(
      id,
      { $set: req.body },
      { new: true, runValidators: true }
    );
    if (!updatedCinema)
      return res.status(404).json({ message: "Cinema not found" });
    res.status(200).json({ message: "Cinema updated", cinema: updatedCinema });
  } catch (error) {
    /* ... Error handling ... */
  }
});

// DELETE /admin/cinemas/:id - Delete a cinema
router.delete("/cinemas/:id", async (req, res) => {
  /* ... Logic from previous implementation ... */
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id))
      return res.status(400).json({ message: "Invalid ID" });
    const deletedCinema = await Cinema.findByIdAndDelete(id);
    if (!deletedCinema)
      return res.status(404).json({ message: "Cinema not found" });
    // TODO: Cascade delete Showtimes?
    res.status(200).json({ message: `Cinema "${deletedCinema.name}" deleted` });
  } catch (error) {
    /* ... Error handling ... */
  }
});

// =========================
// == SHOWTIME MANAGEMENT ==
// =========================
// POST /admin/showtimes - Create a new showtime
router.post("/showtimes", async (req, res) => {
  /* ... Logic from previous implementation ... */
  try {
    const { movie, cinema, screenName, startTime, pricePerSeat } = req.body;
    // Validation...
    if (!movie || !cinema || !screenName || !startTime || pricePerSeat == null)
      return res.status(400).json({ message: "Missing required fields" });
    // ... More validation ...
    const movieDoc = await Movie.findById(movie).select("duration");
    if (!movieDoc) return res.status(404).json({ message: "Movie not found" });
    const startTimeDate = new Date(startTime);
    const endTimeDate = new Date(
      startTimeDate.getTime() + movieDoc.duration * 60000
    );
    const newShowtime = new Showtime({
      movie,
      cinema,
      screenName,
      startTime: startTimeDate,
      endTime: endTimeDate,
      pricePerSeat,
    });
    await newShowtime.save();
    res
      .status(201)
      .json({ message: "Showtime created", showtime: newShowtime });
  } catch (error) {
    /* ... Error handling ... */
  }
});

// PUT /admin/showtimes/:id - Update a showtime
router.put("/showtimes/:id", async (req, res) => {
  /* ... Logic from previous implementation ... */
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id))
      return res.status(400).json({ message: "Invalid ID" });
    const updateData = req.body;
    // Prevent updating critical fields directly
    delete updateData.movie;
    delete updateData.cinema;
    delete updateData.bookedSeats;
    delete updateData._id;
    // Recalculate endTime if startTime changes
    if (updateData.startTime) {
      const showtime = await Showtime.findById(id).populate(
        "movie",
        "duration"
      );
      if (!showtime)
        return res.status(404).json({ message: "Showtime not found" });
      updateData.endTime = new Date(
        new Date(updateData.startTime).getTime() +
          showtime.movie.duration * 60000
      );
    }
    const updatedShowtime = await Showtime.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true, runValidators: true }
    );
    if (!updatedShowtime)
      return res.status(404).json({ message: "Showtime not found" });
    res
      .status(200)
      .json({ message: "Showtime updated", showtime: updatedShowtime });
  } catch (error) {
    /* ... Error handling ... */
  }
});

// DELETE /admin/showtimes/:id - Delete a showtime
router.delete("/showtimes/:id", async (req, res) => {
  /* ... Logic from previous implementation ... */
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id))
      return res.status(400).json({ message: "Invalid ID" });
    const bookingCount = await Booking.countDocuments({ showtime: id });
    if (bookingCount > 0)
      return res.status(400).json({
        message: `Cannot delete showtime with ${bookingCount} booking(s).`,
      });
    const deletedShowtime = await Showtime.findByIdAndDelete(id);
    if (!deletedShowtime)
      return res.status(404).json({ message: "Showtime not found" });
    res.status(200).json({ message: `Showtime deleted` });
  } catch (error) {
    /* ... Error handling ... */
  }
});

// =========================
// == BOOKING MANAGEMENT ===
// =========================
// GET /admin/bookings - List all bookings with filters
router.get("/bookings", async (req, res) => {
  /* ... Logic from previous implementation ... */
  try {
    const { search, status, date, userId, movieId, cinemaId } = req.query;
    let filter = {};
    let userIds = null;
    let movieIds = null;
    if (search && search.trim()) {
      /* ... Search logic ... */
      const searchTerm = search.trim();
      const searchRegex = { $regex: searchTerm, $options: "i" };
      const matchingUsers = await User.find({
        $or: [{ name: searchRegex }, { email: searchRegex }],
      })
        .select("_id")
        .lean();
      userIds = matchingUsers.map((u) => u._id);
      const matchingMovies = await Movie.find({ title: searchRegex })
        .select("_id")
        .lean();
      movieIds = matchingMovies.map((m) => m._id);
      const searchConditions = [];
      searchConditions.push({ bookingId: searchRegex });
      if (userIds && userIds.length > 0)
        searchConditions.push({ user: { $in: userIds } });
      if (movieIds && movieIds.length > 0)
        searchConditions.push({ movie: { $in: movieIds } });
      if (searchConditions.length > 0) {
        filter.$or = searchConditions;
      } else {
        return res.status(200).json({ bookings: [] });
      }
    }
    if (
      status &&
      ["pending", "paid", "failed", "refunded", "cancelled"].includes(status)
    )
      filter.paymentStatus = status;
    if (date) {
      const targetDate = new Date(date);
      if (!isNaN(targetDate)) {
        const startOfDay = new Date(targetDate);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(targetDate);
        endOfDay.setHours(23, 59, 59, 999);
        filter.bookingDate = { $gte: startOfDay, $lte: endOfDay };
      }
    }
    if (userId && mongoose.Types.ObjectId.isValid(userId)) filter.user = userId;
    if (movieId && mongoose.Types.ObjectId.isValid(movieId))
      filter.movie = movieId;
    if (cinemaId && mongoose.Types.ObjectId.isValid(cinemaId))
      filter.cinema = cinemaId;
    // TODO: Add Pagination
    const bookings = await Booking.find(filter)
      .populate("user", "name email")
      .populate("movie", "title")
      .populate("cinema", "name")
      .populate("showtime", "startTime screenName")
      .sort({ bookingDate: -1 });
    res.status(200).json({ bookings: bookings });
  } catch (error) {
    console.error("Admin Bookings Fetch Error:", error);
    res.status(500).json({ message: "Error fetching bookings" });
  }
});

// PUT /admin/bookings/:id - Update booking status
router.put("/bookings/:id", async (req, res) => {
  /* ... Logic from previous implementation ... */
  try {
    const { id } = req.params;
    const { paymentStatus } = req.body;
    if (!mongoose.Types.ObjectId.isValid(id))
      return res.status(400).json({ message: "Invalid ID" });
    if (
      !paymentStatus ||
      !["pending", "paid", "failed", "refunded", "cancelled"].includes(
        paymentStatus
      )
    )
      return res.status(400).json({ message: "Invalid paymentStatus" });
    const updatedBooking = await Booking.findByIdAndUpdate(
      id,
      { $set: { paymentStatus: paymentStatus } },
      { new: true, runValidators: true }
    );
    if (!updatedBooking)
      return res.status(404).json({ message: "Booking not found" });
    res
      .status(200)
      .json({ message: "Booking status updated", booking: updatedBooking });
  } catch (error) {
    /* ... Error handling ... */
  }
});

// DELETE /admin/bookings/:id - Cancel/Delete a booking (releases seats)
router.delete("/bookings/:id", async (req, res) => {
  /* ... Logic from previous implementation ... */
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id))
      return res.status(400).json({ message: "Invalid ID" });
    const deletedBooking = await Booking.findByIdAndDelete(id);
    if (!deletedBooking)
      return res.status(404).json({ message: "Booking not found" });
    try {
      await Showtime.updateOne(
        { _id: deletedBooking.showtime },
        { $pull: { bookedSeats: { $in: deletedBooking.seats } } }
      );
    } catch (e) {
      console.error("Seat release error:", e);
    }
    try {
      await User.updateOne(
        { _id: deletedBooking.user },
        { $pull: { bookings: deletedBooking._id } }
      );
    } catch (e) {
      console.error("User booking ref error:", e);
    }
    res
      .status(200)
      .json({ message: `Booking ID "${deletedBooking.bookingId}" deleted` });
  } catch (error) {
    /* ... Error handling ... */
  }
});

// =========================
// == REVIEW MANAGEMENT ====
// =========================
// GET /admin/reviews - List all reviews with filters
router.get("/reviews", async (req, res) => {
  try {
    const {
      search,
      movieId,
      userId,
      rating,
      isHidden,
      page = 1,
      limit = 15,
    } = req.query; // <<< Thêm page, limit
    let filter = {};
    let userIds = null;
    let movieIds = null;

    // --- Search Logic ---
    if (search && search.trim()) {
      const searchTerm = search.trim();
      const searchRegex = { $regex: searchTerm, $options: "i" };

      // Find matching User IDs (parallel)
      const userSearchPromise = User.find({
        $or: [{ name: searchRegex }, { email: searchRegex }],
      })
        .select("_id")
        .lean();

      // Find matching Movie IDs (parallel)
      const movieSearchPromise = Movie.find({ title: searchRegex })
        .select("_id")
        .lean();

      const [matchingUsers, matchingMovies] = await Promise.all([
        userSearchPromise,
        movieSearchPromise,
      ]);

      userIds = matchingUsers.map((u) => u._id);
      movieIds = matchingMovies.map((m) => m._id);

      const searchConditions = [];
      searchConditions.push({ comment: searchRegex }); // Search in comment text
      if (userIds.length > 0) searchConditions.push({ user: { $in: userIds } });
      if (movieIds.length > 0)
        searchConditions.push({ movie: { $in: movieIds } });

      if (searchConditions.length > 0) {
        filter.$or = searchConditions;
      } else {
        // If search term doesn't match any user/movie and is not a comment match pattern
        // We assume it should return empty if nothing is found across relations
        console.log("Search term did not match any known field or entity.");
        return res
          .status(200)
          .json({ reviews: [], total: 0, page: 1, limit: limit }); // Return empty with pagination info
      }
    }

    // --- Other Filters ---
    if (movieId && mongoose.Types.ObjectId.isValid(movieId))
      filter.movie = movieId;
    if (userId && mongoose.Types.ObjectId.isValid(userId)) filter.user = userId;
    if (
      rating &&
      !isNaN(parseInt(rating)) &&
      parseInt(rating) >= 1 &&
      parseInt(rating) <= 5
    )
      filter.rating = parseInt(rating);
    // Handle boolean filter correctly (query params are strings)
    if (
      isHidden !== undefined &&
      ["true", "false"].includes(isHidden.toLowerCase())
    ) {
      filter.isHidden = isHidden.toLowerCase() === "true";
    }

    // --- Pagination Logic ---
    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 15; // Default limit to 15
    const skip = (pageNum - 1) * limitNum;

    console.log("Admin reviews filter:", JSON.stringify(filter));
    console.log("Pagination:", { page: pageNum, limit: limitNum, skip });

    // Execute queries in parallel: one for data, one for total count
    const reviewsPromise = Review.find(filter)
      .populate("user", "name email") // Populate user details
      .populate("movie", "title") // Populate movie title
      .sort({ createdAt: -1 }) // Sort by newest first
      .skip(skip) // Apply skip for pagination
      .limit(limitNum); // Apply limit for pagination

    const totalReviewsPromise = Review.countDocuments(filter); // Count documents matching the filter

    const [reviews, totalReviews] = await Promise.all([
      reviewsPromise,
      totalReviewsPromise,
    ]);

    console.log(
      `Found ${reviews.length} reviews for page ${pageNum}, total ${totalReviews}`
    );

    res.status(200).json({
      reviews: reviews, // The array of reviews for the current page
      total: totalReviews, // Total number of reviews matching the filter
      page: pageNum, // Current page number
      limit: limitNum, // Number of items per page
      pages: Math.ceil(totalReviews / limitNum), // Total number of pages
    });
  } catch (error) {
    console.error("Admin: Error fetching reviews:", error);
    res
      .status(500)
      .json({ message: "Error fetching reviews", error: error.message });
  }
});

// PUT /admin/reviews/:id - Update review visibility (or other fields if needed)
router.put("/reviews/:id", async (req, res) => {
  // <<< Đã thêm endpoint này
  try {
    const reviewId = req.params.id;
    if (!mongoose.Types.ObjectId.isValid(reviewId))
      return res.status(400).json({ message: "Invalid Review ID" });

    const { isHidden } = req.body; // Example: only update isHidden
    if (isHidden === undefined || typeof isHidden !== "boolean") {
      return res
        .status(400)
        .json({ message: "Missing or invalid 'isHidden' field." });
    }

    const updatedReview = await Review.findByIdAndUpdate(
      reviewId,
      { $set: { isHidden: isHidden } },
      { new: true, runValidators: true }
    )
      .populate("user", "name")
      .populate("movie", "title");

    if (!updatedReview)
      return res.status(404).json({ message: "Review not found" });

    // Recalculate movie rating if review visibility changes? Optional, depends on logic.
    // await updatedReview.constructor.updateMovieRating(updatedReview.movie._id); // Call static method if needed

    console.log(`Admin: Updated review ${reviewId} visibility to ${isHidden}`);
    res.status(200).json({
      message: `Review ${isHidden ? "hidden" : "shown"}`,
      review: updatedReview,
    });
  } catch (error) {
    console.error(`Admin Review Update Error (${req.params.id}):`, error);
    res
      .status(500)
      .json({ message: "Error updating review", error: error.message });
  }
});

// DELETE /admin/reviews/:id - Delete a review
router.delete("/reviews/:id", async (req, res) => {
  try {
    const reviewId = req.params.id;
    if (!mongoose.Types.ObjectId.isValid(reviewId))
      return res.status(400).json({ message: "Invalid Review ID" });

    // Dùng findOneAndDelete để trigger hook 'post findOneAndDelete' trong model Review
    // Hook này sẽ tự động cập nhật lại rating trung bình của phim liên quan
    const deletedReview = await Review.findOneAndDelete({ _id: reviewId });

    if (!deletedReview) {
      return res.status(404).json({ message: "Review not found" });
    }

    console.log(
      `Admin: Deleted review ${reviewId} for movie ${deletedReview.movie}`
    );
    res.status(200).json({ message: `Review deleted successfully` });
  } catch (error) {
    console.error(`Admin Review Delete Error (${req.params.id}):`, error);
    res
      .status(500)
      .json({ message: "Error deleting review", error: error.message });
  }
});

module.exports = router;

// --- END OF FILE api/routes/admin.js ---
