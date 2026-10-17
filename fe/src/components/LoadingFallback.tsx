import React from 'react';
import { Loader2 } from 'lucide-react';

interface LoadingFallbackProps {
  message?: string;
}

export const LoadingFallback: React.FC<LoadingFallbackProps> = ({ message = 'Loading...' }) => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[300px] w-full p-8 text-center animate-fadeIn">
      <div className="relative flex items-center justify-center">
        <div className="w-12 h-12 rounded-full border-4 border-emerald-500/20 border-t-emerald-500 animate-spin" />
        <Loader2 className="w-5 h-5 text-emerald-400 absolute animate-pulse" />
      </div>
      <p className="mt-4 text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
        {message}
      </p>
    </div>
  );
};
