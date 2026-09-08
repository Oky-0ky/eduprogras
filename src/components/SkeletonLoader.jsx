import React from 'react';

export default function SkeletonLoader({ count = 3, type = "card" }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="bg-slate-200 dark:bg-slate-800 rounded-3xl p-6 h-48 flex flex-col justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-slate-300 dark:bg-slate-700"></div>
            <div className="space-y-2 flex-1">
              <div className="h-4 bg-slate-300 dark:bg-slate-700 rounded w-3/4"></div>
              <div className="h-3 bg-slate-300 dark:bg-slate-700 rounded w-1/2"></div>
            </div>
          </div>
          <div className="space-y-2">
            <div className="h-3 bg-slate-300 dark:bg-slate-700 rounded"></div>
            <div className="h-3 bg-slate-300 dark:bg-slate-700 rounded w-5/6"></div>
          </div>
        </div>
      ))}
    </div>
  );
}
