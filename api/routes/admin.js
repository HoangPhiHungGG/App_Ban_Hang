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
// == MOVIE MANAGEMENT =====
// =========================
// POST /admin/movies - Create a new movie
router.post("/movies", async (req, res) => {
  try {
    const newMovie = new Movie(req.body);
    await newMovie.save();
    console.log("Admin: Movie created:", newMovie._id);
    res
      .status(201)
      .json({ message: "Movie created successfully", movie: newMovie });
  } catch (error) {
    console.error("Admin: Error creating movie:", error);
    if (error.name === "ValidationError") {
      return res
        .status(400)
        .json({ message: "Validation Error", errors: error.errors });
    }
    res
      .status(500)
      .json({ message: "Error creating movie", error: error.message });
  }
});

// PUT /admin/movies/:id - Update a movie
router.put("/movies/:id", async (req, res) => {
  try {
    const movieId = req.params.id;
    if (!mongoose.Types.ObjectId.isValid(movieId)) {
      return res.status(400).json({ message: "Invalid Movie ID format" });
    }

    const receivedData = req.body;
    console.log(
      `Admin: Received update data for movie ${movieId}:`,
      JSON.stringify(receivedData, null, 2)
    );

    const allowedUpdates = [
      "title",
      "description",
      "posterImage",
      "bannerImage",
      "trailerUrl",
      "genre",
      "language",
      "duration",
      "releaseDate",
      "status",
      "cast",
      "director",
      "country",
    ];

    const updateFields = {}; // Object để xây dựng các trường $set

    for (const key of allowedUpdates) {
      if (receivedData.hasOwnProperty(key)) {
        // Chỉ xử lý nếu trường được gửi từ client
        let value = receivedData[key];

        // Xử lý đặc biệt cho từng loại dữ liệu nếu cần
        if (
          key === "title" ||
          key === "description" ||
          key === "posterImage" ||
          key === "bannerImage" ||
          key === "trailerUrl" ||
          key === "director" ||
          key === "country" ||
          key === "language"
        ) {
          if (typeof value === "string") {
            value = value.trim();
            if (
              value === "" &&
              (key === "bannerImage" ||
                key === "trailerUrl" ||
                key === "director" ||
                key === "country")
            ) {
              // Cho phép xóa các trường optional bằng cách gửi chuỗi rỗng, sẽ được set thành undefined
              updateFields[key] = undefined; // Hoặc dùng $unset, nhưng $set: undefined cũng hiệu quả
            } else if (value !== "") {
              updateFields[key] = value;
            }
          } else if (
            value === null &&
            (key === "bannerImage" ||
              key === "trailerUrl" ||
              key === "director" ||
              key === "country")
          ) {
            updateFields[key] = undefined; // Cho phép set null thành undefined
          }
        } else if (key === "genre" || key === "cast") {
          if (typeof value === "string") {
            updateFields[key] = value
              .split(",")
              .map((item) => item.trim())
              .filter((item) => item);
          } else if (Array.isArray(value)) {
            updateFields[key] = value
              .map((item) => (typeof item === "string" ? item.trim() : item))
              .filter((item) => item);
          } else {
            updateFields[key] = []; // Mặc định là mảng rỗng nếu không hợp lệ
          }
        } else if (key === "duration") {
          const numValue = parseInt(value, 10);
          if (!isNaN(numValue) && numValue > 0) {
            updateFields[key] = numValue;
          } else {
            console.warn(
              `Admin: Invalid duration value '${value}' received for movie ${movieId}. Skipping update for duration.`
            );
            // Không thêm vào updateFields nếu không hợp lệ, hoặc có thể trả lỗi 400
          }
        } else if (key === "releaseDate") {
          const dateValue = new Date(value);
          if (!isNaN(dateValue.getTime())) {
            updateFields[key] = dateValue;
          } else {
            console.warn(
              `Admin: Invalid releaseDate value '${value}' received for movie ${movieId}. Skipping update for releaseDate.`
            );
          }
        } else if (key === "status") {
          // Kiểm tra giá trị status với enum trong schema
          const movieSchemaPaths = Movie.schema.paths;
          if (movieSchemaPaths.status && movieSchemaPaths.status.enumValues) {
            if (movieSchemaPaths.status.enumValues.includes(value)) {
              updateFields[key] = value;
            } else {
              console.warn(
                `Admin: Invalid status value '${value}' for movie ${movieId}. Allowed: ${movieSchemaPaths.status.enumValues.join(
                  ", "
                )}. Skipping status update.`
              );
              // return res.status(400).json({ message: `Invalid status value. Allowed: ${movieSchemaPaths.status.enumValues.join(', ')}` }); // Trả lỗi nếu muốn chặt chẽ
            }
          } else {
            updateFields[key] = value; // Nếu không có enum, cứ cập nhật
          }
        }
      }
    }

    if (Object.keys(updateFields).length === 0) {
      return res
        .status(400)
        .json({ message: "No valid or changed fields provided for update." });
    }

    console.log(
      `Admin: Processed update fields for movie ${movieId}:`,
      JSON.stringify(updateFields, null, 2)
    );

    const updatedMovie = await Movie.findByIdAndUpdate(
      movieId,
      { $set: updateFields },
      { new: true, runValidators: true }
    );

    if (!updatedMovie) {
      return res.status(404).json({ message: "Movie not found" });
    }

    console.log(`Admin: Successfully updated movie ${movieId}.`);
    res
      .status(200)
      .json({ message: "Movie updated successfully", movie: updatedMovie });
  } catch (error) {
    console.error(`Admin: Error updating movie ${req.params.id}:`, error);
    if (error.name === "ValidationError") {
      console.error("Admin: Movie update ValidationError:", error.errors);
      return res
        .status(400)
        .json({ message: "Validation Error", errors: error.errors });
    }
    res
      .status(500)
      .json({ message: "Error updating movie", error: error.message });
  }
});

