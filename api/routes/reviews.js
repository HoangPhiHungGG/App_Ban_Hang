// --- START OF FILE api/routes/reviews.js ---

const express = require("express");
// mergeParams: true cho phép truy cập req.params từ router cha (ví dụ: req.params.movieId)
const router = express.Router({ mergeParams: true });
const mongoose = require("mongoose");
const Review = require("../models/review"); // Import model Review
const Movie = require("../models/movie"); // Import model Movie để kiểm tra phim tồn tại
const { authenticateToken } = require("../middleware/auth"); // Chỉ cần authenticate cho user thường

// --- POST /movies/:movieId/reviews ---
// Tạo mới hoặc cập nhật đánh giá của người dùng đã đăng nhập cho một phim cụ thể
router.post("/", authenticateToken, async (req, res) => {
  try {
    const { rating, comment } = req.body; // Lấy rating và comment từ request body
    const userId = req.user.userId; // Lấy userId từ token đã xác thực
    const movieId = req.params.movieId; // Lấy movieId từ URL params (nhờ mergeParams)

    // --- Validation ---
    // Kiểm tra movieId hợp lệ
    if (!mongoose.Types.ObjectId.isValid(movieId)) {
      return res.status(400).json({ message: "Invalid Movie ID format." });
    }
    // Kiểm tra rating hợp lệ (số từ 1 đến 5)
    if (!rating || typeof rating !== "number" || rating < 1 || rating > 5) {
      return res
        .status(400)
        .json({ message: "Rating must be a number between 1 and 5." });
    }
    // Kiểm tra phim tồn tại (không bắt buộc nhưng nên có)
    const movieExists = await Movie.findById(movieId).select("_id");
    if (!movieExists) {
      return res.status(404).json({ message: "Movie not found." });
    }
    // -----------------

    // Tìm và cập nhật (hoặc tạo mới nếu chưa có) đánh giá của user này cho phim này
    // findOneAndUpdate với upsert:true là cách hiệu quả để xử lý cả hai trường hợp
    const updatedReview = await Review.findOneAndUpdate(
      { user: userId, movie: movieId }, // Điều kiện tìm kiếm: user và movie phải khớp
      {
        $set: {
          // Chỉ cập nhật các trường này
          rating: rating,
          comment: comment?.trim() || "", // Cập nhật comment, xóa khoảng trắng thừa, hoặc để rỗng
          user: userId, // Đảm bảo user ID đúng
          movie: movieId, // Đảm bảo movie ID đúng
        },
      },
      {
        new: true, // Trả về document đã được cập nhật
        upsert: true, // Tạo mới document nếu không tìm thấy khớp
        runValidators: true, // Chạy các validation đã định nghĩa trong Schema
        setDefaultsOnInsert: true, // Đặt giá trị default (như createdAt) khi tạo mới
      }
    ).populate("user", "name"); // Populate tên user để trả về cho client

    // Kiểm tra xem review được tạo mới hay cập nhật
    // Mongoose không cung cấp trực tiếp cờ isNew cho findOneAndUpdate,
    // nhưng bạn có thể so sánh createdAt và updatedAt hoặc dựa vào trạng thái HTTP
    const isNew =
      updatedReview.createdAt.getTime() === updatedReview.updatedAt.getTime(); // Cách ước lượng
    const statusCode = isNew ? 201 : 200; // 201 Created hoặc 200 OK

    console.log(
      `Review ${
        isNew ? "created" : "updated"
      } by ${userId} for movie ${movieId}`
    );

    // Không cần gọi updateMovieRating ở đây nữa vì hook post save/remove trong model sẽ tự làm

    res.status(statusCode).json({
      message: `Review successfully ${isNew ? "added" : "updated"}.`,
      review: updatedReview,
    });
  } catch (error) {
    console.error("Error adding/updating review:", error);
    // Xử lý lỗi trùng lặp nếu có (mặc dù findOneAndUpdate + upsert thường xử lý tốt)
    if (error.code === 11000) {
      return res
        .status(409)
        .json({ message: "Review conflict. Please try again." });
    }
    res.status(500).json({
      message: "Failed to add or update review.",
      error: error.message,
    });
  }
});

// --- GET /movies/:movieId/reviews ---
// Lấy tất cả các đánh giá (đã được phê duyệt/không ẩn) cho một phim cụ thể (Public)
router.get("/", async (req, res) => {
  try {
    const movieId = req.params.movieId; // Lấy movieId từ URL params

    // Kiểm tra movieId hợp lệ
    if (!mongoose.Types.ObjectId.isValid(movieId)) {
      return res.status(400).json({ message: "Invalid Movie ID format." });
    }

    // Tìm tất cả review cho movieId này
    // Thêm điều kiện lọc { isHidden: { $ne: true } } nếu bạn muốn ẩn các review bị admin đánh dấu
    const reviews = await Review.find({
      movie: movieId,
      // isHidden: { $ne: true } // Bỏ comment dòng này nếu có trường isHidden và muốn lọc
    })
      .populate("user", "name") // Chỉ lấy tên của người dùng
      .sort({ createdAt: -1 }); // Sắp xếp theo ngày tạo mới nhất trước

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

module.exports = router;
