import React, { useState } from 'react';
import type { User, UserProfile, DailyMealPlan } from '../types';
import { Sparkles, Flame, Plus, Trash2, Crown, Lock, RefreshCw, X, Utensils } from 'lucide-react';
import { useToast } from '../components/Toast';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { useModal } from '../contexts/ModalContext';
import { useData } from '../contexts/DataContext';
import { useDashboardData } from '../hooks/useDashboardData';
import { api } from '../services/api';

interface DashboardProps {
  user?: User | null;
  profile?: UserProfile | null;
  onOpenAuth?: () => void;
  onOpenScanner?: () => void;
  onOpenWeightModal?: () => void;
  onOpenOnboarding?: () => void;
  onOpenSubscription?: () => void;
  onOpenRAGMealPlan?: () => void;
  theme?: 'dark' | 'light';
  refreshKey?: number;
}

export const Dashboard: React.FC<DashboardProps> = ({
  user: propUser,
  profile: propProfile,
  onOpenAuth: propOnOpenAuth,
  onOpenScanner: propOnOpenScanner,
  onOpenWeightModal: propOnOpenWeightModal,
  onOpenOnboarding: propOnOpenOnboarding,
  onOpenSubscription: propOnOpenSubscription,
  onOpenRAGMealPlan: propOnOpenRAGMealPlan,
  theme: propTheme,
}) => {
  const auth = useAuth();
  const themeContext = useTheme();
  const modal = useModal();
  const { invalidateData } = useData();
  const toast = useToast();

  const user = propUser !== undefined ? propUser : auth.user;
  const profile = propProfile !== undefined ? propProfile : auth.profile;
  const isDark = propTheme !== undefined ? propTheme === 'dark' : themeContext.isDark;

  const onOpenAuth = propOnOpenAuth || (() => modal.openModal('AUTH'));
  const onOpenScanner = propOnOpenScanner || (() => modal.openModal('FOOD_SCANNER'));
  const onOpenWeightModal = propOnOpenWeightModal || (() => modal.openModal('WEIGHT_LOG'));
  const onOpenOnboarding = propOnOpenOnboarding || (() => modal.openModal('ONBOARDING'));
  const onOpenSubscription = propOnOpenSubscription || (() => modal.openModal('SUBSCRIPTION'));
  const onOpenRAGMealPlan = propOnOpenRAGMealPlan || (() => modal.openModal('RAG_MEAL_PLAN'));

  const {
    summary,
    todayLogs,
    allLogs,
    recommendation,
    proMealPlan,
    refreshingProPlan,
    deleteLog,
    refreshProPlan,
  } = useDashboardData(user);

  const [selectedMeal, setSelectedMeal] = useState<DailyMealPlan['meals'][0] | null>(null);
  const [loggingIndex, setLoggingIndex] = useState<number | null>(null);
  const [journalView, setJournalView] = useState<'today' | 'all'>('today');

  const isProOrAdmin = user?.role === 'admin' || user?.plan === 'pro';

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
    try {
      await refreshProPlan();
      toast.success('AI meal plan recommendations updated!', 'Meal Plan Refreshed');
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : 'Connection error while loading new meal recommendations.';
      toast.error(errMsg, 'AI Meal Plan Error');
    }
  };

  const handleQuickLogMeal = async (
    m: DailyMealPlan['meals'][0],
    idx: number = -1,
    e?: React.MouseEvent
  ) => {
    if (e) e.stopPropagation();
    if (!user?.user_id) return;
    setLoggingIndex(idx);
    try {
      await api.createFoodLog(user.user_id, {
        meal_type: (m.meal_type as 'breakfast' | 'lunch' | 'dinner' | 'snack') || 'lunch',
        food_name: m.name,
        weight_g: 350,
        calories: m.calories,
        protein_g: m.protein_g || 25,
        carbs_g: m.carbs_g || 40,
        fat_g: m.fat_g || 12,
      });
      invalidateData('dashboard');
      invalidateData('history');
      toast.success(`Logged "${m.name}" (+${m.calories} kcal) into your Daily Meal Journal!`, 'Meal Logged');
      setSelectedMeal(null);
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : 'Failed to log meal.';
      toast.error(errMsg, 'Logging Error');
    } finally {
      setLoggingIndex(null);
    }
  };

  const consumed = summary?.daily.consumed_calories || 0;
  const target = profile?.daily_calorie_target || summary?.daily.target_calories || 2000;
  const pct = Math.min(100, Math.round((consumed / target) * 100));

  const cardBg = isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200';
  const textMain = isDark ? 'text-white' : 'text-slate-900';
  const textSub = isDark ? 'text-slate-400' : 'text-slate-500';

  return (
    <div className={`space-y-6 pb-24 max-w-4xl mx-auto px-4 pt-4 ${textMain}`}>
      {/* Top Banner / Welcome */}
      <div
        className={`border rounded-3xl p-5 shadow-xl flex items-center justify-between transition-colors ${
          isDark
            ? 'bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border-slate-800'
            : 'bg-gradient-to-r from-emerald-50 via-white to-teal-50 border-slate-200'
        }`}
      >
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-xs font-bold text-emerald-500 uppercase tracking-wider">
              AI Health Tracking System
            </span>
            <span
              className={`text-[10px] px-2.5 py-0.5 rounded-full font-extrabold uppercase ${
                user?.role === 'admin'
                  ? 'bg-amber-500/20 text-amber-400'
                  : user?.plan === 'pro'
                  ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30'
                  : user?.plan === 'plus'
                  ? 'bg-emerald-500/20 text-emerald-400'
                  : 'bg-slate-700 text-slate-300'
              }`}
            >
              Tier: {user?.role === 'admin' ? 'ADMIN' : user?.plan || 'STANDARD'}
            </span>
          </div>
          <h2 className="text-xl font-black mt-1">Welcome back, {user?.full_name || 'User'} 👋</h2>
          <p className={`text-xs mt-0.5 ${textSub}`}>
            Goal:{' '}
            {profile?.goal === 'weight_loss'
              ? 'Weight Loss / Cut'
              : profile?.goal === 'muscle_gain'
              ? 'Muscle Gain / Bulk'
              : 'Maintain Fitness'}
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
          <div className="border rounded-3xl p-6 shadow-2xl relative overflow-hidden bg-gradient-to-br from-indigo-950/40 via-slate-900 to-slate-900 border-indigo-500/40">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold">
                  <Crown className="w-5 h-5 text-indigo-400 fill-indigo-400" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-indigo-300">{proMealPlan.title}</h3>
                  <p className="text-[11px] text-slate-400">
                    Tailored to your daily goal ({proMealPlan.target_daily_calories} kcal) • Click any meal to view details or log
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
                  <RefreshCw className={`w-3.5 h-3.5 ${refreshingProPlan ? 'animate-spin' : ''}`} />
                  <span>{refreshingProPlan ? 'Creating...' : 'Create New'}</span>
                </button>
                <button
                  onClick={onOpenRAGMealPlan}
                  className="text-xs font-bold text-amber-400 bg-amber-500/20 hover:bg-amber-500 hover:text-slate-950 border border-amber-500/40 px-3.5 py-1.5 rounded-xl transition flex items-center space-x-1 shadow-sm"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>AI Meal Planner →</span>
                </button>
              </div>
            </div>

            {/* Clickable AI Recommended Meals Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-1">
              {proMealPlan.meals.map((m, idx) => (
                <div
                  key={idx}
                  onClick={() => setSelectedMeal(m)}
                  className="p-4 rounded-2xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 hover:border-indigo-500/60 transition-all cursor-pointer shadow-md group relative flex flex-col justify-between"
                  title="Click to view full meal details or log into journal"
                >
                  <div>
                    <div className="flex justify-between items-center mb-1.5">
                      <span className="font-bold text-xs text-indigo-300 uppercase tracking-wider">{m.meal_label}</span>
                      <span className="text-xs font-black text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-lg border border-emerald-500/20">
                        {m.calories} kcal
                      </span>
                    </div>
                    <h4 className="font-extrabold text-sm text-white group-hover:text-indigo-300 transition-colors">
                      {m.name}
                    </h4>
                    <p className="text-[11px] text-slate-400 mt-1">{m.portion}</p>
                    <p className="text-[10px] text-indigo-200/90 italic mt-2 bg-indigo-950/50 p-2 rounded-xl border border-indigo-800/30">
                      💡 {m.advice}
                    </p>
                  </div>

                  <div className="mt-3 pt-2.5 border-t border-slate-700/60 flex items-center justify-between">
                    <span className="text-[10px] font-semibold text-slate-400 group-hover:text-indigo-300 transition-colors">
                      View macros →
                    </span>
                    <button
                      type="button"
                      onClick={(e) => handleQuickLogMeal(m, idx, e)}
                      disabled={loggingIndex === idx}
                      className="text-[11px] font-bold text-slate-950 bg-emerald-400 hover:bg-emerald-300 px-3 py-1.5 rounded-xl transition flex items-center space-x-1 shadow-sm active:scale-95 shrink-0"
                      title="Quick log this meal into your journal"
                    >
                      <Plus className={`w-3.5 h-3.5 ${loggingIndex === idx ? 'animate-spin' : ''}`} />
                      <span>{loggingIndex === idx ? 'Logging...' : 'Log Meal'}</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="border rounded-3xl p-5 shadow-xl bg-slate-900/90 border-indigo-500/30 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <RefreshCw className="w-5 h-5 text-indigo-400 animate-spin" />
              <div>
                <h3 className="font-extrabold text-sm text-indigo-200">👑 Generating Pro AI Meal Plan...</h3>
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
                Upgrade to Pro tier (~$2/mo) to unlock custom meal plans for Breakfast, Lunch, Dinner, & Snack tailored to
                your daily calorie burn & fitness goals.
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

      {/* Selected Meal Details Modal */}
      {selectedMeal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
          <div className="bg-slate-900 border border-indigo-500/40 rounded-3xl w-full max-w-md p-6 shadow-2xl text-white space-y-4 relative">
            <button
              onClick={() => setSelectedMeal(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-2 rounded-full hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center space-x-2">
              <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                {selectedMeal.meal_label}
              </span>
              <span className="text-xs font-black text-emerald-400">
                {selectedMeal.calories} kcal
              </span>
            </div>

            <h3 className="text-lg font-extrabold text-white">{selectedMeal.name}</h3>
            <p className="text-xs text-slate-300 bg-slate-800/80 p-3 rounded-2xl border border-slate-700/60">
              📏 <strong className="text-slate-200">Recommended Portion:</strong> {selectedMeal.portion}
            </p>

            {/* Macros Breakdown */}
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="p-3 bg-sky-500/10 border border-sky-500/20 rounded-2xl">
                <span className="text-[10px] font-bold text-sky-400 uppercase block">Protein</span>
                <span className="text-base font-black text-sky-400">{selectedMeal.protein_g}g</span>
              </div>
              <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-2xl">
                <span className="text-[10px] font-bold text-amber-400 uppercase block">Carbs</span>
                <span className="text-base font-black text-amber-400">{selectedMeal.carbs_g}g</span>
              </div>
              <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-2xl">
                <span className="text-[10px] font-bold text-rose-400 uppercase block">Fat</span>
                <span className="text-base font-black text-rose-400">{selectedMeal.fat_g}g</span>
              </div>
            </div>

            {/* AI Advice */}
            <div className="bg-indigo-950/40 p-3.5 rounded-2xl border border-indigo-800/40 text-xs text-indigo-200/90 leading-relaxed">
              💡 <strong className="text-indigo-200">AI Nutritionist Note:</strong> {selectedMeal.advice}
            </div>

            {/* Action Buttons */}
            <div className="flex space-x-2 pt-2">
              <button
                type="button"
                onClick={() => handleQuickLogMeal(selectedMeal)}
                disabled={loggingIndex === -1}
                className="flex-1 py-3 bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 font-black text-xs rounded-xl shadow-lg shadow-emerald-500/20 hover:opacity-95 transition flex items-center justify-center space-x-1.5"
              >
                <Plus className="w-4 h-4 stroke-[3]" />
                <span>Log to Daily Meal Journal (+{selectedMeal.calories} kcal)</span>
              </button>
            </div>
          </div>
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
                  className={isDark ? 'text-slate-800 fill-none' : 'text-slate-200 fill-none'}
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
              <div className={`w-full h-2.5 rounded-full overflow-hidden ${isDark ? 'bg-slate-800' : 'bg-slate-200'}`}>
                <div
                  className="h-full bg-gradient-to-r from-sky-500 to-blue-400 rounded-full transition-all duration-700"
                  style={{
                    width: `${Math.min(
                      100,
                      ((summary?.daily.protein_g || 0) / (summary?.daily.protein_target_g || 120)) * 100
                    )}%`,
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
              <div className={`w-full h-2.5 rounded-full overflow-hidden ${isDark ? 'bg-slate-800' : 'bg-slate-200'}`}>
                <div
                  className="h-full bg-gradient-to-r from-amber-500 to-yellow-400 rounded-full transition-all duration-700"
                  style={{
                    width: `${Math.min(
                      100,
                      ((summary?.daily.carbs_g || 0) / (summary?.daily.carbs_target_g || 200)) * 100
                    )}%`,
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
              <div className={`w-full h-2.5 rounded-full overflow-hidden ${isDark ? 'bg-slate-800' : 'bg-slate-200'}`}>
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
          className={`border rounded-3xl p-5 shadow-xl relative ${
            isDark ? 'bg-slate-900/90 border-emerald-500/30' : 'bg-emerald-50/50 border-emerald-200'
          }`}
        >
          <div className="flex items-center space-x-2 mb-2">
            <div className="w-7 h-7 rounded-xl bg-emerald-500/20 text-emerald-500 flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
            <h3 className="font-extrabold text-sm text-emerald-500">AI Diet Recommendations</h3>
          </div>
          <p className={`text-xs leading-relaxed mb-3 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
            {recommendation.advice}
          </p>

          {recommendation.suggested_meals && recommendation.suggested_meals.length > 0 && (
            <div className="space-y-2">
              {recommendation.suggested_meals.map((item, idx) => (
                <div
                  key={idx}
                  className={`p-3 rounded-2xl border flex items-center justify-between text-xs ${
                    isDark ? 'bg-slate-800/60 border-slate-800' : 'bg-white border-slate-200'
                  }`}
                >
                  <div>
                    <span className="font-bold text-emerald-500">{item.meal}: </span>
                    <span className={isDark ? 'text-slate-200' : 'text-slate-800'}>{item.suggestion}</span>
                  </div>
                  <span
                    className={`font-bold text-[11px] px-2 py-1 rounded-lg ${
                      isDark ? 'bg-slate-900 text-slate-400' : 'bg-slate-100 text-slate-600'
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

      {/* Daily Meal Journal (Today's Meals Timeline) */}
      <div className={`border rounded-3xl p-5 shadow-xl ${cardBg}`}>
        <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
          <div className="flex items-center space-x-2">
            <Utensils className="w-5 h-5 text-emerald-500" />
            <div>
              <div className="flex items-center space-x-2">
                <h3 className={`font-extrabold text-sm ${textMain}`}>Daily Meal Journal</h3>
                <span className="text-[10px] bg-emerald-500/10 text-emerald-400 font-bold px-2 py-0.5 rounded-full border border-emerald-500/20">
                  {journalView === 'today' ? "Today's Intake" : 'All Past Meals'}
                </span>
              </div>
              <p className={`text-[11px] ${textSub}`}>
                {journalView === 'today'
                  ? `Meals consumed today • ${todayLogs.length} items logged`
                  : `Showing all recorded meals • ${allLogs.length} total items`}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {/* View toggle if user has logs from previous days */}
            {allLogs.length > 0 && allLogs.length !== todayLogs.length && (
              <div className={`flex border p-0.5 rounded-xl ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-slate-100 border-slate-200'}`}>
                <button
                  type="button"
                  onClick={() => setJournalView('today')}
                  className={`px-2.5 py-1 text-[11px] font-bold rounded-lg transition ${
                    journalView === 'today'
                      ? 'bg-emerald-500 text-slate-950 shadow-sm'
                      : textSub
                  }`}
                >
                  Today ({todayLogs.length})
                </button>
                <button
                  type="button"
                  onClick={() => setJournalView('all')}
                  className={`px-2.5 py-1 text-[11px] font-bold rounded-lg transition ${
                    journalView === 'all'
                      ? 'bg-emerald-500 text-slate-950 shadow-sm'
                      : textSub
                  }`}
                >
                  All Past ({allLogs.length})
                </button>
              </div>
            )}

            <button
              onClick={onOpenScanner}
              className="text-xs font-bold text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 px-3 py-1.5 rounded-xl border border-emerald-500/30 transition flex items-center space-x-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Meal</span>
            </button>
          </div>
        </div>

        {(journalView === 'today' ? todayLogs : allLogs).length === 0 ? (
          <div className={`text-center py-8 text-xs ${textSub} space-y-2`}>
            <div className="w-12 h-12 rounded-2xl bg-slate-800/80 text-slate-500 flex items-center justify-center mx-auto mb-2">
              <Utensils className="w-6 h-6" />
            </div>
            <p className="font-bold text-slate-300">
              {journalView === 'today' ? 'No meals recorded for today yet.' : 'No meal records found in your journal.'}
            </p>
            <p className="text-[11px] text-slate-500 max-w-sm mx-auto">
              Scan a photo of your food, enter a description, or click <strong>Log Meal</strong> in the AI Recommended Meal Plan above!
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {(journalView === 'today' ? todayLogs : allLogs).map((log) => (
              <div
                key={log.id}
                className={`border rounded-2xl p-3.5 flex items-center justify-between transition-all ${
                  isDark
                    ? 'bg-slate-800/60 border-slate-700/60 hover:bg-slate-800'
                    : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-500 flex items-center justify-center font-bold text-sm">
                    {log.meal_type === 'breakfast'
                      ? '🌅'
                      : log.meal_type === 'lunch'
                      ? '☀️'
                      : log.meal_type === 'dinner'
                      ? '🌙'
                      : '🍎'}
                  </div>
                  <div>
                    <h4 className={`font-bold text-sm ${textMain}`}>{log.food_name}</h4>
                    <p className={`text-[11px] ${textSub}`}>
                      {log.weight_g}g • Protein: {log.protein_g}g • Carbs: {log.carbs_g}g • Fat: {log.fat_g}g
                    </p>
                    {journalView === 'all' && (
                      <span className="text-[10px] text-slate-400">
                        {new Date(log.logged_at).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                        })}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <span className="font-black text-sm text-emerald-500">{log.calories} kcal</span>
                  <button
                    onClick={() => deleteLog(log.id)}
                    className={`p-1.5 rounded-lg transition-colors ${
                      isDark
                        ? 'text-slate-500 hover:text-rose-400 hover:bg-slate-700'
                        : 'text-slate-400 hover:text-rose-600 hover:bg-slate-200'
                    }`}
                    title="Delete log"
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
