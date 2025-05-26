// const mongoose = require("mongoose");
// const Movie = require("./movie"); // Import Movie model để có thể gọi method của nó

// const reviewSchema = new mongoose.Schema(
//   {
//     user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
//     movie: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "Movie",
//       required: true,
//     },
//     rating: { type: Number, required: true, min: 1, max: 5 },
//     comment: { type: String, trim: true }, // trim: true để xóa khoảng trắng thừa
//     isHidden: { type: Boolean, default: false }, // Cho admin ẩn/hiện
//   },
//   { timestamps: true }
// ); // <<< Quan trọng: Tự động thêm createdAt và updatedAt

// // Đảm bảo một user chỉ review một phim một lần
// reviewSchema.index({ movie: 1, user: 1 }, { unique: true });
// // Index để query review theo phim và sắp xếp theo ngày tạo
// reviewSchema.index({ movie: 1, createdAt: -1 });

// // --- Static method để cập nhật rating trung bình của Movie ---
// reviewSchema.statics.updateMovieAverageRating = async function (movieId) {
//   if (!movieId) return;

//   try {
//     // Tính toán rating trung bình từ tất cả các review (không bị ẩn) của phim đó
//     const stats = await this.aggregate([
//       {
//         $match: {
//           movie: new mongoose.Types.ObjectId(movieId),
//           isHidden: { $ne: true },
//         },
//       }, // Chỉ tính review không bị ẩn
//       {
//         $group: {
//           _id: "$movie",
//           averageRating: { $avg: "$rating" },
//           reviewCount: { $sum: 1 },
//         },
//       },
//     ]);

//     // console.log(`Stats for movie ${movieId}:`, stats);

//     const movieToUpdate = await Movie.findById(movieId);
//     if (movieToUpdate) {
//       if (stats.length > 0) {
//         movieToUpdate.rating = parseFloat(stats[0].averageRating.toFixed(1)); // Làm tròn 1 chữ số thập phân
//         // movieToUpdate.numReviews = stats[0].reviewCount; // Có thể thêm trường này vào Movie model
//       } else {
//         movieToUpdate.rating = 0; // Nếu không có review nào (hoặc tất cả bị ẩn), đặt rating là 0
//         // movieToUpdate.numReviews = 0;
//       }
//       await movieToUpdate.save();
//       console.log(
//         `Updated average rating for movie ${movieId} to ${movieToUpdate.rating}`
//       );
//     }
//   } catch (error) {
//     console.error(`Error updating average rating for movie ${movieId}:`, error);
//   }
// };

// // --- Middleware (Hooks) để tự động cập nhật rating phim sau khi Review được lưu hoặc xóa ---
// reviewSchema.post("save", async function () {
//   // `this` là document Review vừa được lưu
//   // `this.constructor` là Model Review
//   await this.constructor.updateMovieAverageRating(this.movie);
// });

// reviewSchema.post("findOneAndDelete", async function (doc) {
//   // `doc` là document Review vừa bị xóa (nếu tìm thấy)
//   if (doc) {
//     // Cần truy cập Model từ mongoose.model vì `this.constructor` không hoạt động đúng trong hook này
//     await mongoose.model("Review").updateMovieAverageRating(doc.movie);
//   }
// });
// // Nếu bạn dùng deleteMany, cần hook khác hoặc logic phức tạp hơn để cập nhật nhiều phim
// // reviewSchema.post('deleteMany', async function(result) { ... });

// const Review = mongoose.model("Review", reviewSchema);
// module.exports = Review;
// --- START OF FILE api/models/review.js ---
const mongoose = require("mongoose");
// KHÔNG import Movie ở đây để tránh circular dependency nếu Movie cũng import Review
// Chúng ta sẽ lấy Movie model bằng mongoose.model('Movie') bên trong static method

const reviewSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    movie: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Movie",
      required: true,
    },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, trim: true },
    isHidden: { type: Boolean, default: false },
  },
  { timestamps: true }
);

reviewSchema.index({ movie: 1, user: 1 }, { unique: true });
reviewSchema.index({ movie: 1, createdAt: -1 });

// Static method để cập nhật rating trung bình của Movie
reviewSchema.statics.updateMovieAverageRating = async function (movieId) {
  if (!movieId) return;
  const MovieModel = mongoose.model("Movie"); // Lấy Movie model

  try {
    const stats = await this.aggregate([
      // 'this' ở đây là Model Review
      {
        $match: {
          movie: new mongoose.Types.ObjectId(movieId),
          isHidden: { $ne: true },
        },
      },
      {
        $group: {
          _id: "$movie",
          averageRating: { $avg: "$rating" },
          reviewCount: { $sum: 1 },
        },
      },
    ]);

    const movieToUpdate = await MovieModel.findById(movieId);
    if (movieToUpdate) {
      if (stats.length > 0) {
        movieToUpdate.rating = parseFloat(stats[0].averageRating.toFixed(1));
        movieToUpdate.numReviews = stats[0].reviewCount;
      } else {
        movieToUpdate.rating = 0;
        movieToUpdate.numReviews = 0;
      }
      await movieToUpdate.save(); // Quan trọng: Lưu thay đổi vào Movie document
      console.log(
        `Updated stats for movie ${movieId}: Rating ${movieToUpdate.rating}, Reviews ${movieToUpdate.numReviews}`
      );
    }
  } catch (error) {
    console.error(`Error updating average rating for movie ${movieId}:`, error);
  }
};

// Middleware (Hooks)
reviewSchema.post("save", async function (doc) {
  // doc là review vừa được save (create hoặc update)
  // Gọi static method trên model Review
  await mongoose.model("Review").updateMovieAverageRating(doc.movie);
});

reviewSchema.post("findOneAndDelete", async function (doc) {
  if (doc) {
    await mongoose.model("Review").updateMovieAverageRating(doc.movie);
  }
});
// Nếu bạn dùng deleteMany, cần xử lý riêng
reviewSchema.post(
  "deleteMany",
  async function (
    result // Chứa thông tin về query và result
    // Ví dụ: this.getFilter() để lấy điều kiện xóa
  ) {
    // Đây là phần phức tạp hơn vì bạn cần xác định các movieId bị ảnh hưởng
    // và cập nhật rating cho từng phim đó.
    // Ví dụ đơn giản nếu bạn chỉ xóa reviews của một phim:
    // const filter = this.getFilter(); // Lấy điều kiện xóa
    // if (filter && filter.movie) {
    //     await mongoose.model('Review').updateMovieAverageRating(filter.movie);
    // } else {
    //     console.warn("deleteMany hook on Review: Could not determine movie to update rating for.");
    // }
    console.warn(
      "Review.deleteMany hook executed. Rating updates for multiple movies might be complex."
    );
  }
);

const Review = mongoose.model("Review", reviewSchema);
module.exports = Review;
// --- END OF FILE api/models/review.js ---
