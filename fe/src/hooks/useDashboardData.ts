import { useState, useEffect, useCallback } from 'react';
import { api } from '../services/api';
import { useData } from '../contexts/DataContext';
import type { User, FoodLog, NutritionSummary, AIRecommendation, DailyMealPlan } from '../types';

export function isSameDayAsToday(dateStr: string): boolean {
  if (!dateStr) return false;
  try {
    const d = new Date(dateStr.includes('Z') || dateStr.includes('+') ? dateStr : `${dateStr}Z`);
    const now = new Date();

    const isLocalToday =
      d.getFullYear() === now.getFullYear() &&
      d.getMonth() === now.getMonth() &&
      d.getDate() === now.getDate();

    const isUtcToday =
      d.getUTCFullYear() === now.getUTCFullYear() &&
      d.getUTCMonth() === now.getUTCMonth() &&
      d.getUTCDate() === now.getUTCDate();

    return isLocalToday || isUtcToday;
  } catch {
    return false;
  }
}

export function useDashboardData(user: User | null) {
  const { dataVersion, invalidateData } = useData();
  const [summary, setSummary] = useState<NutritionSummary | null>(null);
  const [todayLogs, setTodayLogs] = useState<FoodLog[]>([]);
  const [allLogs, setAllLogs] = useState<FoodLog[]>([]);
  const [recommendation, setRecommendation] = useState<AIRecommendation | null>(null);
  const [proMealPlan, setProMealPlan] = useState<DailyMealPlan | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [refreshingProPlan, setRefreshingProPlan] = useState<boolean>(false);

  const userId = user?.user_id;
  const isProOrAdmin = user?.role === 'admin' || user?.plan === 'pro';

  const loadData = useCallback(async () => {
    if (!userId) return;
    setIsLoading(true);
    try {
      const [sumRes, logsRes, recRes] = await Promise.all([
        api.getNutritionSummary(userId),
        api.getFoodLogs(userId),
        api.getAIRecommendations(userId),
      ]);
      setSummary(sumRes);

      const logsList = Array.isArray(logsRes) ? logsRes : [];
      setAllLogs(logsList);

      // Filter ONLY meals logged today for Daily Meal Journal
      const todayOnly = logsList.filter((log) => isSameDayAsToday(log.logged_at));
      setTodayLogs(todayOnly);

      setRecommendation(recRes);

      if (isProOrAdmin) {
        try {
          const mealRes = await api.getProDailyMealRecommendations(userId);
          setProMealPlan(mealRes);
        } catch (err) {
          console.warn('Pro meal fetch notice:', err);
        }
      }
    } catch (err) {
      console.warn('Dashboard load notice:', err);
    } finally {
      setIsLoading(false);
    }
  }, [userId, isProOrAdmin]);

  useEffect(() => {
    if (userId) {
      loadData();
    }
  }, [userId, dataVersion, user?.plan, loadData]);

  const deleteLog = useCallback(async (logId: number) => {
    await api.deleteFoodLog(logId);
    setTodayLogs((prev) => prev.filter((l) => l.id !== logId));
    setAllLogs((prev) => prev.filter((l) => l.id !== logId));
    invalidateData('dashboard');
    invalidateData('history');
  }, [invalidateData]);

  const refreshProPlan = useCallback(async () => {
    if (!userId) return;
    setRefreshingProPlan(true);
    try {
      const mealRes = await api.getProDailyMealRecommendations(userId);
      setProMealPlan(mealRes);
      return mealRes;
    } finally {
      setRefreshingProPlan(false);
    }
  }, [userId]);

  return {
    summary,
    todayLogs,
    allLogs,
    recommendation,
    proMealPlan,
    isLoading,
    refreshingProPlan,
    refetch: loadData,
    deleteLog,
    refreshProPlan,
  };
}