// DELETE /admin/movies/:id - Delete a movie
router.delete("/movies/:id", async (req, res) => {
  try {
    const movieId = req.params.id;
    if (!mongoose.Types.ObjectId.isValid(movieId)) {
      return res.status(400).json({ message: "Invalid Movie ID format" });
    }
    const deletedMovie = await Movie.findByIdAndDelete(movieId);
    if (!deletedMovie) {
      return res.status(404).json({ message: "Movie not found" });
    }
    // TODO: Cascade delete related Showtimes, Reviews, Bookings for this movie
    // await Showtime.deleteMany({ movie: movieId });
    // await Review.deleteMany({ movie: movieId }); // This will trigger rating updates
    // await Booking.deleteMany({ movie: movieId });
    console.log(`Admin: Deleted movie ${movieId}`);
    res
      .status(200)
      .json({ message: `Movie "${deletedMovie.title}" deleted successfully` });
  } catch (error) {
    console.error(`Admin: Error deleting movie ${req.params.id}:`, error);
    res
      .status(500)
      .json({ message: "Error deleting movie", error: error.message });
  }
});

// =========================
// == CINEMA MANAGEMENT ====
// =========================
// POST /admin/cinemas - Create a new cinema
router.post("/cinemas", async (req, res) => {
  try {
    const newCinema = new Cinema(req.body);
    await newCinema.save();
    console.log("Admin: Cinema created:", newCinema._id);
    res
      .status(201)
      .json({ message: "Cinema created successfully", cinema: newCinema });
  } catch (error) {
    console.error("Admin: Error creating cinema:", error);
    if (error.name === "ValidationError") {
      return res
        .status(400)
        .json({ message: "Validation Error", errors: error.errors });
    }
    res
      .status(500)
      .json({ message: "Error creating cinema", error: error.message });
  }
});

