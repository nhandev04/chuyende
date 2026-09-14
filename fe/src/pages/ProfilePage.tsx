import React, { useState, useEffect } from 'react';

import { api } from '../services/api';
import type { User, UserProfile, SubscriptionStatusOut } from '../types';
import { Save, LogOut, CheckCircle2, Sliders, Crown, Calendar, Zap, ShieldCheck, Camera } from 'lucide-react';

interface ProfilePageProps {
  user: User | null;
  profile: UserProfile | null;
  onUpdateProfile: (updated: UserProfile) => void;
  onLogout: () => void;
  onOpenSubscription?: () => void;
  theme?: 'dark' | 'light';
}

export const ProfilePage: React.FC<ProfilePageProps> = ({
  user,
  profile,
  onUpdateProfile,
  onLogout,
  onOpenSubscription,
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
  const [subStatus, setSubStatus] = useState<SubscriptionStatusOut | null>(null);

  const [avatarUrl, setAvatarUrl] = useState<string | null>(user?.avatar_url || profile?.avatar_url || null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  useEffect(() => {
    if (user?.avatar_url) {
      setAvatarUrl(user.avatar_url);
    }
  }, [user]);

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0] || !user?.user_id) return;
    const file = e.target.files[0];
    setUploadingAvatar(true);
    try {
      const res = await api.uploadAvatar(user.user_id, file);
      setAvatarUrl(res.avatar_url);
      if (user) {
        user.avatar_url = res.avatar_url;
      }
    } catch (err: any) {
      alert(err.message || "Failed to upload avatar");
    } finally {
      setUploadingAvatar(false);
    }
  };

  useEffect(() => {
    if (user?.user_id) {
      api.getSubscriptionStatus(user.user_id).then(setSubStatus).catch(() => null);
    }
  }, [user]);


  useEffect(() => {
    if (profile) {
      setHeightCm(profile.height_cm);
      setCurrentWeight(profile.current_weight_kg);
      setTargetWeight(profile.target_weight_kg);
      setAge(profile.age);
      setGoal(profile.goal || 'weight_loss');
      setCalorieTarget(profile.daily_calorie_target || 2000);
      setDietPref(profile.dietary_preferences || '');
    }
  }, [profile]);



  if (!user) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center space-y-4">
        <h3 className="text-xl font-bold">Personal Health Profile</h3>
        <p className="text-sm text-slate-400">Please sign in to view and customize your daily calorie targets, fitness goals, and preferences.</p>
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

  const isDark = theme === 'dark';
  const cardBg = isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200';
  const textMain = isDark ? 'text-white' : 'text-slate-900';
  const textSub = isDark ? 'text-slate-400' : 'text-slate-500';
  const inputBg = isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900';


  return (
    <div className={`space-y-6 pb-24 max-w-2xl mx-auto px-4 pt-4 ${textMain}`}>

      {/* Header Profile Summary */}
      <div className={`border rounded-3xl p-6 shadow-2xl text-center relative overflow-hidden ${cardBg}`}>
        <div className="relative w-24 h-24 mx-auto mb-3 group">
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt={user?.full_name || "Avatar"}
              className="w-24 h-24 rounded-full object-cover border-2 border-emerald-500 shadow-xl shadow-emerald-500/20"
            />
          ) : (
            <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-emerald-500 to-teal-400 text-slate-950 font-black text-4xl flex items-center justify-center shadow-lg shadow-emerald-500/20 border-2 border-emerald-400">
              {user?.full_name ? user.full_name[0].toUpperCase() : 'U'}
            </div>
          )}

          {/* Camera Upload Button Overlay */}
          <label
            title="Upload profile picture"
            className="absolute bottom-0 right-0 bg-slate-900 border border-slate-700 p-2 rounded-full cursor-pointer text-emerald-400 hover:text-white hover:bg-emerald-600 transition shadow-lg group-hover:scale-110"
          >
            <Camera className="w-4 h-4" />
            <input
              type="file"
              accept="image/*"
              onChange={handleAvatarChange}
              disabled={uploadingAvatar}
              className="hidden"
            />
          </label>
        </div>
        {uploadingAvatar && (
          <p className="text-[11px] text-emerald-400 animate-pulse font-bold mb-2">Uploading avatar to Cloudinary...</p>
        )}

        <h2 className={`text-xl font-black ${textMain}`}>{user?.full_name || 'Health AI User'}</h2>
        <p className={`text-xs mt-0.5 ${textSub}`}>{user?.email}</p>
        <span className={`inline-block text-[10px] font-bold px-3 py-1 rounded-full mt-2 border ${isDark ? 'bg-slate-800 text-emerald-400 border-slate-700' : 'bg-emerald-50 text-emerald-600 border-emerald-200'
          }`}>
          {user?.role === 'admin' ? 'Administrator Account (Admin)' : 'Standard User Account'}
        </span>
      </div>

      {/* Subscription Tier & Expiration Date Card */}
      <div className={`border rounded-3xl p-5 shadow-xl relative overflow-hidden ${user?.role === 'admin'
          ? 'bg-gradient-to-r from-slate-900 via-amber-950/40 to-slate-900 border-amber-500/40'
          : user?.plan === 'pro'
            ? 'bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border-indigo-500/40'
            : user?.plan === 'plus'
              ? 'bg-gradient-to-r from-slate-900 via-emerald-950/40 to-slate-900 border-emerald-500/40'
              : cardBg
        }`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold ${user?.role === 'admin' || user?.plan === 'pro' ? 'bg-amber-500/20 text-amber-400' : user?.plan === 'plus' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-700/40 text-slate-400'
              }`}>
              {user?.role === 'admin' ? <ShieldCheck className="w-6 h-6" /> : user?.plan === 'pro' ? <Crown className="w-6 h-6 fill-amber-400 text-amber-400" /> : user?.plan === 'plus' ? <Zap className="w-6 h-6" /> : <Calendar className="w-6 h-6" />}
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">CURRENT SUBSCRIPTION PLAN</span>
              <h3 className={`text-base font-extrabold flex items-center gap-2 ${textMain}`}>
                {user?.role === 'admin' ? 'ADMINISTRATOR TIER' : (user?.plan || 'STANDARD').toUpperCase() + ' TIER'}
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${user?.role === 'admin' || user?.plan === 'pro' ? 'bg-amber-500/20 text-amber-400' : user?.plan === 'plus' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-700/50 text-slate-400'
                  }`}>
                  {subStatus?.subscription_status || 'Active'}
                </span>
              </h3>
            </div>
          </div>

          {onOpenSubscription && (
            <button
              type="button"
              onClick={onOpenSubscription}
              className="px-3.5 py-2 bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 font-black text-xs rounded-xl shadow-md transition hover:scale-105"
            >
              Manage / Upgrade
            </button>
          )}
        </div>

        {/* Expiration Details */}
        <div className={`mt-4 pt-3 border-t text-xs flex items-center justify-between ${isDark ? 'border-slate-800/80 text-slate-300' : 'border-slate-200 text-slate-600'}`}>
          <div className="flex items-center space-x-1.5">
            <Calendar className="w-4 h-4 text-emerald-400" />
            <span>
              {user?.role === 'admin' ? (
                <strong className="text-amber-400">Unlimited System Access (No Expiration)</strong>
              ) : subStatus?.subscription_expires_at ? (
                <>
                  Valid until: <strong className="text-emerald-400">{new Date(subStatus.subscription_expires_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</strong>
                </>
              ) : (
                <span className="text-slate-400">Lifetime Standard Free Tier (No expiration)</span>
              )}
            </span>
          </div>

          {subStatus?.subscription_expires_at && user?.role !== 'admin' && (
            <span className="text-[11px] font-bold text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-lg border border-amber-500/20">
              {Math.max(0, Math.ceil((new Date(subStatus.subscription_expires_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))} days remaining
            </span>
          )}
        </div>
      </div>


      {savedSuccess && (
        <div className="bg-emerald-500/10 border border-emerald-500/30 p-3.5 rounded-2xl text-center text-xs text-emerald-500 flex items-center justify-center space-x-2 animate-fadeIn">
          <CheckCircle2 className="w-4 h-4" />
          <span>Profile settings saved successfully! Daily calorie target & BMI updated.</span>
        </div>
      )}

      {/* Edit Form */}
      <form onSubmit={handleSave} className={`border rounded-3xl p-6 shadow-xl space-y-4 ${cardBg}`}>
        <div className={`flex items-center space-x-2 pb-3 border-b ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
          <Sliders className="w-5 h-5 text-emerald-500" />
          <h3 className={`font-extrabold text-sm ${textMain}`}>Health Metrics & Fitness Goals</h3>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={`block text-xs mb-1 ${textSub}`}>Height (cm)</label>
            <input
              type="number"
              value={heightCm}
              onChange={(e) => setHeightCm(Number(e.target.value))}
              className={`w-full rounded-xl p-2.5 text-sm font-bold ${inputBg}`}
            />
          </div>
          <div>
            <label className={`block text-xs mb-1 ${textSub}`}>Age</label>
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
            <label className={`block text-xs mb-1 ${textSub}`}>Current Weight (kg)</label>
            <input
              type="number"
              value={currentWeight}
              onChange={(e) => setCurrentWeight(Number(e.target.value))}
              className={`w-full rounded-xl p-2.5 text-sm text-emerald-500 font-bold ${inputBg}`}
            />
          </div>
          <div>
            <label className={`block text-xs mb-1 ${textSub}`}>Target Weight (kg)</label>
            <input
              type="number"
              value={targetWeight}
              onChange={(e) => setTargetWeight(Number(e.target.value))}
              className={`w-full rounded-xl p-2.5 text-sm text-teal-500 font-bold ${inputBg}`}
            />
          </div>
        </div>

        <div>
          <label className={`block text-xs mb-1 ${textSub}`}>Primary Fitness Goal</label>
          <select
            value={goal}
            onChange={(e) => setGoal(e.target.value as any)}
            className={`w-full rounded-xl p-2.5 text-xs ${inputBg}`}
          >
            <option value="weight_loss">Weight Loss / Cut (-400 kcal)</option>
            <option value="muscle_gain">Muscle Gain / Bulk (+300 kcal)</option>
            <option value="maintain">Maintain Fitness (Balanced calories)</option>
          </select>
        </div>

        <div>
          <label className={`block text-xs mb-1 ${textSub}`}>Daily Calorie Target (kcal)</label>
          <input
            type="number"
            value={calorieTarget}
            onChange={(e) => setCalorieTarget(Number(e.target.value))}
            className={`w-full rounded-xl p-2.5 text-sm text-amber-500 font-bold ${inputBg}`}
          />
        </div>

        <div>
          <label className={`block text-xs mb-1 ${textSub}`}>Food Allergies / Dietary Preferences</label>
          <input
            type="text"
            placeholder="e.g., Seafood allergy, Vegan, Diabetes, High blood fat..."
            value={dietPref}
            onChange={(e) => setDietPref(e.target.value)}
            className={`w-full rounded-xl p-2.5 text-xs ${inputBg}`}
          />
          <div className="flex flex-wrap gap-1.5 mt-2">
            {[
              { label: '🥗 Vegan', value: 'Vegan' },
              { label: '🩸 Diabetes', value: 'Diabetes' },
              { label: '🫀 High Blood Fat', value: 'High blood fat' },
              { label: '🦐 Seafood Allergy', value: 'Seafood allergy' },
              { label: '🥛 Dairy / Lactose Allergy', value: 'Dairy/Lactose allergy' },
            ].map((tag) => {
              const isSelected = dietPref.toLowerCase().includes(tag.value.toLowerCase());
              return (
                <button
                  key={tag.value}
                  type="button"
                  onClick={() => {
                    const current = dietPref.trim();
                    if (!current) {
                      setDietPref(tag.value);
                    } else if (isSelected) {
                      const parts = current
                        .split(',')
                        .map(p => p.trim())
                        .filter(p => !p.toLowerCase().includes(tag.value.toLowerCase()));
                      setDietPref(parts.join(', '));
                    } else {
                      setDietPref(`${current}, ${tag.value}`);
                    }
                  }}
                  className={`text-[11px] px-2.5 py-1 rounded-lg font-medium transition-all ${isSelected
                      ? 'bg-emerald-500 text-slate-950 font-bold shadow-sm shadow-emerald-500/30'
                      : isDark
                        ? 'bg-slate-800/80 text-slate-300 hover:bg-slate-700/80 border border-slate-700/60'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200'
                    }`}
                >
                  {tag.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="pt-2 flex space-x-3">
          <button
            type="submit"
            disabled={saving}
            className="flex-1 bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 font-bold py-3 rounded-xl shadow-lg shadow-emerald-500/20 text-xs flex items-center justify-center space-x-1.5"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Saving...' : 'Save Profile Changes'}</span>
          </button>
          <button
            type="button"
            onClick={onLogout}
            className={`font-semibold py-3 px-4 rounded-xl text-xs flex items-center justify-center space-x-1.5 border ${isDark ? 'bg-slate-800 text-rose-400 border-slate-700 hover:bg-slate-700' : 'bg-slate-100 text-rose-600 border-slate-300 hover:bg-slate-200'
              }`}
          >
            <LogOut className="w-4 h-4" />
            <span>Logout</span>
          </button>
        </div>
      </form>


    </div>
  );
};
