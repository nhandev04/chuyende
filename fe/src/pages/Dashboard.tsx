import React, { useState, useEffect } from "react";
import { api } from "../services/api";
import type { User, UserProfile, FoodLog, NutritionSummary, AIRecommendation, DailyMealPlan } from "../types";
import { Sparkles, Flame, Plus, Trash2, Crown, Lock, RefreshCw } from "lucide-react";

interface DashboardProps {
    user: User | null;
    profile: UserProfile | null;
    onOpenAuth: () => void;
    onOpenScanner: () => void;
    onOpenWeightModal: () => void;
    onOpenOnboarding: () => void;
    onOpenSubscription: () => void;
    onOpenRAGMealPlan?: () => void;
    theme?: "dark" | "light";
    refreshKey?: number;
}

export const Dashboard: React.FC<DashboardProps> = ({
    user,
    profile,
    onOpenAuth,
    onOpenScanner,
    onOpenWeightModal,
    onOpenOnboarding,
    onOpenSubscription,
    onOpenRAGMealPlan,
    theme = "dark",
    refreshKey = 0,
}) => {
    const [summary, setSummary] = useState<NutritionSummary | null>(null);
    const [todayLogs, setTodayLogs] = useState<FoodLog[]>([]);
    const [recommendation, setRecommendation] = useState<AIRecommendation | null>(null);
    const [proMealPlan, setProMealPlan] = useState<DailyMealPlan | null>(null);
    const [refreshingProPlan, setRefreshingProPlan] = useState(false);

    const userId = user?.user_id;
    const isDark = theme === "dark";
    const isProOrAdmin = user?.role === "admin" || user?.plan === "pro";

    const loadDashboardData = async () => {
        if (!userId) return;
        try {
            const [sumRes, logsRes, recRes] = await Promise.all([
                api.getNutritionSummary(userId),
                api.getFoodLogs(userId),
                api.getAIRecommendations(userId),
            ]);
            setSummary(sumRes);
            setTodayLogs(logsRes);
            setRecommendation(recRes);

            if (isProOrAdmin) {
                try {
                    const mealRes = await api.getProDailyMealRecommendations(userId);
                    setProMealPlan(mealRes);
                } catch (err) {
                    console.log("Pro meal fetch notice:", err);
                }
            }
        } catch (err) {
            console.log("Dashboard load notice:", err);
        }
    };

    useEffect(() => {
        if (userId) {
            loadDashboardData();
        }
    }, [userId, refreshKey, user?.plan]);

    if (!user) {
        return (
            <div className="max-w-4xl mx-auto px-4 py-16 text-center space-y-6">
                <div className="w-20 h-20 bg-gradient-to-tr from-emerald-500 to-teal-400 rounded-3xl flex items-center justify-center mx-auto shadow-xl shadow-emerald-500/20">
                    <Sparkles className="w-10 h-10 text-slate-950" />
                </div>
                <h2 className="text-3xl font-black text-slate-900 dark:text-white">Welcome to HealthLens AI</h2>
                <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto leading-relaxed">
                    Your smart AI companion for photo food scanning, calorie tracking, and personalized diet recommendations.
                </p>
                <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
                    <button
                        onClick={onOpenAuth}
                        className="w-full sm:w-auto px-8 py-3.5 bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 font-black text-sm rounded-2xl shadow-lg hover:opacity-95 transition"
                    >
                        🔑 Sign In / Register to Start
                    </button>
                </div>
            </div>
        );
    }

    const handleRefreshProMeal = async () => {
        if (!userId) return;
        setRefreshingProPlan(true);
        try {
            const mealRes = await api.getProDailyMealRecommendations(userId);
            setProMealPlan(mealRes);
        } catch (err: any) {
            alert(err.message || "Connection error while loading new meal recommendations.");
        } finally {
            setRefreshingProPlan(false);
        }
    };

    const handleDeleteLog = async (logId: number) => {
        await api.deleteFoodLog(logId);
        setTodayLogs((prev) => prev.filter((l) => l.id !== logId));
        loadDashboardData();
    };

    const consumed = summary?.daily.consumed_calories || 0;
    const target = profile?.daily_calorie_target || summary?.daily.target_calories || 2000;
    const pct = Math.min(100, Math.round((consumed / target) * 100));

    const cardBg = isDark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200";
    const textMain = isDark ? "text-white" : "text-slate-900";
    const textSub = isDark ? "text-slate-400" : "text-slate-500";

    return (
        <div className={`space-y-6 pb-24 max-w-4xl mx-auto px-4 pt-4 ${textMain}`}>
            {/* Top Banner / Welcome */}
            <div
                className={`border rounded-3xl p-5 shadow-xl flex items-center justify-between transition-colors ${isDark
                        ? "bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border-slate-800"
                        : "bg-gradient-to-r from-emerald-50 via-white to-teal-50 border-slate-200"
                    }`}
            >
                <div>
                    <div className="flex items-center space-x-2">
                        <span className="text-xs font-bold text-emerald-500 uppercase tracking-wider">
                            AI Health Tracking System
                        </span>
                        <span
                            className={`text-[10px] px-2.5 py-0.5 rounded-full font-extrabold uppercase ${user?.role === "admin"
                                    ? "bg-amber-500/20 text-amber-400"
                                    : user?.plan === "pro"
                                        ? "bg-indigo-500/20 text-indigo-400 border border-indigo-500/30"
                                        : user?.plan === "plus"
                                            ? "bg-emerald-500/20 text-emerald-400"
                                            : "bg-slate-700 text-slate-300"
                                }`}
                        >
                            Tier: {user?.role === "admin" ? "ADMIN" : user?.plan || "STANDARD"}
                        </span>
                    </div>
                    <h2 className="text-xl font-black mt-1">Welcome back, {user?.full_name || "User"} 👋</h2>
                    <p className={`text-xs mt-0.5 ${textSub}`}>
                        Goal:{" "}
                        {profile?.goal === "weight_loss"
                            ? "Weight Loss / Cut"
                            : profile?.goal === "muscle_gain"
                                ? "Muscle Gain / Bulk"
                                : "Maintain Fitness"}
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={onOpenOnboarding}
                        className="hidden sm:flex bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs px-3 py-2 rounded-xl border border-slate-700 font-semibold transition"
                    >
                        Body Profile
                    </button>
                    <button
                        onClick={onOpenSubscription}
                        className="bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-black text-xs px-3.5 py-2 rounded-xl shadow-md transition flex items-center gap-1.5"
                    >
                        <Crown className="w-3.5 h-3.5 fill-slate-950" />
                        <span>Upgrade Tier</span>
                    </button>
                </div>
            </div>

            {/* Pro Plan Exclusive Daily Meal Recommendations */}
            {isProOrAdmin ? (
                proMealPlan ? (
                    <div
                        className={`border rounded-3xl p-6 shadow-2xl relative overflow-hidden bg-gradient-to-br from-indigo-950/40 via-slate-900 to-slate-900 border-indigo-500/40`}
                    >
                        <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
                            <div className="flex items-center space-x-2">
                                <div className="w-8 h-8 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold">
                                    <Crown className="w-5 h-5 text-indigo-400 fill-indigo-400" />
                                </div>
                                <div>
                                    <h3 className="font-extrabold text-sm text-indigo-300">{proMealPlan.title}</h3>
                                    <p className="text-[11px] text-slate-400">
                                        Tailored to your daily goal ({proMealPlan.target_daily_calories} kcal) & fitness profile
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center space-x-2">
                                <button
                                    onClick={handleRefreshProMeal}
                                    disabled={refreshingProPlan}
                                    className="text-xs font-bold text-indigo-300 bg-indigo-500/20 hover:bg-indigo-500 hover:text-white border border-indigo-500/40 px-3 py-1.5 rounded-xl transition flex items-center space-x-1 shadow-sm"
                                    title="Refresh AI Meal Recommendations"
                                >
                                    <RefreshCw className={`w-3.5 h-3.5 ${refreshingProPlan ? "animate-spin" : ""}`} />
                                    <span>{refreshingProPlan ? "Creating..." : "Create New"}</span>
                                </button>
                                {onOpenRAGMealPlan && (
                                    <button
                                        onClick={onOpenRAGMealPlan}
                                        className="text-xs font-bold text-amber-400 bg-amber-500/20 hover:bg-amber-500 hover:text-slate-950 border border-amber-500/40 px-3.5 py-1.5 rounded-xl transition flex items-center space-x-1 shadow-sm"
                                    >
                                        <Sparkles className="w-3.5 h-3.5" />
                                        <span>AI Meal Planner →</span>
                                    </button>
                                )}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                            {proMealPlan.meals.map((m, idx) => (
                                <div key={idx} className="p-3.5 rounded-2xl bg-slate-800/80 border border-slate-700/80">
                                    <div className="flex justify-between items-center mb-1">
                                        <span className="font-bold text-xs text-indigo-300">{m.meal_label}</span>
                                        <span className="text-[11px] font-black text-emerald-400">
                                            {m.calories} kcal
                                        </span>
                                    </div>
                                    <h4 className="font-extrabold text-sm text-white">{m.name}</h4>
                                    <p className="text-[11px] text-slate-400 mt-0.5">{m.portion}</p>
                                    <p className="text-[10px] text-indigo-200/80 italic mt-1.5 bg-indigo-950/50 p-1.5 rounded-lg border border-indigo-800/30">
                                        💡 {m.advice}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>
                ) : (
                    <div className="border rounded-3xl p-5 shadow-xl bg-slate-900/90 border-indigo-500/30 flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                            <RefreshCw className="w-5 h-5 text-indigo-400 animate-spin" />
                            <div>
                                <h3 className="font-extrabold text-sm text-indigo-200">
                                    👑 Generating Pro AI Meal Plan...
                                </h3>
                                <p className="text-xs text-slate-400 mt-0.5">
                                    Customized daily meals tailored to your daily calorie target & health profile.
                                </p>
                            </div>
                        </div>
                    </div>
                )
            ) : (
                /* Paywall Banner ONLY for Standard / Plus users */
                <div className="border border-indigo-500/30 rounded-3xl p-5 shadow-xl bg-gradient-to-r from-indigo-950/50 via-slate-900 to-purple-950/50 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0">
                            <Lock className="w-5 h-5 text-indigo-400" />
                        </div>
                        <div>
                            <h3 className="font-extrabold text-sm text-indigo-200 flex items-center gap-1.5">
                                <Crown className="w-4 h-4 text-amber-400 fill-amber-400" />
                                Daily AI Recommended Meal Plan (Pro Tier Exclusive)
                            </h3>
                            <p className="text-xs text-slate-400 mt-0.5">
                                Upgrade to Pro tier (~$2/mo) to unlock custom meal plans for Breakfast, Lunch, Dinner, &
                                Snack tailored to your daily calorie burn & fitness goals.
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onOpenSubscription}
                        className="w-full sm:w-auto px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-extrabold text-xs rounded-xl shadow-lg shrink-0 transition"
                    >
                        Unlock Pro Tier
                    </button>
                </div>
            )}

            {/* Primary Hero Calorie Progress Gauge */}
            <div className={`border rounded-3xl p-6 shadow-2xl relative overflow-hidden transition-colors ${cardBg}`}>
                <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />

                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-2">
                        <Flame className="w-5 h-5 text-amber-500" />
                        <h3 className={`font-bold text-sm ${textMain}`}>Today's Caloric Intake</h3>
                    </div>
                    <button
                        onClick={onOpenScanner}
                        className="bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 px-3.5 py-1.5 rounded-xl font-extrabold text-xs shadow-md shadow-emerald-500/20 flex items-center space-x-1 hover:scale-105 transition-all"
                    >
                        <Plus className="w-4 h-4 stroke-[3]" />
                        <span>Add Meal</span>
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
                    {/* Circular Progress Gauge */}
                    <div className="flex flex-col items-center justify-center relative py-2">
                        <div className="relative w-36 h-36 flex items-center justify-center">
                            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                                <circle
                                    cx="50"
                                    cy="50"
                                    r="42"
                                    stroke="currentColor"
                                    strokeWidth="8"
                                    className={isDark ? "text-slate-800 fill-none" : "text-slate-200 fill-none"}
                                />
                                <circle
                                    cx="50"
                                    cy="50"
                                    r="42"
                                    stroke="url(#emeraldGrad)"
                                    strokeWidth="8"
                                    strokeDasharray={264}
                                    strokeDashoffset={264 - (264 * pct) / 100}
                                    strokeLinecap="round"
                                    className="fill-none transition-all duration-1000 ease-out"
                                />
                                <defs>
                                    <linearGradient id="emeraldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                                        <stop offset="0%" stopColor="#10b981" />
                                        <stop offset="100%" stopColor="#14b8a6" />
                                    </linearGradient>
                                </defs>
                            </svg>
                            <div className="absolute flex flex-col items-center text-center">
                                <span className={`text-2xl font-black ${textMain}`}>{consumed}</span>
                                <span className={`text-[10px] font-medium ${textSub}`}>/ {target} kcal</span>
                                <span className="text-[10px] font-bold text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full mt-0.5">
                                    {pct}% Goal
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Quick Metrics Breakdown */}
                    <div className="md:col-span-2 space-y-3">
                        {/* Protein Bar */}
                        <div>
                            <div className="flex justify-between text-xs font-semibold mb-1">
                                <span className="text-sky-500">Protein</span>
                                <span className={textSub}>
                                    {summary?.daily.protein_g || 0}g / {summary?.daily.protein_target_g || 120}g
                                </span>
                            </div>
                            <div
                                className={`w-full h-2.5 rounded-full overflow-hidden ${isDark ? "bg-slate-800" : "bg-slate-200"}`}
                            >
                                <div
                                    className="h-full bg-gradient-to-r from-sky-500 to-blue-400 rounded-full transition-all duration-700"
                                    style={{
                                        width: `${Math.min(100, ((summary?.daily.protein_g || 0) / (summary?.daily.protein_target_g || 120)) * 100)}%`,
                                    }}
                                />
                            </div>
                        </div>

                        {/* Carbs Bar */}
                        <div>
                            <div className="flex justify-between text-xs font-semibold mb-1">
                                <span className="text-amber-500">Carbs</span>
                                <span className={textSub}>
                                    {summary?.daily.carbs_g || 0}g / {summary?.daily.carbs_target_g || 200}g
                                </span>
                            </div>
                            <div
                                className={`w-full h-2.5 rounded-full overflow-hidden ${isDark ? "bg-slate-800" : "bg-slate-200"}`}
                            >
                                <div
                                    className="h-full bg-gradient-to-r from-amber-500 to-yellow-400 rounded-full transition-all duration-700"
                                    style={{
                                        width: `${Math.min(100, ((summary?.daily.carbs_g || 0) / (summary?.daily.carbs_target_g || 200)) * 100)}%`,
                                    }}
                                />
                            </div>
                        </div>

                        {/* Fat Bar */}
                        <div>
                            <div className="flex justify-between text-xs font-semibold mb-1">
                                <span className="text-rose-500">Fat</span>
                                <span className={textSub}>
                                    {summary?.daily.fat_g || 0}g / {summary?.daily.fat_target_g || 50}g
                                </span>
                            </div>
                            <div
                                className={`w-full h-2.5 rounded-full overflow-hidden ${isDark ? "bg-slate-800" : "bg-slate-200"}`}
                            >
                                <div
                                    className="h-full bg-gradient-to-r from-rose-500 to-pink-400 rounded-full transition-all duration-700"
                                    style={{
                                        width: `${Math.min(100, ((summary?.daily.fat_g || 0) / (summary?.daily.fat_target_g || 50)) * 100)}%`,
                                    }}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* AI Recommendation Card */}
            {recommendation && (
                <div
                    className={`border rounded-3xl p-5 shadow-xl relative ${isDark ? "bg-slate-900/90 border-emerald-500/30" : "bg-emerald-50/50 border-emerald-200"
                        }`}
                >
                    <div className="flex items-center space-x-2 mb-2">
                        <div className="w-7 h-7 rounded-xl bg-emerald-500/20 text-emerald-500 flex items-center justify-center">
                            <Sparkles className="w-4 h-4" />
                        </div>
                        <h3 className="font-extrabold text-sm text-emerald-500">AI Diet Recommendations</h3>
                    </div>
                    <p className={`text-xs leading-relaxed mb-3 ${isDark ? "text-slate-300" : "text-slate-700"}`}>
                        {recommendation.advice}
                    </p>

                    {recommendation.suggested_meals && recommendation.suggested_meals.length > 0 && (
                        <div className="space-y-2">
                            {recommendation.suggested_meals.map((item, idx) => (
                                <div
                                    key={idx}
                                    className={`p-3 rounded-2xl border flex items-center justify-between text-xs ${isDark ? "bg-slate-800/60 border-slate-800" : "bg-white border-slate-200"
                                        }`}
                                >
                                    <div>
                                        <span className="font-bold text-emerald-500">{item.meal}: </span>
                                        <span className={isDark ? "text-slate-200" : "text-slate-800"}>
                                            {item.suggestion}
                                        </span>
                                    </div>
                                    <span
                                        className={`font-bold text-[11px] px-2 py-1 rounded-lg ${isDark ? "bg-slate-900 text-slate-400" : "bg-slate-100 text-slate-600"
                                            }`}
                                    >
                                        ~{item.calories} kcal
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Health & Body Stats Widget */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className={`border p-4 rounded-2xl text-center ${cardBg}`}>
                    <span className={`text-[10px] font-semibold block ${textSub}`}>TODAY'S WEIGHT</span>
                    <span className="text-xl font-extrabold text-emerald-500 block mt-1">
                        {profile?.current_weight_kg || 65} <span className="text-xs font-normal">kg</span>
                    </span>
                    <button
                        onClick={onOpenWeightModal}
                        className="text-[10px] text-emerald-500 hover:underline mt-1 font-semibold"
                    >
                        Update →
                    </button>
                </div>

                <div className={`border p-4 rounded-2xl text-center ${cardBg}`}>
                    <span className={`text-[10px] font-semibold block ${textSub}`}>TARGET WEIGHT</span>
                    <span className="text-xl font-extrabold text-teal-500 block mt-1">
                        {profile?.target_weight_kg || 60} <span className="text-xs font-normal">kg</span>
                    </span>
                    <span className={`text-[10px] block mt-1 ${textSub}`}>4-week projection</span>
                </div>

                <div className={`border p-4 rounded-2xl text-center ${cardBg}`}>
                    <span className={`text-[10px] font-semibold block ${textSub}`}>BMI INDEX</span>
                    <span className="text-xl font-extrabold text-sky-500 block mt-1">{profile?.bmi || 22.5}</span>
                    <span className="text-[10px] text-emerald-500 block mt-1 font-bold">Normal</span>
                </div>

                <div className={`border p-4 rounded-2xl text-center ${cardBg}`}>
                    <span className={`text-[10px] font-semibold block ${textSub}`}>DAILY CALORIE BURN</span>
                    <span className="text-xl font-extrabold text-amber-500 block mt-1">
                        {profile?.tdee || 2200} <span className="text-xs font-normal">kcal</span>
                    </span>
                    <span className={`text-[10px] block mt-1 ${textSub}`}>Maintenance Burn (TDEE)</span>
                </div>
            </div>

            {/* Today's Meals Timeline */}
            <div className={`border rounded-3xl p-5 shadow-xl ${cardBg}`}>
                <div className="flex items-center justify-between mb-4">
                    <h3 className={`font-extrabold text-sm ${textMain}`}>Daily Meal Journal</h3>
                    <span className={`text-xs ${textSub}`}>{todayLogs.length} items recorded</span>
                </div>

                {todayLogs.length === 0 ? (
                    <div className={`text-center py-8 text-xs ${textSub}`}>
                        No meals recorded for today. Tap Add Meal to scan or log your food!
                    </div>
                ) : (
                    <div className="space-y-3">
                        {todayLogs.map((log) => (
                            <div
                                key={log.id}
                                className={`border rounded-2xl p-3.5 flex items-center justify-between transition-all ${isDark
                                        ? "bg-slate-800/60 border-slate-700/60 hover:bg-slate-800"
                                        : "bg-slate-50 border-slate-200 hover:bg-slate-100"
                                    }`}
                            >
                                <div className="flex items-center space-x-3">
                                    <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-500 flex items-center justify-center font-bold text-sm">
                                        {log.meal_type === "breakfast"
                                            ? "🌅"
                                            : log.meal_type === "lunch"
                                                ? "☀️"
                                                : log.meal_type === "dinner"
                                                    ? "🌙"
                                                    : "🍎"}
                                    </div>
                                    <div>
                                        <h4 className={`font-bold text-sm ${textMain}`}>{log.food_name}</h4>
                                        <p className={`text-[11px] ${textSub}`}>
                                            {log.weight_g}g • Protein: {log.protein_g}g • Carbs: {log.carbs_g}g • Fat:{" "}
                                            {log.fat_g}g
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-center space-x-3">
                                    <span className="font-black text-sm text-emerald-500">{log.calories} kcal</span>
                                    <button
                                        onClick={() => handleDeleteLog(log.id)}
                                        className={`p-1.5 rounded-lg transition-colors ${isDark
                                                ? "text-slate-500 hover:text-rose-400 hover:bg-slate-700"
                                                : "text-slate-400 hover:text-rose-600 hover:bg-slate-200"
                                            }`}
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};