// PUT /admin/cinemas/:id - Update a cinema
router.put("/cinemas/:id", async (req, res) => {
  try {
    const cinemaId = req.params.id;
    if (!mongoose.Types.ObjectId.isValid(cinemaId)) {
      return res.status(400).json({ message: "Invalid Cinema ID format" });
    }

    const receivedUpdateData = req.body;
    console.log(
      `Admin: Received update data for cinema ${cinemaId}:`,
      receivedUpdateData
    );

    // --- Whitelist Approach for Cinema Fields ---
    // Liệt kê các trường bạn cho phép cập nhật cho Cinema
    const allowedUpdates = [
      "name",
      "location", // location là một object, cần xử lý cẩn thận
      "totalScreens",
      // Thêm các trường khác của Cinema mà bạn muốn cho phép cập nhật
    ];

    const updateData = {};
    for (const key of allowedUpdates) {
      if (receivedUpdateData.hasOwnProperty(key)) {
        if (key === "location") {
          // Nếu location được gửi lên, chỉ cập nhật các trường con được phép của location
          updateData.location = {};
          const allowedLocationFields = [
            "address",
            "city",
            "state",
            "postalCode",
          ];
          if (
            typeof receivedUpdateData.location === "object" &&
            receivedUpdateData.location !== null
          ) {
            for (const locKey of allowedLocationFields) {
              if (
                receivedUpdateData.location.hasOwnProperty(locKey) &&
                receivedUpdateData.location[locKey] !== undefined
              ) {
                updateData.location[locKey] =
                  receivedUpdateData.location[locKey];
              }
            }
            // Nếu sau khi lọc, object location rỗng, không cần thêm nó vào updateData
            if (Object.keys(updateData.location).length === 0) {
              delete updateData.location;
            }
          }
        } else if (key === "totalScreens") {
          const screens = parseInt(receivedUpdateData[key], 10);
          if (!isNaN(screens) && screens >= 0) {
            // Cho phép 0 screen nếu hợp lệ
            updateData[key] = screens;
          } else {
            console.warn(
              `Invalid totalScreens value received: ${receivedUpdateData[key]}`
            );
          }
        } else {
          // Các trường khác, gán trực tiếp
          updateData[key] = receivedUpdateData[key];
        }
      }
    }

    if (Object.keys(updateData).length === 0) {
      return res
        .status(400)
        .json({ message: "No valid fields provided for update." });
    }

    console.log(
      `Admin: Sanitized update data for cinema ${cinemaId}:`,
      updateData
    );

    const updatedCinema = await Cinema.findByIdAndUpdate(
      cinemaId,
      { $set: updateData }, // Chỉ cập nhật các trường đã được xử lý trong updateData
      { new: true, runValidators: true } // runValidators để kích hoạt schema validation
    );

    if (!updatedCinema) {
      return res.status(404).json({ message: "Cinema not found" });
    }

    console.log(
      `Admin: Successfully updated cinema ${cinemaId}:`,
      updatedCinema
    );
    res
      .status(200)
      .json({ message: "Cinema updated successfully", cinema: updatedCinema });
  } catch (error) {
    console.error(`Admin: Error updating cinema ${req.params.id}:`, error);
    if (error.name === "ValidationError") {
      console.error("Admin: Cinema update ValidationError:", error.errors);
      return res
        .status(400)
        .json({ message: "Validation Error", errors: error.errors });
    }
    res
      .status(500)
      .json({ message: "Error updating cinema", error: error.message });
  }
});

// DELETE /admin/cinemas/:id - Delete a cinema
router.delete("/cinemas/:id", async (req, res) => {
  try {
    const cinemaId = req.params.id;
    if (!mongoose.Types.ObjectId.isValid(cinemaId)) {
      return res.status(400).json({ message: "Invalid Cinema ID format" });
    }
    const deletedCinema = await Cinema.findByIdAndDelete(cinemaId);
    if (!deletedCinema) {
      return res.status(404).json({ message: "Cinema not found" });
    }
    // TODO: Cascade delete related Showtimes for this cinema
    // await Showtime.deleteMany({ cinema: cinemaId });
    console.log(`Admin: Deleted cinema ${cinemaId}`);
    res
      .status(200)
      .json({ message: `Cinema "${deletedCinema.name}" deleted successfully` });
  } catch (error) {
    console.error(`Admin: Error deleting cinema ${req.params.id}:`, error);
    res
      .status(500)
      .json({ message: "Error deleting cinema", error: error.message });
  }
});

