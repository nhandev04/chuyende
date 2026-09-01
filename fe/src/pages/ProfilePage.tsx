import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import type { User, UserProfile } from '../types';
import { Save, LogOut, CheckCircle2, Sliders } from 'lucide-react';

interface ProfilePageProps {
  user: User | null;
  profile: UserProfile | null;
  onUpdateProfile: (updated: UserProfile) => void;
  onLogout: () => void;
  theme?: 'dark' | 'light';
}

export const ProfilePage: React.FC<ProfilePageProps> = ({
  user,
  profile,
  onUpdateProfile,
  onLogout,
  theme = 'dark'
}) => {
  const [heightCm, setHeightCm] = useState(profile?.height_cm || 172);
  const [currentWeight, setCurrentWeight] = useState(profile?.current_weight_kg || 68);
  const [targetWeight, setTargetWeight] = useState(profile?.target_weight_kg || 63);
  const [age, setAge] = useState(profile?.age || 22);
  const [goal, setGoal] = useState(profile?.goal || 'weight_loss');
  const [calorieTarget, setCalorieTarget] = useState(profile?.daily_calorie_target || 1950);
  const [dietPref, setDietPref] = useState(profile?.dietary_preferences || '');
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  if (!user) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center space-y-4">
        <h3 className="text-xl font-bold">Hồ Sơ Sức Khỏe Cá Nhân</h3>
        <p className="text-sm text-slate-400">Vui lòng đăng nhập để xem và tùy chỉnh thông tin sinh học, chỉ số TDEE và mục tiêu giảm cân.</p>
      </div>
    );
  }


  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const updated = await api.updateProfile(user?.user_id || 1, {
      height_cm: heightCm,
      current_weight_kg: currentWeight,
      target_weight_kg: targetWeight,
      age: age,
      goal: goal,
      daily_calorie_target: calorieTarget,
      dietary_preferences: dietPref
    });
    onUpdateProfile(updated);
    setSaving(false);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const cardBg = isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200';
  const textMain = isDark ? 'text-white' : 'text-slate-900';
  const textSub = isDark ? 'text-slate-400' : 'text-slate-500';
  const inputBg = isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900';

  return (
    <div className={`space-y-6 pb-24 max-w-2xl mx-auto px-4 pt-4 ${textMain}`}>
      
      {/* Header Profile Summary */}
      <div className={`border rounded-3xl p-6 shadow-2xl text-center relative overflow-hidden ${cardBg}`}>
        <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-emerald-500 to-teal-400 text-slate-950 font-black text-3xl flex items-center justify-center mx-auto mb-3 shadow-lg shadow-emerald-500/20">
          {user?.full_name ? user.full_name[0].toUpperCase() : 'U'}
        </div>
        <h2 className={`text-xl font-black ${textMain}`}>{user?.full_name || 'Người Dùng Health AI'}</h2>
        <p className={`text-xs mt-0.5 ${textSub}`}>{user?.email}</p>
        <span className={`inline-block text-[10px] font-bold px-3 py-1 rounded-full mt-2 border ${
          isDark ? 'bg-slate-800 text-emerald-400 border-slate-700' : 'bg-emerald-50 text-emerald-600 border-emerald-200'
        }`}>
          {user?.role === 'admin' ? 'Tài Khoản Quản Trị Viên (Admin)' : 'Tài Khoản Người Dùng Cố Định'}
        </span>
      </div>

      {savedSuccess && (
        <div className="bg-emerald-500/10 border border-emerald-500/30 p-3.5 rounded-2xl text-center text-xs text-emerald-500 flex items-center justify-center space-x-2 animate-fadeIn">
          <CheckCircle2 className="w-4 h-4" />
          <span>Đã lưu cài đặt hồ sơ thành công! AI đã tính toán lại TDEE & BMI.</span>
        </div>
      )}

      {/* Edit Form */}
      <form onSubmit={handleSave} className={`border rounded-3xl p-6 shadow-xl space-y-4 ${cardBg}`}>
        <div className={`flex items-center space-x-2 pb-3 border-b ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
          <Sliders className="w-5 h-5 text-emerald-500" />
          <h3 className={`font-extrabold text-sm ${textMain}`}>Cấu Hình Chỉ Số & Mục Tiêu</h3>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={`block text-xs mb-1 ${textSub}`}>Chiều cao (cm)</label>
            <input
              type="number"
              value={heightCm}
              onChange={(e) => setHeightCm(Number(e.target.value))}
              className={`w-full rounded-xl p-2.5 text-sm font-bold ${inputBg}`}
            />
          </div>
          <div>
            <label className={`block text-xs mb-1 ${textSub}`}>Tuổi</label>
            <input
              type="number"
              value={age}
              onChange={(e) => setAge(Number(e.target.value))}
              className={`w-full rounded-xl p-2.5 text-sm font-bold ${inputBg}`}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={`block text-xs mb-1 ${textSub}`}>Cân nặng hiện tại (kg)</label>
            <input
              type="number"
              value={currentWeight}
              onChange={(e) => setCurrentWeight(Number(e.target.value))}
              className={`w-full rounded-xl p-2.5 text-sm text-emerald-500 font-bold ${inputBg}`}
            />
          </div>
          <div>
            <label className={`block text-xs mb-1 ${textSub}`}>Cân nặng mục tiêu (kg)</label>
            <input
              type="number"
              value={targetWeight}
              onChange={(e) => setTargetWeight(Number(e.target.value))}
              className={`w-full rounded-xl p-2.5 text-sm text-teal-500 font-bold ${inputBg}`}
            />
          </div>
        </div>

        <div>
          <label className={`block text-xs mb-1 ${textSub}`}>Mục tiêu sức khỏe</label>
          <select
            value={goal}
            onChange={(e) => setGoal(e.target.value as any)}
            className={`w-full rounded-xl p-2.5 text-xs ${inputBg}`}
          >
            <option value="weight_loss">Giảm Cân / Siết Mỡ (-400 kcal)</option>
            <option value="muscle_gain">Tăng Cơ / Tăng Cân (+300 kcal)</option>
            <option value="maintain">Duy Trì Vóc Dáng (Bằng TDEE)</option>
          </select>
        </div>

        <div>
          <label className={`block text-xs mb-1 ${textSub}`}>Mục tiêu Calorie mỗi ngày (kcal)</label>
          <input
            type="number"
            value={calorieTarget}
            onChange={(e) => setCalorieTarget(Number(e.target.value))}
            className={`w-full rounded-xl p-2.5 text-sm text-amber-500 font-bold ${inputBg}`}
          />
        </div>

        <div>
          <label className={`block text-xs mb-1 ${textSub}`}>Dị ứng thực phẩm / Ngân sách ăn uống</label>
          <input
            type="text"
            placeholder="Ví dụ: Dị ứng hải sản, Ngân sách 100k/ngày..."
            value={dietPref}
            onChange={(e) => setDietPref(e.target.value)}
            className={`w-full rounded-xl p-2.5 text-xs ${inputBg}`}
          />
        </div>

        <div className="pt-2 flex space-x-3">
          <button
            type="submit"
            disabled={saving}
            className="flex-1 bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 font-bold py-3 rounded-xl shadow-lg shadow-emerald-500/20 text-xs flex items-center justify-center space-x-1.5"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Đang lưu...' : 'Lưu Thay Đổi Hồ Sơ'}</span>
          </button>
          <button
            type="button"
            onClick={onLogout}
            className={`font-semibold py-3 px-4 rounded-xl text-xs flex items-center justify-center space-x-1.5 border ${
              isDark ? 'bg-slate-800 text-rose-400 border-slate-700 hover:bg-slate-700' : 'bg-slate-100 text-rose-600 border-slate-300 hover:bg-slate-200'
            }`}
          >
            <LogOut className="w-4 h-4" />
            <span>Đăng Xuất</span>
          </button>
        </div>
      </form>

    </div>
  );
};
