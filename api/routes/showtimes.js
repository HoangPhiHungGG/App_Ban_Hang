// module.exports = null;

const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const Showtime = require("../models/showtime");
const Movie = require("../models/movie"); // Cần để populate
const Cinema = require("../models/cinema"); // Cần để populate

// GET /showtimes (Public - Lấy danh sách suất chiếu với filter)
router.get("/", async (req, res) => {
  try {
    const { movieId, cinemaId, date } = req.query;
    let filter = {};

    if (movieId) {
      if (!mongoose.Types.ObjectId.isValid(movieId))
        return res.status(400).json({ message: "Invalid Movie ID" });
      filter.movie = movieId;
    }
    if (cinemaId) {
      if (!mongoose.Types.ObjectId.isValid(cinemaId))
        return res.status(400).json({ message: "Invalid Cinema ID" });
      filter.cinema = cinemaId;
    }

    const targetDate = date ? new Date(date) : new Date();
    if (isNaN(targetDate))
      return res
        .status(400)
        .json({ message: "Invalid date format. Use YYYY-MM-DD." });

    const startOfDay = new Date(targetDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(targetDate);
    endOfDay.setHours(23, 59, 59, 999);
    filter.startTime = { $gte: startOfDay, $lte: endOfDay };

    // Chỉ lấy suất chiếu chưa kết thúc
    // filter.endTime = { $gt: new Date() };

    const showtimes = await Showtime.find(filter)
      .populate("movie", "title posterImage duration") // Lấy các trường cần thiết
      .populate("cinema", "name location")
      .sort({ startTime: 1 }); // Sắp xếp theo giờ bắt đầu

    res.status(200).json(showtimes);
  } catch (error) {
    console.error("Error fetching showtimes:", error);
    res
      .status(500)
      .json({ message: "Error fetching showtimes", error: error.message });
  }
});

// GET /showtimes/:id (Public - Lấy chi tiết một suất chiếu)
router.get("/:id", async (req, res) => {
  try {
    const showtimeId = req.params.id;
    if (!mongoose.Types.ObjectId.isValid(showtimeId))
      return res.status(400).json({ message: "Invalid Showtime ID" });

    const showtime = await Showtime.findById(showtimeId)
      .populate("movie") // Lấy đầy đủ thông tin movie
      .populate("cinema"); // Lấy đầy đủ thông tin cinema

    if (!showtime) {
      return res.status(404).json({ message: "Showtime not found" });
    }
    // Trả về cả bookedSeats để frontend biết ghế nào đã bị đặt
    res.status(200).json(showtime);
  } catch (error) {
    console.error(`Error fetching showtime ${req.params.id}:`, error);
    res.status(500).json({
      message: "Error fetching showtime details",
      error: error.message,
    });
  }
});

module.exports = router;
