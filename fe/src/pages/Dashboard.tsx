import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import type { User, UserProfile, FoodLog, NutritionSummary, AIRecommendation } from '../types';
import { Sparkles, Flame, Plus, Trash2, ChevronRight } from 'lucide-react';

interface DashboardProps {
  user: User | null;
  profile: UserProfile | null;
  onOpenScanner: () => void;
  onOpenWeightModal: () => void;
  onOpenOnboarding: () => void;
  theme?: 'dark' | 'light';
}

export const Dashboard: React.FC<DashboardProps> = ({
  user,
  profile,
  onOpenScanner,
  onOpenWeightModal,
  onOpenOnboarding,
  theme = 'dark'
}) => {
  const [summary, setSummary] = useState<NutritionSummary | null>(null);
  const [todayLogs, setTodayLogs] = useState<FoodLog[]>([]);
  const [recommendation, setRecommendation] = useState<AIRecommendation | null>(null);

  const userId = user?.user_id || 1;
  const isDark = theme === 'dark';

  const loadDashboardData = async () => {
    const [sumRes, logsRes, recRes] = await Promise.all([
      api.getNutritionSummary(userId),
      api.getFoodLogs(userId),
      api.getAIRecommendations(userId)
    ]);
    setSummary(sumRes);
    setTodayLogs(logsRes);
    setRecommendation(recRes);
  };

  useEffect(() => {
    loadDashboardData();
  }, [userId]);

  const handleDeleteLog = async (logId: number) => {
    await api.deleteFoodLog(logId);
    setTodayLogs((prev) => prev.filter((l) => l.id !== logId));
    loadDashboardData();
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
      <div className={`border rounded-3xl p-5 shadow-xl flex items-center justify-between transition-colors ${
        isDark 
          ? 'bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border-slate-800' 
          : 'bg-gradient-to-r from-emerald-50 via-white to-teal-50 border-slate-200'
      }`}>
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-xs font-bold text-emerald-500 uppercase tracking-wider">Hệ Thống Theo Dõi Sức Khỏe AI</span>
            <span className="bg-emerald-500/20 text-emerald-600 dark:text-emerald-300 text-[10px] px-2 py-0.5 rounded-full font-bold">Real-time</span>
          </div>
          <h2 className="text-xl font-black mt-1">Xin chào, {user?.full_name || 'Bạn'} 👋</h2>
          <p className={`text-xs mt-0.5 ${textSub}`}>
            Mục tiêu: {profile?.goal === 'weight_loss' ? 'Giảm Cân / Siết Mỡ' : profile?.goal === 'muscle_gain' ? 'Tăng Cơ / Tăng Cân' : 'Duy Trì Vóc Dáng'}
          </p>
        </div>
        <button
          onClick={onOpenOnboarding}
          className={`text-xs font-semibold px-3 py-2 rounded-xl border transition-all flex items-center space-x-1 ${
            isDark 
              ? 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700' 
              : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300'
          }`}
        >
          <span>Khảo sát thể trạng</span>
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Primary Hero Calorie Progress Gauge */}
      <div className={`border rounded-3xl p-6 shadow-2xl relative overflow-hidden transition-colors ${cardBg}`}>
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
        
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <Flame className="w-5 h-5 text-amber-500" />
            <h3 className={`font-bold text-sm ${textMain}`}>Tiêu Thụ Calorie Hôm Nay</h3>
          </div>
          <button
            onClick={onOpenScanner}
            className="bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 px-3.5 py-1.5 rounded-xl font-extrabold text-xs shadow-md shadow-emerald-500/20 flex items-center space-x-1 hover:scale-105 transition-all"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>Thêm Bữa Ăn</span>
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
                  {pct}% Mục Tiêu
                </span>
              </div>
            </div>
          </div>

          {/* Quick Metrics Breakdown */}
          <div className="md:col-span-2 space-y-3">
            {/* Protein Bar */}
            <div>
              <div className="flex justify-between text-xs font-semibold mb-1">
                <span className="text-sky-500">Đạm (Protein)</span>
                <span className={textSub}>{summary?.daily.protein_g || 0}g / {summary?.daily.protein_target_g || 120}g</span>
              </div>
              <div className={`w-full h-2.5 rounded-full overflow-hidden ${isDark ? 'bg-slate-800' : 'bg-slate-200'}`}>
                <div
                  className="h-full bg-gradient-to-r from-sky-500 to-blue-400 rounded-full transition-all duration-700"
                  style={{ width: `${Math.min(100, ((summary?.daily.protein_g || 0) / (summary?.daily.protein_target_g || 120)) * 100)}%` }}
                />
              </div>
            </div>

            {/* Carbs Bar */}
            <div>
              <div className="flex justify-between text-xs font-semibold mb-1">
                <span className="text-amber-500">Đường Bột (Carbs)</span>
                <span className={textSub}>{summary?.daily.carbs_g || 0}g / {summary?.daily.carbs_target_g || 200}g</span>
              </div>
              <div className={`w-full h-2.5 rounded-full overflow-hidden ${isDark ? 'bg-slate-800' : 'bg-slate-200'}`}>
                <div
                  className="h-full bg-gradient-to-r from-amber-500 to-yellow-400 rounded-full transition-all duration-700"
                  style={{ width: `${Math.min(100, ((summary?.daily.carbs_g || 0) / (summary?.daily.carbs_target_g || 200)) * 100)}%` }}
                />
              </div>
            </div>

            {/* Fat Bar */}
            <div>
              <div className="flex justify-between text-xs font-semibold mb-1">
                <span className="text-rose-500">Chất Béo (Fat)</span>
                <span className={textSub}>{summary?.daily.fat_g || 0}g / {summary?.daily.fat_target_g || 50}g</span>
              </div>
              <div className={`w-full h-2.5 rounded-full overflow-hidden ${isDark ? 'bg-slate-800' : 'bg-slate-200'}`}>
                <div
                  className="h-full bg-gradient-to-r from-rose-500 to-pink-400 rounded-full transition-all duration-700"
                  style={{ width: `${Math.min(100, ((summary?.daily.fat_g || 0) / (summary?.daily.fat_target_g || 50)) * 100)}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* AI Recommendation Card */}
      {recommendation && (
        <div className={`border rounded-3xl p-5 shadow-xl relative ${
          isDark ? 'bg-slate-900/90 border-emerald-500/30' : 'bg-emerald-50/50 border-emerald-200'
        }`}>
          <div className="flex items-center space-x-2 mb-2">
            <div className="w-7 h-7 rounded-xl bg-emerald-500/20 text-emerald-500 flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
            <h3 className="font-extrabold text-sm text-emerald-500">Gợi Ý Thực Đơn Tự Động Từ AI</h3>
          </div>
          <p className={`text-xs leading-relaxed mb-3 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>{recommendation.advice}</p>

          {recommendation.suggested_meals && recommendation.suggested_meals.length > 0 && (
            <div className="space-y-2">
              {recommendation.suggested_meals.map((item, idx) => (
                <div key={idx} className={`p-3 rounded-2xl border flex items-center justify-between text-xs ${
                  isDark ? 'bg-slate-800/60 border-slate-800' : 'bg-white border-slate-200'
                }`}>
                  <div>
                    <span className="font-bold text-emerald-500">{item.meal}: </span>
                    <span className={isDark ? 'text-slate-200' : 'text-slate-800'}>{item.suggestion}</span>
                  </div>
                  <span className={`font-bold text-[11px] px-2 py-1 rounded-lg ${
                    isDark ? 'bg-slate-900 text-slate-400' : 'bg-slate-100 text-slate-600'
                  }`}>
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
          <span className={`text-[10px] font-semibold block ${textSub}`}>CÂN NẶNG HÔM NAY</span>
          <span className="text-xl font-extrabold text-emerald-500 block mt-1">{profile?.current_weight_kg || 65} <span className="text-xs font-normal">kg</span></span>
          <button onClick={onOpenWeightModal} className="text-[10px] text-emerald-500 hover:underline mt-1 font-semibold">Cập nhật →</button>
        </div>

        <div className={`border p-4 rounded-2xl text-center ${cardBg}`}>
          <span className={`text-[10px] font-semibold block ${textSub}`}>MỤC TIÊU</span>
          <span className="text-xl font-extrabold text-teal-500 block mt-1">{profile?.target_weight_kg || 60} <span className="text-xs font-normal">kg</span></span>
          <span className={`text-[10px] block mt-1 ${textSub}`}>Dự kiến 4 tuần</span>
        </div>

        <div className={`border p-4 rounded-2xl text-center ${cardBg}`}>
          <span className={`text-[10px] font-semibold block ${textSub}`}>CHỈ SỐ BMI</span>
          <span className="text-xl font-extrabold text-sky-500 block mt-1">{profile?.bmi || 22.5}</span>
          <span className="text-[10px] text-emerald-500 block mt-1 font-bold">Bình Thường</span>
        </div>

        <div className={`border p-4 rounded-2xl text-center ${cardBg}`}>
          <span className={`text-[10px] font-semibold block ${textSub}`}>NĂNG LƯỢNG TDEE</span>
          <span className="text-xl font-extrabold text-amber-500 block mt-1">{profile?.tdee || 2200} <span className="text-xs font-normal">kcal</span></span>
          <span className={`text-[10px] block mt-1 ${textSub}`}>Mức duy trì</span>
        </div>
      </div>

      {/* Today's Meals Timeline */}
      <div className={`border rounded-3xl p-5 shadow-xl ${cardBg}`}>
        <div className="flex items-center justify-between mb-4">
          <h3 className={`font-extrabold text-sm ${textMain}`}>Nhật Ký Bữa Ăn Trong Ngày</h3>
          <span className={`text-xs ${textSub}`}>{todayLogs.length} món đã ghi nhận</span>
        </div>

        {todayLogs.length === 0 ? (
          <div className={`text-center py-8 text-xs ${textSub}`}>
            Chưa có bữa ăn nào được ghi nhận hôm nay. Bấm nút Quét / Thêm Bữa Ăn để khởi tạo!
          </div>
        ) : (
          <div className="space-y-3">
            {todayLogs.map((log) => (
              <div
                key={log.id}
                className={`border rounded-2xl p-3.5 flex items-center justify-between transition-all ${
                  isDark ? 'bg-slate-800/60 border-slate-700/60 hover:bg-slate-800' : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-500 flex items-center justify-center font-bold text-sm">
                    {log.meal_type === 'breakfast' ? '🌅' : log.meal_type === 'lunch' ? '☀️' : log.meal_type === 'dinner' ? '🌙' : '🍎'}
                  </div>
                  <div>
                    <h4 className={`font-bold text-sm ${textMain}`}>{log.food_name}</h4>
                    <p className={`text-[11px] ${textSub}`}>
                      {log.weight_g}g • Protein: {log.protein_g}g • Carbs: {log.carbs_g}g • Fat: {log.fat_g}g
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <span className="font-black text-sm text-emerald-500">{log.calories} kcal</span>
                  <button
                    onClick={() => handleDeleteLog(log.id)}
                    className={`p-1.5 rounded-lg transition-colors ${
                      isDark ? 'text-slate-500 hover:text-rose-400 hover:bg-slate-700' : 'text-slate-400 hover:text-rose-600 hover:bg-slate-200'
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
