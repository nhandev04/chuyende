import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import type { FoodDatabaseItem, AIReportItem } from '../types';
import { ShieldAlert, Database, AlertCircle, Plus, Trash2, CheckCircle2, XCircle, Users, Shield } from 'lucide-react';

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
    }
  };


  useEffect(() => {
    loadAdminData();
  }, []);

  const notify = (msg: string) => {
    setActionMessage(msg);
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
      notify(`Successfully added "${created.food_name}" to Ground-Truth DB!`);
      loadAdminData();
    } catch (err: any) {
      alert(err.message || "Failed to add food item");
    }
  };

  const handleDeleteFood = async (foodId: number, foodName: string) => {
    if (!confirm(`Are you sure you want to delete "${foodName}" from Ground-Truth DB?`)) return;
    try {
      await api.deleteGroundTruthFood(foodId);
      setFoods(foods.filter(f => f.id !== foodId));
      notify(`Deleted "${foodName}" from Ground-Truth DB.`);
      loadAdminData();
    } catch (err: any) {
      alert(err.message || "Failed to delete food item");
    }
  };

  const handleReportAction = async (reportId: number, status: 'resolved' | 'dismissed', addToGroundTruth: boolean = false) => {
    try {
      const updated = await api.updateAIReport(reportId, status, addToGroundTruth);
      setReports(reports.map(r => r.id === reportId ? updated : r));
      notify(status === 'resolved' 
        ? `Report #${reportId} resolved! ${addToGroundTruth ? 'Added to Ground-Truth DB.' : ''}` 
        : `Report #${reportId} dismissed.`);
      loadAdminData();
    } catch (err: any) {
      alert(err.message || "Failed to update report status");
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
      notify(`Updated User #${userId} settings.`);
      loadAdminData();
    } catch (err: any) {
      alert(err.message || "Failed to update user settings");
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
            <h2 className={`text-xl font-black ${textMain}`}>System Administration Hub (Admin)</h2>
            <p className="text-xs text-amber-500 font-medium">Manage AI Ground-Truth Data, Feedback Reports & User Roles</p>
          </div>
        </div>
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
          <span className={`text-[10px] font-semibold block ${textSub}`}>BMI ALERT USERS</span>
          <span className="text-xl font-extrabold text-rose-500 block mt-1">{stats?.alert_users_count || 0}</span>
        </div>
        <div className={`border p-4 rounded-2xl text-center ${cardBg}`}>
          <span className={`text-[10px] font-semibold block ${textSub}`}>PENDING AI REPORTS</span>
          <span className="text-xl font-extrabold text-amber-500 block mt-1">{stats?.pending_ai_reports || 0}</span>
        </div>
        <div className={`border p-4 rounded-2xl text-center ${cardBg}`}>
          <span className={`text-[10px] font-semibold block ${textSub}`}>GROUND-TRUTH FOODS</span>
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
          <span>Ground-Truth Food Library ({foods.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('reports')}
          className={`pb-2 text-xs font-bold transition-all flex items-center space-x-1.5 shrink-0 ${
            activeTab === 'reports' ? 'text-amber-500 border-b-2 border-amber-500' : textSub
          }`}
        >
          <AlertCircle className="w-4 h-4" />
          <span>AI Error Reports ({reports.filter(r => r.status === 'pending').length})</span>
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
            <h3 className={`font-extrabold text-sm ${textMain}`}>Sample Foods Library (Ground-truth for AI Mapping)</h3>
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="bg-amber-500 hover:bg-amber-400 text-slate-950 px-3 py-1.5 rounded-xl font-bold text-xs flex items-center space-x-1"
            >
              <Plus className="w-4 h-4" />
              <span>Add New Ground-Truth Item</span>
            </button>
          </div>

          {/* Form add new ground-truth food */}
          {showAddForm && (
            <form onSubmit={handleAddFood} className={`p-4 rounded-2xl border space-y-3 ${
              isDark ? 'bg-slate-800/80 border-amber-500/30' : 'bg-amber-50/50 border-amber-200'
            }`}>
              <span className="text-xs font-bold text-amber-500">New ground-truth food portion values:</span>
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
                  placeholder="Category (Rice, Soup, Noodle...)"
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  className={`rounded-xl p-2 text-xs ${inputBg}`}
                />
              </div>

              <div className="grid grid-cols-4 gap-2">
                <div>
                  <span className={`text-[10px] ${textSub}`}>Cal / 100g</span>
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

              <button type="submit" className="w-full bg-amber-500 text-slate-950 font-bold text-xs py-2 rounded-xl">
                Save to AI Ground-Truth Library
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
                  <th className="py-2.5 px-3">Cal / 100g</th>
                  <th className="py-2.5 px-3">Protein</th>
                  <th className="py-2.5 px-3">Carbs</th>
                  <th className="py-2.5 px-3">Fat</th>
                  <th className="py-2.5 px-3 text-right">Actions</th>
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
                        title="Delete Food Item"
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
          <h3 className={`font-extrabold text-sm ${textMain}`}>AI Misclassification Feedback List</h3>
          <div className="space-y-3">
            {reports.map((report) => (
              <div key={report.id} className={`p-4 rounded-2xl border flex items-center justify-between text-xs ${
                isDark ? 'bg-slate-800/60 border-slate-700/60' : 'bg-slate-50 border-slate-200'
              }`}>
                <div className="flex items-center space-x-3">
                  {report.image_url ? (
                    <img
                      src={report.image_url}
                      alt="Uploaded food"
                      className="w-12 h-12 rounded-xl object-cover border border-slate-700 shadow"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-500 text-[10px] font-bold">
                      No Img
                    </div>
                  )}
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-rose-500">AI Predicted: "{report.original_prediction}"</span>
                      <span className={textSub}>→</span>
                      <span className="font-bold text-emerald-500">Actual: "{report.user_correction}"</span>
                    </div>
                    <p className={`text-[11px] mt-1 ${textSub}`}>User ID: #{report.user_id} • Time: {new Date(report.created_at).toLocaleDateString('vi-VN')}</p>
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
                    {report.status}
                  </span>

                  {report.status === 'pending' && (
                    <div className="flex space-x-1">
                      <button
                        onClick={() => handleReportAction(report.id, 'resolved', true)}
                        className="p-1.5 bg-emerald-500/20 hover:bg-emerald-500 text-emerald-400 hover:text-slate-950 font-bold rounded-xl text-xs flex items-center space-x-1 transition"
                        title="Resolve & Add to Ground-Truth DB"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Approve & Add DB</span>
                      </button>
                      <button
                        onClick={() => handleReportAction(report.id, 'dismissed', false)}
                        className="p-1.5 bg-rose-500/20 hover:bg-rose-500 text-rose-400 hover:text-white font-bold rounded-xl text-xs flex items-center space-x-1 transition"
                        title="Dismiss Report"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        <span>Dismiss</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'users' && (
        <div className={`border rounded-3xl p-5 shadow-xl space-y-4 ${cardBg}`}>
          <h3 className={`font-extrabold text-sm ${textMain}`}>Registered User Accounts & Tier Roles</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className={`border-b ${isDark ? 'border-slate-800 text-slate-400' : 'border-slate-200 text-slate-500'}`}>
                  <th className="py-2.5 px-3">User ID & Email</th>
                  <th className="py-2.5 px-3">Role</th>
                  <th className="py-2.5 px-3">Subscription Tier</th>
                  <th className="py-2.5 px-3">BMI Status</th>
                  <th className="py-2.5 px-3 text-right">Admin Controls</th>
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
                        {u.role.toUpperCase()}
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      <span className={`font-extrabold px-2 py-0.5 rounded-full text-[10px] ${
                        u.plan === 'pro' ? 'bg-indigo-500/20 text-indigo-400' : u.plan === 'plus' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-700/30 text-slate-400'
                      }`}>
                        {u.plan ? u.plan.toUpperCase() : 'STANDARD'}
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      {u.bmi ? (
                        <span className={`font-bold ${u.bmi > 30 ? 'text-rose-500' : u.bmi < 16 ? 'text-amber-500' : 'text-emerald-500'}`}>
                          BMI: {u.bmi.toFixed(1)} ({u.body_shape || 'Normal'})
                        </span>
                      ) : (
                        <span className={textSub}>No data</span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-right space-x-1">
                      <button
                        onClick={() => handleUpdateUser(u.id, u.role === 'admin' ? 'user' : 'admin', u.plan)}
                        className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-amber-400 rounded-lg text-[10px] font-bold border border-amber-500/30 transition"
                      >
                        {u.role === 'admin' ? 'Set User' : 'Make Admin'}
                      </button>
                      <button
                        onClick={() => handleUpdateUser(u.id, u.role, u.plan === 'pro' ? 'standard' : 'pro')}
                        className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-indigo-400 rounded-lg text-[10px] font-bold border border-indigo-500/30 transition"
                      >
                        {u.plan === 'pro' ? 'Set Standard' : 'Grant PRO'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  );
};

