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

// Helper for Mock Fallback when BE server is not yet running
const mockUser: User = {
    user_id: 1,
    email: "demouser@uit.edu.vn",
    full_name: "Nguyễn Trọng Nhân",
    role: "user",
    access_token: "mock_jwt_token_12345",
};

const mockProfile: UserProfile = {
    id: 1,
    user_id: 1,
    height_cm: 172,
    current_weight_kg: 68,
    target_weight_kg: 63,
    age: 22,
    gender: "male",
    activity_level: "moderate",
    goal: "weight_loss",
    daily_calorie_target: 1950,
    bmi: 23.0,
    tdee: 2350,
    body_shape: "Average",
    dietary_preferences: "Hạn chế dầu mỡ, Ngân sách 100k/ngày",
};

const mockLogs: FoodLog[] = [
    {
        id: 1,
        user_id: 1,
        meal_type: "breakfast",
        food_name: "Phở Bò Tái Sách",
        weight_g: 450,
        calories: 480,
        protein_g: 26.5,
        carbs_g: 58,
        fat_g: 14.2,
        confidence_score: 0.95,
        logged_at: new Date().toISOString(),
    },
    {
        id: 2,
        user_id: 1,
        meal_type: "lunch",
        food_name: "Salad Ức Gà Sốt Chanh Dây",
        weight_g: 350,
        calories: 320,
        protein_g: 35,
        carbs_g: 18,
        fat_g: 10.5,
        confidence_score: 0.96,
        logged_at: new Date().toISOString(),
    },
];

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
            if (err.response?.data?.detail) {
                throw new Error(err.response.data.detail);
            }
            const user: User = { ...mockUser, email, full_name: email.split("@")[0] };
            this.setStoredUser(user, user.access_token);
            return user;
        }
    },

    async register(email: string, password: string, fullName?: string): Promise<User> {
        try {
            const res = await client.post("/auth/register", { email, password, full_name: fullName });
            const user: User = res.data;
            this.setStoredUser(user, user.access_token);
            return user;
        } catch (err: any) {
            if (err.response?.data?.detail) {
                throw new Error(err.response.data.detail);
            }
            const user: User = { ...mockUser, email, full_name: fullName || "Người dùng mới" };
            this.setStoredUser(user, user.access_token);
            return user;
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

    // Profile APIs
    async getProfile(userId: number): Promise<UserProfile> {
        try {
            const res = await client.get(`/profile/${userId}`);
            return res.data;
        } catch {
            return mockProfile;
        }
    },

    async updateProfile(userId: number, profileData: Partial<UserProfile>): Promise<UserProfile> {
        try {
            const res = await client.put(`/profile/${userId}`, profileData);
            return res.data;
        } catch {
            return { ...mockProfile, ...profileData };
        }
    },

    async analyzeBodyPose(formData: FormData): Promise<BodyAnalysisResult> {
        try {
            const res = await client.post("/profile/body-analysis", formData, {
                headers: { "Content-Type": "multipart/form-data" },
            });
            return res.data;
        } catch (err: any) {
            const message = err.response?.data?.detail || err.message || "Không thể phân tích ảnh khuôn mặt.";
            throw new Error(message);
        }
    },

    // Food Logs & Summary
    async getFoodLogs(userId: number, dateStr?: string): Promise<FoodLog[]> {
        try {
            const res = await client.get(`/food-logs/${userId}`, { params: { date_str: dateStr } });
            return res.data;
        } catch {
            return mockLogs;
        }
    },

    async createFoodLog(
        userId: number,
        log: Omit<FoodLog, "id" | "user_id" | "confidence_score" | "logged_at">,
    ): Promise<FoodLog> {
        try {
            const res = await client.post(`/food-logs/${userId}`, log);
            return res.data;
        } catch {
            const newLog: FoodLog = {
                ...log,
                id: Date.now(),
                user_id: userId,
                confidence_score: 0.95,
                logged_at: new Date().toISOString(),
            };
            mockLogs.unshift(newLog);
            return newLog;
        }
    },

    async deleteFoodLog(logId: number): Promise<void> {
        try {
            await client.delete(`/food-logs/${logId}`);
        } catch {
            // Mock delete
        }
    },

    async getNutritionSummary(userId: number): Promise<NutritionSummary> {
        try {
            const res = await client.get(`/food-logs/${userId}/summary`);
            return res.data;
        } catch {
            return {
                daily: {
                    consumed_calories: 800,
                    target_calories: 1950,
                    remaining_calories: 1150,
                    protein_g: 61.5,
                    protein_target_g: 146,
                    carbs_g: 76,
                    carbs_target_g: 219,
                    fat_g: 24.7,
                    fat_target_g: 54,
                },
                weekly_chart: [
                    { day: "T2", date: "04/08", calories: 1850, target: 1950 },
                    { day: "T3", date: "05/08", calories: 2050, target: 1950 },
                    { day: "T4", date: "06/08", calories: 1780, target: 1950 },
                    { day: "T5", date: "07/08", calories: 1920, target: 1950 },
                    { day: "T6", date: "08/08", calories: 2100, target: 1950 },
                    { day: "T7", date: "09/08", calories: 1650, target: 1950 },
                    { day: "CN", date: "10/08", calories: 800, target: 1950 },
                ],
                monthly_chart: [
                    { week: "Tuần 1", avg_calories: 1920, avg_weight: 69.5 },
                    { week: "Tuần 2", avg_calories: 1880, avg_weight: 69.0 },
                    { week: "Tuần 3", avg_calories: 1850, avg_weight: 68.4 },
                    { week: "Tuần 4", avg_calories: 1810, avg_weight: 68.0 },
                ],
            };
        }
    },

    // Weight logs
    async getWeightHistory(userId: number): Promise<WeightLog[]> {
        try {
            const res = await client.get(`/weight-logs/${userId}`);
            return res.data;
        } catch {
            return [
                { id: 1, user_id: userId, weight_kg: 69.5, recorded_at: "2026-07-15T08:00:00Z" },
                { id: 2, user_id: userId, weight_kg: 68.8, recorded_at: "2026-07-25T08:00:00Z" },
                { id: 3, user_id: userId, weight_kg: 68.0, recorded_at: "2026-08-05T08:00:00Z" },
            ];
        }
    },

    async recordWeight(userId: number, weightKg: number): Promise<WeightLog> {
        try {
            const res = await client.post(`/weight-logs/${userId}`, { weight_kg: weightKg });
            return res.data;
        } catch {
            return { id: Date.now(), user_id: userId, weight_kg: weightKg, recorded_at: new Date().toISOString() };
        }
    },

    // AI Service
    async analyzeFood(formData: FormData): Promise<AIAnalysisResult> {
        try {
            const res = await client.post("/ai/analyze-food", formData, {
                headers: { "Content-Type": "multipart/form-data" },
            });
            return res.data;
        } catch (err: any) {
            // Re-throw error with server message or default message
            const errorMessage =
                err.response?.data?.detail ||
                err.message ||
                "Không nhận diện được đồ ăn. Vui lòng cung cấp ảnh rõ ràng hơn.";

            throw new Error(errorMessage);
        }
    },

    async getAIRecommendations(userId: number): Promise<AIRecommendation> {
        try {
            const res = await client.get(`/ai/recommendations/${userId}`);
            return res.data;
        } catch {
            return {
                status: "on_track",
                diff_calories: -1150,
                advice: "Bạn còn dư 1,150 kcal cho bữa tối. Hãy nạp bữa ăn giàu đạm cùng rau xanh để đảm bảo thâm hụt calo lành mạnh!",
                suggested_meals: [
                    {
                        meal: "Bữa Tối",
                        suggestion: "Cơm gạo lứt + 200g Ức gà áp chảo + Bông cải xanh luộc",
                        calories: 520,
                    },
                    { meal: "Bữa Phụ", suggestion: "1 Quả táo đỏ + 1 hũ sữa chua không đường", calories: 150 },
                ],
            };
        }
    },

    async submitAIReport(userId: number, original: string, correction: string, foodLogId?: number): Promise<void> {
        try {
            await client.post(`/ai/report/${userId}`, {
                food_log_id: foodLogId,
                original_prediction: original,
                user_correction: correction,
            });
        } catch {
            // Mock submit success
        }
    },

    // Admin API
    async getAdminStats(): Promise<{
        total_users: number;
        alert_users_count: number;
        pending_ai_reports: number;
        total_food_items: number;
    }> {
        try {
            const res = await client.get("/admin/stats");
            return res.data;
        } catch {
            return { total_users: 128, alert_users_count: 5, pending_ai_reports: 3, total_food_items: 45 };
        }
    },

    async getFoodDatabase(): Promise<FoodDatabaseItem[]> {
        try {
            const res = await client.get("/admin/foods");
            return res.data;
        } catch {
            return [
                {
                    id: 1,
                    food_name: "Phở Bò Tái Sách",
                    category: "Món Nước",
                    calories_per_100g: 106,
                    protein_per_100g: 5.8,
                    carbs_per_100g: 12.8,
                    fat_per_100g: 3.1,
                },
                {
                    id: 2,
                    food_name: "Cơm Tấm Sườn Bì Chả",
                    category: "Cơm",
                    calories_per_100g: 144,
                    protein_per_100g: 7.6,
                    carbs_per_100g: 15.0,
                    fat_per_100g: 5.6,
                },
                {
                    id: 3,
                    food_name: "Salad Ức Gà Sốt Chanh Dây",
                    category: "Healthy",
                    calories_per_100g: 91.4,
                    protein_per_100g: 10.0,
                    carbs_per_100g: 5.1,
                    fat_per_100g: 3.0,
                },
            ];
        }
    },

    async getAIReports(): Promise<AIReportItem[]> {
        try {
            const res = await client.get("/admin/reports");
            return res.data;
        } catch {
            return [
                {
                    id: 1,
                    user_id: 1,
                    original_prediction: "Thịt bò xào",
                    user_correction: "Thịt lợn rang cháy cạnh",
                    status: "pending",
                    created_at: new Date().toISOString(),
                },
                {
                    id: 2,
                    user_id: 2,
                    original_prediction: "Trà chanh",
                    user_correction: "Trà sữa trân châu",
                    status: "pending",
                    created_at: new Date().toISOString(),
                },
            ];
        }
    },
};
