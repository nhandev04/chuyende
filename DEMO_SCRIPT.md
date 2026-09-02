# 🥗 HealthLens AI - Kịch Bản Live Demo & Thông Tin Thử Nghiệm

Tài liệu hướng dẫn kịch bản thuyết trình **Live Demo 5 - 7 Phút** dành cho buổi **Báo cáo Đồ án Tốt nghiệp UIT**, kèm đầy đủ thông tin **Tài khoản Thử nghiệm** và **Thẻ Tín Dụng Thử Nghiệm Stripe (Test Payment Cards)**.

---

## 🔑 1. Danh Sách Tài Khoản Thử Nghiệm (System Accounts)

| Vai Trò                     | Email / Username                           | Mật Khẩu   | Quyền Hạn & Tính Năng Nổi Bật                                                                |
| :-------------------------- | :----------------------------------------- | :--------- | :------------------------------------------------------------------------------------------- |
| 👨‍💼 **System Administrator** | `admin@uit.edu.vn`                         | `admin123` | Phân hệ Admin Hub, Quản lý Thư viện Ground-Truth DB, Duyệt Báo cáo AI, Phân quyền User/Admin |
| 👤 **Standard Demo User**   | `demouser@uit.edu.vn`                      | `123456`   | Quét ảnh đồ ăn AI, Phân tích vóc dáng YOLO Pose, Theo dõi Calo, Xem biểu đồ Lịch sử          |
| 🌐 **Clerk OAuth User**     | Đăng nhập trực tiếp qua popup Google Clerk | N/A        | Tự động đồng bộ tài khoản Google với Backend FastAPI local                                   |

---

## 💳 2. Thông Tin Thẻ Tín Dụng Thử Nghiệm Stripe (Stripe Test Payment Credentials)

Khi kiểm thử tính năng **Nâng Cấp Gói Dịch Vụ AI (Stripe Checkout)**, sử dụng thông tin thẻ thử nghiệm dưới đây trên trang thanh toán bảo mật của Stripe:

### 💳 Thẻ Tín Dụng Test Chuẩn (Stripe Test Cards)

| Loại Thẻ                      | Số Thẻ (Card Number)  | Ngày Hết Hạn (MM/YY)                      | CVC   | Mã Bưu Chính (ZIP) | Kết Quả Mong Đợi                    |
| :---------------------------- | :-------------------- | :---------------------------------------- | :---- | :----------------- | :---------------------------------- |
| **Visa (Khuyên dùng)**        | `4242 4242 4242 4242` | `12/28` (hoặc bất kỳ tháng/năm tương lai) | `123` | `90210`            | **Thanh toán Thành công** (Success) |
| **Mastercard**                | `5555 5555 5555 4444` | `12/28`                                   | `456` | `90210`            | **Thanh toán Thành công** (Success) |
| **Thẻ xác thực 3D Secure**    | `4000 0024 0000 3155` | `12/28`                                   | `789` | `90210`            | **Mở khung xác thực OTP 3D Secure** |
| **Thẻ Bị Từ Chối (Declined)** | `4000 0000 0000 0002` | `12/28`                                   | `000` | `90210`            | Báo lỗi thẻ bị từ chối              |

### 💵 Mức Giá Các Gói Thử Nghiệm

- 🟢 **Standard (Free Tier)**: `$0 / month`
- ⚡ **Plus (Food Scanner Tier)**: `~$1.00 / month` (`25,000 VNĐ`)
- 👑 **Pro (AI Expert Tier)**: `~$2.00 / month` (`50,000 VNĐ`)

---

## 🎬 3. Kịch Bản Thuyết Trình Live Demo (5 - 7 Phút)

### 📌 Bước 1: Đăng Nhập & Tổng Quan Màn Hình Chính (1 phút)

