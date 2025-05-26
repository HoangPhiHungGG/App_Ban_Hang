const express = require("express");
const router = express.Router({ mergeParams: true }); // mergeParams để lấy movieId từ route cha
const mongoose = require("mongoose");
const Review = require("../models/review");
const Movie = require("../models/movie"); // Để kiểm tra phim tồn tại
const { authenticateToken } = require("../middleware/auth"); // Chỉ cần authenticate cho user

// --- POST /movies/:movieId/reviews ---
// User tạo mới hoặc cập nhật đánh giá của họ cho một phim
router.post("/", authenticateToken, async (req, res) => {
  try {
    const { rating, comment } = req.body;
    const userId = req.user.userId; // Từ token
    const movieId = req.params.movieId; // Từ URL

    // Validation
    if (!mongoose.Types.ObjectId.isValid(movieId)) {
      return res.status(400).json({ message: "Invalid Movie ID format." });
    }
    if (!rating || typeof rating !== "number" || rating < 1 || rating > 5) {
      return res
        .status(400)
        .json({ message: "Rating must be a number between 1 and 5." });
    }
    const movieExists = await Movie.findById(movieId).select("_id");
    if (!movieExists) {
      return res.status(404).json({ message: "Movie not found." });
    }

    // Tìm và cập nhật, hoặc tạo mới nếu chưa có
    const review = await Review.findOneAndUpdate(
      { user: userId, movie: movieId }, // Điều kiện tìm kiếm
      {
        $set: {
          // Các trường cần cập nhật/đặt
          rating: rating,
          comment: comment?.trim() || "", // Xóa khoảng trắng thừa
          user: userId,
          movie: movieId,
        },
      },
      {
        new: true, // Trả về document đã cập nhật (hoặc mới)
        upsert: true, // Tạo mới nếu không tìm thấy
        runValidators: true, // Chạy schema validation
        setDefaultsOnInsert: true, // Đặt giá trị default (như createdAt) khi tạo mới
      }
    ).populate("user", "name"); // Populate tên người dùng cho response

    if (!review) {
      // Trường hợp hiếm, upsert không thành công
      return res
        .status(500)
        .json({ message: "Failed to save or update review." });
    }

    // Xác định là tạo mới hay cập nhật dựa trên version key (__v)
    const isNewDocument = review.__v === 0; // Mongoose tự tăng __v khi update
    const statusCode = isNewDocument ? 201 : 200; // 201 Created, 200 OK

    console.log(
      `Review ${
        isNewDocument ? "created" : "updated"
      } by ${userId} for movie ${movieId}`
    );
    // Hook 'post save' trong Review model sẽ tự động cập nhật rating trung bình của Movie

    res.status(statusCode).json({
      message: `Review successfully ${isNewDocument ? "added" : "updated"}.`,
      review: review,
    });
  } catch (error) {
    console.error("Error processing review submission:", error);
    if (error.code === 11000) {
      // Lỗi unique key (user đã review phim này rồi - trường hợp hiếm với findOneAndUpdate)
      return res.status(409).json({
        message: "Review conflict. You might have already reviewed this movie.",
      });
    }
    res
      .status(500)
      .json({ message: "Failed to process review.", error: error.message });
  }
});

// --- GET /movies/:movieId/reviews ---
// Lấy tất cả các đánh giá (không bị ẩn) cho một phim cụ thể (Public)
router.get("/", async (req, res) => {
  try {
    const movieId = req.params.movieId;
    if (!mongoose.Types.ObjectId.isValid(movieId)) {
      return res.status(400).json({ message: "Invalid Movie ID format." });
    }

    const reviews = await Review.find({
      movie: movieId,
      isHidden: { $ne: true }, // Chỉ lấy các review không bị đánh dấu là ẩn
    })
      .populate("user", "name") // Chỉ lấy tên của người dùng
      .sort({ createdAt: -1 }); // Sắp xếp mới nhất trước

    res.status(200).json(reviews); // Trả về mảng các reviews
  } catch (error) {
    console.error(
      `Error fetching reviews for movie ${req.params.movieId}:`,
      error
    );
    res
      .status(500)
      .json({ message: "Failed to fetch reviews.", error: error.message });
  }
});

// --- DELETE /movies/:movieId/reviews ---
// Cho phép người dùng đã đăng nhập xóa review của chính họ cho phim này
router.delete("/", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId; // Lấy userId từ token
    const movieId = req.params.movieId; // Lấy movieId từ URL

    if (!mongoose.Types.ObjectId.isValid(movieId)) {
      return res.status(400).json({ message: "Invalid Movie ID." });
    }

    // Tìm và xóa review của user này cho phim này
    // findOneAndDelete sẽ trigger hook 'post findOneAndDelete'
    const deletedReview = await Review.findOneAndDelete({
      user: userId,
      movie: movieId,
    });

    if (!deletedReview) {
      // Có thể user chưa review, hoặc review đã bị xóa
      return res.status(404).json({
        message: "Review not found or you are not authorized to delete it.",
      });
    }

    // Hook 'post findOneAndDelete' trong Review model sẽ tự động cập nhật rating trung bình của Movie

    console.log(`User ${userId} deleted their review for movie ${movieId}`);
    res
      .status(200)
      .json({ message: "Your review has been deleted successfully." });
  } catch (error) {
    console.error("Error deleting user review:", error);
    res
      .status(500)
      .json({ message: "Failed to delete your review.", error: error.message });
  }
});

// Các route admin cho review (ví dụ: PUT /admin/reviews/:id để ẩn/hiện)
// sẽ nằm trong file api/routes/admin.js và được mount với prefix /admin/reviews/:id

module.exports = router;