// =========================
// == SHOWTIME MANAGEMENT ==
// =========================
// POST /admin/showtimes - Create a new showtime
router.post("/showtimes", async (req, res) => {
  try {
    const { movie, cinema, screenName, startTime, pricePerSeat } = req.body;

    // Basic Validation
    if (
      !movie ||
      !cinema ||
      !screenName ||
      !startTime ||
      pricePerSeat == null
    ) {
      return res
        .status(400)
        .json({ message: "Missing required fields for showtime creation." });
    }
    if (
      !mongoose.Types.ObjectId.isValid(movie) ||
      !mongoose.Types.ObjectId.isValid(cinema)
    ) {
      return res
        .status(400)
        .json({ message: "Invalid Movie or Cinema ID format." });
    }
    if (typeof pricePerSeat !== "number" || pricePerSeat < 0) {
      return res
        .status(400)
        .json({ message: "Price per seat must be a non-negative number." });
    }
    const startTimeDate = new Date(startTime);
    if (isNaN(startTimeDate)) {
      return res.status(400).json({ message: "Invalid startTime format." });
    }

    // Fetch Movie for duration to calculate endTime
    const movieDoc = await Movie.findById(movie).select("duration");
    if (!movieDoc) {
      return res.status(404).json({ message: "Associated Movie not found." });
    }
    if (typeof movieDoc.duration !== "number" || movieDoc.duration <= 0) {
      return res
        .status(400)
        .json({ message: "Associated Movie has an invalid duration." });
    }

    const endTimeDate = new Date(
      startTimeDate.getTime() + movieDoc.duration * 60000 // duration in minutes
    );

    const newShowtime = new Showtime({
      movie,
      cinema,
      screenName,
      startTime: startTimeDate,
      endTime: endTimeDate,
      pricePerSeat,
      bookedSeats: [], // Initialize with empty booked seats
    });

    await newShowtime.save();
    console.log("Admin: Showtime created:", newShowtime._id);
    res.status(201).json({
      message: "Showtime created successfully",
      showtime: newShowtime,
    });
  } catch (error) {
    console.error("Admin Showtime Create Error:", error);
    if (error.name === "ValidationError") {
      return res
        .status(400)
        .json({ message: "Validation Error", errors: error.errors });
    }
    res
      .status(500)
      .json({ message: "Error creating showtime", error: error.message });
  }
});

// PUT /admin/showtimes/:id - Update a showtime
router.put("/showtimes/:id", async (req, res) => {
  try {
    const showtimeIdToUpdate = req.params.id;
    if (!mongoose.Types.ObjectId.isValid(showtimeIdToUpdate)) {
      return res.status(400).json({ message: "Invalid Showtime ID format" });
    }

    const updateData = req.body;
    // Prevent updating movie, cinema, or bookedSeats directly via this route
    delete updateData.movie;
    delete updateData.cinema;
    delete updateData.bookedSeats;
    delete updateData._id; // Should not be in body anyway

    // Recalculate endTime if startTime changes or movie (if movie update was allowed)
    if (updateData.startTime) {
      // Need the movie's duration. Fetch the showtime to get its movie ID.
      const currentShowtime = await Showtime.findById(showtimeIdToUpdate)
        .populate("movie", "duration") // Populate only duration
        .lean(); // Use lean for read-only operation

      if (!currentShowtime) {
        return res.status(404).json({ message: "Showtime not found." });
      }
      if (
        !currentShowtime.movie ||
        typeof currentShowtime.movie.duration !== "number" ||
        currentShowtime.movie.duration <= 0
      ) {
        return res.status(400).json({
          message:
            "Cannot update showtime: associated movie's duration is invalid.",
        });
      }

      const newStartTimeDate = new Date(updateData.startTime);
      if (isNaN(newStartTimeDate)) {
        return res
          .status(400)
          .json({ message: "Invalid new startTime format." });
      }
      updateData.endTime = new Date(
        newStartTimeDate.getTime() + currentShowtime.movie.duration * 60000
      );
    }
    // Validate pricePerSeat if provided
    if (updateData.pricePerSeat !== undefined) {
      const priceNum = parseFloat(updateData.pricePerSeat);
      if (isNaN(priceNum) || priceNum < 0) {
        return res.status(400).json({ message: "Invalid price per seat." });
      }
      updateData.pricePerSeat = priceNum;
    }

    const updatedShowtime = await Showtime.findByIdAndUpdate(
      showtimeIdToUpdate,
      { $set: updateData },
      { new: true, runValidators: true }
    );

    if (!updatedShowtime) {
      return res.status(404).json({ message: "Showtime not found" });
    }
    console.log(`Admin: Updated showtime ${showtimeIdToUpdate}`);
    res.status(200).json({
      message: "Showtime updated successfully",
      showtime: updatedShowtime,
    });
  } catch (error) {
    console.error(`Admin Showtime Update Error (${req.params.id}):`, error);
    if (error.name === "ValidationError") {
      return res
        .status(400)
        .json({ message: "Validation Error", errors: error.errors });
    }
    res
      .status(500)
      .json({ message: "Error updating showtime", error: error.message });
  }
});

