import React from 'react';

export default function ProgressBar({ progress = 0, status = "Berkembang", showLabel = true }) {
  // Color palette according to status:
  // Hijau (Sangat Mahir), Biru (Mahir), Kuning (Berkembang), Merah/Ungu (Mulai/Belum)
  const getStatusColor = (st) => {
    switch (st) {
      case 'Sangat Mahir':
        return { bg: 'bg-emerald-500', text: 'text-emerald-600 dark:text-emerald-400', badgeBg: 'bg-emerald-100 dark:bg-emerald-950/60 border-emerald-300' };
      case 'Mahir':
        return { bg: 'bg-sky-500', text: 'text-sky-600 dark:text-sky-400', badgeBg: 'bg-sky-100 dark:bg-sky-950/60 border-sky-300' };
      case 'Berkembang':
        return { bg: 'bg-amber-400', text: 'text-amber-600 dark:text-amber-400', badgeBg: 'bg-amber-100 dark:bg-amber-950/60 border-amber-300' };
      case 'Mulai Berkembang':
        return { bg: 'bg-purple-400', text: 'text-purple-600 dark:text-purple-400', badgeBg: 'bg-purple-100 dark:bg-purple-950/60 border-purple-300' };
      case 'Belum':
      default:
        return { bg: 'bg-rose-400', text: 'text-rose-600 dark:text-rose-400', badgeBg: 'bg-rose-100 dark:bg-rose-950/60 border-rose-300' };
    }
  };

  const style = getStatusColor(status);

  return (
    <div className="w-full space-y-1.5">
      {showLabel && (
        <div className="flex justify-between items-center text-xs font-bold">
          <span className={`px-2.5 py-0.5 rounded-full border ${style.badgeBg} ${style.text}`}>
            {status}
          </span>
          <span className="text-slate-600 dark:text-slate-400 font-extrabold">{progress}%</span>
        </div>
      )}
      <div className="w-full h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden p-0.5 border border-slate-200/60 dark:border-slate-700/60 shadow-inner">
        <div
          className={`h-full ${style.bg} rounded-full transition-all duration-700 ease-out shadow-sm`}
          style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
        />
      </div>
    </div>
  );
}
