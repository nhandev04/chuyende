import React, { useState } from 'react';
import { X, CheckCircle2, Zap, Crown, ShieldCheck, Sparkles, CreditCard } from 'lucide-react';
import type { User, SubscriptionPlan } from '../types';
import { api } from '../services/api';

interface SubscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User | null;
  onPlanUpgraded: (updatedUser: User) => void;
}

export const SubscriptionModal: React.FC<SubscriptionModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onPlanUpgraded,
}) => {
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const currentPlanId = currentUser?.role === 'admin' ? 'pro' : currentUser?.plan || 'standard';

  const handleSubscribe = async (planId: 'plus' | 'pro') => {
    if (!currentUser) {
      setErrorMessage("Please sign in to upgrade your subscription tier.");
      return;
    }

    setLoadingPlan(planId);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      // Create Stripe checkout session
      const session = await api.createCheckoutSession(planId, currentUser.user_id);
      
      // Perform direct upgrade / simulate Stripe redirect
      const updatedUser = await api.upgradeSubscription(planId, currentUser.user_id);
      onPlanUpgraded(updatedUser);
      setSuccessMessage(`🎉 You have successfully upgraded to ${planId.toUpperCase()} tier!`);
      
      if (session.checkout_url && !session.checkout_url.includes("demo_success")) {
        window.location.href = session.checkout_url;
      }
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to initialize Stripe checkout. Please try again.");
    } finally {
      setLoadingPlan(null);
    }
  };

  const plans: SubscriptionPlan[] = [
    {
      id: 'standard',
      name: 'Standard (Free Tier)',
      price_vnd: 0,
      price_display: '$0 / month',
      badge: 'Free',
      is_current_default: true,
      features: [
        'Manual food logging',
        'Basic weight & BMI tracking',
        'Personal profile management'
      ]
    },
    {
      id: 'plus',
      name: 'Plus (Food Scanner Tier)',
      price_vnd: 25000,
      price_display: '~$1.00 / month (25,000 VND)',
      badge: 'Most Popular',
      is_current_default: false,
      features: [
        'All Standard tier features',
        '⚡ AI Food Image Scanning (YOLOv8)',
        'Automated Calorie, Protein, Carbs, Fat analysis',
        'Ground-Truth food database access'
      ]
    },
    {
      id: 'pro',
      name: 'Pro (AI Expert Tier)',
      price_vnd: 50000,
      price_display: '~$2.00 / month (50,000 VND)',
      badge: 'Premium Exclusive',
      is_current_default: false,
      features: [
        'All Plus tier features',
        '👑 Full-body AI Pose Analysis (YOLO Pose)',
        '10-Level BMI Scale & Biometric advice',
        '🥗 Daily AI Recommended Meal Plan',
        'Priority support & Detailed nutrition reports'
      ]
    }
  ];


  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-sm animate-fade-in overflow-y-auto">
      <div className="relative w-full max-w-4xl max-h-[92vh] overflow-y-auto bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 my-auto">

        
        {/* Header */}
        <div className="relative bg-gradient-to-r from-emerald-600 via-teal-600 to-indigo-600 p-6 md:p-8 text-white text-center">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 text-white/80 hover:text-white bg-black/20 hover:bg-black/40 rounded-full transition"
          >
            <X className="w-5 h-5" />
          </button>
          
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/20 rounded-full text-xs font-semibold uppercase tracking-wider mb-2">
            <Sparkles className="w-4 h-4 text-amber-300" /> AI Services & Pricing Matrix
          </div>
          <h2 className="text-2xl md:text-3xl font-extrabold">Upgrade Your HealthLens AI Experience</h2>
          <p className="text-sm md:text-base text-emerald-100 mt-2 max-w-xl mx-auto">
            Select the right plan to unlock food computer vision & comprehensive body silhouette analysis.
          </p>
        </div>

        {/* Notifications */}
        {errorMessage && (
          <div className="mx-6 mt-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 text-sm rounded-xl font-medium">
            {errorMessage}
          </div>
        )}
        {successMessage && (
          <div className="mx-6 mt-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm rounded-xl font-medium">
            {successMessage}
          </div>
        )}

        {/* Pricing Cards Grid */}
        <div className="p-6 md:p-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          {plans.map((plan) => {
            const isCurrent = currentPlanId === plan.id;
            const isPro = plan.id === 'pro';
            const isPlus = plan.id === 'plus';

            return (
              <div
                key={plan.id}
                className={`relative flex flex-col justify-between p-6 rounded-2xl border transition-all duration-200 ${
                  isCurrent
                    ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/20 shadow-md ring-2 ring-emerald-500'
                    : isPro
                    ? 'border-indigo-400 dark:border-indigo-600 bg-slate-50 dark:bg-slate-800/80 shadow-lg hover:shadow-indigo-500/10'
                    : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-slate-300'
                }`}
              >
                {/* Badge */}
                <div className="flex justify-between items-start mb-4">
                  <span className={`px-3 py-1 text-xs font-bold rounded-full ${
                    isPro 
                      ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white' 
                      : isPlus 
                      ? 'bg-emerald-500 text-white' 
                      : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                  }`}>
                    {plan.badge}
                  </span>
                  {isCurrent && (
                    <span className="text-xs font-extrabold text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-900/50 px-2.5 py-1 rounded-full border border-emerald-300">
                      Current Plan
                    </span>
                  )}
                </div>

                {/* Plan Header */}
                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    {isPro && <Crown className="w-5 h-5 text-amber-500 fill-amber-500" />}
                    {isPlus && <Zap className="w-5 h-5 text-emerald-500" />}
                    {plan.name}
                  </h3>
                  <div className="mt-3 mb-6">
                    <span className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white">
                      {plan.price_display}
                    </span>
                  </div>

                  {/* Feature List */}
                  <ul className="space-y-3 mb-6 text-sm text-slate-600 dark:text-slate-300">
                    {plan.features.map((feat, idx) => (
                      <li key={idx} className="flex items-start gap-2.5">
                        <CheckCircle2 className={`w-4 h-4 mt-0.5 shrink-0 ${
                          isPro ? 'text-indigo-500' : isPlus ? 'text-emerald-500' : 'text-slate-400'
                        }`} />
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Action Button */}
                <div className="pt-4 mt-auto border-t border-slate-100 dark:border-slate-700">
                  {isCurrent ? (
                    <button
                      disabled
                      className="w-full py-2.5 px-4 bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 font-semibold rounded-xl cursor-default text-sm"
                    >
                      Active Plan
                    </button>
                  ) : plan.id === 'standard' ? (
                    <button
                      disabled
                      className="w-full py-2.5 px-4 bg-slate-100 dark:bg-slate-700 text-slate-400 font-semibold rounded-xl text-sm"
                    >
                      Default Tier
                    </button>
                  ) : (
                    <button
                      onClick={() => handleSubscribe(plan.id as 'plus' | 'pro')}
                      disabled={loadingPlan === plan.id}
                      className={`w-full py-3 px-4 rounded-xl font-bold text-sm text-white shadow-md flex items-center justify-center gap-2 transition active:scale-95 ${
                        isPro
                          ? 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700'
                          : 'bg-emerald-600 hover:bg-emerald-700'
                      }`}
                    >
                      <CreditCard className="w-4 h-4" />
                      {loadingPlan === plan.id ? 'Processing Stripe...' : `Upgrade ${plan.id.toUpperCase()} (Stripe)`}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer info */}
        <div className="bg-slate-50 dark:bg-slate-800/50 p-4 border-t border-slate-200 dark:border-slate-700 text-center text-xs text-slate-500 dark:text-slate-400 flex items-center justify-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-500" />
          Secure checkout powered by Stripe. Cancel anytime without hidden fees.
        </div>

      </div>
    </div>
  );
};