// DELETE /admin/showtimes/:id - Delete a showtime
router.delete("/showtimes/:id", async (req, res) => {
  try {
    const showtimeIdToDelete = req.params.id;
    if (!mongoose.Types.ObjectId.isValid(showtimeIdToDelete)) {
      return res.status(400).json({ message: "Invalid Showtime ID format" });
    }

    // Check for existing bookings before deleting
    const existingBookings = await Booking.countDocuments({
      showtime: showtimeIdToDelete,
    });
    if (existingBookings > 0) {
      return res.status(400).json({
        message: `Cannot delete showtime with ${existingBookings} existing booking(s). Please cancel or reassign bookings first.`,
      });
    }

    const deletedShowtime = await Showtime.findByIdAndDelete(
      showtimeIdToDelete
    );
    if (!deletedShowtime) {
      return res.status(404).json({ message: "Showtime not found" });
    }
    console.log(`Admin: Deleted showtime ${showtimeIdToDelete}`);
    res.status(200).json({ message: `Showtime deleted successfully` });
  } catch (error) {
    console.error(`Admin Showtime Delete Error (${req.params.id}):`, error);
    res
      .status(500)
      .json({ message: "Error deleting showtime", error: error.message });
  }
});

// =========================
// == BOOKING MANAGEMENT ===
// =========================
// GET /admin/bookings - List all bookings with filters and pagination
router.get("/bookings", async (req, res) => {
  try {
    const {
      search,
      status,
      date,
      userId,
      movieId,
      cinemaId,
      page = 1,
      limit = 15,
    } = req.query;
    let filter = {};

    if (search && search.trim()) {
      const searchTerm = search.trim();
      const searchRegex = { $regex: searchTerm, $options: "i" };
      const matchingUsers = await User.find({
        $or: [{ name: searchRegex }, { email: searchRegex }],
      })
        .select("_id")
        .lean();
      const userIds = matchingUsers.map((u) => u._id);
      const matchingMovies = await Movie.find({ title: searchRegex })
        .select("_id")
        .lean();
      const movieIds = matchingMovies.map((m) => m._id);

      const searchConditions = [{ bookingId: searchRegex }];
      if (userIds.length > 0) searchConditions.push({ user: { $in: userIds } });
      if (movieIds.length > 0)
        searchConditions.push({ movie: { $in: movieIds } });

      if (searchConditions.length > 0) filter.$or = searchConditions;
      else {
        // If search term doesn't match any user/movie name and is not a bookingId pattern
        // To avoid returning all bookings if search doesn't find related entities but isn't specific to bookingId
        // We can add a condition that will result in no matches if filter.$or is empty due to this.
        // For example, match a non-existent bookingId.
        // This part can be tricky; better to ensure search logic is robust.
        // For now, if $or is empty because user/movie search yielded nothing, it effectively returns nothing (if bookingId pattern also fails).
      }
    }

    if (
      status &&
      ["pending", "paid", "failed", "refunded", "cancelled"].includes(status)
    ) {
      filter.paymentStatus = status;
    }
    if (date) {
      const targetDate = new Date(date);
      if (!isNaN(targetDate)) {
        const startOfDay = new Date(targetDate.setHours(0, 0, 0, 0));
        const endOfDay = new Date(targetDate.setHours(23, 59, 59, 999));
        filter.bookingDate = { $gte: startOfDay, $lte: endOfDay };
      }
    }
    if (userId && mongoose.Types.ObjectId.isValid(userId)) filter.user = userId;
    if (movieId && mongoose.Types.ObjectId.isValid(movieId))
      filter.movie = movieId;
    if (cinemaId && mongoose.Types.ObjectId.isValid(cinemaId))
      filter.cinema = cinemaId;

    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    const bookingsPromise = Booking.find(filter)
      .populate("user", "name email")
      .populate("movie", "title")
      .populate("cinema", "name")
      .populate("showtime", "startTime screenName")
      .sort({ bookingDate: -1 })
      .skip(skip)
      .limit(limitNum);
    const totalBookingsPromise = Booking.countDocuments(filter);

    const [bookings, totalBookings] = await Promise.all([
      bookingsPromise,
      totalBookingsPromise,
    ]);

    res.status(200).json({
      bookings: bookings,
      total: totalBookings,
      page: pageNum,
      pages: Math.ceil(totalBookings / limitNum),
    });
  } catch (error) {
    console.error("Admin Bookings Fetch Error:", error);
    res
      .status(500)
      .json({ message: "Error fetching bookings", error: error.message });
  }
});

