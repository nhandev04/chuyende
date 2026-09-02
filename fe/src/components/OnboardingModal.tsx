import React, { useState, useEffect } from "react";
import type { UserProfile, BodyAnalysisResult } from "../types";
import { api } from "../services/api";
import { Upload, Camera, Sparkles, X, Edit3 } from "lucide-react";

interface OnboardingModalProps {
    isOpen: boolean;
    onClose: () => void;
    userId: number;
    currentProfile?: UserProfile | null;
    onSaveProfile: (profile: UserProfile) => void;
    onOpenSubscription?: () => void;
}

export const OnboardingModal: React.FC<OnboardingModalProps> = ({
    isOpen,
    onClose,
    userId,
    currentProfile,
    onSaveProfile,
    onOpenSubscription
}) => {
    const [method, setMethod] = useState<"manual" | "ai">("manual");

    // Physical stats
    const [heightCm, setHeightCm] = useState(170);
    const [currentWeightKg, setCurrentWeightKg] = useState(65);
    const [targetWeightKg, setTargetWeightKg] = useState(60);
    const [age, setAge] = useState(22);
    const [gender, setGender] = useState<"male" | "female">("male");
    const [activityLevel, setActivityLevel] = useState<"sedentary" | "light" | "moderate" | "active">("moderate");
    const [goal, setGoal] = useState<"weight_loss" | "muscle_gain" | "maintain">("weight_loss");

    // Fetch fresh profile state from API whenever modal opens
    useEffect(() => {
        if (isOpen && userId) {
            api.getProfile(userId).then(p => {
                if (p) {
                    setHeightCm(p.height_cm || 170);
                    setCurrentWeightKg(p.current_weight_kg || 65);
                    setTargetWeightKg(p.target_weight_kg || 60);
                    setAge(p.age || 22);
                    setGender((p.gender as any) || "male");
                    setActivityLevel((p.activity_level as any) || "moderate");
                    setGoal((p.goal as any) || "weight_loss");
                }
            }).catch(() => {
                if (currentProfile) {
                    setHeightCm(currentProfile.height_cm || 170);
                    setCurrentWeightKg(currentProfile.current_weight_kg || 65);
                    setTargetWeightKg(currentProfile.target_weight_kg || 60);
                    setAge(currentProfile.age || 22);
                    setGender((currentProfile.gender as any) || "male");
                    setActivityLevel((currentProfile.activity_level as any) || "moderate");
                    setGoal((currentProfile.goal as any) || "weight_loss");
                }
            });
        }
    }, [isOpen, userId]);


    // AI Photo State
    const [photoPreview, setPhotoPreview] = useState<string | null>(null);
    const [analyzingPhoto, setAnalyzingPhoto] = useState(false);
    const [aiBodyAnalysis, setAiBodyAnalysis] = useState<BodyAnalysisResult | null>(null);
    const [aiError, setAiError] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);


    if (!isOpen) return null;

    const handleClose = () => {
        // Reset all transient photo/analysis states without saving
        setPhotoPreview(null);
        setAiBodyAnalysis(null);
        setAnalyzingPhoto(false);
        setAiError(null);
        onClose();
    };

    const handleClearPhoto = () => {
        setPhotoPreview(null);
        setAiBodyAnalysis(null);
        setAnalyzingPhoto(false);
        setAiError(null);
    };

    const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setPhotoPreview(URL.createObjectURL(file));

            setAnalyzingPhoto(true);
            setAiError(null);
            const formData = new FormData();
            formData.append("age", age.toString());
            formData.append("gender", gender);
            formData.append("goal", goal);
            formData.append("body_image", file);

            try {
                const res = await api.analyzeBodyPose(formData);
                setAiBodyAnalysis(res);

                if (res.height_cm) setHeightCm(res.height_cm);
                if (res.weight_kg) setCurrentWeightKg(res.weight_kg);
            } catch (err: any) {
                setAiBodyAnalysis(null);
                setAiError(
                    err?.response?.data?.detail ||
                        "❌ Không nhận diện được cơ thể từ ảnh này. Vui lòng chọn ảnh toàn thân rõ ràng, chụp thẳng từ đầu tới chân.",
                );
            } finally {
                setAnalyzingPhoto(false);
            }
        }
    };

    const handleFinish = async () => {
        setSaving(true);
        const updated = await api.updateProfile(userId, {
            height_cm: heightCm,
            current_weight_kg: currentWeightKg,
            target_weight_kg: targetWeightKg,
            age: age,
            gender: gender,
            activity_level: activityLevel,
            goal: goal,
            body_shape: aiBodyAnalysis?.body_shape,
        });
        onSaveProfile(updated);
        setSaving(false);
        handleClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fadeIn">
            <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-lg p-6 shadow-2xl text-white max-h-[90vh] overflow-y-auto relative">
                {/* Close Button (Resets info without saving) */}
                <button
                    onClick={handleClose}
                    className="absolute top-4 right-4 text-slate-400 hover:text-rose-400 p-2 rounded-full hover:bg-slate-800 transition-colors"
                    title="Close (Without saving)"
                >
                    <X className="w-5 h-5" />
                </button>

                {/* Header */}
                <div className="mb-4 pr-8">
                    <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
                        Biometrics & Physical Setup
                    </span>
                    <h2 className="text-lg font-extrabold text-white">Body Profile & Fitness Configuration</h2>
                </div>

                {/* Method Selector Tabs: 1. Manual Input | 2. AI Photo Analysis */}
                <div className="flex bg-slate-800/80 p-1 rounded-2xl mb-5">
                    <button
                        onClick={() => setMethod("manual")}
                        className={`flex-1 py-2 text-xs font-bold rounded-xl flex items-center justify-center space-x-1.5 transition-all ${
                            method === "manual"
                                ? "bg-emerald-500 text-slate-950 shadow-md"
                                : "text-slate-400 hover:text-white"
                        }`}
                    >
                        <Edit3 className="w-4 h-4" />
                        <span>1. Manual Input</span>
                    </button>
                    <button
                        onClick={() => setMethod("ai")}
                        className={`flex-1 py-2 text-xs font-bold rounded-xl flex items-center justify-center space-x-1.5 transition-all ${
                            method === "ai"
                                ? "bg-emerald-500 text-slate-950 shadow-md"
                                : "text-slate-400 hover:text-white"
                        }`}
                    >
                        <Sparkles className="w-4 h-4" />
                        <span>2. AI Photo Analysis</span>
                    </button>
                </div>

                {/* METHOD 1: MANUAL INPUT FORM */}
                {method === "manual" && (
                    <div className="space-y-4 animate-fadeIn">
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block text-xs text-slate-400 mb-1">Height (cm)</label>
                                <input
                                    type="number"
                                    value={heightCm}
                                    onChange={(e) => setHeightCm(Number(e.target.value))}
                                    className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-sm text-emerald-400 font-bold"
                                />
                            </div>
                            <div>
                                <label className="block text-xs text-slate-400 mb-1">Current Weight (kg)</label>
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
                                <label className="block text-xs text-slate-400 mb-1">Target Weight (kg)</label>
                                <input
                                    type="number"
                                    value={targetWeightKg}
                                    onChange={(e) => setTargetWeightKg(Number(e.target.value))}
                                    className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-sm text-teal-400 font-bold"
                                />
                            </div>
                            <div>
                                <label className="block text-xs text-slate-400 mb-1">Age</label>
                                <input
                                    type="number"
                                    value={age}
                                    onChange={(e) => setAge(Number(e.target.value))}
                                    className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-sm text-white"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs text-slate-400 mb-1">Gender</label>
                            <div className="grid grid-cols-2 gap-2">
                                {[
                                    { id: "male", label: "👨 Male" },
                                    { id: "female", label: "👩 Female" },
                                ].map((item) => (
                                    <button
                                        key={item.id}
                                        type="button"
                                        onClick={() => setGender(item.id as any)}
                                        className={`py-2 text-xs font-bold rounded-xl border text-center transition-all ${
                                            gender === item.id
                                                ? "bg-emerald-500/20 border-emerald-500 text-emerald-300"
                                                : "bg-slate-800 border-slate-700 text-slate-400"
                                        }`}
                                    >
                                        {item.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs text-slate-400 mb-1">Primary Fitness Goal</label>
                            <div className="grid grid-cols-3 gap-2">
                                {[
                                    { id: "weight_loss", label: "Weight Loss / Cut" },
                                    { id: "muscle_gain", label: "Muscle Gain / Bulk" },
                                    { id: "maintain", label: "Maintain Fitness" },
                                ].map((item) => (
                                    <button
                                        key={item.id}
                                        type="button"
                                        onClick={() => setGoal(item.id as any)}
                                        className={`py-2 px-2 text-xs font-semibold rounded-xl border text-center transition-all ${
                                            goal === item.id
                                                ? "bg-emerald-500/20 border-emerald-500 text-emerald-300"
                                                : "bg-slate-800 border-slate-700 text-slate-400"
                                        }`}
                                    >
                                        {item.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs text-slate-400 mb-1">Daily Activity Level</label>
                            <select
                                value={activityLevel}
                                onChange={(e) => setActivityLevel(e.target.value as any)}
                                className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-xs text-white"
                            >
                                <option value="sedentary">Sedentary (Desk job, minimal exercise)</option>
                                <option value="light">Light Activity (Workouts 1-3 days/week)</option>
                                <option value="moderate">Moderate Activity (Workouts 3-5 days/week)</option>
                                <option value="active">High Activity (Intense workouts 6-7 days/week)</option>
                            </select>
                        </div>

                        <button
                            onClick={handleFinish}
                            disabled={saving}
                            className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold py-3 rounded-xl shadow-lg shadow-emerald-500/20 transition-all mt-4"
                        >
                            {saving ? "Saving..." : "Save & Initialize Profile →"}
                        </button>
                    </div>
                )}

                {/* METHOD 2: AI CAMERA SCAN METHOD */}
                {method === "ai" && (
                    <div className="space-y-4 animate-fadeIn">
                        <div className="p-3 bg-indigo-950/60 border border-indigo-500/30 rounded-2xl flex items-center justify-between text-xs">
                            <span className="text-indigo-200">✨ AI YOLO Pose 17 Keypoints Feature (Pro Tier Exclusive)</span>
                            {onOpenSubscription && (
                                <button
                                    onClick={onOpenSubscription}
                                    className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-bold text-[11px] shrink-0"
                                >
                                    Upgrade Pro
                                </button>
                            )}
                        </div>
                        <p className="text-xs text-slate-400">
                            Upload a clear full-body photo to estimate height, weight, and 10-level BMI scale from YOLO pose skeleton keypoints.
                        </p>


                        {aiError && (
                            <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-300">
                                {aiError}
                            </div>
                        )}

                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block text-xs text-slate-400 mb-1">
                                    Height (cm) (Auto-updated by photo)
                                </label>
                                <input
                                    type="number"
                                    value={heightCm}
                                    onChange={(e) => setHeightCm(Number(e.target.value))}
                                    className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2 text-xs text-emerald-400 font-bold"
                                />
                            </div>
                            <div>
                                <label className="block text-xs text-slate-400 mb-1">
                                    Weight (kg) (Auto-updated by photo)
                                </label>
                                <input
                                    type="number"
                                    value={currentWeightKg}
                                    onChange={(e) => setCurrentWeightKg(Number(e.target.value))}
                                    className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2 text-xs text-emerald-400 font-bold"
                                />
                            </div>
                        </div>

                        {/* Photo Upload Zone */}
                        <div className="border-2 border-dashed border-slate-700 hover:border-emerald-500/50 rounded-2xl p-4 text-center bg-slate-800/40 relative">
                            {photoPreview ? (
                                <div className="relative inline-block">
                                    <img
                                        src={photoPreview}
                                        alt="Body"
                                        className="h-44 rounded-xl object-cover border border-slate-700"
                                    />
                                    {/* Remove photo button */}
                                    <button
                                        onClick={handleClearPhoto}
                                        className="absolute -top-2 -right-2 bg-rose-500 hover:bg-rose-600 text-white p-1.5 rounded-full shadow-lg transition-colors"
                                        title="Remove photo"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                    <label className="absolute bottom-2 right-2 bg-slate-950/80 p-2 rounded-full cursor-pointer text-emerald-400">
                                        <Camera className="w-4 h-4" />
                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={handlePhotoUpload}
                                            className="hidden"
                                        />
                                    </label>
                                </div>
                            ) : (
                                <label className="cursor-pointer block py-5">
                                    <Upload className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
                                    <span className="text-xs font-semibold text-slate-300">
                                        Tap to select or capture full-body photo for AI Pose
                                    </span>
                                    <span className="block text-[10px] text-slate-500 mt-1">
                                        YOLO Pose extracts 17 skeleton keypoints & calculates dynamic BMI
                                    </span>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={handlePhotoUpload}
                                        className="hidden"
                                    />
                                </label>
                            )}
                        </div>

                        {/* AI Estimation Result Display */}
                        {analyzingPhoto && (
                            <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl text-center text-xs text-emerald-400 animate-pulse">
                                <Sparkles className="w-5 h-5 mx-auto mb-1" />
                                AI YOLO Pose is extracting 17 skeleton keypoints & analyzing 10-level BMI scale...
                            </div>
                        )}

                        {aiBodyAnalysis && !analyzingPhoto && (
                            <div className="p-4 bg-slate-800/80 border border-emerald-500/30 rounded-2xl space-y-3 text-xs">
                                <div className="flex items-center justify-between font-bold text-emerald-400">
                                    <span>AI Body Shape: {aiBodyAnalysis.body_shape}</span>
                                    <span>TDEE: {aiBodyAnalysis.tdee} kcal</span>
                                </div>

                                {aiBodyAnalysis.bmi_level && (
                                    <div className="bg-slate-900/90 p-2.5 rounded-xl border border-slate-700">
                                        <div className="flex items-center justify-between text-xs mb-1.5 font-bold">
                                            <span className="text-amber-400">📊 BMI Scale: Level {aiBodyAnalysis.bmi_level}/10</span>
                                            <span className="text-emerald-300">{aiBodyAnalysis.bmi_level_label}</span>
                                        </div>
                                        <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden flex">
                                            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((lvl) => (
                                                <div
                                                    key={lvl}
                                                    className={`flex-1 h-full border-r border-slate-900 transition-all ${
                                                        lvl <= (aiBodyAnalysis.bmi_level || 5)
                                                            ? (aiBodyAnalysis.bmi_level || 5) <= 3
                                                                ? "bg-amber-400"
                                                                : (aiBodyAnalysis.bmi_level || 5) <= 5
                                                                  ? "bg-emerald-400"
                                                                  : (aiBodyAnalysis.bmi_level || 5) <= 7
                                                                    ? "bg-orange-400"
                                                                    : "bg-rose-500"
                                                            : "bg-slate-700/50"
                                                    }`}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                )}

                                <div className="text-slate-300 leading-relaxed whitespace-pre-line">
                                    {aiBodyAnalysis.recommendation}
                                </div>
                            </div>
                        )}

                        <button
                            onClick={handleFinish}
                            disabled={saving}
                            className="w-full bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 font-bold py-3 rounded-xl shadow-lg shadow-emerald-500/20 transition-all mt-2"
                        >
                            {saving ? "Saving..." : "Save & Initialize AI Analysis →"}
                        </button>
                    </div>
                )}

            </div>
        </div>
    );
};
