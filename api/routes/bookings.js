const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const Booking = require("../models/booking");
// Import các model khác nếu cần populate
const Movie = require("../models/movie");
const Cinema = require("../models/cinema");
const Showtime = require("../models/showtime");
const { authenticateToken } = require("../middleware/auth"); // <<< Cần middleware xác thực

// GET /bookings/user/:userId (Lấy lịch sử đặt vé của user)
router.get("/user/:userId", authenticateToken, async (req, res) => {
  // <<< Đường dẫn là "/user/:userId"
  // Validation: User chỉ xem được của mình, admin xem được của người khác
  if (req.user.userId !== req.params.userId && req.user.role !== "admin") {
    return res
      .status(403)
      .json({ message: "Forbidden: Cannot view others' bookings" });
  }
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.userId)) {
      return res.status(400).json({ message: "Invalid User ID format" });
    }
    const bookings = await Booking.find({ user: req.params.userId })
      .populate("movie", "title posterImage") // Populate các trường cần thiết
      .populate("cinema", "name location.city")
      .populate("showtime", "startTime screenName") // Thêm screenName
      .sort({ bookingDate: -1 }); // Sắp xếp mới nhất trước

    res.status(200).json(bookings); // <<< Trả về mảng bookings trực tiếp
  } catch (error) {
    console.error(
      `Error fetching bookings for user ${req.params.userId}:`,
      error
    );
    res
      .status(500)
      .json({ message: "Error fetching user bookings", error: error.message });
  }
});

// GET /bookings/:id (Lấy chi tiết 1 booking - Dùng cho cả user và admin)
router.get("/:id", authenticateToken, async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: "Invalid Booking ID format" });
    }
    const booking = await Booking.findById(req.params.id)
      .populate("movie") // Populate đầy đủ
      .populate("cinema")
      .populate("showtime");

    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    // Check ownership or admin role
    if (
      booking.user.toString() !== req.user.userId &&
      req.user.role !== "admin"
    ) {
      return res
        .status(403)
        .json({ message: "Forbidden: Cannot view this booking" });
    }
    res.status(200).json(booking); // Trả về booking object
  } catch (error) {
    console.error(`Error fetching booking ${req.params.id}:`, error);
    res.status(500).json({
      message: "Error fetching booking details",
      error: error.message,
    });
  }
});

// POST /bookings (Tạo booking mới - User action)
// Di chuyển logic tạo booking từ index.js vào đây nếu chưa làm
router.post("/", authenticateToken, async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { showtimeId, seats, paymentMethod, totalPrice } = req.body;
    const userId = req.user.userId;

    if (
      !showtimeId ||
      !seats ||
      !Array.isArray(seats) ||
      seats.length === 0 ||
      !paymentMethod ||
      totalPrice == null
    ) {
      /* ... validation ... */ await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ message: "Missing info" });
    }
    if (!mongoose.Types.ObjectId.isValid(showtimeId)) {
      /* ... */ await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ message: "Invalid Showtime ID" });
    }

    const showtime = await Showtime.findById(showtimeId)
      .select("bookedSeats movie cinema pricePerSeat")
      .session(session);
    if (!showtime) {
      /* ... */ await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ message: "Showtime not found" });
    }

    const expectedPrice = seats.length * showtime.pricePerSeat;
    if (Math.abs(expectedPrice - totalPrice) > 0.01) {
      /* ... */ await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        message: `Price mismatch. Expected $${expectedPrice.toFixed(2)}`,
      });
    }

    const updateResult = await Showtime.updateOne(
      { _id: showtimeId, bookedSeats: { $nin: seats } },
      { $addToSet: { bookedSeats: { $each: seats } } },
      { session }
    );
    if (updateResult.matchedCount === 0) {
      /* ... */ await session.abortTransaction();
      session.endSession();
      return res.status(409).json({ message: "Seat conflict." });
    }

    const { generateBookingId } = require("../utils/helpers"); // Import helper
    const newBooking = new Booking({
      bookingId: generateBookingId(),
      user: userId,
      movie: showtime.movie,
      cinema: showtime.cinema,
      showtime: showtimeId,
      seats: seats,
      totalPrice: totalPrice,
      paymentMethod: paymentMethod,
      paymentStatus: "pending",
    });
    await newBooking.save({ session });

    const User = require("../models/user"); // Require User model locally
    await User.findByIdAndUpdate(
      userId,
      { $push: { bookings: newBooking._id } },
      { session }
    );

    // TEMPORARY PAYMENT SIMULATION
    newBooking.paymentStatus = "paid";
    newBooking.qrCodeData = newBooking.bookingId;
    await newBooking.save({ session });
    // END TEMPORARY

    await session.commitTransaction();
    session.endSession();

    const populatedBooking = await Booking.findById(newBooking._id)
      .populate("movie", "title posterImage")
      .populate("cinema", "name location")
      .populate("showtime", "startTime screenName");
    res
      .status(201)
      .json({ message: "Booking successful!", booking: populatedBooking });
  } catch (error) {
    console.error("Error creating booking:", error);
    await session.abortTransaction();
    session.endSession();
    res
      .status(500)
      .json({ message: "Error creating booking", error: error.message });
  }
});

module.exports = router;
