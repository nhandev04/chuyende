import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import type { FoodDatabaseItem, AIReportItem } from '../types';
import { ShieldAlert, Database, AlertCircle, Plus, Trash2, CheckCircle2, XCircle, Users, Shield, RefreshCw, Maximize2, ImageOff, X } from 'lucide-react';
import { useToast } from '../components/Toast';

interface AdminPageProps {
  theme?: 'dark' | 'light';
}

interface AdminUserItem {
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

export const AdminPage: React.FC<AdminPageProps> = ({ theme = 'dark' }) => {
  const [activeTab, setActiveTab] = useState<'foods' | 'reports' | 'users'>('foods');
  const [foods, setFoods] = useState<FoodDatabaseItem[]>([]);
  const [reports, setReports] = useState<AIReportItem[]>([]);
  const [users, setUsers] = useState<AdminUserItem[]>([]);
  const [stats, setStats] = useState<{ total_users: number; alert_users_count: number; pending_ai_reports: number; total_food_items: number } | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedReportImage, setSelectedReportImage] = useState<AIReportItem | null>(null);

  const isDark = theme === 'dark';

  // New Food Form State
  const [showAddForm, setShowAddForm] = useState(false);
  const [newFoodName, setNewFoodName] = useState('');
  const [newCategory, setNewCategory] = useState('Soups & Stews');
  const [newCal100g, setNewCal100g] = useState(120);
  const [newProtein, setNewProtein] = useState(8);
  const [newCarbs, setNewCarbs] = useState(15);
  const [newFat, setNewFat] = useState(4);

  const loadAdminData = async () => {
    setIsRefreshing(true);
    try {
      const [foodRes, reportRes, statRes, userRes] = await Promise.all([
        api.getFoodDatabase(),
        api.getAIReports(),
        api.getAdminStats(),
        api.getAllUsers()
      ]);
      setFoods(foodRes);
      setReports(reportRes);
      setStats(statRes);
      setUsers(userRes);
    } catch (err) {
      console.warn("Error loading admin data:", err);
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadAdminData();
  }, [activeTab]);

  const toast = useToast();

  const notify = (msg: string) => {
    setActionMessage(msg);
    toast.success(msg, "Admin Hub");
    setTimeout(() => setActionMessage(null), 3000);
  };

