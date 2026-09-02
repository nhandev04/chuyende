# 📊 HỆ THỐNG THANG ĐO BMI 10 CẤP ĐỘ & THUẬT TOÁN GỢI Ý SỨC KHỎE AI

> **Dự án**: HealthLens AI - Nền Tảng Chăm Sóc Sức Khỏe & Phân Tích Dinh Dưỡng Thông Minh  
> **Tiêu chuẩn áp dụng**: Chuẩn Sinh học WHO & Chuẩn Thể trạng Châu Á - Thái Bình Dương (Asian-Pacific BMI Guidelines)

---

## 🌟 1. TỔNG QUAN HỆ THỐNG

Hệ thống **Thang đo BMI 10 Cấp Độ** được thiết kế nhằm thay thế cho các bảng phân loại BMI 4-5 cấp truyền thống đơn điệu. Bằng cách kết hợp giữa:

1. **YOLOv8 Pose Skeleton Estimation (17 Keypoints)**: Trích xuất tỷ lệ khung xương trực tiếp từ hình ảnh thực tế.
2. **Ma Trận Phân Cấp 10 Tầng (10-Tier Matrix)**: Phân chia chi tiết chỉ số BMI từ `< 16.5` đến `≥ 35.0`.
3. **Chuyên Gia Dinh Dưỡng AI (AI Dietitian System)**: Đưa ra lời khuyên sinh học chuẩn xác về mức calo thâm hụt / thặng dư và phác đồ tập luyện tối ưu cho từng cá nhân.

---

## 📐 2. BẢNG CHI TIẾT 10 CẤP ĐỘ BMI & LỜI KHUYÊN NĂNG LƯỢNG

|   Cấp Độ   | Khoảng BMI ($\text{kg/m}^2$) | Phân Loại Thể Trạng           | Nhãn Thể Trạng (Somatotype) |             Chiến Lược Calo             | Lời Khuyên Dinh Dưỡng & Phác Đồ Tập Luyện AI                                                                                                                    |
| :--------: | :--------------------------: | :---------------------------- | :-------------------------- | :-------------------------------------: | :-------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Cấp 1**  |           $< 16.5$           | 🚨 **Gầy rất nặng**           | Severe Ectomorph            | Thặng dư mạnh (`+500 - +700` kcal/ngày) | **CẢNH BÁO THỂ TRẠNG**: Mức độ thiếu cân nguy hiểm. Cần bổ sung đạm cao (thịt đỏ, cá, trứng), uống sữa béo và chia thành 5-6 bữa nhỏ/ngày. Hạn chế cardio nặng. |
| **Cấp 2**  |        $16.5 - 17.4$         | ⚠️ **Gầy vừa**                | Skinny / Ectomorph          |     Thặng dư cao (`+400` kcal/ngày)     | **GẦY VỪA**: Cần thặng dư calo tích cực. Bổ sung các loại hạt dinh dưỡng (hạnh nhân, óc chó), quả bơ, sinh tố bơ mầm đạm. Tập nhẹ 2-3 buổi/tuần.                |
| **Cấp 3**  |        $17.5 - 18.4$         | 🟡 **Gầy nhẹ**                | Mild Ectomorph              |     Thặng dư vừa (`+300` kcal/ngày)     | **CHỚM NGHƯỠNG GẦY**: Thặng dư năng lượng nhẹ kết hợp tập kháng lực (Gym/Resistance Training) để xây dựng khối lượng cơ bắp an toàn.                            |
| **Cấp 4**  |        $18.5 - 20.4$         | ✅ **Bình thường - Thon gọn** | Slim Fit / Lean             |      Duy trì TDEE (`±0` kcal/ngày)      | **THON GỌN KHỎE MẠNH**: Tỷ lệ dinh dưỡng chuẩn (40% Carbs, 30% Protein, 30% Fat). Duy trì tập thể thao 3-4 buổi/tuần để giữ form dáng.                          |
| **Cấp 5**  |        $20.5 - 22.9$         | 🌟 **Bình thường - Lý tưởng** | Ideal Mesomorph             |      Duy trì TDEE (`±0` kcal/ngày)      | **THỂ TRẠNG LÝ TƯỞNG NHẤT**: Tỷ lệ vóc dáng chuẩn Châu Á. Giữ vững TDEE hiện tại, ưu tiên thực phẩm tươi sống (Whole Foods) và tăng cơ giảm mỡ.                 |
| **Cấp 6**  |        $23.0 - 24.9$         | ⚠️ **Tiền thừa cân**          | Slightly High / Soft        |     Thâm hụt nhẹ (`-200` kcal/ngày)     | **CHỚM THỪA CÂN**: Thâm hụt calo nhẹ hoặc tăng cường tập Cardio 150 phút/tuần để tiêu bớt mỡ thừa vùng bụng.                                                    |
| **Cấp 7**  |        $25.0 - 27.4$         | 🔴 **Thừa cân độ 1**          | Overweight / Soft           |    Thâm hụt chuẩn (`-400` kcal/ngày)    | **THỪA CÂN RÕ RỆT**: Cần cắt giảm tinh bột nhanh, nước ngọt, đồ chiên rán nhiều mỡ. Tăng cường đạm nạc và chất xơ từ rau xanh.                                  |
| **Cấp 8**  |        $27.5 - 29.9$         | ⚠️ **Tiền béo phì**           | Pre-Obese Endomorph         |     Thâm hụt cao (`-500` kcal/ngày)     | **CẢNH BÁO TIỀN BÉO PHÌ**: Thâm hụt calo nghiêm ngặt. Kết hợp 45 phút Cardio + tập Gym mỗi ngày để giải phóng mỡ nội tạng hiệu quả.                             |
| **Cấp 9**  |        $30.0 - 34.9$         | 🚨 **Béo phì độ 1**           | Obese Class I               |    Thâm hụt mạnh (`-600` kcal/ngày)     | **BÉO PHÌ ĐỘ 1**: Rủi ro cao về huyết áp và mỡ máu. Cần cắt giảm calo, ưu tiên đi bộ/bơi lội nhẹ nhàng để tránh gây áp lực tổn thương khớp gối.                 |
| **Cấp 10** |          $\ge 35.0$          | 🚨 **Béo phì độ 2+ (Nặng)**   | Severe Obese Endomorph      |  Thâm hụt rất mạnh (`-700` kcal/ngày)   | **CẢNH BÁO MỨC NẶNG**: Can thiệp y khoa & dinh dưỡng chuyên sâu. Kiểm soát chặt calo nạp vào, kiêng tuyệt đối đường ngọt và đồ béo xấu.                         |

