import React, { useState, useEffect } from 'react';
import { Sparkles, ShoppingBag, ChefHat, CheckCircle2, Lock, X, RefreshCw, Layers } from 'lucide-react';
import { api } from '../services/api';
import { useToast } from './Toast';
import type { User } from '../types';

interface RAGMealPlanModalProps {
  user: User | null;
  onClose: () => void;
  onOpenSubscription: () => void;
  onFoodLogged: () => void;
  theme?: 'dark' | 'light';
}

export const RAGMealPlanModal: React.FC<RAGMealPlanModalProps> = ({
  user,
  onClose,
  onOpenSubscription,
  onFoodLogged,
  theme = 'dark'
}) => {
  const [loading, setLoading] = useState(false);
  const [ragData, setRagData] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'meals' | 'grocery'>('meals');
  const [loggingIndex, setLoggingIndex] = useState<number | null>(null);

  const isDark = theme === 'dark';
  const isStandard = !user?.plan || user.plan === 'standard';
  const isPro = user?.plan === 'pro' || user?.role === 'admin';

  useEffect(() => {
    if (user?.user_id && !isStandard) {
      api.getLatestRAGMealPlan(user.user_id).then((res) => {
        if (res && res.has_plan) {
          setRagData(res);
        }
      }).catch(() => null);
    }
  }, [user, isStandard]);

  const toast = useToast();

  const handleGenerate = async () => {
    if (!user?.user_id) return;
    setLoading(true);
    try {
      const data = await api.generateRAGMealPlan(user.user_id);
      setRagData(data);
      toast.success("AI Meal Plan generated successfully!", "Smart Meal Planner");
    } catch (err: any) {
      toast.error(err.message || "Failed to generate AI meal plan.", "Generation Error");
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLog = async (meal: any, idx: number) => {
    if (!user?.user_id) return;
    setLoggingIndex(idx);
    try {
      await api.createFoodLog(user.user_id, {
        meal_type: meal.meal_type || 'snack',
        food_name: meal.meal_name,
        weight_g: 350.0,
        calories: meal.calories,
        protein_g: meal.protein_g,
        carbs_g: meal.carbs_g,
        fat_g: meal.fat_g
      });
      onFoodLogged();
      toast.success(`Added "${meal.meal_name}" to your daily journal!`, "Logged Meal");
    } catch (err: any) {
      toast.error(err.message || "Failed to log food", "Logging Error");
    } finally {
      setLoggingIndex(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className={`border rounded-3xl max-w-2xl w-full p-6 text-white shadow-2xl relative max-h-[90vh] overflow-y-auto ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white text-slate-900 border-slate-200'
        }`}>

        {/* Header */}
        <div className={`flex items-center justify-between border-b pb-4 mb-4 ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-gradient-to-tr from-emerald-500 to-teal-400 rounded-2xl text-slate-950 shadow-lg shadow-emerald-500/20">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className={`font-black text-base ${isDark ? 'text-white' : 'text-slate-900'}`}>AI Smart Meal Planner</h2>
                <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-black border ${isPro
                    ? 'bg-amber-500/20 text-amber-400 border-amber-500/40'
                    : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                  }`}>
                  {isPro ? '👑 PRO AI MEALS' : '⚡ PLUS AI MEALS'}
                </span>
              </div>
              <p className={`text-xs mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                Personalized nutrition plans customized to your health and calorie goals
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white transition" title="Close">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Standard Tier Lock Screen */}
        {isStandard ? (
          <div className="p-8 bg-slate-950/90 border border-rose-500/30 rounded-2xl text-center space-y-4 shadow-xl">
            <div className="w-14 h-14 bg-rose-500/20 text-rose-400 rounded-2xl flex items-center justify-center mx-auto shadow-inner">
              <Lock className="w-7 h-7" />
            </div>
            <h3 className="font-extrabold text-base text-rose-200">🔒 AI Smart Meal Planner Locked</h3>
            <p className="text-xs text-slate-400 leading-relaxed max-w-sm mx-auto">
              Personalized daily meal suggestions, allergy-safe recipe matching, and automated grocery shopping lists require a <strong className="text-emerald-400">Plus</strong> or <strong className="text-amber-400">Pro</strong> subscription.
            </p>
            <button
              onClick={() => { onClose(); onOpenSubscription(); }}
              className="w-full bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 font-black text-xs py-3 rounded-xl shadow-lg shadow-emerald-500/20 transition-transform hover:scale-[1.02]"
            >
              Upgrade Your Subscription to Unlock AI Meal Plans →
            </button>
          </div>
        ) : (
          <div className="space-y-4">

            {/* Generate Trigger / Re-generate Header Bar */}
            <div className="flex items-center justify-between bg-slate-800/40 p-3.5 rounded-2xl border border-slate-700/50">
              <span className="text-xs text-slate-300 font-semibold">
                {ragData ? `Target: ${ragData.target_calories || 2000} kcal/day` : 'Ready to generate your personalized meal plan.'}
              </span>
              <button
                onClick={handleGenerate}
                disabled={loading}
                className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 font-black text-xs rounded-xl shadow-lg hover:scale-105 transition flex items-center space-x-1.5"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                <span>{loading ? "AI Generating Plan..." : ragData ? "Generate New Plan" : "✨ Generate AI Meal Plan"}</span>
              </button>
            </div>

            {/* Empty State */}
            {!ragData && !loading && (
              <div className="text-center py-10 space-y-3">
                <ChefHat className="w-14 h-14 text-emerald-400 mx-auto animate-pulse" />
                <h4 className="font-extrabold text-sm text-white">Click "Generate AI Meal Plan" above</h4>
                <p className="text-xs text-slate-400 max-w-xs mx-auto">
                  Our AI will tailor recipes to your health profile, filter out any allergens, and create your custom daily meal plan.
                </p>
              </div>
            )}

            {/* Display RAG Meal Plan Content */}
            {ragData && (
              <div className="space-y-4">

                {/* Advice Card */}
                {ragData.summary_advice && (
                  <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl text-xs text-emerald-300 leading-relaxed">
                    💡 <strong>AI Nutrition Advice:</strong> {ragData.summary_advice}
                  </div>
                )}

                {/* Tabs for Pro Tier */}
                {isPro && ragData.grocery_list && ragData.grocery_list.length > 0 && (
                  <div className="flex border-b border-slate-800 space-x-4 pb-2 text-xs font-bold">
                    <button
                      onClick={() => setActiveTab('meals')}
                      className={`pb-1 flex items-center space-x-1.5 transition ${activeTab === 'meals' ? 'text-emerald-400 border-b-2 border-emerald-400' : 'text-slate-400 hover:text-slate-200'}`}
                    >
                      <Layers className="w-4 h-4" />
                      <span>🍱 Daily Meals ({ragData.meals?.length || 0})</span>
                    </button>
                    <button
                      onClick={() => setActiveTab('grocery')}
                      className={`pb-1 flex items-center space-x-1.5 transition ${activeTab === 'grocery' ? 'text-amber-400 border-b-2 border-amber-400' : 'text-slate-400 hover:text-slate-200'}`}
                    >
                      <ShoppingBag className="w-4 h-4" />
                      <span>🛒 Grocery Shopping List ({ragData.grocery_list.length})</span>
                    </button>
                  </div>
                )}

                {/* TAB 1: MEALS */}
                {activeTab === 'meals' && (
                  <div className="space-y-3">
                    {ragData.meals?.map((meal: any, idx: number) => (
                      <div key={idx} className="p-4 bg-slate-800/60 border border-slate-700/60 rounded-2xl flex items-center justify-between text-xs space-x-3 hover:border-emerald-500/30 transition">
                        <div className="space-y-1">
                          <span className="font-extrabold text-[10px] uppercase text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20 inline-block">
                            {meal.meal_label || meal.meal_type}
                          </span>
                          <h4 className="font-extrabold text-sm text-white">{meal.meal_name}</h4>
                          <p className="text-[11px] text-slate-400">
                            {meal.portion} • <strong className="text-emerald-400">{meal.calories} kcal</strong> (Protein: {meal.protein_g}g | Carbs: {meal.carbs_g}g | Fat: {meal.fat_g}g)
                          </p>
                          {meal.recipe_notes && (
                            <p className="text-[10px] text-slate-400 italic">💡 {meal.recipe_notes}</p>
                          )}
                        </div>
                        <button
                          onClick={() => handleQuickLog(meal, idx)}
                          disabled={loggingIndex === idx}
                          className="px-3 py-1.5 bg-slate-800 hover:bg-emerald-500 text-emerald-400 hover:text-slate-950 font-bold rounded-xl text-[11px] border border-slate-700 transition shrink-0"
                        >
                          {loggingIndex === idx ? "Logging..." : "+ Log Meal"}
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* TAB 2: GROCERY SHOPPING LIST (PRO ONLY) */}
                {activeTab === 'grocery' && isPro && (
                  <div className="p-4 bg-slate-800/40 border border-amber-500/30 rounded-2xl space-y-3">
                    <h4 className="font-extrabold text-xs text-amber-400 flex items-center space-x-1.5">
                      <ShoppingBag className="w-4 h-4" />
                      <span>👑 Weekly Grocery Shopping List (Pro Exclusive):</span>
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-200">
                      {ragData.grocery_list?.map((item: string, i: number) => (
                        <div key={i} className="flex items-center space-x-2 bg-slate-900/90 p-2.5 rounded-xl border border-slate-800">
                          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                          <span className="font-semibold text-xs">{item}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              </div>
            )}

          </div>
        )}

      </div>
    </div>
  );
};
