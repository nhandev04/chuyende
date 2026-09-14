import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import type { NutritionSummary, WeightLog } from '../types';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine,
  LineChart, Line, CartesianGrid
} from 'recharts';
import { Scale, BarChart2 } from 'lucide-react';

interface HistoryProps {
  userId: number;
  theme?: 'dark' | 'light';
}

export const History: React.FC<HistoryProps> = ({ userId, theme = 'dark' }) => {
  const [filterPeriod, setFilterPeriod] = useState<'daily' | 'weekly' | 'monthly'>('weekly');
  const [summary, setSummary] = useState<NutritionSummary | null>(null);
  const [weightLogs, setWeightLogs] = useState<WeightLog[]>([]);

  const isDark = theme === 'dark';

  useEffect(() => {
    async function loadData() {
      if (!userId) return;
      try {
        const [sumRes, weightRes] = await Promise.all([
          api.getNutritionSummary(userId),
          api.getWeightHistory(userId)
        ]);
        setSummary(sumRes);
        setWeightLogs(weightRes);
      } catch (err) {
        console.log("History load notice:", err);
      }
    }
    loadData();
  }, [userId]);

  const cardBg = isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200';
  const textMain = isDark ? 'text-white' : 'text-slate-900';
  const textSub = isDark ? 'text-slate-400' : 'text-slate-500';

  if (!userId) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center space-y-4">
        <h3 className="text-xl font-bold">Health Tracking History</h3>
        <p className="text-sm text-slate-400">Please sign in to view your caloric intake and body weight progression charts.</p>
      </div>
    );
  }


  return (
    <div className={`space-y-6 pb-24 max-w-4xl mx-auto px-4 pt-4 ${textMain}`}>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className={`text-xl font-black ${textMain}`}>History & AI Progress Analytics</h2>
          <p className={`text-xs ${textSub}`}>Caloric intake trends & weight fluctuation analysis</p>
        </div>

        {/* Time Period Tabs */}
        <div className={`flex border p-1 rounded-2xl ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-slate-100 border-slate-200'
          }`}>
          {(['daily', 'weekly', 'monthly'] as const).map((period) => (
            <button
              key={period}
              onClick={() => setFilterPeriod(period)}
              className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all ${filterPeriod === period
                  ? 'bg-emerald-500 text-slate-950 shadow-md'
                  : textSub
                }`}
            >
              {period === 'daily' ? 'Daily' : period === 'weekly' ? 'Weekly' : 'Monthly'}
            </button>
          ))}
        </div>
      </div>

      {/* Main Calorie Chart Card */}
      <div className={`border rounded-3xl p-5 shadow-2xl space-y-4 ${cardBg}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <BarChart2 className="w-5 h-5 text-emerald-500" />
            <h3 className={`font-extrabold text-sm ${textMain}`}>
              {filterPeriod === 'weekly' ? '7-Day Caloric Intake Chart' : filterPeriod === 'monthly' ? 'Weekly Average Caloric Trend' : 'Detailed Daily Chart'}
            </h3>
          </div>
          <span className="text-[11px] font-semibold text-emerald-500 bg-emerald-500/10 px-2.5 py-1 rounded-full">
            Target: {summary?.daily.target_calories || 1950} kcal/day
          </span>
        </div>

        <div className="h-64 w-full pt-2">
          {filterPeriod === 'weekly' ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={summary?.weekly_chart || []}>
                <XAxis dataKey="day" stroke={isDark ? "#64748b" : "#94a3b8"} fontSize={11} tickLine={false} />
                <YAxis stroke={isDark ? "#64748b" : "#94a3b8"} fontSize={11} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: isDark ? '#0f172a' : '#ffffff',
                    borderColor: isDark ? '#334155' : '#e2e8f0',
                    borderRadius: '12px',
                    color: isDark ? '#ffffff' : '#0f172a'
                  }}
                />
                <ReferenceLine y={summary?.daily.target_calories || 1950} stroke="#ef4444" strokeDasharray="3 3" />
                <Bar dataKey="calories" fill="#10b981" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={summary?.monthly_chart || []}>
                <CartesianGrid strokeDasharray="3 3" stroke={isDark ? "#1e293b" : "#f1f5f9"} />
                <XAxis dataKey="week" stroke={isDark ? "#64748b" : "#94a3b8"} fontSize={11} />
                <YAxis stroke={isDark ? "#64748b" : "#94a3b8"} fontSize={11} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: isDark ? '#0f172a' : '#ffffff',
                    borderColor: isDark ? '#334155' : '#e2e8f0',
                    borderRadius: '12px',
                    color: isDark ? '#ffffff' : '#0f172a'
                  }}
                />
                <Line type="monotone" dataKey="avg_calories" stroke="#10b981" strokeWidth={3} dot={{ r: 5 }} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Weight Progression Chart */}
      <div className={`border rounded-3xl p-5 shadow-2xl space-y-4 ${cardBg}`}>
        <div className="flex items-center space-x-2">
          <Scale className="w-5 h-5 text-teal-500" />
          <h3 className={`font-extrabold text-sm ${textMain}`}>Body Weight Progression (kg)</h3>
        </div>

        <div className="h-56 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={summary?.monthly_chart || []}>
              <CartesianGrid strokeDasharray="3 3" stroke={isDark ? "#1e293b" : "#f1f5f9"} />
              <XAxis dataKey="week" stroke={isDark ? "#64748b" : "#94a3b8"} fontSize={11} />
              <YAxis domain={['dataMin - 2', 'dataMax + 2']} stroke={isDark ? "#64748b" : "#94a3b8"} fontSize={11} />
              <Tooltip
                contentStyle={{
                  backgroundColor: isDark ? '#0f172a' : '#ffffff',
                  borderColor: isDark ? '#334155' : '#e2e8f0',
                  borderRadius: '12px',
                  color: isDark ? '#ffffff' : '#0f172a'
                }}
              />
              <Line type="monotone" dataKey="avg_weight" stroke="#14b8a6" strokeWidth={3} dot={{ r: 6, fill: '#14b8a6' }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Weight Log Entries */}
      <div className={`border rounded-3xl p-5 shadow-xl ${cardBg}`}>
        <h3 className={`font-extrabold text-sm mb-3 ${textMain}`}>Weight Log Records</h3>
        <div className="space-y-2">
          {weightLogs.map((log) => (
            <div key={log.id} className={`p-3 rounded-2xl border flex items-center justify-between text-xs ${isDark ? 'bg-slate-800/60 border-slate-700/60' : 'bg-slate-50 border-slate-200'
              }`}>
              <span className={textSub}>{new Date(log.recorded_at).toLocaleDateString('en-US')}</span>
              <span className="font-bold text-emerald-500 text-sm">{log.weight_kg} kg</span>
            </div>
          ))}
        </div>
      </div>

    </div>
  );

};