  const handleAddFood = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const created = await api.addGroundTruthFood({
        food_name: newFoodName,
        category: newCategory,
        calories_per_100g: newCal100g,
        protein_per_100g: newProtein,
        carbs_per_100g: newCarbs,
        fat_per_100g: newFat
      });
      setFoods([created, ...foods]);
      setShowAddForm(false);
      setNewFoodName('');
      notify(`Successfully added "${created.food_name}" to the food library!`);
      loadAdminData();
    } catch (err: any) {
      toast.error(err.message || "Failed to add food item", "Admin Action Error");
    }
  };

  const handleDeleteFood = async (foodId: number, foodName: string) => {
    if (!confirm(`Are you sure you want to delete "${foodName}" from the library?`)) return;
    try {
      await api.deleteGroundTruthFood(foodId);
      setFoods(foods.filter(f => f.id !== foodId));
      notify(`Deleted "${foodName}" from the library.`);
      loadAdminData();
    } catch (err: any) {
      toast.error(err.message || "Failed to delete food item", "Admin Action Error");
    }
  };

  const handleReportAction = async (reportId: number, status: 'resolved' | 'dismissed', addToGroundTruth: boolean = false) => {
    try {
      const updated = await api.updateAIReport(reportId, status, addToGroundTruth);
      setReports(reports.map(r => r.id === reportId ? updated : r));
      notify(status === 'resolved' 
        ? `Verified report #${reportId}! ${addToGroundTruth ? 'Added food to standard library.' : ''}` 
        : `Dismissed report #${reportId}.`);
      loadAdminData();
    } catch (err: any) {
      toast.error(err.message || "Failed to update report status", "Admin Action Error");
    }
  };

  const handleUpdateUser = async (userId: number, role?: string, plan?: string) => {
    try {
      await api.updateUserAccount(userId, role, plan);
      setUsers(users.map(u => u.id === userId ? {
        ...u,
        role: role || u.role,
        plan: plan || u.plan
      } : u));
      notify(`Updated account settings for user #${userId}.`);
      loadAdminData();
    } catch (err: any) {
      toast.error(err.message || "Failed to update user account", "Admin Action Error");
    }
  };

  const cardBg = isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200';
  const textMain = isDark ? 'text-white' : 'text-slate-900';
  const textSub = isDark ? 'text-slate-400' : 'text-slate-500';
  const inputBg = isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900';

  return (
    <div className={`space-y-6 pb-24 max-w-4xl mx-auto px-4 pt-4 ${textMain}`}>
      
      {/* Header Admin Badge */}
      <div className={`border rounded-3xl p-5 shadow-xl flex items-center justify-between ${
        isDark ? 'bg-gradient-to-r from-slate-900 via-amber-950/30 to-slate-900 border-amber-500/30' : 'bg-gradient-to-r from-amber-50 via-white to-orange-50 border-amber-200'
      }`}>
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-500 flex items-center justify-center font-bold">
            <ShieldAlert className="w-7 h-7" />
          </div>
          <div>
            <h2 className={`text-xl font-black ${textMain}`}>Admin Management Hub</h2>
            <p className="text-xs text-amber-500 font-medium">Manage standard food library, user correction reports & user roles</p>
          </div>
        </div>
        <button
          onClick={loadAdminData}
          disabled={isRefreshing}
          className={`flex items-center space-x-1.5 px-3.5 py-2 rounded-2xl text-xs font-bold border shadow-sm transition ${
            isDark
              ? 'bg-slate-800/90 hover:bg-slate-700 text-slate-200 border-slate-700'
              : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-300'
          }`}
          title="Reload admin metrics & reports"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-amber-500' : 'text-amber-500'}`} />
          <span>{isRefreshing ? 'Refreshing...' : 'Refresh Hub'}</span>
        </button>
      </div>

      {actionMessage && (
        <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl text-xs text-emerald-500 text-center animate-fadeIn font-semibold">
          {actionMessage}
        </div>
      )}

      {/* Admin Quick Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className={`border p-4 rounded-2xl text-center ${cardBg}`}>
          <span className={`text-[10px] font-semibold block ${textSub}`}>TOTAL USERS</span>
          <span className={`text-xl font-extrabold block mt-1 ${textMain}`}>{stats?.total_users || users.length}</span>
        </div>
        <div className={`border p-4 rounded-2xl text-center ${cardBg}`}>
          <span className={`text-[10px] font-semibold block ${textSub}`}>HEALTH ALERTS</span>
          <span className="text-xl font-extrabold text-rose-500 block mt-1">{stats?.alert_users_count || 0}</span>
        </div>
        <div className={`border p-4 rounded-2xl text-center ${cardBg}`}>
          <span className={`text-[10px] font-semibold block ${textSub}`}>PENDING REPORTS</span>
          <span className="text-xl font-extrabold text-amber-500 block mt-1">{stats?.pending_ai_reports || 0}</span>
        </div>
        <div className={`border p-4 rounded-2xl text-center ${cardBg}`}>
          <span className={`text-[10px] font-semibold block ${textSub}`}>FOOD LIBRARY ITEMS</span>
          <span className="text-xl font-extrabold text-emerald-500 block mt-1">{foods.length}</span>
        </div>
      </div>

      {/* Admin Tab switch */}
      <div className={`flex border-b pb-2 space-x-4 overflow-x-auto ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
        <button
          onClick={() => setActiveTab('foods')}
          className={`pb-2 text-xs font-bold transition-all flex items-center space-x-1.5 shrink-0 ${
            activeTab === 'foods' ? 'text-amber-500 border-b-2 border-amber-500' : textSub
          }`}
        >
          <Database className="w-4 h-4" />
          <span>Food Library ({foods.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('reports')}
          className={`pb-2 text-xs font-bold transition-all flex items-center space-x-1.5 shrink-0 ${
            activeTab === 'reports' ? 'text-amber-500 border-b-2 border-amber-500' : textSub
          }`}
        >
          <AlertCircle className="w-4 h-4" />
          <span>User Correction Reports ({reports.filter(r => r.status === 'pending').length})</span>
        </button>
        <button
          onClick={() => setActiveTab('users')}
          className={`pb-2 text-xs font-bold transition-all flex items-center space-x-1.5 shrink-0 ${
            activeTab === 'users' ? 'text-amber-500 border-b-2 border-amber-500' : textSub
          }`}
        >
          <Users className="w-4 h-4" />
          <span>User Accounts & Roles ({users.length})</span>
        </button>
      </div>

      {activeTab === 'foods' && (
        <div className={`border rounded-3xl p-5 shadow-xl space-y-4 ${cardBg}`}>
          <div className="flex items-center justify-between">
            <h3 className={`font-extrabold text-sm ${textMain}`}>Standard Food Nutrition Library</h3>
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="bg-amber-500 hover:bg-amber-400 text-slate-950 px-3 py-1.5 rounded-xl font-bold text-xs flex items-center space-x-1"
            >
              <Plus className="w-4 h-4" />
              <span>Add New Food</span>
            </button>
          </div>

          {/* Form add new food */}
          {showAddForm && (
            <form onSubmit={handleAddFood} className={`p-4 rounded-2xl border space-y-3 ${
              isDark ? 'bg-slate-800/80 border-amber-500/30' : 'bg-amber-50/50 border-amber-200'
            }`}>
              <span className="text-xs font-bold text-amber-500">Enter nutritional values for new food item:</span>
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="text"
                  required
                  placeholder="Food name..."
                  value={newFoodName}
                  onChange={(e) => setNewFoodName(e.target.value)}
                  className={`rounded-xl p-2 text-xs ${inputBg}`}
                />
                <input
                  type="text"
                  placeholder="Category (Soups, Rice, Stir-fry, Salads...)"
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  className={`rounded-xl p-2 text-xs ${inputBg}`}
                />
              </div>

              <div className="grid grid-cols-4 gap-2">
                <div>
                  <span className={`text-[10px] ${textSub}`}>Calories / 100g</span>
                  <input
                    type="number"
                    value={newCal100g}
                    onChange={(e) => setNewCal100g(Number(e.target.value))}
                    className={`w-full rounded-xl p-2 text-xs text-amber-500 font-bold ${inputBg}`}
                  />
                </div>
                <div>
                  <span className={`text-[10px] ${textSub}`}>Protein / 100g</span>
                  <input
                    type="number"
                    value={newProtein}
                    onChange={(e) => setNewProtein(Number(e.target.value))}
                    className={`w-full rounded-xl p-2 text-xs text-sky-500 font-bold ${inputBg}`}
                  />
                </div>
                <div>
                  <span className={`text-[10px] ${textSub}`}>Carbs / 100g</span>
                  <input
                    type="number"
                    value={newCarbs}
                    onChange={(e) => setNewCarbs(Number(e.target.value))}
                    className={`w-full rounded-xl p-2 text-xs text-amber-500 font-bold ${inputBg}`}
                  />
                </div>
                <div>
                  <span className={`text-[10px] ${textSub}`}>Fat / 100g</span>
                  <input
                    type="number"
                    value={newFat}
                    onChange={(e) => setNewFat(Number(e.target.value))}
                    className={`w-full rounded-xl p-2 text-xs text-rose-500 font-bold ${inputBg}`}
                  />
                </div>
              </div>

              <button type="submit" className="w-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs py-2 rounded-xl transition">
                Save to Food Library
              </button>
            </form>
          )}

          {/* Foods Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className={`border-b ${isDark ? 'border-slate-800 text-slate-400' : 'border-slate-200 text-slate-500'}`}>
                  <th className="py-2.5 px-3">Food Name</th>
                  <th className="py-2.5 px-3">Category</th>
                  <th className="py-2.5 px-3">Calories / 100g</th>
                  <th className="py-2.5 px-3">Protein</th>
                  <th className="py-2.5 px-3">Carbs</th>
                  <th className="py-2.5 px-3">Fat</th>
                  <th className="py-2.5 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className={`divide-y ${isDark ? 'divide-slate-800/60' : 'divide-slate-200'}`}>
                {foods.map((food) => (
                  <tr key={food.id} className={isDark ? "hover:bg-slate-800/40" : "hover:bg-slate-50"}>
                    <td className={`py-3 px-3 font-bold ${textMain}`}>{food.food_name}</td>
                    <td className={`py-3 px-3 ${textSub}`}>{food.category}</td>
                    <td className="py-3 px-3 font-bold text-emerald-500">{food.calories_per_100g} kcal</td>
                    <td className="py-3 px-3 text-sky-500">{food.protein_per_100g}g</td>
                    <td className="py-3 px-3 text-amber-500">{food.carbs_per_100g}g</td>
                    <td className="py-3 px-3 text-rose-500">{food.fat_per_100g}g</td>
                    <td className="py-3 px-3 text-right">
                      <button
                        onClick={() => handleDeleteFood(food.id, food.food_name)}
                        className="p-1.5 text-rose-400 hover:text-rose-600 hover:bg-rose-500/10 rounded-lg transition"
                        title="Delete food item"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'reports' && (
        <div className={`border rounded-3xl p-5 shadow-xl space-y-4 ${cardBg}`}>
          <div className="flex items-center justify-between">
            <h3 className={`font-extrabold text-sm ${textMain}`}>
              User Feedback & Recognition Reports ({reports.length})
            </h3>
            <button
              onClick={loadAdminData}
              disabled={isRefreshing}
              className="flex items-center space-x-1.5 text-xs text-amber-500 hover:text-amber-400 font-bold px-3 py-1 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 transition"
            >
              <RefreshCw className={`w-3 h-3 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span>{isRefreshing ? 'Refreshing...' : 'Refresh List'}</span>
            </button>
          </div>
          <div className="space-y-3">
            {reports.length === 0 ? (
              <div className="py-8 text-center text-slate-500 text-xs">
                No user feedback reports found.
              </div>
            ) : (
              reports.map((report) => (
                <div key={report.id} className={`p-4 rounded-2xl border flex items-center justify-between text-xs ${
                  isDark ? 'bg-slate-800/60 border-slate-700/60' : 'bg-slate-50 border-slate-200'
                }`}>
                  <div className="flex items-center space-x-3.5">
                    {report.image_url ? (
                      <div
                        onClick={() => setSelectedReportImage(report)}
                        className="w-14 h-14 rounded-2xl overflow-hidden border border-slate-700 shadow-md shrink-0 cursor-pointer relative group bg-slate-950 flex items-center justify-center"
                        title="Click to view full photo"
                      >
                        <img
                          src={report.image_url}
                          alt="Food report"
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                          onError={(e) => {
                            (e.target as HTMLElement).style.display = 'none';
                          }}
                        />
                        <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white">
                          <Maximize2 className="w-4 h-4" />
                        </div>
                      </div>
                    ) : (
                      <div className="w-14 h-14 rounded-2xl bg-slate-800/80 border border-slate-700/80 flex flex-col items-center justify-center text-slate-500 shrink-0">
                        <ImageOff className="w-4 h-4 mb-0.5" />
                        <span className="text-[9px] font-semibold">No photo</span>
                      </div>
                    )}
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-rose-500">AI predicted: "{report.original_prediction}"</span>
                        <span className={textSub}>→</span>
                        <span className="font-bold text-emerald-500">User correction: "{report.user_correction}"</span>
                      </div>
                      <p className={`text-[11px] mt-1 ${textSub}`}>
                        Report #{report.id} • User #{report.user_id} • Date: {new Date(report.created_at).toLocaleDateString('en-US')}
                        {report.image_url ? ' • 📷 Photo attached' : ''}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <span className={`font-bold px-2.5 py-1 rounded-full text-[10px] ${
                      report.status === 'pending'
                        ? 'bg-amber-500/20 text-amber-500'
                        : report.status === 'resolved'
                        ? 'bg-emerald-500/20 text-emerald-500'
                        : 'bg-slate-500/20 text-slate-400'
                    }`}>
                      {report.status === 'pending' ? 'Pending' : report.status === 'resolved' ? 'Verified' : 'Dismissed'}
                    </span>

                    {report.status === 'pending' && (
                      <div className="flex space-x-1">
                        <button
                          onClick={() => handleReportAction(report.id, 'resolved', true)}
                          className="p-1.5 bg-emerald-500/20 hover:bg-emerald-500 text-emerald-400 hover:text-slate-950 font-bold rounded-xl text-xs flex items-center space-x-1 transition"
                          title="Verify & Add to standard library"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Verify & Add</span>
                        </button>
                        <button
                          onClick={() => handleReportAction(report.id, 'dismissed', false)}
                          className="p-1.5 bg-rose-500/20 hover:bg-rose-500 text-rose-400 hover:text-white font-bold rounded-xl text-xs flex items-center space-x-1 transition"
                          title="Dismiss report"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          <span>Dismiss</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {activeTab === 'users' && (
        <div className={`border rounded-3xl p-5 shadow-xl space-y-4 ${cardBg}`}>
          <h3 className={`font-extrabold text-sm ${textMain}`}>User Accounts & Subscription Plans</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className={`border-b ${isDark ? 'border-slate-800 text-slate-400' : 'border-slate-200 text-slate-500'}`}>
                  <th className="py-2.5 px-3">User & Email</th>
                  <th className="py-2.5 px-3">Role</th>
                  <th className="py-2.5 px-3">Plan</th>
                  <th className="py-2.5 px-3">Body Metrics (BMI)</th>
                  <th className="py-2.5 px-3 text-right">Manage Role & Plan</th>
                </tr>
              </thead>
              <tbody className={`divide-y ${isDark ? 'divide-slate-800/60' : 'divide-slate-200'}`}>
                {users.map((u) => (
                  <tr key={u.id} className={isDark ? "hover:bg-slate-800/40" : "hover:bg-slate-50"}>
                    <td className="py-3 px-3">
                      <span className={`font-bold block ${textMain}`}>#{u.id} {u.full_name || 'User'}</span>
                      <span className={`text-[10px] ${textSub}`}>{u.email}</span>
                    </td>
                    <td className="py-3 px-3">
                      <span className={`inline-flex items-center gap-1 font-bold px-2 py-0.5 rounded-full text-[10px] ${
                        u.role === 'admin' ? 'bg-amber-500/20 text-amber-500 border border-amber-500/30' : 'bg-slate-700/50 text-slate-300'
                      }`}>
                        {u.role === 'admin' ? <Shield className="w-3 h-3" /> : null}
                        {u.role === 'admin' ? 'ADMIN' : 'USER'}
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      <span className={`font-extrabold px-2 py-0.5 rounded-full text-[10px] ${
                        u.plan === 'pro' ? 'bg-indigo-500/20 text-indigo-400' : u.plan === 'plus' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-700/30 text-slate-400'
                      }`}>
                        {u.plan === 'pro' ? 'PRO' : u.plan === 'plus' ? 'PLUS' : 'STANDARD'}
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      {u.bmi ? (
                        <span className={`font-bold ${u.bmi > 30 ? 'text-rose-500' : u.bmi < 16 ? 'text-amber-500' : 'text-emerald-500'}`}>
                          BMI: {u.bmi.toFixed(1)} ({u.body_shape || 'Fit'})
                        </span>
                      ) : (
                        <span className={textSub}>No data logged</span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-right space-x-1">
                      <button
                        onClick={() => handleUpdateUser(u.id, u.role === 'admin' ? 'user' : 'admin', u.plan)}
                        className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-amber-400 rounded-lg text-[10px] font-bold border border-amber-500/30 transition"
                      >
                        {u.role === 'admin' ? 'Demote Admin' : 'Make Admin'}
                      </button>
                      <button
                        onClick={() => handleUpdateUser(u.id, u.role, u.plan === 'pro' ? 'standard' : 'pro')}
                        className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-indigo-400 rounded-lg text-[10px] font-bold border border-indigo-500/30 transition"
                      >
                        {u.plan === 'pro' ? 'Set Standard' : 'Upgrade to Pro'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Lightbox / Image Viewer Modal */}
      {selectedReportImage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-lg p-5 shadow-2xl text-white space-y-4 relative">
            <button
              onClick={() => setSelectedReportImage(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-1.5 rounded-full hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-sm font-extrabold text-white flex items-center space-x-2">
              <span>Reported Food Photo</span>
              <span className="text-xs text-amber-500 font-normal">#{selectedReportImage.id}</span>
            </h3>

            {selectedReportImage.image_url ? (
              <div className="rounded-2xl overflow-hidden border border-slate-800 max-h-80 bg-slate-950 flex items-center justify-center">
                <img
                  src={selectedReportImage.image_url}
                  alt="Full food report photo"
                  className="max-h-80 w-auto object-contain mx-auto"
                />
              </div>
            ) : (
              <div className="py-12 text-center text-slate-500 text-xs">No image attached</div>
            )}

            <div className="bg-slate-800/60 p-3.5 rounded-2xl border border-slate-700/60 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">AI Model Output:</span>
                <span className="font-bold text-rose-400">"{selectedReportImage.original_prediction}"</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">User Verified As:</span>
                <span className="font-bold text-emerald-400">"{selectedReportImage.user_correction}"</span>
              </div>
              <div className="flex items-center justify-between pt-1.5 border-t border-slate-700/60 text-[11px] text-slate-400">
                <span>User #{selectedReportImage.user_id}</span>
                <span>{new Date(selectedReportImage.created_at).toLocaleString('en-US')}</span>
              </div>
            </div>

            {selectedReportImage.status === 'pending' && (
              <div className="flex space-x-2 pt-1">
                <button
                  onClick={() => {
                    handleReportAction(selectedReportImage.id, 'resolved', true);
                    setSelectedReportImage(null);
                  }}
                  className="flex-1 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center justify-center space-x-1 transition shadow-lg shadow-emerald-500/20"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Verify & Add to Food Library</span>
                </button>
                <button
                  onClick={() => {
                    handleReportAction(selectedReportImage.id, 'dismissed', false);
                    setSelectedReportImage(null);
                  }}
                  className="py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-rose-500/20 text-rose-400 font-bold text-xs transition"
                >
                  Dismiss
                </button>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
};
