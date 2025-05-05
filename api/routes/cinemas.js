// module.exports = null;

const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const Cinema = require("../models/cinema");

// GET /cinemas (Public - Lấy danh sách rạp với filter)
router.get("/", async (req, res) => {
  try {
    const { city, search } = req.query;
    let filter = {};
    if (city) filter["location.city"] = { $regex: city.trim(), $options: "i" };
    if (search) filter.name = { $regex: search.trim(), $options: "i" };

    const cinemas = await Cinema.find(filter).sort({ name: 1 }); // Sắp xếp theo tên
    res.status(200).json(cinemas);
  } catch (error) {
    console.error("Error fetching cinemas:", error);
    res
      .status(500)
      .json({ message: "Error fetching cinemas", error: error.message });
  }
});

// GET /cinemas/:id (Public - Lấy chi tiết một rạp)
router.get("/:id", async (req, res) => {
  try {
    const cinemaId = req.params.id;
    if (!mongoose.Types.ObjectId.isValid(cinemaId))
      return res.status(400).json({ message: "Invalid Cinema ID" });

    const cinema = await Cinema.findById(cinemaId);
    if (!cinema) {
      return res.status(404).json({ message: "Cinema not found" });
    }
    res.status(200).json(cinema);
  } catch (error) {
    console.error(`Error fetching cinema ${req.params.id}:`, error);
    res
      .status(500)
      .json({ message: "Error fetching cinema details", error: error.message });
  }
});

module.exports = router;