---

## 🧮 3. CÔNG THỨC TOÁN HỌC & THUẬT TOÁN AI

### 3.1. Thuật Toán Trích Xuất Khung Xương YOLO Pose

Từ 17 điểm keypoints khung xương, hệ thống đo đạc tỷ lệ trực quan giữa độ rộng thân ($\text{width\_px}$) và chiều cao ($\text{height\_px}$):
$$\text{Visual Ratio} = \frac{\text{width\_px}}{\text{height\_px}}$$

Từ tỷ lệ khung xương, BMI động được suy ra trực tiếp theo công thức tuyến tính:
$$\text{BMI}_{\text{dynamic}} = 15.0 + (\text{Visual Ratio} - 0.16) \times 50.0 \quad (\text{Giới hạn: } [16.5, 36.0])$$

### 3.2. Công Thức Tính Nhu Cầu Năng Lượng Cơ Bản BMR (Mifflin-St Jeor)

- **Nam giới**: $\text{BMR} = 10 \times \text{Cân nặng (kg)} + 6.25 \times \text{Chiều cao (cm)} - 5 \times \text{Tuổi} + 5$
- **Nữ giới**: $\text{BMR} = 10 \times \text{Cân nặng (kg)} + 6.25 \times \text{Chiều cao (cm)} - 5 \times \text{Tuổi} - 161$

### 3.3. Công Thức Tính Tổng Calo Tiêu Thụ Hàng Ngày TDEE

$$\text{TDEE} = \text{BMR} \times 1.375 \quad (\text{Mức vận động vừa})$$

### 3.4. Công Thức Tính % Mỡ Cơ Thể Deurenberg

$$\text{Body Fat } \% = (1.20 \times \text{BMI}) + (0.23 \times \text{Tuổi}) - (10.8 \times \text{Giới tính}) - 5.4$$
_(Trong đó: Nam = 1, Nữ = 0)_

---

## 💻 4. MẪU DỮ LIỆU PHẢN HỒI API (API RESPONSE PAYLOAD)

Khi client gọi API `POST /api/v1/profile/body-analysis`, kết quả JSON trả về bao gồm thông tin Cấp độ BMI:

```json
{
    "body_shape": "Fit / Athletic Ideal",
    "estimated_body_fat_pct": 16.4,
    "bmi": 21.8,
    "tdee": 2150.0,
    "bmi_level": 5,
    "bmi_level_label": "Bình thường - Lý tưởng (Normal Ideal)",
    "recommendation": "🌟 THANG 5/10 - Bình thường - Lý tưởng (Normal Ideal): Chỉ số BMI 21.8 LÝ TƯỞNG NHẤT (Chuẩn Châu Á). Tỷ lệ cơ thể rất đẹp! Hãy giữ vững mức TDEE hiện tại và ưu tiên thực phẩm tươi sống (Whole Foods).\n[YOLO Pose Model: YOLO Pose (body proportions), Confidence: 0.88]",
    "height_cm": 172.5,
    "weight_kg": 64.8
}
```

---

## 🎨 5. MINH HỌA GIAO DIỆN THANH TIẾN TRÌNH (FRONTEND DISPLAY)

Trên giao diện React (`OnboardingModal.tsx`), Cấp độ BMI được biểu diễn bằng thanh tiến trình 10 vạch phân màu:

- **Cấp 1 - 3**: สี Vàng lá / Vàng chanh (`bg-amber-400`) - _Thiếu cân_
- **Cấp 4 - 5**: Màu Xanh lục lá (`bg-emerald-400`) - _Khỏe mạnh / Lý tưởng_
- **Cấp 6 - 7**: Màu Cam (`bg-orange-400`) - _Tiền thừa cân / Thừa cân_
- **Cấp 8 - 10**: Màu Đỏ sẫm (`bg-rose-500`) - _Béo phì / Cảnh báo nguy cơ_

---

_Hệ thống được phát triển và tối ưu bởi đội ngũ HealthLens AI._