// PUT /admin/bookings/:id - Update booking status
router.put("/bookings/:id", async (req, res) => {
  try {
    const bookingIdToUpdate = req.params.id;
    const { paymentStatus } = req.body;

    if (!mongoose.Types.ObjectId.isValid(bookingIdToUpdate)) {
      return res.status(400).json({ message: "Invalid Booking ID format" });
    }
    if (
      !paymentStatus ||
      !["pending", "paid", "failed", "refunded", "cancelled"].includes(
        paymentStatus
      )
    ) {
      return res
        .status(400)
        .json({ message: "Invalid paymentStatus provided" });
    }

    const updatedBooking = await Booking.findByIdAndUpdate(
      bookingIdToUpdate,
      { $set: { paymentStatus: paymentStatus } },
      { new: true, runValidators: true }
    )
      .populate("user", "name email") // Repopulate for consistent response
      .populate("movie", "title")
      .populate("cinema", "name")
      .populate("showtime", "startTime screenName");

    if (!updatedBooking) {
      return res.status(404).json({ message: "Booking not found" });
    }
    console.log(
      `Admin: Updated booking ${bookingIdToUpdate} status to ${paymentStatus}`
    );
    res
      .status(200)
      .json({ message: "Booking status updated", booking: updatedBooking });
  } catch (error) {
    console.error(`Admin Booking Update Error (${req.params.id}):`, error);
    res
      .status(500)
      .json({ message: "Error updating booking status", error: error.message });
  }
});

// DELETE /admin/bookings/:id - Cancel/Delete a booking (releases seats)
router.delete("/bookings/:id", async (req, res) => {
  try {
    const bookingIdToDelete = req.params.id;
    if (!mongoose.Types.ObjectId.isValid(bookingIdToDelete)) {
      return res.status(400).json({ message: "Invalid Booking ID format" });
    }

    const bookingToDelete = await Booking.findById(bookingIdToDelete);
    if (!bookingToDelete) {
      return res.status(404).json({ message: "Booking not found" });
    }

    // Release seats
    if (bookingToDelete.showtime && bookingToDelete.seats?.length > 0) {
      await Showtime.updateOne(
        { _id: bookingToDelete.showtime },
        { $pullAll: { bookedSeats: bookingToDelete.seats } } // Use $pullAll for arrays
      );
      console.log(
        `Admin: Released seats ${bookingToDelete.seats.join(
          ", "
        )} for showtime ${bookingToDelete.showtime}`
      );
    }

    // Remove booking reference from user
    if (bookingToDelete.user) {
      await User.updateOne(
        { _id: bookingToDelete.user },
        { $pull: { bookings: bookingToDelete._id } }
      );
      console.log(
        `Admin: Removed booking ref ${bookingToDelete._id} from user ${bookingToDelete.user}`
      );
    }

    await Booking.findByIdAndDelete(bookingIdToDelete);

    console.log(`Admin: Deleted booking ${bookingToDelete.bookingId}`);
    res.status(200).json({
      message: `Booking ID "${bookingToDelete.bookingId}" deleted and seats released.`,
    });
  } catch (error) {
    console.error(`Admin Booking Delete Error (${req.params.id}):`, error);
    res
      .status(500)
      .json({ message: "Error deleting booking", error: error.message });
  }
});

