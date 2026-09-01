import axios from "axios";
import type {
    User,
    UserProfile,
    FoodLog,
    WeightLog,
    AIAnalysisResult,
    BodyAnalysisResult,
    NutritionSummary,
    AIRecommendation,
    FoodDatabaseItem,
    AIReportItem,
    SubscriptionPlan,
    DailyMealPlan,
} from "../types";

const API_BASE_URL = "http://localhost:8000/api/v1";

const client = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        "Content-Type": "application/json",
    },
    timeout: 15000,
});

// Interceptor to attach JWT token to all requests if present
client.interceptors.request.use((config) => {
    const token = localStorage.getItem("health_app_token");
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

export const api = {
    // Session Persistence Helpers
    getStoredUser(): User | null {
        const data = localStorage.getItem("health_app_user");
        return data ? JSON.parse(data) : null;
    },

    setStoredUser(user: User | null, token?: string) {
        if (user) {
            localStorage.setItem("health_app_user", JSON.stringify(user));
            if (token || user.access_token) {
                localStorage.setItem("health_app_token", token || user.access_token || "");
            }
        } else {
            localStorage.removeItem("health_app_user");
            localStorage.removeItem("health_app_token");
        }
    },

    // Auth APIs
    async login(email: string, password: string): Promise<User> {
        try {
            const res = await client.post("/auth/login", { email, password });
            const user: User = res.data;
            this.setStoredUser(user, user.access_token);
            return user;
        } catch (err: any) {
            const message = err.response?.data?.detail || "Đăng nhập thất bại. Kiểm tra email & mật khẩu.";
            throw new Error(message);
        }
    },

    async register(email: string, password: string, fullName?: string): Promise<User> {
        try {
            const res = await client.post("/auth/register", { email, password, full_name: fullName });
            const user: User = res.data;
            this.setStoredUser(user, user.access_token);
            return user;
        } catch (err: any) {
            const message = err.response?.data?.detail || "Đăng ký thất bại. Email đã được sử dụng.";
            throw new Error(message);
        }
    },

    async clerkSync(clerkUserId: string, email: string, fullName?: string): Promise<User> {
        try {
            const res = await client.post("/auth/clerk-sync", {
                clerk_user_id: clerkUserId,
                email,
                full_name: fullName
            });
            const user: User = res.data;
            this.setStoredUser(user, user.access_token);
            return user;
        } catch (err: any) {
            const message = err.response?.data?.detail || "Không thể đồng bộ tài khoản Clerk OAuth với hệ thống.";
            throw new Error(message);
        }
    },

    async getCurrentUser(): Promise<User | null> {
        try {
            const res = await client.get("/auth/me");
            return res.data;
        } catch {
            return this.getStoredUser();
        }
    },

    // Subscription & Stripe APIs
    async getSubscriptionPlans(): Promise<SubscriptionPlan[]> {
        try {
            const res = await client.get("/subscription/plans");
            return res.data.plans;
        } catch (err: any) {
            throw new Error("Không thể tải danh sách gói dịch vụ từ server.");
        }
    },

    async createCheckoutSession(plan: 'plus' | 'pro', userId: number): Promise<{ checkout_url: string }> {
        try {
            const res = await client.post("/subscription/create-checkout-session", { plan, user_id: userId });
            return res.data;
        } catch (err: any) {
            const message = err.response?.data?.detail || "Không thể khởi tạo Stripe checkout session.";
            throw new Error(message);
        }
    },

    async upgradeSubscription(plan: 'plus' | 'pro', userId: number): Promise<User> {
        try {
            const res = await client.post("/subscription/upgrade", { plan, user_id: userId, payment_method: "stripe" });
            const currentUser = this.getStoredUser();
            const updated = currentUser 
                ? { ...currentUser, plan: res.data.plan as 'plus' | 'pro' }
                : { user_id: userId, email: "", role: "user" as const, plan: res.data.plan as 'plus' | 'pro' };
            
            this.setStoredUser(updated, currentUser?.access_token);
            return updated;
        } catch (err: any) {
            const message = err.response?.data?.detail || "Không thể nâng cấp gói dịch vụ.";
            throw new Error(message);
        }
    },

    async getProDailyMealRecommendations(userId: number): Promise<DailyMealPlan> {
        try {
            const res = await client.get(`/ai/daily-meal-recommendations/${userId}`);
            return res.data;
        } catch (err: any) {
            const message = err.response?.data?.detail || "🔒 Tính năng 'Gợi ý bữa ăn hàng ngày' chỉ dành riêng cho bản Pro (50.000đ/tháng).";
            throw new Error(message);
        }
    },

    // Profile APIs
    async getProfile(userId: number): Promise<UserProfile> {
        try {
            const res = await client.get(`/profile/${userId}`);
            return res.data;
        } catch (err: any) {
            throw new Error("Không thể tải thông tin profile người dùng.");
        }
    },

    async updateProfile(userId: number, profileData: Partial<UserProfile>): Promise<UserProfile> {
        try {
            const res = await client.put(`/profile/${userId}`, profileData);
            return res.data;
        } catch (err: any) {
            const message = err.response?.data?.detail || "Cập nhật hồ sơ thất bại.";
            throw new Error(message);
        }
    },

    async analyzeBodyPose(formData: FormData): Promise<BodyAnalysisResult> {
        try {
            const res = await client.post("/profile/body-analysis", formData, {
                headers: { "Content-Type": "multipart/form-data" },
            });
            return res.data;
        } catch (err: any) {
            const message = err.response?.data?.detail || err.message || "Không thể phân tích ảnh toàn thân.";
            throw new Error(message);
        }
    },

    // Food Logs & Summary APIs
    async getFoodLogs(userId: number, dateStr?: string): Promise<FoodLog[]> {
        try {
            const res = await client.get(`/food-logs/${userId}`, { params: { date_str: dateStr } });
            return res.data;
        } catch {
            return [];
        }
    },

    async createFoodLog(
        userId: number,
        log: Omit<FoodLog, "id" | "user_id" | "confidence_score" | "logged_at">,
    ): Promise<FoodLog> {
        try {
            const res = await client.post(`/food-logs/${userId}`, log);
            return res.data;
        } catch (err: any) {
            const message = err.response?.data?.detail || "Không thể thêm nhật ký món ăn.";
            throw new Error(message);
        }
    },

    async deleteFoodLog(logId: number): Promise<void> {
        try {
            await client.delete(`/food-logs/${logId}`);
        } catch (err: any) {
            const message = err.response?.data?.detail || "Xóa món ăn thất bại.";
            throw new Error(message);
        }
    },

    async getNutritionSummary(userId: number): Promise<NutritionSummary> {
        try {
            const res = await client.get(`/food-logs/${userId}/summary`);
            return res.data;
        } catch (err: any) {
            throw new Error("Không thể tải thống kê dinh dưỡng.");
        }
    },

    // Weight logs APIs
    async getWeightHistory(userId: number): Promise<WeightLog[]> {
        try {
            const res = await client.get(`/weight-logs/${userId}`);
            return res.data;
        } catch {
            return [];
        }
    },

    async recordWeight(userId: number, weightKg: number): Promise<WeightLog> {
        try {
            const res = await client.post(`/weight-logs/${userId}`, { weight_kg: weightKg });
            return res.data;
        } catch (err: any) {
            const message = err.response?.data?.detail || "Ghi nhận cân nặng thất bại.";
            throw new Error(message);
        }
    },

    // AI Service APIs
    async analyzeFood(formData: FormData): Promise<AIAnalysisResult> {
        try {
            const res = await client.post("/ai/analyze-food", formData, {
                headers: { "Content-Type": "multipart/form-data" },
            });
            return res.data;
        } catch (err: any) {
            const message = err.response?.data?.detail || err.message || "Quét ảnh món ăn thất bại.";
            throw new Error(message);
        }
    },

    async getAIRecommendations(userId: number): Promise<AIRecommendation> {
        try {
            const res = await client.get(`/ai/recommendations/${userId}`);
            return res.data;
        } catch (err: any) {
            throw new Error("Không thể lấy gợi ý AI.");
        }
    },

    async submitAIReport(userId: number, original: string, correction: string, foodLogId?: number): Promise<void> {
        try {
            await client.post(`/ai/report/${userId}`, {
                food_log_id: foodLogId,
                original_prediction: original,
                user_correction: correction,
            });
        } catch (err: any) {
            const message = err.response?.data?.detail || "Gửi báo cáo lỗi AI thất bại.";
            throw new Error(message);
        }
    },

    // Admin APIs
    async getAdminStats(): Promise<{
        total_users: number;
        alert_users_count: number;
        pending_ai_reports: number;
        total_food_items: number;
    }> {
        try {
            const res = await client.get("/admin/stats");
            return res.data;
        } catch (err: any) {
            throw new Error("Không thể tải thống kê Admin.");
        }
    },

    async getFoodDatabase(): Promise<FoodDatabaseItem[]> {
        try {
            const res = await client.get("/admin/foods");
            return res.data;
        } catch {
            return [];
        }
    },

    async getAIReports(): Promise<AIReportItem[]> {
        try {
            const res = await client.get("/admin/reports");
            return res.data;
        } catch {
            return [];
        }
    },
};
