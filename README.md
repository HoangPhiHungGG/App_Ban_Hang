# 🎬 ỨNG DỤNG BÁN VÉ XEM PHIM ĐA NỀN TẢNG

## 🎯 Giới thiệu
Ứng dụng di động đa nền tảng cho phép người dùng dễ dàng đặt vé xem phim, với giao diện thân thiện và đầy đủ tính năng.
## ⭐ Tính Năng Chính

### 👤 Quản Lý Tài Khoản
- **Đăng Ký & Đăng Nhập**
  - Đăng ký tài khoản mới
  - Đăng nhập bằng email/mật khẩu
  - Xác thực qua email
  - Khôi phục mật khẩu

- **Hồ Sơ Người Dùng**
  - Xem/Chỉnh sửa thông tin cá nhân
  - Đổi mật khẩu
  - Xem lịch sử đặt vé
  - Quản lý phương thức thanh toán

### 🎬 Phim & Suất Chiếu
- **Danh Sách Phim**
  - Phim đang chiếu
  - Phim sắp chiếu
  - Tìm kiếm theo tên
  - Lọc theo thể loại/ngôn ngữ

- **Chi Tiết Phim**
  - Thông tin chi tiết & trailer
  - Đánh giá & bình luận
  - Lịch chiếu theo ngày
  - Đặt vé nhanh

### 🎫 Đặt Vé & Thanh Toán
- **Chọn Suất Chiếu**
  - Xem lịch theo ngày
  - Lọc theo rạp
  - Thông tin giá vé
- **Chọn Ghế**
  - Sơ đồ ghế trực quan
  - Hiển thị ghế đã đặt/còn trống
  - Chọn nhiều ghế
  - Tính tổng tiền tự động

- **Thanh Toán**
  - Nhiều phương thức thanh toán
  - Mã giảm giá
  - Xác nhận đặt vé
  - Vé điện tử (QR Code)

### 📱 Tiện Ích
- **Thông Báo**
  - Xác nhận đặt vé
  - Nhắc nhở suất chiếu
  - Khuyến mãi mới
  - Cập nhật phim

- **Rạp Phim**
  - Danh sách rạp
  - Thông tin chi tiết
  - Bản đồ vị trí
  - Đánh giá rạp

### 👨‍💼 Quản Trị Viên (Admin)
- **Quản Lý Phim**
  - Thêm/sửa/xóa phim
  - Cập nhật thông tin
  - Quản lý lịch chiếu
  - Thống kê doanh thu

- **Quản Lý Rạp**
  - Thêm/sửa/xóa rạp
  - Quản lý phòng chiếu
  - Sắp xếp lịch chiếu
  - Báo cáo hiệu suất
- **Quản Lý Người Dùng**
  - Xem danh sách users
  - Phân quyền
  - Khóa/mở tài khoản
  - Xử lý báo cáo

- **Báo Cáo & Thống Kê**
  - Doanh thu theo phim
  - Thống kê đặt vé
  - Báo cáo người dùng
  - Phân tích xu hướng

## 🎯 Ưu Điểm Nổi Bật
- **Giao Diện Thân Thiện**
  - Thiết kế hiện đại, dễ sử dụng
  - Tương thích đa nền tảng
  - Tối ưu hiệu năng
  - Hỗ trợ đa ngôn ngữ

- **Tính Năng Thông Minh**
  - Đề xuất phim phù hợp
  - Lưu lịch sử xem
  - Tự động nhắc nhở
  - Đồng bộ đa thiết bị

- **Bảo Mật Cao**
  - Xác thực hai lớp
  - Mã hóa dữ liệu
  - Bảo vệ thanh toán
  - Quản lý phiên đăng nhập
---

## 🚀 CÔNG NGHỆ SỬ DỤNG


### Frontend
- **Framework:** React Native + Expo
- **State Management:** Redux + Context API
- **Navigation:** React Navigation (Stack + Tab)
- **Network:** Axios
- **Storage:** AsyncStorage
- **UI Components:** React Native Elements, Vector Icons
- **Authentication:** JWT

### Backend
- **Server:** Express.js
- **Database:** MongoDB
- **Authentication:** JWT
- **Email Service:** Nodemailer

---
## 🛠️ Setup and Installation

1. **Clone the repository**
```sh
git clone [repository-url]
```

2. **Install Dependencies**
- Frontend:
```sh
npm install
```
- Backend:
```sh
cd api
npm install
```

3. **Environment Setup**
Create `.env` files in root and `/api` directories:
```sh
# Root .env
EXPO_PUBLIC_API_URL=your_api_url

# /api/.env
PORT=8000
MONGODB_URI=your_mongodb_uri
JWT_SECRET_KEY=your_secret
```

4. **Run the Application**
- Frontend:
```sh
expo start
```
- Backend:
```sh
cd api
npm start
```

## 📁 Project Structure
```
├── api/                 # Backend server
│   ├── models/         # Database models
│   ├── routes/         # API routes
│   ├── middleware/     # Custom middleware
│   └── utils/          # Utility functions
├── components/         # Reusable components
├── screens/           # Application screens
├── navigation/        # Navigation configuration
├── redux/            # Redux state management
└── assets/           # Static assets
```


---
📬 Liên hệ
Phí Hùng - hoangphihung072002@gmail.com

Link Dự án: https://github.com/HoangPhiHungGG/Web_Ban_Hang_AI.git