// =========================
// == REVIEW MANAGEMENT ====
// =========================
// GET /admin/reviews - List all reviews with filters and pagination
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
    } = req.query;
    let filter = {};

    if (search && search.trim()) {
      const searchTerm = search.trim();
      const searchRegex = { $regex: searchTerm, $options: "i" };
      const userSearchPromise = User.find({
        $or: [{ name: searchRegex }, { email: searchRegex }],
      })
        .select("_id")
        .lean();
      const movieSearchPromise = Movie.find({ title: searchRegex })
        .select("_id")
        .lean();
      const [matchingUsers, matchingMovies] = await Promise.all([
        userSearchPromise,
        movieSearchPromise,
      ]);
      const userIds = matchingUsers.map((u) => u._id);
      const movieIds = matchingMovies.map((m) => m._id);
      const searchConditions = [{ comment: searchRegex }];
      if (userIds.length > 0) searchConditions.push({ user: { $in: userIds } });
      if (movieIds.length > 0)
        searchConditions.push({ movie: { $in: movieIds } });
      filter.$or = searchConditions;
    }

    if (movieId && mongoose.Types.ObjectId.isValid(movieId))
      filter.movie = movieId;
    if (userId && mongoose.Types.ObjectId.isValid(userId)) filter.user = userId;
    const ratingNum = parseInt(rating, 10);
    if (!isNaN(ratingNum) && ratingNum >= 1 && ratingNum <= 5)
      filter.rating = ratingNum;
    if (
      isHidden !== undefined &&
      ["true", "false"].includes(isHidden.toLowerCase())
    ) {
      filter.isHidden = isHidden.toLowerCase() === "true";
    }

    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    const reviewsPromise = Review.find(filter)
      .populate("user", "name email")
      .populate("movie", "title")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);
    const totalReviewsPromise = Review.countDocuments(filter);

    const [reviews, totalReviews] = await Promise.all([
      reviewsPromise,
      totalReviewsPromise,
    ]);

    res.status(200).json({
      reviews: reviews,
      total: totalReviews,
      page: pageNum,
      pages: Math.ceil(totalReviews / limitNum),
    });
  } catch (error) {
    console.error("Admin: Error fetching reviews:", error);
    res
      .status(500)
      .json({ message: "Error fetching reviews", error: error.message });
  }
});

// PUT /admin/reviews/:id - Update review visibility
router.put("/reviews/:id", async (req, res) => {
  try {
    const reviewId = req.params.id;
    const { isHidden } = req.body;

    if (!mongoose.Types.ObjectId.isValid(reviewId)) {
      return res.status(400).json({ message: "Invalid Review ID format" });
    }
    if (isHidden === undefined || typeof isHidden !== "boolean") {
      return res.status(400).json({
        message: "'isHidden' field is required and must be a boolean.",
      });
    }

    const updatedReview = await Review.findByIdAndUpdate(
      reviewId,
      { $set: { isHidden } },
      { new: true }
    ).populate("movie", "_id"); // Populate movie ID to update its rating

    if (!updatedReview) {
      return res.status(404).json({ message: "Review not found" });
    }

    // CRITICAL: Update the movie's average rating after changing review visibility
    if (updatedReview.movie?._id) {
      await Review.updateMovieAverageRating(updatedReview.movie._id); // Call static method from Review model
    } else {
      console.warn(
        `Review ${updatedReview._id} updated, but associated movie data missing for rating update.`
      );
    }

    console.log(`Admin: Updated review ${reviewId} visibility to ${isHidden}`);
    res.status(200).json({
      message: `Review visibility ${isHidden ? "hidden" : "shown"}`,
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
    if (!mongoose.Types.ObjectId.isValid(reviewId)) {
      return res.status(400).json({ message: "Invalid Review ID format" });
    }

    // Use findOneAndDelete to trigger the 'post findOneAndDelete' hook in Review model
    const deletedReview = await Review.findOneAndDelete({ _id: reviewId });

    if (!deletedReview) {
      return res.status(404).json({ message: "Review not found" });
    }

    // The hook in Review model will handle movie average rating update.
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
