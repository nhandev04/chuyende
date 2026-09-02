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
    SubscriptionStatusOut,
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
            const message = err.response?.data?.detail || "Login failed. Please check your email & password.";
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
            const message = err.response?.data?.detail || "Registration failed. Email is already in use.";
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
            const message = err.response?.data?.detail || "Failed to sync Clerk OAuth account with system.";
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
            throw new Error("Failed to load subscription plans from server.");
        }
    },

    async createCheckoutSession(plan: 'plus' | 'pro', userId: number): Promise<{ checkout_url: string }> {
        try {
            const res = await client.post("/subscription/create-checkout-session", { plan, user_id: userId });
            return res.data;
        } catch (err: any) {
            const message = err.response?.data?.detail || "Failed to initialize Stripe checkout session.";
            throw new Error(message);
        }
    },

    async verifyStripeSession(sessionId: string): Promise<User> {
        try {
            const res = await client.post("/subscription/verify-session", { session_id: sessionId });
            const currentUser = this.getStoredUser();
            const updated = currentUser 
                ? { ...currentUser, plan: res.data.plan as 'plus' | 'pro' }
                : { user_id: res.data.user_id, email: "", role: "user" as const, plan: res.data.plan as 'plus' | 'pro' };
            
            this.setStoredUser(updated, currentUser?.access_token);
            return updated;
        } catch (err: any) {
            const message = err.response?.data?.detail || "Failed to verify Stripe payment session.";
            throw new Error(message);
        }
    },

    async getSubscriptionStatus(userId: number): Promise<SubscriptionStatusOut> {
        try {
            const res = await client.get(`/subscription/status/${userId}`);
            return res.data;
        } catch {
            return {
                user_id: userId,
                plan: 'standard',
                subscription_status: 'active',
                subscription_expires_at: null,
                is_active: false
            };
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
            const message = err.response?.data?.detail || "Failed to upgrade subscription tier.";
            throw new Error(message);
        }
    },


    async getProDailyMealRecommendations(userId: number): Promise<DailyMealPlan> {
        try {
            const res = await client.get(`/ai/daily-meal-recommendations/${userId}`);
            return res.data;
        } catch (err: any) {
            const message = err.response?.data?.detail || "🔒 'Daily Meal Recommendation' feature is exclusive to Pro tier users.";
            throw new Error(message);
        }
    },

    // Profile APIs
    async uploadAvatar(userId: number, file: File): Promise<{ avatar_url: string }> {
        try {
            const formData = new FormData();
            formData.append("avatar_file", file);
            const res = await client.post(`/profile/upload-avatar/${userId}`, formData, {
                headers: { "Content-Type": "multipart/form-data" }
            });
            const currentUser = this.getStoredUser();
            if (currentUser) {
                const updatedUser = { ...currentUser, avatar_url: res.data.avatar_url };
                this.setStoredUser(updatedUser, currentUser.access_token);
            }
            return res.data;
        } catch (err: any) {
            const message = err.response?.data?.detail || "Failed to upload avatar image.";
            throw new Error(message);
        }
    },

    async getProfile(userId: number): Promise<UserProfile> {

        try {
            const res = await client.get(`/profile/${userId}`);
            return res.data;
        } catch (err: any) {
            throw new Error("Failed to load user profile information.");
        }
    },

    async updateProfile(userId: number, profileData: Partial<UserProfile>): Promise<UserProfile> {
        try {
            const res = await client.put(`/profile/${userId}`, profileData);
            return res.data;
        } catch (err: any) {
            const message = err.response?.data?.detail || "Profile update failed.";
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
            const message = err.response?.data?.detail || err.message || "Failed to analyze full-body photo.";
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
            const message = err.response?.data?.detail || "Failed to create food log entry.";
            throw new Error(message);
        }
    },

    async deleteFoodLog(logId: number): Promise<void> {
        try {
            await client.delete(`/food-logs/${logId}`);
        } catch (err: any) {
            const message = err.response?.data?.detail || "Failed to delete food log item.";
            throw new Error(message);
        }
    },

    async getNutritionSummary(userId: number): Promise<NutritionSummary> {
        try {
            const res = await client.get(`/food-logs/${userId}/summary`);
            return res.data;
        } catch (err: any) {
            throw new Error("Failed to load nutrition summary stats.");
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
            const message = err.response?.data?.detail || "Failed to record weight entry.";
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
            const message = err.response?.data?.detail || err.message || "Food photo analysis failed.";
            throw new Error(message);
        }
    },

    async getAIRecommendations(userId: number): Promise<AIRecommendation> {
        try {
            const res = await client.get(`/ai/recommendations/${userId}`);
            return res.data;
        } catch (err: any) {
            throw new Error("Failed to load AI recommendations.");
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
            const message = err.response?.data?.detail || "Failed to submit AI error report.";
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
            throw new Error("Failed to load Admin statistics.");
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

    async addGroundTruthFood(foodData: {
        food_name: string;
        category: string;
        calories_per_100g: number;
        protein_per_100g: number;
        carbs_per_100g: number;
        fat_per_100g: number;
    }): Promise<FoodDatabaseItem> {
        try {
            const res = await client.post("/admin/foods", foodData);
            return res.data;
        } catch (err: any) {
            const message = err.response?.data?.detail || "Failed to add food item to Ground-Truth DB.";
            throw new Error(message);
        }
    },

    async deleteGroundTruthFood(foodId: number): Promise<void> {
        try {
            await client.delete(`/admin/foods/${foodId}`);
        } catch (err: any) {
            const message = err.response?.data?.detail || "Failed to delete food item from DB.";
            throw new Error(message);
        }
    },

    async updateAIReport(reportId: number, status: 'resolved' | 'dismissed', addToGroundTruth: boolean = false): Promise<AIReportItem> {
        try {
            const res = await client.put(`/admin/reports/${reportId}`, {
                status,
                add_to_ground_truth: addToGroundTruth
            });
            return res.data;
        } catch (err: any) {
            const message = err.response?.data?.detail || "Failed to update AI report status.";
            throw new Error(message);
        }
    },

    async getAllUsers(): Promise<any[]> {
        try {
            const res = await client.get("/admin/users");
            return res.data;
        } catch {
            return [];
        }
    },

    async updateUserAccount(userId: number, role?: string, plan?: string): Promise<any> {
        try {
            const res = await client.put(`/admin/users/${userId}`, { role, plan });
            return res.data;
        } catch (err: any) {
            const message = err.response?.data?.detail || "Failed to update user account settings.";
            throw new Error(message);
        }
    }
};

