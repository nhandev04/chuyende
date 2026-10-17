import { useState, useEffect, useCallback } from 'react';
import { api } from '../services/api';
import type { FoodDatabaseItem, AIReportItem } from '../types';

export interface AdminUserItem {
  id: number;
  email: string;
  full_name?: string;
  role: string;
  plan: string;
  auth_provider: string;
  created_at: string;
  height_cm?: number;
  current_weight_kg?: number;
  bmi?: number;
  body_shape?: string;
}

export interface AdminStats {
  total_users: number;
  alert_users_count: number;
  pending_ai_reports: number;
  total_food_items: number;
}

export function useAdminData(activeTab: 'foods' | 'reports' | 'users') {
  const [foods, setFoods] = useState<FoodDatabaseItem[]>([]);
  const [reports, setReports] = useState<AIReportItem[]>([]);
  const [users, setUsers] = useState<AdminUserItem[]>([]);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadAdminData = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const [foodRes, reportRes, statRes, userRes] = await Promise.all([
        api.getFoodDatabase(),
        api.getAIReports(),
        api.getAdminStats(),
        api.getAllUsers(),
      ]);
      setFoods(foodRes);
      setReports(reportRes);
      setStats(statRes);
      setUsers(userRes);
    } catch (err) {
      console.warn('Error loading admin data:', err);
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadAdminData();
  }, [activeTab, loadAdminData]);

  const addFood = async (item: {
    food_name: string;
    category: string;
    calories_per_100g: number;
    protein_per_100g: number;
    carbs_per_100g: number;
    fat_per_100g: number;
  }) => {
    const created = await api.addGroundTruthFood(item);
    setFoods((prev) => [created, ...prev]);
    await loadAdminData();
    return created;
  };

  const deleteFood = async (foodId: number) => {
    await api.deleteGroundTruthFood(foodId);
    setFoods((prev) => prev.filter((f) => f.id !== foodId));
    await loadAdminData();
  };

  const updateReport = async (reportId: number, status: 'resolved' | 'dismissed', addToGroundTruth: boolean = false) => {
    const updated = await api.updateAIReport(reportId, status, addToGroundTruth);
    setReports((prev) => prev.map((r) => (r.id === reportId ? updated : r)));
    await loadAdminData();
    return updated;
  };

  const updateUserAccount = async (userId: number, role?: string, plan?: string) => {
    await api.updateUserAccount(userId, role, plan);
    setUsers((prev) =>
      prev.map((u) =>
        u.id === userId
          ? {
              ...u,
              role: role || u.role,
              plan: plan || u.plan,
            }
          : u
      )
    );
    await loadAdminData();
  };

  return {
    foods,
    reports,
    users,
    stats,
    isRefreshing,
    refetch: loadAdminData,
    addFood,
    deleteFood,
    updateReport,
    updateUserAccount,
  };
}
