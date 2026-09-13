import React from 'react';
import { motion } from 'framer-motion';

export default function BadgeCard({ badge, isNew, onClaim }) {
  if (!badge) return null;
  return (
    <motion.div
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className={`
        relative p-4 rounded-3xl border-2 text-center
        ${isNew
          ? 'border-yellow-400 bg-gradient-to-br from-yellow-50 to-amber-50 shadow-lg shadow-yellow-200'
          : 'border-slate-200 bg-white dark:bg-slate-800 dark:border-slate-700'}
      `}
    >
      {isNew && (
        <motion.div
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ repeat: Infinity, duration: 1.2 }}
          className="absolute -top-2 -right-2 bg-yellow-400 text-white text-[10px] font-black px-2 py-0.5 rounded-full"
        >
          BARU! 🎉
        </motion.div>
      )}
      <div className="text-4xl mb-2">{badge.icon}</div>
      <div className="font-black text-sm text-slate-800 dark:text-slate-100">{badge.name}</div>
      {badge.description && (
        <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">{badge.description}</div>
      )}
      {onClaim && (
        <button
          onClick={onClaim}
          className="mt-3 px-4 py-1.5 bg-gradient-to-r from-violet-500 to-purple-600 text-white text-xs font-black rounded-full shadow hover:shadow-md transition"
        >
          Ambil Hadiah 🎁
        </button>
      )}
    </motion.div>
  );
}
