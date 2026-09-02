export interface User {
  user_id: number;
  email: string;
  full_name?: string;
  role: 'user' | 'admin';
  plan?: 'standard' | 'plus' | 'pro';
  auth_provider?: 'clerk' | 'local';
  clerk_user_id?: string;
  access_token?: string;
}

export interface SubscriptionPlan {
  id: 'standard' | 'plus' | 'pro';
  name: string;
  price_vnd: number;
  price_display: string;
  features: string[];
  badge: string;
  is_current_default: boolean;
}

export interface SubscriptionStatusOut {
  user_id: number;
  plan: 'standard' | 'plus' | 'pro';
  subscription_status: string;
  subscription_expires_at?: string | null;
  is_active: boolean;
}


export interface DailyMealPlan {
  title: string;
  target_daily_calories: number;
  planned_total_calories: number;
  macros_summary: {
    protein_g: number;
    carbs_g: number;
    fat_g: number;
  };
  bmi_context: {
    bmi: number;
    body_shape: string;
    goal: string;
  };
  meals: Array<{
    meal_type: string;
    meal_label: string;
    name: string;
    portion: string;
    calories: number;
    protein_g: number;
    carbs_g: number;
    fat_g: number;
    advice: string;
  }>;
}


export interface UserProfile {
  id?: number;
  user_id: number;
  height_cm: number;
  current_weight_kg: number;
  target_weight_kg: number;
  age: number;
  gender: 'male' | 'female';
  activity_level: 'sedentary' | 'light' | 'moderate' | 'active';
  goal: 'weight_loss' | 'muscle_gain' | 'maintain';
  daily_calorie_target: number;
  bmi: number;
  tdee: number;
  body_shape: string;
  dietary_preferences?: string;
}

export interface FoodLog {
  id: number;
  user_id: number;
  meal_type: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  food_name: string;
  weight_g: number;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  image_url?: string;
  confidence_score: number;
  logged_at: string;
}

export interface WeightLog {
  id: number;
  user_id: number;
  weight_kg: number;
  recorded_at: string;
}

export interface AIAnalysisResult {
  food_name: string;
  estimated_weight_g: number;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  confidence_score: number;
  detected_items: string[];
  advice?: string;
}

export interface BodyAnalysisResult {
  body_shape: string;
  estimated_body_fat_pct: number;
  bmi: number;
  tdee: number;
  recommendation: string;
  height_cm?: number;
  weight_kg?: number;
  bmi_level?: number;
  bmi_level_label?: string;
}

export interface NutritionSummary {
  daily: {
    consumed_calories: number;
    target_calories: number;
    remaining_calories: number;
    protein_g: number;
    protein_target_g: number;
    carbs_g: number;
    carbs_target_g: number;
    fat_g: number;
    fat_target_g: number;
  };
  weekly_chart: Array<{
    day: string;
    date: string;
    calories: number;
    target: number;
  }>;
  monthly_chart: Array<{
    week: string;
    avg_calories: number;
    avg_weight: number;
  }>;
}

export interface AIRecommendation {
  status: 'on_track' | 'over_budget' | 'under_budget';
  diff_calories: number;
  advice: string;
  suggested_meals: Array<{
    meal: string;
    suggestion: string;
    calories: number;
  }>;
}

export interface FoodDatabaseItem {
  id: number;
  food_name: string;
  category: string;
  calories_per_100g: number;
  protein_per_100g: number;
  carbs_per_100g: number;
  fat_per_100g: number;
  image_url?: string;
}

export interface AIReportItem {
  id: number;
  user_id: number;
  food_log_id?: number;
  original_prediction: string;
  user_correction: string;
  status: string;
  created_at: string;
}
