import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const MEDALS = ['🥇', '🥈', '🥉'];
const MOTIVATIONS = ['Luar Biasa!', 'Hebat!', 'Kamu Bisa!', 'Terus Semangat!', 'Pantang Menyerah!'];

export default function Leaderboard({ entries = [], title = '🏆 Leaderboard', myParticipantId }) {
  return (
    <div className="w-full">
      {title && (
        <h3 className="text-center font-black text-lg text-slate-800 dark:text-white mb-3">{title}</h3>
      )}
      <div className="space-y-2">
        <AnimatePresence>
          {entries.slice(0, 10).map((entry, i) => {
            const isMine = entry.id === myParticipantId;
            const medal = MEDALS[i] || null;
            return (
              <motion.div
                key={entry.id}
                layout
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ delay: i * 0.05 }}
                className={`
                  flex items-center gap-3 p-3 rounded-2xl font-bold text-sm
                  ${isMine
                    ? 'bg-violet-100 dark:bg-violet-900/40 border-2 border-violet-400 shadow-md'
                    : i < 3
                    ? 'bg-gradient-to-r from-yellow-50 to-amber-50 dark:from-yellow-900/20 dark:to-amber-900/20 border border-yellow-200 dark:border-yellow-800'
                    : 'bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700'}
                `}
              >
                <span className="w-8 text-center text-xl flex-shrink-0">
                  {medal || <span className="text-sm text-slate-400 font-black">{i + 1}</span>}
                </span>
                <span className={`flex-1 truncate ${isMine ? 'text-violet-700 dark:text-violet-300' : 'text-slate-800 dark:text-slate-200'}`}>
                  {entry.name} {isMine && <span className="text-xs">(Kamu)</span>}
                </span>
                <div className="text-right flex-shrink-0">
                  <div className={`font-black ${i === 0 ? 'text-amber-500' : 'text-slate-700 dark:text-slate-300'}`}>
                    {entry.score?.toLocaleString('id-ID')}
                  </div>
                  {entry.accuracy !== undefined && (
                    <div className="text-[10px] text-slate-400">{entry.accuracy}% akurat</div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
        {entries.length === 0 && (
          <div className="text-center text-slate-400 py-6 text-sm">Belum ada peserta</div>
        )}
      </div>
    </div>
  );
}