1. Truy cập địa chỉ `http://localhost:3000`.
2. Mở Modal Đăng nhập và nhập tài khoản User: `demouser@uit.edu.vn` / `123456`.
3. Giới thiệu màn hình **Dashboard**:
    - **Hero Calorie Intake Progress Gauge**: Đồng hồ tiến trình năng lượng nạp trong ngày.
    - **Biometrics Widgets**: Chỉ số Cân nặng hiện tại, Cân nặng mục tiêu, Chỉ số BMI và Năng lượng TDEE duy trì.

### 📌 Bước 2: Khảo Sát Thể Trạng & Phân Tích Khung Xương AI YOLO Pose (1.5 phút)

1. Mở modal **Body Profile & Fitness Configuration**.
2. **Chế độ 1 (Manual Input)**: Nhập thông số Chiều cao (170cm), Cân nặng (65kg), Mục tiêu (Giảm cân).
3. **Chế độ 2 (AI Photo Analysis - YOLOv8-Pose)**:
    - Tải lên ảnh chụp vóc dáng toàn thân.
    - Giới thiệu thuật toán trích xuất **17 điểm khung xương cơ thể (Keypoints)** từ model `yolov8n-pose.pt`.
    - Giới thiệu **Thang đo BMI 10 Cấp độ (WPRO)** và đề xuất chế độ Calo dư thừa/thiếu hụt tự động.

### 📌 Bước 3: AI Quét Ảnh Món Ăn & Định Lượng Dinh Dưỡng (1.5 phút)

1. Bấm nút **Camera** ở chính giữa thanh điều hướng bên dưới.
2. Tải lên ảnh món ăn mẫu (Phở bò / Cơm tấm / Bánh mì).
3. Giới thiệu kết quả phân tích từ mô hình AI YOLOv8 Custom (`best.pt`):
    - Nhận diện đúng tên món ăn và tỷ lệ tin cậy (Confidence score).
    - Tự động tra cứu cơ sở dữ liệu **Ground-Truth DB** để tính lượng Calo, Protein, Carbs, Fat dựa trên khối lượng phần ăn.
4. Bấm **Log Meal to Daily Journal** để ghi nhật ký bữa ăn.

### 📌 Bước 4: Nâng Cấp Gói Dịch Vụ Qua Stripe (1 phút)

1. Bấm nút **Upgrade** trên thanh Header.
2. Mở **Subscription & Pricing Matrix Modal**.
3. Chọn gói **Plus** hoặc **Pro** $\rightarrow$ Bấm nút `Upgrade PLUS (Stripe)`.
4. Nhập thông tin thẻ thử nghiệm Stripe (`4242 4242 4242 4242`, Exp: `12/28`, CVC: `123`).
5. Hoàn tất thanh toán $\rightarrow$ Xác nhận Badge trên Header chuyển thành **`PLUS`** hoặc **`PRO`**.

### 📌 Bước 5: Phân Hệ Quản Trị Hệ Thống (Admin System Hub) (1 phút)

1. Đăng xuất tài khoản User và đăng nhập tài khoản Quản trị: `admin@uit.edu.vn` / `admin123`.
2. Mở tab **Admin System Hub**:
    - **Tab 1 (Ground-Truth DB)**: Thêm món ăn mới vào cơ sở dữ liệu / Xóa món ăn chuẩn.
    - **Tab 2 (AI Recognition Error Reports)**: Xem báo cáo AI đoán sai từ người dùng $\rightarrow$ Bấm **Approve & Add DB** để tự động học món mới vào DB.
    - **Tab 3 (User Accounts & Roles)**: Xem danh sách người dùng, cảnh báo chỉ số BMI bất thường $\rightarrow$ Thao tác đổi vai trò `Make Admin` hoặc cấp gói `Grant PRO`.

---

## 🛠️ 4. Các Lệnh Kiểm Thử Nhanh Trước Khi Thuyết Trình

```bash
# 1. Kiểm tra Backend FastAPI
cd be
python -c "from app.main import app; print('Backend Status OK:', app.title)"

# 2. Kiểm tra nạp Model YOLO Pose
python -c "from app.services.body_pose_analyzer import get_pose_model; print('Pose Model OK')"

# 3. Kiểm tra Build Frontend React
cd ../fe
npm run build
```
