# HealthLens AI - Nền Tảng Chăm Sóc Sức Khỏe & Định Lượng Calorie AI

Dự án Đồ Án Tốt Nghiệp: **Xây dựng nền tảng web chăm sóc sức khỏe và định lượng calorie dựa trên trí tuệ nhân tạo (AI-Powered Personalized Health Care and Calorie Quantification Web Platform)**

---

## Hướng Dẫn Khởi Chạy Ứng Dụng (Quick Start Guide)

### Yêu cầu tiên quyết (Prerequisites)

- **Node.js**: `>= 18.0.0`
- **Python**: `>= 3.10`

---

### 1️ Khởi Chạy Backend FastAPI (`be/`)

Mở Terminal thứ 1 và thực hiện các lệnh sau:

```bash
# 1. Di chuyển vào thư mục backend
cd be

# 2. Cài đặt các thư viện Python (FastAPI, Ultralytics YOLOv8, OpenCV, PyTorch...)
pip install -r requirements.txt

# 3. Khởi chạy Server FastAPI tại Port 8000
python -m uvicorn app.main:app --reload --port 8000
```

- **Backend API Base**: `http://localhost:8000`
- **Tài liệu API Swagger UI**: `http://localhost:8000/docs`

---

### 2️ Khởi Chạy Frontend React (`fe/`)

Mở Terminal thứ 2 và thực hiện các lệnh sau:

```bash
# 1. Di chuyển vào thư mục frontend
cd fe

# 2. Khởi chạy giao diện phát triển Vite (Port 3000)
npm run dev
```

- **Địa chỉ ứng dụng Web (Mobile-First)**: `http://localhost:3000`

---


## Tài Khoản Thử Nghiệm Mặc Định (Demo Credentials)

| Vai Trò | Email / Username | Mật Khẩu | Quyền Hạn |
| :---------------- | :-------------------- | :--------- | :-------------------------------------------------------- |
| **User Thường** | `demouser@uit.edu.vn` | `123456` | Quét ảnh AI, Theo dõi Calorie, Nhập Cân nặng, Xem Lịch sử |
| **Quản Trị Viên** | `admin@uit.edu.vn` | `admin123` | Quản lý Ground-Truth DB món ăn, Duyệt báo cáo AI sai |

---

## ️ Kiến Trúc Hệ Thống (System Architecture)

```
chuyende/
├── fe/ # React 19 + TypeScript + Tailwind CSS (Mobile-First)
│ ├── src/components/ # Header (Thêm Switch Dark/Light Mode), BottomNav, Modals...
│ ├── src/pages/ # Dashboard, History, ProfilePage, AdminPage
│ └── src/App.tsx # Main Controller & Dark/Light Theme Manager
├── be/ # FastAPI + SQLAlchemy ORM + SQLite
│ ├── app/models/best.pt # Weights Mô Hình AI YOLOv8 (29.2 MB)
│ ├── app/services/body_pose_analyzer.py # YOLO Pose (17 Keypoints) & Dynamic BMI Engine
│ ├── app/services/analysis_engine.py # 10-Level BMI Scale & Recommendation Engine
│ └── health_app.db # Database SQLite
├── BMI_10_LEVEL_SCALE.md # Tài liệu Thang đo BMI 10 Cấp độ
└── Food_calories_analysis/ # Phân Hệ Nghiên Cứu AI & PySpark Big Data Batch
 ├── app.py # Streamlit Dashboard Demo
 └── pipeline.py # PySpark UDF Batch Pipeline Engine
```

---

## Kiểm Thử Tự Động (Verification Commands)

- **Kiểm tra Build Frontend**:
 ```bash
 cd fe && npm run build
 ```
- **Kiểm tra Backend FastAPI**:
 ```bash
 cd be && python -c "from app.main import app; print('Backend OK:', app.title)"
 ```

