import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import type { FoodDatabaseItem, AIReportItem } from '../types';
import { ShieldAlert, Database, AlertCircle, Plus } from 'lucide-react';

interface AdminPageProps {
  theme?: 'dark' | 'light';
}

export const AdminPage: React.FC<AdminPageProps> = ({ theme = 'dark' }) => {
  const [activeTab, setActiveTab] = useState<'foods' | 'reports'>('foods');
  const [foods, setFoods] = useState<FoodDatabaseItem[]>([]);
  const [reports, setReports] = useState<AIReportItem[]>([]);
  const [stats, setStats] = useState<{ total_users: number; alert_users_count: number; pending_ai_reports: number; total_food_items: number } | null>(null);

  const isDark = theme === 'dark';

  // New Food Form State
  const [showAddForm, setShowAddForm] = useState(false);
  const [newFoodName, setNewFoodName] = useState('');
  const [newCategory, setNewCategory] = useState('Món Nước');
  const [newCal100g, setNewCal100g] = useState(120);
  const [newProtein, setNewProtein] = useState(8);
  const [newCarbs, setNewCarbs] = useState(15);
  const [newFat, setNewFat] = useState(4);

  const loadAdminData = async () => {
    const [foodRes, reportRes, statRes] = await Promise.all([
      api.getFoodDatabase(),
      api.getAIReports(),
      api.getAdminStats()
    ]);
    setFoods(foodRes);
    setReports(reportRes);
    setStats(statRes);
  };

  useEffect(() => {
    loadAdminData();
  }, []);

  const handleAddFood = async (e: React.FormEvent) => {
    e.preventDefault();
    const item: FoodDatabaseItem = {
      id: Date.now(),
      food_name: newFoodName,
      category: newCategory,
      calories_per_100g: newCal100g,
      protein_per_100g: newProtein,
      carbs_per_100g: newCarbs,
      fat_per_100g: newFat
    };
    setFoods([item, ...foods]);
    setShowAddForm(false);
    setNewFoodName('');
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
            <h2 className={`text-xl font-black ${textMain}`}>Phân Hệ Quản Trị Hệ Thống (Admin)</h2>
            <p className="text-xs text-amber-500 font-medium">Quản lý Dữ Liệu AI Ground-Truth & Phản Hồi Báo Lỗi</p>
          </div>
        </div>
      </div>

      {/* Admin Quick Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className={`border p-4 rounded-2xl text-center ${cardBg}`}>
          <span className={`text-[10px] font-semibold block ${textSub}`}>TỔNG NGƯỜI DÙNG</span>
          <span className={`text-xl font-extrabold block mt-1 ${textMain}`}>{stats?.total_users || 128}</span>
        </div>
        <div className={`border p-4 rounded-2xl text-center ${cardBg}`}>
          <span className={`text-[10px] font-semibold block ${textSub}`}>USER BMI BÁO ĐỘNG</span>
          <span className="text-xl font-extrabold text-rose-500 block mt-1">{stats?.alert_users_count || 5}</span>
        </div>
        <div className={`border p-4 rounded-2xl text-center ${cardBg}`}>
          <span className={`text-[10px] font-semibold block ${textSub}`}>BÁO LỖI AI CHỜ DUYỆT</span>
          <span className="text-xl font-extrabold text-amber-500 block mt-1">{stats?.pending_ai_reports || 3}</span>
        </div>
        <div className={`border p-4 rounded-2xl text-center ${cardBg}`}>
          <span className={`text-[10px] font-semibold block ${textSub}`}>MÓN ĂN GROUND-TRUTH</span>
          <span className="text-xl font-extrabold text-emerald-500 block mt-1">{foods.length}</span>
        </div>
      </div>

      {/* Admin Tab switch */}
      <div className={`flex border-b pb-2 space-x-4 ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
        <button
          onClick={() => setActiveTab('foods')}
          className={`pb-2 text-xs font-bold transition-all flex items-center space-x-1.5 ${
            activeTab === 'foods' ? 'text-amber-500 border-b-2 border-amber-500' : textSub
          }`}
        >
          <Database className="w-4 h-4" />
          <span>Thư Viện Món Ăn Chuẩn (Ground-Truth DB)</span>
        </button>
        <button
          onClick={() => setActiveTab('reports')}
          className={`pb-2 text-xs font-bold transition-all flex items-center space-x-1.5 ${
            activeTab === 'reports' ? 'text-amber-500 border-b-2 border-amber-500' : textSub
          }`}
        >
          <AlertCircle className="w-4 h-4" />
          <span>Báo Cáo Nhận Diện AI</span>
        </button>
      </div>

      {activeTab === 'foods' ? (
        <div className={`border rounded-3xl p-5 shadow-xl space-y-4 ${cardBg}`}>
          <div className="flex items-center justify-between">
            <h3 className={`font-extrabold text-sm ${textMain}`}>Danh Sách Món Ăn Mẫu (Ground-truth for AI Mapping)</h3>
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="bg-amber-500 hover:bg-amber-400 text-slate-950 px-3 py-1.5 rounded-xl font-bold text-xs flex items-center space-x-1"
            >
              <Plus className="w-4 h-4" />
              <span>Thêm Món Chuẩn Mới</span>
            </button>
          </div>

          {/* Form add new ground-truth food */}
          {showAddForm && (
            <form onSubmit={handleAddFood} className={`p-4 rounded-2xl border space-y-3 ${
              isDark ? 'bg-slate-800/80 border-amber-500/30' : 'bg-amber-50/50 border-amber-200'
            }`}>
              <span className="text-xs font-bold text-amber-500">Định lượng món ăn chuẩn mới:</span>
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="text"
                  required
                  placeholder="Tên món ăn..."
                  value={newFoodName}
                  onChange={(e) => setNewFoodName(e.target.value)}
                  className={`rounded-xl p-2 text-xs ${inputBg}`}
                />
                <input
                  type="text"
                  placeholder="Phân loại (Cơm, Món Nước...)"
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  className={`rounded-xl p-2 text-xs ${inputBg}`}
                />
              </div>

              <div className="grid grid-cols-4 gap-2">
                <div>
                  <span className={`text-[10px] ${textSub}`}>Calo / 100g</span>
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
                Lưu Vào Thư Viện AI Ground-truth
              </button>
            </form>
          )}

          {/* Foods Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className={`border-b ${isDark ? 'border-slate-800 text-slate-400' : 'border-slate-200 text-slate-500'}`}>
                  <th className="py-2.5 px-3">Tên Món Ăn</th>
                  <th className="py-2.5 px-3">Danh Mục</th>
                  <th className="py-2.5 px-3">Calo / 100g</th>
                  <th className="py-2.5 px-3">Protein</th>
                  <th className="py-2.5 px-3">Carbs</th>
                  <th className="py-2.5 px-3">Fat</th>
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
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className={`border rounded-3xl p-5 shadow-xl space-y-4 ${cardBg}`}>
          <h3 className={`font-extrabold text-sm ${textMain}`}>Danh Sách Báo Lỗi AI Nhận Diện</h3>
          <div className="space-y-3">
            {reports.map((report) => (
              <div key={report.id} className={`p-4 rounded-2xl border flex items-center justify-between text-xs ${
                isDark ? 'bg-slate-800/60 border-slate-700/60' : 'bg-slate-50 border-slate-200'
              }`}>
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-rose-500">AI Đoán: "{report.original_prediction}"</span>
                    <span className={textSub}>→</span>
                    <span className="font-bold text-emerald-500">Thực tế: "{report.user_correction}"</span>
                  </div>
                  <p className={`text-[11px] mt-1 ${textSub}`}>User ID: #{report.user_id} • Thời gian: {new Date(report.created_at).toLocaleDateString('vi-VN')}</p>
                </div>
                <span className="bg-amber-500/20 text-amber-500 font-bold px-2.5 py-1 rounded-full text-[10px]">
                  {report.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
};
