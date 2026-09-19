# 🥗 HealthLens AI - Kịch Bản Live Demo & Thông Tin Thử Nghiệm Báo Cáo Đồ Án

Tài liệu hướng dẫn kịch bản thuyết trình **Live Demo 5 - 7 Phút** dành cho buổi **Báo cáo Đồ án Tốt nghiệp UIT**, đính kèm thông tin **Tài khoản Thử nghiệm**, **Cơ sở dữ liệu Supabase PostgreSQL**, **Thẻ Tín Dụng Thử Nghiệm Stripe** và các **Cập nhật Giao diện mới (Clean UI & Toast Popup)**.

---

## 🔑 1. Danh Sách Tài Khoản Thử Nghiệm (System Accounts)

| Vai Trò | Email / Username | Mật Khẩu | Quyền Hạn & Tính Năng Nổi Bật |
| :--- | :--- | :--- | :--- |
| 👨‍💼 **System Administrator** | `admin@uit.edu.vn` | `admin123` | Cổng Admin Hub, Quản lý Thư viện Ground-Truth DB, Duyệt Báo cáo AI, Phân quyền User/Admin |
| 👤 **Pro / Standard Demo User** | `demouser@uit.edu.vn` | `123456` | Quét ảnh đồ ăn AI, Phân tích vóc dáng YOLO Pose, Thực đơn RAG AI, Grocery List, Lịch sử |
| 🌐 **Clerk OAuth User** | Đăng nhập qua Google Clerk | N/A | Tự động đồng bộ tài khoản Google OAuth với Backend FastAPI & Supabase PostgreSQL |

---

## ☁️ 2. Thông Tin Cơ Sở Dữ Liệu Supabase PostgreSQL Cloud

- **Hệ quản trị CSDL**: **PostgreSQL 15+ (Đám mây Supabase)**
- **Host**: `db.cweuliizkgrlkhouhzir.supabase.co` (Port `5432`)
- **Tự động hóa**: Tự động dựng 8 bảng dữ liệu (`users`, `user_profiles`, `food_logs`, `weight_logs`, `food_database`, `ai_reports`, `subscription_history`, `rag_meal_plans`) và nạp dữ liệu mồi khi chạy Backend.

---

## 💳 3. Thông Tin Thẻ Tín Dụng Thử Nghiệm Stripe (Stripe Test Payment Cards)

Khi kiểm thử tính năng **Nâng Cấp Gói Dịch Vụ AI (Stripe Checkout)**, sử dụng thông tin thẻ dưới đây trên trang thanh toán bảo mật của Stripe:

| Loại Thẻ | Số Thẻ (Card Number) | Ngày Hết Hạn (MM/YY) | CVC | Mã Bưu Chính (ZIP) | Kết Quả Mong Đợi |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Visa (Khuyên dùng)** | `4242 4242 4242 4242` | `12/28` | `123` | `90210` | **Thanh toán Thành công** (Success Toast) |
| **Mastercard** | `5555 5555 5555 4444` | `12/28` | `456` | `90210` | **Thanh toán Thành công** (Success Toast) |
| **Thẻ xác thực 3D Secure** | `4000 0024 0000 3155` | `12/28` | `789` | `90210` | **Mở khung OTP 3D Secure** |
| **Thẻ Bị Từ Chối (Declined)**| `4000 0000 0000 0002` | `12/28` | `000` | `90210` | **Báo lỗi thẻ bị từ chối** (Error Toast) |

---

## 🎬 4. Kịch Bản Thuyết Trình Live Demo Đồ Án (5 - 7 Phút)

### 📌 Bước 1: Đăng Nhập & Tổng Quan Màn Hình Dashboard (1 phút)

1. Truy cập địa chỉ `http://localhost:3000`.
2. Mở Modal Đăng nhập $\rightarrow$ Đăng nhập tài khoản User: `demouser@uit.edu.vn` / `123456`.
3. Nhấn vào **Logo HealthLens AI** trên Header để về trang chủ Dashboard.
4. Giới thiệu giao diện **Dashboard (Mobile-First Design)**:
   - **Daily Calorie Ring**: Vòng tiến độ năng lượng nạp trong ngày.
   - **Phân rã Macrophages**: Lượng Protein, Carbs, Fat nạp vào so với mục tiêu.
   - **Biometrics Widgets**: Chỉ số Cân nặng hiện tại, Cân nặng mục tiêu, Chỉ số BMI và Năng lượng TDEE duy trì.

---

### 📌 Bước 2: Phân Tích Vóc Dáng & Khung Xương AI YOLO Pose (1.5 phút)

1. Mở Menu Profile $\rightarrow$ Chọn **Personal Health Profile** hoặc mở **Body Profile & Fitness Configuration**.
2. **Chế độ 1 (Manual Input)**: Nhập thông số Chiều cao (170cm), Cân nặng (65kg), Mục tiêu (Giảm cân).
3. **Chế độ 2 (AI Photo Analysis - YOLOv8-Pose)**:
   - Tải lên ảnh chụp vóc dáng toàn thân.
   - Giới thiệu thuật toán trích xuất **17 điểm khung xương cơ thể (Keypoints)** từ model `yolov8n-pose.pt`.
   - Giới thiệu **Thang đo BMI 10 Cấp độ (Biometric Standard)** và đề xuất lời khuyên dinh dưỡng chuyên sâu.

