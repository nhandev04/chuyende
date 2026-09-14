import React, { useState } from "react";
import { api } from "../services/api";
import type { User, AIAnalysisResult } from "../types";
import { X, Camera, Upload, Sparkles, AlertTriangle, Edit3, Check, Lock } from "lucide-react";

interface FoodScannerModalProps {
    isOpen: boolean;
    onClose: () => void;
    userId: number;
    user?: User | null;
    onFoodLogged: () => void;
    onOpenSubscription?: () => void;
}

export const FoodScannerModal: React.FC<FoodScannerModalProps> = ({ isOpen, onClose, userId, user, onFoodLogged, onOpenSubscription }) => {
    const [mode, setMode] = useState<"image" | "text">("image");
    const [textPrompt, setTextPrompt] = useState("");
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [isScanning, setIsScanning] = useState(false);
    const [result, setResult] = useState<AIAnalysisResult | null>(null);

    // Editable fields state
    const [mealType, setMealType] = useState<"breakfast" | "lunch" | "dinner" | "snack">("lunch");
    const [editFoodName, setEditFoodName] = useState("");
    const [editWeightG, setEditWeightG] = useState(350);
    const [editCalories, setEditCalories] = useState(420);
    const [editProtein, setEditProtein] = useState(25);
    const [editCarbs, setEditCarbs] = useState(45);
    const [editFat, setEditFat] = useState(14);
    const [reportOpen, setReportOpen] = useState(false);
    const [reportCorrection, setReportCorrection] = useState("");
    const [reportSuccess, setReportSuccess] = useState(false);
    const [scanError, setScanError] = useState<string | null>(null);

    if (!isOpen) return null;

    const isAllowed = user?.role === 'admin' || ['plus', 'pro'].includes(user?.plan || '');

    if (!isAllowed) {
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fadeIn">
                <div className="bg-slate-900 border border-emerald-500/30 rounded-3xl w-full max-w-md p-6 shadow-2xl text-white text-center space-y-4 relative">
                    <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-white p-2 rounded-full hover:bg-slate-800">
                        <X className="w-5 h-5" />
                    </button>
                    <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
                        <Lock className="w-7 h-7" />
                    </div>
                    <h3 className="text-lg font-extrabold text-white">🔒 Plus Tier Required</h3>
                    <p className="text-xs text-slate-300">
                        AI Food Photo Scanning is exclusive to Plus & Pro tier users. Upgrade your subscription plan (~$1/mo) to unlock automated food photo scanning!
                    </p>
                    <button
                        onClick={() => {
                            onClose();
                            if (onOpenSubscription) onOpenSubscription();
                        }}
                        className="w-full bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 font-black text-xs py-3 rounded-xl shadow-lg shadow-emerald-500/20"
                    >
                        Upgrade to Plus / Pro Tier →
                    </button>
                </div>
            </div>
        );
    }


    const handleScan = async (overrideFile?: File) => {
        const fileToScan = overrideFile || imageFile;
        if (mode === "image" && !fileToScan) return;
        if (mode === "text" && !textPrompt.trim()) return;

        setIsScanning(true);
        setResult(null);
        setScanError(null);

        try {
            const formData = new FormData();
            if (mode === "image" && fileToScan) {
                formData.append("food_image", fileToScan);
            }
            if (textPrompt) {
                formData.append("text_prompt", textPrompt);
            }

            const aiRes = await api.analyzeFood(formData);
            setResult(aiRes);
            setEditFoodName(aiRes.food_name);
            setEditWeightG(aiRes.estimated_weight_g);
            setEditCalories(aiRes.calories);
            setEditProtein(aiRes.protein_g);
            setEditCarbs(aiRes.carbs_g);
            setEditFat(aiRes.fat_g);
        } catch (error: any) {
            // Display error message when detection fails
            const errorMsg = error.message || "Food could not be recognized";
            setScanError(errorMsg);
            setResult(null);
        } finally {
            setIsScanning(false);
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setImageFile(file);
            setImagePreview(URL.createObjectURL(file));
            handleScan(file);
        }
    };

    const handleSaveToLog = async () => {
        if (!result) return;
        await api.createFoodLog(userId, {
            meal_type: mealType,
            food_name: editFoodName,
            weight_g: editWeightG,
            calories: editCalories,
            protein_g: editProtein,
            carbs_g: editCarbs,
            fat_g: editFat,
            image_url: result.image_url || imagePreview || undefined,

        });
        onFoodLogged();
        onClose();
    };

    const handleReportError = async () => {
        if (!reportCorrection.trim() || !result) return;
        await api.submitAIReport(userId, result.food_name, reportCorrection);
        setReportSuccess(true);
        setTimeout(() => {
            setReportOpen(false);
            setReportSuccess(false);
        }, 2000);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fadeIn">
            <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-lg p-6 shadow-2xl text-white max-h-[90vh] overflow-y-auto relative">
                {/* Close button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-slate-400 hover:text-white p-2 rounded-full hover:bg-slate-800"
                >
                    <X className="w-5 h-5" />
                </button>

                <div className="flex items-center space-x-3 mb-4">
                    <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center shadow-lg shadow-emerald-500/20">
                        <Sparkles className="w-6 h-6 text-slate-950" />
                    </div>
                    <div>
                        <h2 className="text-lg font-extrabold text-white">AI Food Analyzer</h2>
                        <p className="text-xs text-slate-400">Food recognition & automated calorie quantification</p>
                    </div>
                </div>

                {/* Mode Selector */}
                <div className="flex bg-slate-800/80 p-1 rounded-2xl mb-4">
                    <button
                        onClick={() => {
                            setMode("image");
                            setResult(null);
                            setScanError(null);
                        }}
                        className={`flex-1 py-2 text-xs font-semibold rounded-xl flex items-center justify-center space-x-1.5 transition-all ${mode === "image"
                                ? "bg-emerald-500 text-slate-950 shadow-md"
                                : "text-slate-400 hover:text-white"
                            }`}
                    >
                        <Camera className="w-4 h-4" />
                        <span>Capture / Upload Photo</span>
                    </button>
                    <button
                        onClick={() => {
                            setMode("text");
                            setResult(null);
                            setScanError(null);
                        }}
                        className={`flex-1 py-2 text-xs font-semibold rounded-xl flex items-center justify-center space-x-1.5 transition-all ${mode === "text"
                                ? "bg-emerald-500 text-slate-950 shadow-md"
                                : "text-slate-400 hover:text-white"
                            }`}
                    >
                        <Edit3 className="w-4 h-4" />
                        <span>Enter Text Prompt</span>
                    </button>
                </div>

                {/* Input Zone */}
                {!result && !isScanning && !scanError && (
                    <div className="space-y-4">
                        {mode === "image" ? (
                            <div className="border-2 border-dashed border-slate-700 hover:border-emerald-500/50 rounded-2xl p-6 text-center bg-slate-800/40 relative">
                                {imagePreview ? (
                                    <div className="relative">
                                        <img
                                            src={imagePreview}
                                            alt="Food preview"
                                            className="max-h-48 rounded-xl mx-auto object-cover border border-slate-700"
                                        />
                                        <button
                                            onClick={() => setImagePreview(null)}
                                            className="absolute top-2 right-2 bg-slate-950/80 p-1.5 rounded-full text-slate-400 hover:text-rose-400"
                                        >
                                            <X className="w-4 h-4" />
                                        </button>
                                    </div>
                                ) : (
                                    <label className="cursor-pointer block py-6">
                                        <Upload className="w-10 h-10 text-emerald-400 mx-auto mb-2" />
                                        <span className="text-xs font-semibold text-slate-200">
                                            Tap to select food photo from device or camera
                                        </span>
                                        <span className="block text-[10px] text-slate-500 mt-1">
                                            Supports JPG, PNG, WEBP
                                        </span>
                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={handleFileChange}
                                            className="hidden"
                                        />
                                    </label>
                                )}
                            </div>
                        ) : (
                            <div>
                                <label className="block text-xs text-slate-400 mb-1.5">
                                    Describe your meal in natural language
                                </label>
                                <textarea
                                    rows={3}
                                    placeholder="e.g., 1 bowl of Beef Pho with rare steak and 1 iced green tea"
                                    value={textPrompt}
                                    onChange={(e) => setTextPrompt(e.target.value)}
                                    className="w-full bg-slate-800 border border-slate-700 rounded-2xl p-3 text-sm text-white focus:outline-none focus:border-emerald-500"
                                />
                                <button
                                    onClick={() => handleScan()}
                                    className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold py-3 rounded-xl shadow-lg shadow-emerald-500/20 mt-3"
                                >
                                    Analyze with AI →
                                </button>
                            </div>
                        )}
                    </div>
                )}

                {/* Scanning Loading Animation */}
                {isScanning && (
                    <div className="py-12 text-center space-y-3">
                        <div className="w-14 h-14 border-4 border-emerald-500/20 border-t-emerald-400 rounded-full animate-spin mx-auto" />
                        <p className="text-sm font-bold text-emerald-400">
                            AI is analyzing your food...
                        </p>
                        <p className="text-xs text-slate-400">
                            Estimating portion weight, calories, and nutritional values
                        </p>
                    </div>
                )}

                {/* Error Message Section */}
                {scanError && !isScanning && !result && (
                    <div className="py-8 text-center space-y-4 animate-fadeIn">
                        <div className="bg-rose-500/10 border border-rose-500/30 rounded-2xl p-4 flex items-start space-x-3">
                            <AlertTriangle className="w-5 h-5 text-rose-400 flex-shrink-0 mt-0.5" />
                            <div className="text-left">
                                <p className="text-sm font-semibold text-rose-400">Unable to recognize food</p>
                                <p className="text-xs text-rose-300/80 mt-1">{scanError}</p>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <p className="text-xs text-slate-400">💡 Tips:</p>
                            <ul className="text-xs text-slate-500 space-y-1">
                                <li>• Take a clear, well-lit photo of the meal</li>
                                <li>• Avoid steep camera angles</li>
                                <li>• Or describe the meal using text prompt</li>
                            </ul>
                        </div>
                        <button
                            onClick={() => setScanError(null)}
                            className="w-full bg-slate-800 hover:bg-slate-700 text-white font-semibold py-2 rounded-xl text-sm"
                        >
                            Retry
                        </button>
                    </div>
                )}

                {/* Result Preview & Edit Section */}
                {result && !isScanning && (
                    <div className="space-y-4 animate-fadeIn">
                        {/* Confidence & Image preview */}
                        <div className="flex items-center justify-between bg-slate-800/80 p-3 rounded-2xl border border-slate-700">
                            <div className="flex items-center space-x-2">
                                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                                <span className="text-xs font-semibold text-emerald-400">
                                    AI Confidence: {Math.round(result.confidence_score * 100)}%
                                </span>
                            </div>
                            <button
                                onClick={() => setReportOpen(true)}
                                className="text-[11px] text-amber-400 hover:underline flex items-center space-x-1"
                            >
                                <AlertTriangle className="w-3.5 h-3.5" />
                                <span>Report AI misclassification</span>
                            </button>
                        </div>

                        {/* Meal Type selection */}
                        <div>
                            <label className="block text-xs text-slate-400 mb-1">Meal Type</label>
                            <div className="grid grid-cols-4 gap-2">
                                {[
                                    { key: "breakfast", name: "Breakfast" },
                                    { key: "lunch", name: "Lunch" },
                                    { key: "dinner", name: "Dinner" },
                                    { key: "snack", name: "Snack" },
                                ].map((item) => (
                                    <button
                                        key={item.key}
                                        type="button"
                                        onClick={() => setMealType(item.key as any)}
                                        className={`py-1.5 text-xs font-semibold rounded-xl border transition-all ${mealType === item.key
                                                ? "bg-emerald-500/20 border-emerald-500 text-emerald-300"
                                                : "bg-slate-800 border-slate-700 text-slate-400"
                                            }`}
                                    >
                                        {item.name}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Editable Fields Grid */}
                        <div className="bg-slate-800/50 p-4 rounded-2xl border border-slate-800 space-y-3">
                            <div>
                                <label className="block text-[11px] text-slate-400 mb-1">
                                    Food Name (Editable)
                                </label>
                                <input
                                    type="text"
                                    value={editFoodName}
                                    onChange={(e) => setEditFoodName(e.target.value)}
                                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white font-bold"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-[11px] text-slate-400 mb-1">Portion Weight (g)</label>
                                    <input
                                        type="number"
                                        value={editWeightG}
                                        onChange={(e) => setEditWeightG(Number(e.target.value))}
                                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-emerald-400 font-bold"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[11px] text-slate-400 mb-1">Total Calories (kcal)</label>
                                    <input
                                        type="number"
                                        value={editCalories}
                                        onChange={(e) => setEditCalories(Number(e.target.value))}
                                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-teal-400 font-bold"
                                    />
                                </div>
                            </div>

                            {/* Macros Breakdown */}
                            <div className="grid grid-cols-3 gap-2 pt-1">
                                <div className="bg-slate-900 p-2 rounded-xl border border-slate-800 text-center">
                                    <span className="block text-[10px] text-sky-400 font-semibold">Protein</span>
                                    <input
                                        type="number"
                                        value={editProtein}
                                        onChange={(e) => setEditProtein(Number(e.target.value))}
                                        className="w-full bg-transparent text-center text-xs text-white font-bold focus:outline-none"
                                    />
                                    <span className="text-[10px] text-slate-500">grams</span>
                                </div>
                                <div className="bg-slate-900 p-2 rounded-xl border border-slate-800 text-center">
                                    <span className="block text-[10px] text-amber-400 font-semibold">
                                        Carbs
                                    </span>
                                    <input
                                        type="number"
                                        value={editCarbs}
                                        onChange={(e) => setEditCarbs(Number(e.target.value))}
                                        className="w-full bg-transparent text-center text-xs text-white font-bold focus:outline-none"
                                    />
                                    <span className="text-[10px] text-slate-500">grams</span>
                                </div>
                                <div className="bg-slate-900 p-2 rounded-xl border border-slate-800 text-center">
                                    <span className="block text-[10px] text-rose-400 font-semibold">
                                        Fat
                                    </span>
                                    <input
                                        type="number"
                                        value={editFat}
                                        onChange={(e) => setEditFat(Number(e.target.value))}
                                        className="w-full bg-transparent text-center text-xs text-white font-bold focus:outline-none"
                                    />
                                    <span className="text-[10px] text-slate-500">grams</span>
                                </div>
                            </div>
                        </div>

                        {/* AI Advice note */}
                        {result.advice && (
                            <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl text-xs text-emerald-300">
                                <span className="font-bold">Nutritional Advice: </span>
                                {result.advice}
                            </div>
                        )}

                        {/* Report error sub-modal */}
                        {reportOpen && (
                            <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-2xl space-y-2">
                                <span className="text-xs font-bold text-amber-400">Submit AI misclassification feedback:</span>
                                <input
                                    type="text"
                                    placeholder="Enter true food name..."
                                    value={reportCorrection}
                                    onChange={(e) => setReportCorrection(e.target.value)}
                                    className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2 text-xs text-white"
                                />
                                <button
                                    onClick={handleReportError}
                                    className="w-full bg-amber-500 text-slate-950 font-bold text-xs py-1.5 rounded-lg"
                                >
                                    {reportSuccess ? "Feedback Sent ✓" : "Submit Feedback"}
                                </button>
                            </div>
                        )}

                        <div className="flex space-x-3 pt-2">
                            <button
                                onClick={() => {
                                    setResult(null);
                                    setScanError(null);
                                }}
                                className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold py-3 rounded-xl text-xs"
                            >
                                ← Scan Again
                            </button>
                            <button
                                onClick={handleSaveToLog}
                                className="flex-2 bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 font-bold py-3 px-6 rounded-xl shadow-lg shadow-emerald-500/20 text-xs flex items-center justify-center space-x-1.5"
                            >
                                <Check className="w-4 h-4" />
                                <span>Log Meal to Daily Journal</span>
                            </button>
                        </div>
                    </div>
                )}

            </div>
        </div>
    );
};
