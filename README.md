# 🎬 ỨNG DỤNG BÁN VÉ XEM PHIM ĐA NỀN TẢNG

## 🎯 Giới thiệu

Ứng dụng bán vé xem phim giúp người dùng:
- Đăng ký / Đăng nhập tài khoản
- Xem danh sách **phim đang chiếu** và **sắp chiếu**
- Xem **thông tin chi tiết**, **trailer**, và **giá vé**
- Chọn lịch chiếu và **đặt vé nhanh chóng**
- Thanh toán với nhiều hình thức tiện lợi

### 👨‍💼 Quản trị viên (Admin) có thể:
- Thêm / xoá / lọc **phim**
- Thêm / xoá / lọc **lịch chiếu**
- Thêm / xoá / chỉnh sửa **phòng chiếu**

---

## 🚀 CÔNG NGHỆ SỬ DỤNG

### 🔰 Ngôn ngữ chính: **JavaScript**

Toàn bộ hệ thống được phát triển chủ yếu bằng **JavaScript**, bao gồm cả frontend (mobile/web) và backend (server).

---

### 1. 🧱 Framework & Core Libraries
> Xây dựng ứng dụng mobile đa nền tảng (Android, iOS, Web)
- `React Native`, `Expo`, `React`, `JavaScript`

### 2. 🧭 Navigation
> Quản lý điều hướng giữa các màn hình
- `React Navigation`: Stack, Tab, Nested

### 3. 📦 State Management
> Quản lý dữ liệu dùng chung (global state)
- `Redux`

### 4. 🌐 Networking
> Giao tiếp với backend API
- `Axios`

### 5. 🔐 Authentication & Token
> Xác thực người dùng và bảo vệ route
- `JWT`, kiểm tra và giải mã token

### 6. 💾 Storage & Persistence
> Lưu trữ cục bộ như token, giỏ vé, thông tin người dùng
- `AsyncStorage`

### 7. 🎨 UI Components & Utilities
> Tạo và hiển thị giao diện: nút, modal, icon, mã QR,...
- `React Native Elements`, `React Native Paper`, `Lottie`, `QRCode`, `Vector Icons`,...

### 8. 📱 Device & Media Access
> Truy cập camera, thư viện ảnh, thông tin thiết bị
- `ImagePicker`, `Device Info`,...

### 9. 🔧 Dev Tools
> Hỗ trợ phát triển và cấu hình dự án
- `Babel`, `dotenv`, `module-resolver`, `nodemon`

### 10. 🖥️ Backend (API Server)
> Xử lý logic, xác thực, truy xuất CSDL và gửi email
- `Express.js`, `MongoDB`, `JWT`, `Nodemailer`, **JavaScript**

---

## 🔋 Tính Năng Chính

- ✅ Đăng ký / Đăng nhập
- 🎥 Xem phim đang chiếu và sắp chiếu
- 🎞️ Xem thông tin chi tiết, trailer và giá vé
- 🕒 Đặt vé theo lịch chiếu
- 💳 Thanh toán tiện lợi
- 👨‍💼 Quản trị viên:
  - Quản lý phim
  - Quản lý lịch chiếu
  - Quản lý phòng chiếu

---

## 🚀 Khởi Chạy Dự Án

### Với ứng dụng React Native:

```bash
npm install
npm start