---

### 📌 Bước 3: AI Quét Ảnh Món Ăn & Báo Cáo AI Đoán Sai (1.5 phút)

1. Bấm nút **Camera** nổi ở chính giữa thanh điều hướng bên dưới.
2. Tải lên ảnh món ăn (Phở bò / Cơm tấm / Bánh mì).
3. Giới thiệu kết quả từ mô hình **YOLOv8 Custom (`best.pt`)**:
   - Nhận diện tên món ăn và tỷ lệ tin cậy Confidence Score (%).
   - Tự động tra cứu cơ sở dữ liệu **Ground-Truth Food DB** để tính Calo, Protein, Carbs, Fat dựa trên phần ăn.
4. Bấm **Report AI misclassification** $\rightarrow$ Nhập tên món đính chính (ví dụ `Bún bò Huế`) $\rightarrow$ Bấm gửi $\rightarrow$ **Toast Notification** báo gửi thành công về Admin Hub.
5. Bấm **Log Meal to Daily Journal** để lưu bữa ăn vào nhật ký.

---

### 📌 Bước 4: Tạo Thực Đơn RAG AI & Danh Sách Đi Chợ Pro Grocery List (1 phút)

1. Mở Menu Profile $\rightarrow$ Chọn **AI Smart Meal Planner** (hoặc bấm nút `AI Meal Plan` trên Header).
2. Nhấn nút **✨ Generate AI Meal Plan**:
   - Giới thiệu mô hình **Google Gemini 3.5 Flash-lite** kết hợp thuật toán lọc công thức an toàn RAG.
   - Hiển thị thực đơn 4 bữa (Sáng, Trưa, Tối, Phụ) kèm lời khuyên dinh dưỡng từ bác sĩ.
3. Chuyển sang tab **🛒 Grocery Shopping List**:
   - Hiển thị danh sách các nguyên liệu thực phẩm tươi sống cần mua trong tuần (thịt, cá, rau củ, gia vị) phân loại theo nhóm.

---

### 📌 Bước 5: Xem Nhật Ký Bữa Ăn & Biểu Đồ Cân Nặng History (1 phút)

1. Nhấn vào **Icon Đồng hồ 🕒 (History)** trên thanh Header (hoặc tab `History` ở Bottom Nav).
2. **Bộ chọn ngày (Date Picker)**: Xem lại danh sách món ăn đã nạp trong quá khứ.
3. **Biểu đồ biến động cân nặng Recharts**: Minh họa đồ thị đường xu hướng thay đổi cân nặng dài hạn.

---

### 📌 Bước 6: Nâng Cấp Gói Dịch Vụ Stripe Payment (1 phút)

1. Mở Menu Profile $\rightarrow$ Chọn **Upgrade Subscription**.
2. Chọn gói **Pro** $\rightarrow$ Nhập thẻ Visa test Stripe (`4242 4242 4242 4242`, Hạn: `12/28`, CVC: `123`).
3. Hoàn tất thanh toán $\rightarrow$ **Toast Notification** chúc mừng nâng cấp gói Pro $\rightarrow$ Badge tài khoản đổi thành **`PRO`**.

---

### 📌 Bước 7: Phân Hệ Quản Trị Hệ Thống (Admin System Hub) (1 phút)

1. Đăng xuất tài khoản User $\rightarrow$ Đăng nhập tài khoản Admin: `admin@uit.edu.vn` / `admin123`.
2. Mở Menu Profile $\rightarrow$ Chọn **Admin Hub Portal**:
   - **Tab 1 (Food Library)**: Thêm/Sửa/Xóa món ăn chuẩn Ground-Truth DB.
   - **Tab 2 (User Correction Reports)**: Xem báo cáo AI đoán sai từ người dùng $\rightarrow$ Bấm **Approve & Add DB** để tự động học món mới vào DB.
   - **Tab 3 (User Accounts & Roles)**: Xem danh sách tài khoản trên Supabase PostgreSQL $\rightarrow$ Thao tác đổi vai trò `Make Admin` hoặc hạ/cấp gói dịch vụ.

---

## 🛠️ 5. Các Lệnh Kiểm Thử Nhanh Trước Khi Thuyết Trình

```bash
# 1. Kiểm tra kết nối Supabase PostgreSQL & Backend FastAPI
cd be
python -c "import psycopg2; print('Supabase Postgres Connection OK!')"

# 2. Kiểm tra nạp Model YOLO Pose & Food Scanner
python -c "from app.services.body_pose_analyzer import get_pose_model; print('Pose Model OK')"

# 3. Kiểm tra Build & Type-Safety Frontend React
cd ../fe
npx tsc --noEmit
```
