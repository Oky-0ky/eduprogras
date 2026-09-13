import React from 'react';
import { motion } from 'framer-motion';
import { BookOpen, Play, Pencil, Trash2 } from 'lucide-react';

const SUBJECT_COLORS = {
  'Matematika': 'from-blue-400 to-indigo-500',
  'Bahasa Indonesia': 'from-emerald-400 to-teal-500',
  'IPA': 'from-green-400 to-emerald-500',
  'IPS': 'from-amber-400 to-orange-500',
  'Fiqih': 'from-violet-400 to-purple-500',
  'Quran Hadis': 'from-teal-400 to-cyan-500',
  'Bahasa Arab': 'from-rose-400 to-pink-500',
  'PKn': 'from-red-400 to-rose-500',
  'SBdP': 'from-pink-400 to-fuchsia-500',
  'PJOK': 'from-lime-400 to-green-500',
  'Bahasa Inggris': 'from-sky-400 to-blue-500',
};

export default function QuizCard({ quiz, onStart, onEdit, onDelete }) {
  const gradient = SUBJECT_COLORS[quiz.subject] || 'from-slate-400 to-slate-600';
  const date = quiz.createdAt ? new Date(quiz.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : '-';

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      className="bg-white dark:bg-slate-800 rounded-3xl shadow-md border border-slate-100 dark:border-slate-700 overflow-hidden flex flex-col"
    >
      {/* Header */}
      <div className={`bg-gradient-to-br ${gradient} p-5 text-white`}>
        <div className="flex items-start justify-between gap-2">
          <div>
            <span className="text-xs font-bold opacity-80 bg-white/20 px-2 py-0.5 rounded-full">{quiz.grade}</span>
            <h3 className="font-black text-lg mt-1 leading-tight">{quiz.title}</h3>
          </div>
          <BookOpen className="w-8 h-8 opacity-60 flex-shrink-0" />
        </div>
      </div>
      {/* Body */}
      <div className="p-4 flex-1 flex flex-col">
        <p className="text-slate-500 dark:text-slate-400 text-xs mb-3 line-clamp-2">
          {quiz.description || 'Tidak ada deskripsi'}
        </p>
        <div className="flex gap-3 text-xs text-slate-500 dark:text-slate-400 mb-4 mt-auto">
          <span>📚 {quiz.subject}</span>
          <span>❓ {quiz.questions?.length || 0} soal</span>
          <span>📅 {date}</span>
        </div>
        {/* Actions */}
        <div className="flex gap-2">
          <button
            onClick={onEdit}
            className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 text-xs font-bold rounded-xl transition"
          >
            <Pencil className="w-3 h-3" /> Edit
          </button>
          <button
            onClick={onStart}
            className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white text-xs font-bold rounded-xl transition shadow"
          >
            <Play className="w-3 h-3" /> Mulai
          </button>
          <button
            onClick={onDelete}
            className="px-3 py-2 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/40 text-red-500 text-xs font-bold rounded-xl transition"
          >
            <Trash2 className="w-3 h-3" />
          </button>
        </div>
      </div>
    </motion.div>
  );
}
