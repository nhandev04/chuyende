import React, { useState } from 'react';
import type { UserProfile, BodyAnalysisResult } from '../types';
import { api } from '../services/api';
import { Upload, Camera, Sparkles } from 'lucide-react';

interface OnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: number;
  onSaveProfile: (profile: UserProfile) => void;
}

export const OnboardingModal: React.FC<OnboardingModalProps> = ({
  isOpen,
  onClose,
  userId,
  onSaveProfile
}) => {
  const [step, setStep] = useState<1 | 2>(1);
  const [heightCm, setHeightCm] = useState(170);
  const [currentWeightKg, setCurrentWeightKg] = useState(65);
  const [targetWeightKg, setTargetWeightKg] = useState(60);
  const [age, setAge] = useState(22);
  const [gender] = useState<'male' | 'female'>('male');
  const [activityLevel, setActivityLevel] = useState<'sedentary' | 'light' | 'moderate' | 'active'>('moderate');
  const [goal, setGoal] = useState<'weight_loss' | 'muscle_gain' | 'maintain'>('weight_loss');
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [analyzingPhoto, setAnalyzingPhoto] = useState(false);
  const [aiBodyAnalysis, setAiBodyAnalysis] = useState<BodyAnalysisResult | null>(null);

  if (!isOpen) return null;

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setPhotoPreview(URL.createObjectURL(file));

      // Trigger AI body shape estimation
      setAnalyzingPhoto(true);
      const formData = new FormData();
      formData.append('height_cm', heightCm.toString());
      formData.append('weight_kg', currentWeightKg.toString());
      formData.append('age', age.toString());
      formData.append('gender', gender);
      formData.append('goal', goal);
      formData.append('body_image', file);

      const res = await api.analyzeBodyPose(formData);
      setAiBodyAnalysis(res);
      setAnalyzingPhoto(false);
    }
  };

  const handleFinish = async () => {
    const updated = await api.updateProfile(userId, {
      height_cm: heightCm,
      current_weight_kg: currentWeightKg,
      target_weight_kg: targetWeightKg,
      age: age,
      gender: gender,
      activity_level: activityLevel,
      goal: goal,
    });
    onSaveProfile(updated);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fadeIn">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-lg p-6 shadow-2xl text-white max-h-[90vh] overflow-y-auto">
        
        {/* Progress Header */}
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-800">
          <div>
            <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">Khởi tạo Hồ Sơ</span>
            <h2 className="text-lg font-extrabold text-white">Bước {step} trên 2: {step === 1 ? 'Chỉ số cơ thể' : 'Phân tích vóc dáng AI'}</h2>
          </div>
          <div className="flex space-x-1.5">
            <div className={`w-8 h-2 rounded-full ${step >= 1 ? 'bg-emerald-500' : 'bg-slate-800'}`} />
            <div className={`w-8 h-2 rounded-full ${step >= 2 ? 'bg-emerald-500' : 'bg-slate-800'}`} />
          </div>
        </div>

        {step === 1 ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-slate-400 mb-1">Chiều cao (cm)</label>
                <input
                  type="number"
                  value={heightCm}
                  onChange={(e) => setHeightCm(Number(e.target.value))}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-sm text-emerald-400 font-bold"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Cân nặng hiện tại (kg)</label>
                <input
                  type="number"
                  value={currentWeightKg}
                  onChange={(e) => setCurrentWeightKg(Number(e.target.value))}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-sm text-emerald-400 font-bold"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-slate-400 mb-1">Cân nặng mục tiêu (kg)</label>
                <input
                  type="number"
                  value={targetWeightKg}
                  onChange={(e) => setTargetWeightKg(Number(e.target.value))}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-sm text-teal-400 font-bold"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Tuổi</label>
                <input
                  type="number"
                  value={age}
                  onChange={(e) => setAge(Number(e.target.value))}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-sm text-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs text-slate-400 mb-1">Mục tiêu chính</label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'weight_loss', label: 'Giảm Cân / Siết Mỡ' },
                  { id: 'muscle_gain', label: 'Tăng Cơ / Tăng Cân' },
                  { id: 'maintain', label: 'Duy Trì Vóc Dáng' }
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setGoal(item.id as any)}
                    className={`py-2 px-2 text-xs font-semibold rounded-xl border text-center transition-all ${
                      goal === item.id 
                        ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300' 
                        : 'bg-slate-800 border-slate-700 text-slate-400'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs text-slate-400 mb-1">Mức độ vận động hàng ngày</label>
              <select
                value={activityLevel}
                onChange={(e) => setActivityLevel(e.target.value as any)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-xs text-white"
              >
                <option value="sedentary">Ít vận động (Ngồi văn phòng, không tập thể thao)</option>
                <option value="light">Vận động nhẹ (Tập nhẹ 1-3 ngày/tuần)</option>
                <option value="moderate">Vận động vừa (Tập 3-5 ngày/tuần)</option>
                <option value="active">Năng động cao (Tập nặng 6-7 ngày/tuần)</option>
              </select>
            </div>

            <button
              onClick={() => setStep(2)}
              className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold py-3 rounded-xl shadow-lg shadow-emerald-500/20 transition-all mt-4"
            >
              Tiếp Theo: Phân Tích Hình Thể AI →
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-xs text-slate-400">
              Tải lên ảnh chụp toàn thân hoặc nửa người để AI (Pose / Body shape estimator) ước tính sơ bộ tỷ lệ mỡ và phom dáng.
            </p>

            {/* Photo Upload Zone */}
            <div className="border-2 border-dashed border-slate-700 hover:border-emerald-500/50 rounded-2xl p-4 text-center bg-slate-800/40 relative">
              {photoPreview ? (
                <div className="relative inline-block">
                  <img src={photoPreview} alt="Body" className="h-40 rounded-xl object-cover border border-slate-700" />
                  <label className="absolute bottom-2 right-2 bg-slate-950/80 p-2 rounded-full cursor-pointer text-emerald-400">
                    <Camera className="w-4 h-4" />
                    <input type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
                  </label>
                </div>
              ) : (
                <label className="cursor-pointer block py-4">
                  <Upload className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
                  <span className="text-xs font-semibold text-slate-300">Chạm để chọn hoặc chụp ảnh Body</span>
                  <span className="block text-[10px] text-slate-500 mt-1">(Tùy chọn - Có thể bỏ qua)</span>
                  <input type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
                </label>
              )}
            </div>

            {/* AI Estimation Result Display */}
            {analyzingPhoto && (
              <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl text-center text-xs text-emerald-400 animate-pulse">
                <Sparkles className="w-5 h-5 mx-auto mb-1" />
                AI đang trích xuất khung hình và ước tính chỉ số TDEE/BMI...
              </div>
            )}

            {aiBodyAnalysis && !analyzingPhoto && (
              <div className="p-4 bg-slate-800/80 border border-slate-700 rounded-2xl space-y-2 text-xs">
                <div className="flex items-center justify-between font-bold text-emerald-400">
                  <span>Dạng cơ thể: {aiBodyAnalysis.body_shape}</span>
                  <span>TDEE ước tính: {aiBodyAnalysis.tdee} kcal</span>
                </div>
                <div className="text-slate-300 leading-relaxed">
                  {aiBodyAnalysis.recommendation}
                </div>
              </div>
            )}

            <div className="flex space-x-3 pt-2">
              <button
                onClick={() => setStep(1)}
                className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold py-3 rounded-xl"
              >
                ← Quay lại
              </button>
              <button
                onClick={handleFinish}
                className="flex-1 bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 font-bold py-3 rounded-xl shadow-lg shadow-emerald-500/20"
              >
                Hoàn Tất & Lưu →
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
