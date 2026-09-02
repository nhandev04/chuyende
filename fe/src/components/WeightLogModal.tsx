import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { X, Scale, Check } from 'lucide-react';

interface WeightLogModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: number;
  currentWeight: number;
  onWeightRecorded: (weight: number) => void;
}

export const WeightLogModal: React.FC<WeightLogModalProps> = ({
  isOpen,
  onClose,
  userId,
  currentWeight,
  onWeightRecorded
}) => {
  const [weight, setWeight] = useState(currentWeight || 65);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (userId) {
        api.getProfile(userId).then(p => {
          if (p && p.current_weight_kg) {
            setWeight(p.current_weight_kg);
          }
        }).catch(() => {
          if (currentWeight) setWeight(currentWeight);
        });
      } else if (currentWeight) {
        setWeight(currentWeight);
      }
    }
  }, [isOpen, userId, currentWeight]);

  if (!isOpen) return null;


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await api.recordWeight(userId, weight);
    onWeightRecorded(weight);
    setLoading(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-sm p-6 shadow-2xl relative text-white">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-2 rounded-full hover:bg-slate-800"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center mb-6">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-teal-500 to-emerald-400 flex items-center justify-center mx-auto mb-3 shadow-lg shadow-teal-500/20">
            <Scale className="w-6 h-6 text-slate-950" />
          </div>
          <h3 className="text-lg font-bold">Record Today's Weight</h3>
          <p className="text-xs text-slate-400">Track body weight fluctuations over time</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs text-slate-400 mb-1.5 text-center">Actual weight (kg)</label>
            <div className="relative max-w-[180px] mx-auto">
              <input
                type="number"
                step="0.1"
                required
                value={weight}
                onChange={(e) => setWeight(Number(e.target.value))}
                className="w-full bg-slate-800 border-2 border-emerald-500 rounded-2xl py-3 text-center text-2xl font-extrabold text-emerald-400 focus:outline-none"
              />
              <span className="absolute right-4 top-4 text-xs font-bold text-slate-400">KG</span>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 font-bold py-3 rounded-xl shadow-lg shadow-emerald-500/20 text-sm flex items-center justify-center space-x-1.5"
          >
            <Check className="w-4 h-4" />
            <span>Save Weight Entry</span>
          </button>
        </form>

      </div>
    </div>
  );
};
