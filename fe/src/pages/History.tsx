import React, { useState, useEffect, useMemo } from 'react';
import { api } from '../services/api';
import type { NutritionSummary, WeightLog, FoodLog } from '../types';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  LineChart,
  Line,
  CartesianGrid,
} from 'recharts';
import { Scale, BarChart2, Utensils, Calendar, Trash2, Plus } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { useData } from '../contexts/DataContext';
import { useModal } from '../contexts/ModalContext';
import { useToast } from '../components/Toast';

interface HistoryProps {
  userId?: number;
  theme?: 'dark' | 'light';
}

export const History: React.FC<HistoryProps> = ({ userId: propUserId, theme: propTheme }) => {
  const auth = useAuth();
  const themeContext = useTheme();
  const { dataVersion, invalidateData } = useData();
  const modal = useModal();
  const toast = useToast();

  const userId = propUserId !== undefined ? propUserId : auth.user?.user_id || 0;
  const isDark = propTheme !== undefined ? propTheme === 'dark' : themeContext.isDark;

  const [filterPeriod, setFilterPeriod] = useState<'daily' | 'weekly' | 'monthly'>('weekly');
  const [summary, setSummary] = useState<NutritionSummary | null>(null);
  const [weightLogs, setWeightLogs] = useState<WeightLog[]>([]);
  const [foodLogs, setFoodLogs] = useState<FoodLog[]>([]);
  const [activeLogTab, setActiveLogTab] = useState<'meals' | 'weights'>('meals');

  useEffect(() => {
    async function loadData() {
      if (!userId) return;
      try {
        const [sumRes, weightRes, foodRes] = await Promise.all([
          api.getNutritionSummary(userId),
          api.getWeightHistory(userId),
          api.getFoodLogs(userId),
        ]);
        setSummary(sumRes);
        setWeightLogs(weightRes);
        setFoodLogs(foodRes);
      } catch (err) {
        console.warn('History load notice:', err);
      }
    }
    loadData();
  }, [userId, dataVersion]);

  const targetDailyCalories = summary?.daily.target_calories || auth.profile?.daily_calorie_target || 2000;

  // Filter logs for today
  const todayLogs = useMemo(() => {
    const now = new Date();
    return foodLogs.filter((log) => {
      const logDate = new Date(log.logged_at);
      return (
        logDate.getFullYear() === now.getFullYear() &&
        logDate.getMonth() === now.getMonth() &&
        logDate.getDate() === now.getDate()
      );
    });
  }, [foodLogs]);

  // Daily Meal Calorie Distribution (Breakfast, Lunch, Dinner, Snacks)
  const dailyMealChartData = useMemo(() => {
    const mealTotals = {
      breakfast: 0,
      lunch: 0,
      dinner: 0,
      snack: 0,
    };

    todayLogs.forEach((log) => {
      const type = log.meal_type?.toLowerCase() as keyof typeof mealTotals;
      if (mealTotals[type] !== undefined) {
        mealTotals[type] += log.calories;
      } else {
        mealTotals.snack += log.calories;
      }
    });

    return [
      {
        meal: 'Breakfast',
        calories: Math.round(mealTotals.breakfast),
        target: Math.round(targetDailyCalories * 0.25),
      },
      {
        meal: 'Lunch',
        calories: Math.round(mealTotals.lunch),
        target: Math.round(targetDailyCalories * 0.35),
      },
      {
        meal: 'Dinner',
        calories: Math.round(mealTotals.dinner),
        target: Math.round(targetDailyCalories * 0.30),
      },
      {
        meal: 'Snacks',
        calories: Math.round(mealTotals.snack),
        target: Math.round(targetDailyCalories * 0.10),
      },
    ];
  }, [todayLogs, targetDailyCalories]);

  // Formatted Weight Progression Chart Data
  const weightChartData = useMemo(() => {
    if (weightLogs && weightLogs.length > 0) {
      return [...weightLogs]
        .sort((a, b) => new Date(a.recorded_at).getTime() - new Date(b.recorded_at).getTime())
        .map((log) => ({
          label: new Date(log.recorded_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          weight: log.weight_kg,
        }));
    }
    // Fallback to monthly estimates if no real weight records yet
    return (summary?.monthly_chart || []).map((w) => ({
      label: w.week,
      weight: w.avg_weight,
    }));
  }, [weightLogs, summary]);

  const handleDeleteFoodLog = async (logId: number) => {
    try {
      await api.deleteFoodLog(logId);
      setFoodLogs((prev) => prev.filter((l) => l.id !== logId));
      invalidateData('dashboard');
      invalidateData('history');
      toast.success('Food log removed from history.', 'Log Deleted');
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : 'Failed to delete food log.';
      toast.error(errMsg, 'Delete Error');
    }
  };

  const cardBg = isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200';
  const textMain = isDark ? 'text-white' : 'text-slate-900';
  const textSub = isDark ? 'text-slate-400' : 'text-slate-500';

  if (!userId) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
          <BarChart2 className="w-8 h-8" />
        </div>
        <h3 className="text-xl font-bold text-slate-900 dark:text-white">Health Tracking History</h3>
        <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
          Please sign in to view your caloric intake charts, meal history, and body weight progression.
        </p>
        <button
          onClick={() => modal.openModal('AUTH')}
          className="mt-2 px-6 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-xl shadow-lg transition"
        >
          🔑 Sign In to View History
        </button>
      </div>
    );
  }

  const displayedMealLogs = filterPeriod === 'daily' ? todayLogs : foodLogs;

  return (
    <div className={`space-y-6 pb-24 max-w-4xl mx-auto px-4 pt-4 ${textMain}`}>
      {/* Header & Filter Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className={`text-xl font-black ${textMain}`}>History & AI Progress Analytics</h2>
          <p className={`text-xs ${textSub}`}>Caloric intake trends & body weight fluctuation analysis</p>
        </div>

        {/* Time Period Filter Tabs */}
        <div className={`flex border p-1 rounded-2xl self-start sm:self-auto ${
          isDark ? 'bg-slate-900 border-slate-800' : 'bg-slate-100 border-slate-200'
        }`}>
          {(['daily', 'weekly', 'monthly'] as const).map((period) => (
            <button
              key={period}
              onClick={() => setFilterPeriod(period)}
              className={`px-3.5 py-1.5 text-xs font-bold rounded-xl transition-all ${
                filterPeriod === period
                  ? 'bg-emerald-500 text-slate-950 shadow-md scale-105'
                  : `${textSub} hover:${textMain}`
              }`}
            >
              {period === 'daily' ? 'Daily' : period === 'weekly' ? 'Weekly' : 'Monthly'}
            </button>
          ))}
        </div>
      </div>

      {/* Main Calorie Intake Chart Card */}
      <div className={`border rounded-3xl p-5 shadow-2xl space-y-4 ${cardBg}`}>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center space-x-2">
            <BarChart2 className="w-5 h-5 text-emerald-500" />
            <div>
              <h3 className={`font-extrabold text-sm ${textMain}`}>
                {filterPeriod === 'daily' && "Today's Calorie Intake by Meal Category"}
                {filterPeriod === 'weekly' && '7-Day Caloric Intake Trends (Last 7 Days)'}
                {filterPeriod === 'monthly' && '4-Week Average Caloric Fluctuation'}
              </h3>
              <p className={`text-[11px] ${textSub}`}>
                {filterPeriod === 'daily' && 'Distribution across Breakfast, Lunch, Dinner & Snacks'}
                {filterPeriod === 'weekly' && 'Daily intake compared to daily target guideline'}
                {filterPeriod === 'monthly' && 'Weekly average calories across the last 4 weeks'}
              </p>
            </div>
          </div>
          <span className="text-[11px] font-semibold text-emerald-500 bg-emerald-500/10 px-2.5 py-1 rounded-full">
            Target: {targetDailyCalories} kcal/day
          </span>
        </div>

        {/* Render Chart based on filterPeriod */}
        <div className="h-64 w-full pt-2">
          {filterPeriod === 'daily' && (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={dailyMealChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#1e293b' : '#f1f5f9'} />
                <XAxis dataKey="meal" stroke={isDark ? '#64748b' : '#94a3b8'} fontSize={11} tickLine={false} />
                <YAxis stroke={isDark ? '#64748b' : '#94a3b8'} fontSize={11} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: isDark ? '#0f172a' : '#ffffff',
                    borderColor: isDark ? '#334155' : '#e2e8f0',
                    borderRadius: '12px',
                    color: isDark ? '#ffffff' : '#0f172a',
                    boxShadow: '0 10px 15px -3px rgba(0,0,0,0.2)',
                  }}
                  formatter={(val: unknown) => [`${val} kcal`, 'Calories']}
                />
                <Bar dataKey="calories" fill="#10b981" radius={[8, 8, 0, 0]} name="Consumed" />
                <Bar dataKey="target" fill="#64748b" opacity={0.25} radius={[8, 8, 0, 0]} name="Target Guideline" />
              </BarChart>
            </ResponsiveContainer>
          )}

          {filterPeriod === 'weekly' && (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={summary?.weekly_chart || []}>
                <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#1e293b' : '#f1f5f9'} />
                <XAxis dataKey="day" stroke={isDark ? '#64748b' : '#94a3b8'} fontSize={11} tickLine={false} />
                <YAxis stroke={isDark ? '#64748b' : '#94a3b8'} fontSize={11} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: isDark ? '#0f172a' : '#ffffff',
                    borderColor: isDark ? '#334155' : '#e2e8f0',
                    borderRadius: '12px',
                    color: isDark ? '#ffffff' : '#0f172a',
                    boxShadow: '0 10px 15px -3px rgba(0,0,0,0.2)',
                  }}
                  formatter={(val: unknown) => [`${val} kcal`, 'Calories']}
                />
                <ReferenceLine y={targetDailyCalories} stroke="#ef4444" strokeDasharray="3 3" />
                <Bar dataKey="calories" fill="#10b981" radius={[8, 8, 0, 0]} name="Calories" />
              </BarChart>
            </ResponsiveContainer>
          )}

          {filterPeriod === 'monthly' && (
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={summary?.monthly_chart || []}>
                <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#1e293b' : '#f1f5f9'} />
                <XAxis dataKey="week" stroke={isDark ? '#64748b' : '#94a3b8'} fontSize={11} />
                <YAxis stroke={isDark ? '#64748b' : '#94a3b8'} fontSize={11} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: isDark ? '#0f172a' : '#ffffff',
                    borderColor: isDark ? '#334155' : '#e2e8f0',
                    borderRadius: '12px',
                    color: isDark ? '#ffffff' : '#0f172a',
                    boxShadow: '0 10px 15px -3px rgba(0,0,0,0.2)',
                  }}
                  formatter={(val: unknown) => [`${val} kcal`, 'Avg Calories']}
                />
                <ReferenceLine y={targetDailyCalories} stroke="#ef4444" strokeDasharray="3 3" />
                <Line
                  type="monotone"
                  dataKey="avg_calories"
                  stroke="#10b981"
                  strokeWidth={3}
                  dot={{ r: 5, fill: '#10b981' }}
                  name="Avg Calories"
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Body Weight Progression Chart */}
      <div className={`border rounded-3xl p-5 shadow-2xl space-y-4 ${cardBg}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Scale className="w-5 h-5 text-teal-500" />
            <div>
              <h3 className={`font-extrabold text-sm ${textMain}`}>Body Weight Progression (kg)</h3>
              <p className={`text-[11px] ${textSub}`}>Historical recorded body weight trend</p>
            </div>
          </div>
          <button
            onClick={() => modal.openModal('WEIGHT_LOG')}
            className="text-xs font-bold text-teal-400 bg-teal-500/10 hover:bg-teal-500/20 px-3 py-1.5 rounded-xl border border-teal-500/30 transition flex items-center space-x-1"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Record Weight</span>
          </button>
        </div>

        <div className="h-56 w-full pt-1">
          {weightChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={weightChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#1e293b' : '#f1f5f9'} />
                <XAxis dataKey="label" stroke={isDark ? '#64748b' : '#94a3b8'} fontSize={11} />
                <YAxis domain={['dataMin - 1', 'dataMax + 1']} stroke={isDark ? '#64748b' : '#94a3b8'} fontSize={11} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: isDark ? '#0f172a' : '#ffffff',
                    borderColor: isDark ? '#334155' : '#e2e8f0',
                    borderRadius: '12px',
                    color: isDark ? '#ffffff' : '#0f172a',
                    boxShadow: '0 10px 15px -3px rgba(0,0,0,0.2)',
                  }}
                  formatter={(val: unknown) => [`${val} kg`, 'Weight']}
                />
                <Line
                  type="monotone"
                  dataKey="weight"
                  stroke="#14b8a6"
                  strokeWidth={3}
                  dot={{ r: 5, fill: '#14b8a6' }}
                  name="Weight"
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center text-xs text-slate-500">
              <Scale className="w-6 h-6 mb-2 opacity-50" />
              <span>No weight entries recorded yet. Click "Record Weight" to log your first weight!</span>
            </div>
          )}
        </div>
      </div>

      {/* Log History Records Section: Toggle Between Meals and Weights */}
      <div className={`border rounded-3xl p-5 shadow-xl ${cardBg}`}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setActiveLogTab('meals')}
              className={`px-3 py-1.5 text-xs font-bold rounded-xl transition flex items-center space-x-1.5 ${
                activeLogTab === 'meals'
                  ? 'bg-emerald-500 text-slate-950 font-black shadow-md'
                  : `${textSub} hover:${textMain}`
              }`}
            >
              <Utensils className="w-3.5 h-3.5" />
              <span>
                {filterPeriod === 'daily' ? `Today's Meals (${displayedMealLogs.length})` : `Meal History (${displayedMealLogs.length})`}
              </span>
            </button>
            <button
              onClick={() => setActiveLogTab('weights')}
              className={`px-3 py-1.5 text-xs font-bold rounded-xl transition flex items-center space-x-1.5 ${
                activeLogTab === 'weights'
                  ? 'bg-teal-500 text-slate-950 font-black shadow-md'
                  : `${textSub} hover:${textMain}`
              }`}
            >
              <Scale className="w-3.5 h-3.5" />
              <span>Weight Records ({weightLogs.length})</span>
            </button>
          </div>
        </div>

        {/* Meal Logs Tab Content */}
        {activeLogTab === 'meals' && (
          <div className="space-y-2.5">
            {displayedMealLogs.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-500">
                {filterPeriod === 'daily'
                  ? 'No meals logged today yet. Use the camera or manual entry to log a meal!'
                  : 'No meal records found in your history.'}
              </div>
            ) : (
              displayedMealLogs.map((log) => (
                <div
                  key={log.id}
                  className={`p-3.5 rounded-2xl border flex items-center justify-between text-xs transition ${
                    isDark ? 'bg-slate-800/60 border-slate-700/60 hover:bg-slate-800' : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-500 flex items-center justify-center font-bold text-sm shrink-0">
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
                      <p className={`text-[11px] mt-0.5 ${textSub}`}>
                        {log.weight_g}g • Protein: {log.protein_g}g • Carbs: {log.carbs_g}g • Fat: {log.fat_g}g
                      </p>
                      <span className="text-[10px] text-slate-400">
                        {new Date(log.logged_at).toLocaleString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <span className="font-black text-sm text-emerald-500">{log.calories} kcal</span>
                    <button
                      onClick={() => handleDeleteFoodLog(log.id)}
                      className={`p-1.5 rounded-lg transition-colors ${
                        isDark ? 'text-slate-500 hover:text-rose-400 hover:bg-slate-700' : 'text-slate-400 hover:text-rose-600 hover:bg-slate-200'
                      }`}
                      title="Delete log"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Weight Records Tab Content */}
        {activeLogTab === 'weights' && (
          <div className="space-y-2">
            {weightLogs.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-500">
                No weight records found. Tap "Record Weight" above to track your weight.
              </div>
            ) : (
              weightLogs.map((log) => (
                <div
                  key={log.id}
                  className={`p-3 rounded-2xl border flex items-center justify-between text-xs ${
                    isDark ? 'bg-slate-800/60 border-slate-700/60' : 'bg-slate-50 border-slate-200'
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <Calendar className="w-4 h-4 text-teal-400" />
                    <span className={textSub}>
                      {new Date(log.recorded_at).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </span>
                  </div>
                  <span className="font-bold text-teal-400 text-sm">{log.weight_kg} kg</span>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};
